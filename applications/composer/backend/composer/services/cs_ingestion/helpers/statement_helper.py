import re
from typing import Dict, Tuple, List

from django.contrib.auth.models import User

from composer.services.cs_ingestion.logging_service import LoggerService
from composer.services.state_services import ConnectivityStatementStateService
from composer.enums import CSState, NoteType
from composer.management.commands.ingest_nlp_sentence import ID
from composer.models import (
    AlertType,
    Sentence,
    ConnectivityStatement,
    Note,
    Specie,
    Provenance,
    StatementAlert,
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
    population_uris: set = None,
) -> Tuple[ConnectivityStatement, bool]:
    """
    Create or update a connectivity statement from ingested data.
    
    Args:
        statement: The statement data dictionary
        sentence: The associated sentence object
        update_anatomical_entities: Whether to update anatomical entity relationships
        logger_service: Service for logging anomalies
        population_uris: Set of URIs from population file. When provided, the system_exported
                        transition is used to allow state changes from any state.
    
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
    # When population_uris is provided (population file used), use system_exported
    # transition to allow state changes from any state
    if validation_errors.has_errors():
        error_message = validation_errors.to_string()
        if connectivity_statement.state != CSState.INVALID:
            do_transition_to_invalid_with_note(connectivity_statement, error_message)
        else:
            create_invalid_note(connectivity_statement, error_message)
    else:
        # Statement is valid - attempt transition to EXPORTED
        # Use system_exported transition when population_uris is provided
        # This allows transitioning from any state (e.g., TO_BE_REVIEWED -> EXPORTED)
        if population_uris is not None:
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
    statement[STATE] = connectivity_statement.state

    return connectivity_statement, created


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

    for destination in connectivity_statement.destinations.all():
        destination.delete()

    for via in connectivity_statement.via_set.all():
        via.delete()

    add_origins(connectivity_statement, statement, update_anatomical_entities)
    add_vias(connectivity_statement, statement, update_anatomical_entities)
    add_destinations(connectivity_statement, statement, update_anatomical_entities)
    add_species(connectivity_statement, statement)
    add_provenances(connectivity_statement, statement)
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
