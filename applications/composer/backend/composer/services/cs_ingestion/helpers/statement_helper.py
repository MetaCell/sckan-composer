import re
from typing import Dict, Tuple, List
import traceback

from django.contrib.auth.models import User

from composer.services.cs_ingestion.logging_service import LoggerService
from composer.services.state_services import ConnectivityStatementStateService
from composer.enums import CSState, NoteType, RelationshipType
from composer.management.commands.ingest_nlp_sentence import ID
from composer.models import (
    AlertType,
    Sentence,
    ConnectivityStatement,
    Note,
    Specie,
    Provenance,
    ExpertConsultant,
    StatementAlert,
    Relationship,
    Triple,
    ConnectivityStatementTriple,
    ConnectivityStatementText,
    ConnectivityStatementAnatomicalEntity,
    AnatomicalEntity,
)
from composer.services.cs_ingestion.helpers.anatomical_entities_helper import (
    add_origins,
    add_vias,
    add_destinations,
)
from composer.services.cs_ingestion.helpers.changes_detector import has_changes
from composer.services.cs_ingestion.helpers.common_helpers import (
    LABEL,
    PREF_LABEL,
    STATEMENT_ALERTS,
    VALIDATION_ERRORS,
    STATE,
    NOTE_ALERT,
    PROVENANCE,
    EXPERT_CONSULTANTS,
    SPECIES,
    FORWARD_CONNECTION,
)
from composer.services.cs_ingestion.helpers.getters import (
    get_sex,
    get_circuit_type,
    get_functional_circuit_role,
    get_phenotype,
    get_projection_phenotype,
    get_or_create_populationset,
)
from composer.services.cs_ingestion.helpers.notes_helper import (
    do_transition_to_invalid_with_note,
    create_invalid_note,
    add_ingestion_system_note,
    do_transition_to_exported,
    do_system_transition_to_exported,
)
from composer.services.cs_ingestion.models import (
    LoggableAnomaly,
    Severity,
    ValidationErrors,
)


def create_or_update_connectivity_statement(
    statement: Dict,
    sentence: Sentence,
    update_anatomical_entities: bool,
    logger_service: LoggerService,
    force_state_transition: bool = False,
) -> Tuple[ConnectivityStatement, bool]:
    """
    Create or update a connectivity statement from ingested data.
    
    Args:
        statement: The statement data dictionary
        sentence: The associated sentence object
        update_anatomical_entities: Whether to update anatomical entity relationships
        logger_service: Service for logging anomalies
        force_state_transition: If True, allows state transitions from any state (e.g., TO_BE_REVIEWED -> EXPORTED).
                               Use when ingesting pre-filtered populations.
    
    Returns:
        Tuple of (ConnectivityStatement, created) where created is True if new
    """
    reference_uri = statement[ID]
    populationset_name = statement.get("populationset", "")
    defaults = {
        "sentence": sentence,
        "knowledge_statement": statement[PREF_LABEL],
        "sex": get_sex(statement),
        "circuit_type": get_circuit_type(statement),
        "functional_circuit_role": get_functional_circuit_role(statement),
        "phenotype": get_phenotype(statement),
        "population": get_or_create_populationset(populationset_name),
        "projection_phenotype": get_projection_phenotype(statement),
        "reference_uri": statement[ID],
        "state": CSState.EXPORTED,
        "curie_id": statement[LABEL],
    }

    connectivity_statement, created = ConnectivityStatement.objects.get_or_create(
        reference_uri=reference_uri, defaults=defaults
    )
    if not created:
        if has_changes(connectivity_statement, statement, defaults):
            defaults_without_state = {
                field: value for field, value in defaults.items() if field != "state"
            }
            ConnectivityStatement.objects.filter(reference_uri=reference_uri).update(
                **defaults_without_state
            )
            connectivity_statement = ConnectivityStatement.objects.get(
                reference_uri=reference_uri
            )
            add_ingestion_system_note(connectivity_statement)

    validation_errors = statement.get(VALIDATION_ERRORS, ValidationErrors())

    # State transitions: Handle validation errors and state updates
    # When force_state_transition is True, use system_exported transition 
    # to allow state changes from any state (e.g., TO_BE_REVIEWED -> EXPORTED)
    if validation_errors.has_errors():
        error_message = validation_errors.to_string()
        if connectivity_statement.state != CSState.INVALID:
            do_transition_to_invalid_with_note(connectivity_statement, error_message)
        else:
            create_invalid_note(connectivity_statement, error_message)
    else:
        # Statement is valid - attempt transition to EXPORTED
        # Use system_exported transition when force_state_transition is True
        # This allows transitioning from any state (e.g., TO_BE_REVIEWED -> EXPORTED)
        if force_state_transition:
            if connectivity_statement.state != CSState.EXPORTED:
                transition_success, error_message = do_system_transition_to_exported(connectivity_statement)
                if not transition_success:
                    # Transition to EXPORTED failed - move to INVALID state
                    if connectivity_statement.state != CSState.INVALID:
                        do_transition_to_invalid_with_note(connectivity_statement, error_message)
                    else:
                        create_invalid_note(connectivity_statement, error_message)
        else:
            # Normal ingestion: only transition if not already exported
            if connectivity_statement.state != CSState.EXPORTED:
                do_transition_to_exported(connectivity_statement)

    for alert_data in statement.get(STATEMENT_ALERTS, []):
        try:
            create_or_update_statement_alert(connectivity_statement, alert_data)
        except ValueError as e:
            Note.objects.create(
                connectivity_statement=connectivity_statement,
                user=User.objects.get(username="system"),
                type=NoteType.ALERT,
                note=(
                    f"Warning: A problem occurred while updating a statement alert. "
                    f"The issue was: '{str(e)}'. Please review the alert data and ensure the associated AlertType exists."
                ),
            )

    update_many_to_many_fields(
        connectivity_statement, statement, update_anatomical_entities
    )
    
    # Process dynamic relationships with custom code
    process_dynamic_relationships(connectivity_statement, statement, logger_service)
    
    statement[STATE] = connectivity_statement.state

    return connectivity_statement, created


def process_dynamic_relationships(
    connectivity_statement: ConnectivityStatement,
    statement: Dict,
    logger_service: LoggerService,
):
    """
    Reads pre-computed results from Step 1 and creates database entities.
    """
    # Get pre-computed custom relationship results from Step 1
    custom_results = statement.get('_custom_relationship_results', {})
    
    if not custom_results:
        return
    
    # Get all relationships to map IDs to objects
    relationship_ids = [int(rel_id) for rel_id in custom_results.keys()]
    relationships = {r.id: r for r in Relationship.objects.filter(id__in=relationship_ids)}
    
    for relationship_id_str, result in custom_results.items():
        relationship_id = int(relationship_id_str)
        relationship = relationships.get(relationship_id)
        if not relationship:
            continue
            
        try:
            # Process result based on relationship type
            if relationship.type == RelationshipType.TRIPLE_MULTI or relationship.type == RelationshipType.TRIPLE_SINGLE:
                process_triple_relationship(connectivity_statement, relationship, result, logger_service)
            elif relationship.type == RelationshipType.TEXT:
                process_text_relationship(connectivity_statement, relationship, result)
            elif relationship.type == RelationshipType.ANATOMICAL_MULTI:
                process_anatomical_relationship(connectivity_statement, relationship, result, logger_service)
            else:
                log_custom_relationship_error(
                    logger_service,
                    f"Unknown relationship type: {relationship.type}",
                    statement.get(ID),
                    relationship.id,
                    {'relationship_title': relationship.title, 'type': relationship.type}
                )
                
        except Exception as e:
            # Log error and continue with other relationships
            log_custom_relationship_error(
                logger_service,
                f"Failed to process custom relationship '{relationship.title}': {str(e)}",
                statement.get(ID),
                relationship.id,
                {
                    'relationship_title': relationship.title,
                    'error': str(e),
                    'traceback': traceback.format_exc()
                }
            )


def process_triple_relationship(
    connectivity_statement: ConnectivityStatement,
    relationship: Relationship,
    result: List[Dict],
    logger_service: LoggerService,
):
    """
    Process TRIPLE relationship results.
    Expected result format: [{'name': str, 'uri': str}, ...]
    """
    if not isinstance(result, list):
        result = [result]
    
    triples = []
    for item in result:
        if not isinstance(item, dict) or 'name' not in item or 'uri' not in item:
            log_custom_relationship_error(
                logger_service,
                f"Invalid triple format for relationship '{relationship.title}': {item}",
                connectivity_statement.reference_uri,
                relationship.id,
                {'item': str(item), 'relationship_title': relationship.title}
            )
            continue
        
        # Get or create the triple
        triple, created = Triple.objects.get_or_create(
            name=item['name'],
            uri=item['uri'],
            relationship=relationship
        )
        triples.append(triple)
    
    if triples:
        # Get or create the ConnectivityStatementTriple
        cs_triple, created = ConnectivityStatementTriple.objects.get_or_create(
            connectivity_statement=connectivity_statement,
            relationship=relationship
        )
        cs_triple.triples.set(triples)


def process_text_relationship(
    connectivity_statement: ConnectivityStatement,
    relationship: Relationship,
    result,
):
    """
    Process TEXT relationship results.
    Expected result format: string or list of strings
    """
    if isinstance(result, list):
        text = ', '.join(str(item) for item in result)
    else:
        text = str(result)
    
    # Get or create the ConnectivityStatementText
    cs_text, created = ConnectivityStatementText.objects.update_or_create(
        connectivity_statement=connectivity_statement,
        relationship=relationship,
        defaults={'text': text}
    )


def process_anatomical_relationship(
    connectivity_statement: ConnectivityStatement,
    relationship: Relationship,
    result: List[str],
    logger_service: LoggerService,
):
    """
    Process ANATOMICAL_ENTITY relationship results.
    Expected result format: [uri1, uri2, ...]
    """
    if not isinstance(result, list):
        result = [result]
    
    anatomical_entities = []
    for uri in result:
        try:
            ae = AnatomicalEntity.objects.get_by_ontology_uri(str(uri))
            anatomical_entities.append(ae)
        except AnatomicalEntity.DoesNotExist:
            log_custom_relationship_error(
                logger_service,
                f"Anatomical entity not found for URI '{uri}' in relationship '{relationship.title}'",
                connectivity_statement.reference_uri,
                relationship.id,
                {'uri': str(uri), 'relationship_title': relationship.title}
            )
    
    if anatomical_entities:
        # Get or create the ConnectivityStatementAnatomicalEntity
        cs_ae, created = ConnectivityStatementAnatomicalEntity.objects.get_or_create(
            connectivity_statement=connectivity_statement,
            relationship=relationship
        )
        cs_ae.anatomical_entities.set(anatomical_entities)


def log_custom_relationship_error(
    logger_service: LoggerService,
    message: str,
    statement_reference: str = None,
    relationship_id: int = None,
    details: dict = None,
):
    """
    Log custom relationship errors using the LoggerService.
    These errors are added to the anomalies log file.
    """
    from composer.services.cs_ingestion.models import LoggableAnomaly, Severity
    
    # Format detailed error message
    error_msg = f"[CUSTOM_RELATIONSHIP] {message}"
    if details:
        error_msg += f" | Details: {details}"
    
    # Add to logger service as an anomaly
    logger_service.add_anomaly(
        LoggableAnomaly(
            statement_id=statement_reference,
            entity_id=str(relationship_id) if relationship_id else None,
            message=error_msg,
            severity=Severity.WARNING
        )
    )


def update_many_to_many_fields(
    connectivity_statement: ConnectivityStatement,
    statement: Dict,
    update_anatomical_entities: bool,
):
    connectivity_statement.origins.clear()
    connectivity_statement.species.clear()
    # Notes are not cleared because they should be kept

    for provenance in connectivity_statement.provenance_set.all():
        provenance.delete()

    for expert_consultant in connectivity_statement.expertconsultant_set.all():
        expert_consultant.delete()

    for destination in connectivity_statement.destinations.all():
        destination.delete()

    for via in connectivity_statement.via_set.all():
        via.delete()
    
    # Clear dynamic relationship data
    for cs_triple in connectivity_statement.connectivitystatementtriple_set.all():
        cs_triple.delete()
    
    for cs_text in connectivity_statement.connectivitystatementtext_set.all():
        cs_text.delete()
    
    for cs_ae in connectivity_statement.connectivitystatementanatomicalentity_set.all():
        cs_ae.delete()

    add_origins(connectivity_statement, statement, update_anatomical_entities)
    add_vias(connectivity_statement, statement, update_anatomical_entities)
    add_destinations(connectivity_statement, statement, update_anatomical_entities)
    add_species(connectivity_statement, statement)
    add_provenances(connectivity_statement, statement)
    add_expert_consultants(connectivity_statement, statement)
    add_notes(connectivity_statement, statement)


def add_notes(connectivity_statement: ConnectivityStatement, statement: Dict):
    for note in statement[NOTE_ALERT]:
        Note.objects.create(
            connectivity_statement=connectivity_statement,
            user=User.objects.get(username="system"),
            type=NoteType.ALERT,
            note=note,
        )


def add_provenances(connectivity_statement: ConnectivityStatement, statement: Dict):
    provenances_list = (
        statement[PROVENANCE] if statement[PROVENANCE] else [statement[ID]]
    )
    provenances = (
        Provenance(connectivity_statement=connectivity_statement, uri=provenance)
        for provenance in provenances_list
    )
    Provenance.objects.bulk_create(provenances)


def add_expert_consultants(connectivity_statement: ConnectivityStatement, statement: Dict):
    expert_consultants_list = statement.get(EXPERT_CONSULTANTS, [])
    if expert_consultants_list:
        expert_consultants = (
            ExpertConsultant(connectivity_statement=connectivity_statement, uri=uri)
            for uri in expert_consultants_list
        )
        ExpertConsultant.objects.bulk_create(expert_consultants)


def add_species(connectivity_statement: ConnectivityStatement, statement: Dict):
    species = Specie.objects.filter(ontology_uri__in=statement[SPECIES])
    connectivity_statement.species.add(*species)


def update_forward_connections(statements: List):
    for statement in statements:
        connectivity_statement = ConnectivityStatement.objects.get(
            reference_uri=statement[ID]
        )
        connectivity_statement.forward_connection.clear()
        for uri in statement[FORWARD_CONNECTION]:
            try:
                forward_statement = ConnectivityStatement.objects.get(reference_uri=uri)
            except ConnectivityStatement.DoesNotExist:
                assert (
                    statement[STATE] == CSState.INVALID
                ), f"connectivity_statement {connectivity_statement} should be invalid due to forward connection {uri} not found but it isn't"
                continue
            connectivity_statement.forward_connection.add(forward_statement)


def create_or_update_statement_alert(
    connectivity_statement, alert_data: Tuple[str, str]
):
    """
    Create or update a StatementAlert for the given connectivity statement.

    :param connectivity_statement: ConnectivityStatement instance
    :param alert_data: A tuple where the first element is the AlertType URI,
                       and the second element is the alert text.
    """
    alert_uri, alert_value = alert_data

    try:
        alert_text = str(alert_value)
    except (TypeError, ValueError):
        raise ValueError(
            f"alert_text with value '{alert_value}' cannot be converted to string."
        )

    try:
        # Fetch the AlertType based on the URI
        alert_type = AlertType.objects.get(uri=alert_uri)
    except AlertType.DoesNotExist:
        raise ValueError(f"AlertType with URI '{alert_uri}' does not exist")

    system_user = User.objects.get(username="system")

    # Create or update the StatementAlert
    statement_alert, created = StatementAlert.objects.update_or_create(
        connectivity_statement=connectivity_statement,
        alert_type=alert_type,
        defaults={
            "text": alert_text,
            "saved_by": system_user,  # Set the system user
        },
    )

    return statement_alert, created
