import logging
from datetime import datetime
from typing import List, Dict, Optional, Tuple, Set, Any

from django.db import transaction

from composer.models import AnatomicalEntity, Sentence, ConnectivityStatement, Sex, FunctionalCircuitRole, \
    ProjectionPhenotype, Phenotype, Specie, Provenance, Via, Note, User, Destination
from .helpers import get_value_or_none, found_entity, \
    ORIGINS, DESTINATIONS, VIAS, LABEL, SEX, SPECIES, ID, FORWARD_CONNECTION, SENTENCE_NUMBER, \
    FUNCTIONAL_CIRCUIT_ROLE, CIRCUIT_TYPE, CIRCUIT_TYPE_MAPPING, PHENOTYPE, OTHER_PHENOTYPE, NOTE_ALERT, PROVENANCE, \
    VALIDATION_ERRORS
from .logging_service import LoggerService, ENTITY_NOT_FOUND, SEX_NOT_FOUND, SPECIES_NOT_FOUND, MULTIPLE_DESTINATIONS, \
    STATEMENT_INCORRECT_STATE, FORWARD_CONNECTION_NOT_FOUND, SENTENCE_INCORRECT_STATE
from .models import LoggableEvent
from .neurondm_script import main as get_statements_from_neurondm
from ...enums import (
    CircuitType,
    NoteType,
    CSState, SentenceState
)

NOW = datetime.now().strftime("%Y%m%d%H%M%S")

logger_service = LoggerService()


def ingest_statements(update_upstream=False):
    statements_list = get_statements_from_neurondm(logger_service_param=logger_service)
    overridable_statements = get_overwritable_statements(statements_list)
    statements = validate_statements(overridable_statements)

    successful_transaction = True
    try:
        with transaction.atomic():
            for statement in statements:
                sentence, _ = get_or_create_sentence(statement)
                create_or_update_connectivity_statement(statement, sentence)

            update_forward_connections(statements)
    except Exception as e:
        logger_service.add_error(LoggableEvent(statement_id=None, entity_id=None, message=str(e)))
        successful_transaction = False
        logging.error(f"Ingestion aborted due to {e}")

    logger_service.write_errors_to_file()

    if successful_transaction:
        if update_upstream:
            update_upstream_statements()
        logger_service.write_ingested_statements_to_file(statements)


def get_overwritable_statements(statements_list: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    overwritable_statements = [
        statement for statement in statements_list
        if not has_invalid_sentence(statement) and not has_invalid_statement(statement)
    ]
    return overwritable_statements


def has_invalid_sentence(statement: Dict) -> bool:
    try:
        sentence = Sentence.objects.get(doi__iexact=statement[ID])
    except Sentence.DoesNotExist:
        return False
    return not can_sentence_be_overwritten(sentence, statement)


def has_invalid_statement(statement: Dict) -> bool:
    try:
        connectivity_statement = ConnectivityStatement.objects.get(reference_uri=statement[ID])
    except ConnectivityStatement.DoesNotExist:
        return False
    return not can_statement_be_overwritten(connectivity_statement, statement)


def can_statement_be_overwritten(connectivity_statement: ConnectivityStatement, statement) -> bool:
    if connectivity_statement.state != CSState.EXPORTED or connectivity_statement != CSState.INVALID:
        logger_service.add_warning(LoggableEvent(statement[ID], None, STATEMENT_INCORRECT_STATE))
        return False

    return True


def can_sentence_be_overwritten(sentence: Sentence, statement: Dict) -> bool:
    if sentence.state != SentenceState.COMPOSE_NOW:
        logger_service.add_warning(LoggableEvent(statement[ID], None, SENTENCE_INCORRECT_STATE))
        return False
    return True


def validate_statements(statements: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    db_reference_uris = set(ConnectivityStatement.objects.values_list('reference_uri', flat=True))
    input_statement_ids = {statement[ID] for statement in statements}
    statement_ids = input_statement_ids.union(db_reference_uris)

    for statement in statements:
        # Initialize validation_errors if not already present
        if VALIDATION_ERRORS not in statement:
            statement[VALIDATION_ERRORS] = []

        # Validate entities, sex, and species, updating validation_errors accordingly
        annotate_invalid_entities(statement)
        annotate_invalid_sex(statement)
        annotate_invalid_species(statement)

        # Validate forward connection
        annotate_invalid_forward_connections(statement, statement_ids)

    return statements


def annotate_invalid_entities(statement: Dict) -> bool:
    has_invalid_entities = False

    # Consolidate all URIs to check
    uris_to_check = list(statement[ORIGINS].anatomical_entities)
    uris_to_check.extend(uri for dest in statement[DESTINATIONS] for uri in dest.anatomical_entities)
    uris_to_check.extend(uri for via in statement[VIAS] for uri in via.anatomical_entities)

    # Check all URIs and log if not found
    for uri in uris_to_check:
        if not found_entity(uri):
            statement[VALIDATION_ERRORS].append(f"{ENTITY_NOT_FOUND}: {uri}")
            has_invalid_entities = True

    return has_invalid_entities


def annotate_invalid_sex(statement: Dict) -> bool:
    if statement[SEX]:
        if len(statement[SEX]) > 1:
            logger_service.add_warning(
                LoggableEvent(statement[ID], None, f'Multiple sexes found in statement.'))

            first_sex_uri = statement[SEX][0]
            if not Sex.objects.filter(ontology_uri=first_sex_uri).exists():
                statement[VALIDATION_ERRORS].append(f"{SEX_NOT_FOUND}: {first_sex_uri}")
            return True
    return False


def annotate_invalid_species(statement: Dict) -> bool:
    has_invalid_species = False
    for species_uri in statement[SPECIES]:
        if not Specie.objects.filter(ontology_uri=species_uri).exists():
            statement[VALIDATION_ERRORS].append(f"{SPECIES_NOT_FOUND}: {species_uri}")
            has_invalid_species = True
    return has_invalid_species


def annotate_invalid_forward_connections(statement: Dict, statement_ids: Set[str]) -> bool:
    has_invalid_forward_connection = False
    for reference_uri in statement[FORWARD_CONNECTION]:
        if reference_uri not in statement_ids:
            statement[VALIDATION_ERRORS].append(f"{FORWARD_CONNECTION_NOT_FOUND}: {reference_uri}")
            has_invalid_forward_connection = True
    return has_invalid_forward_connection


def get_or_create_sentence(statement: Dict) -> Tuple[Sentence, bool]:
    text = f'{statement[LABEL]} created from neurondm on {NOW}'
    has_sentence_reference = len(statement[SENTENCE_NUMBER]) > 0

    if len(statement[SENTENCE_NUMBER]) > 1:
        logger_service.add_warning(
            LoggableEvent(statement[ID], None, f'Multiple sentence numbers found.'))

    sentence, created = Sentence.objects.get_or_create(
        doi__iexact=statement[ID],
        defaults={"title": text[0:185],
                  "text": text,
                  "doi": statement[ID],
                  "external_ref": statement[SENTENCE_NUMBER][0] if has_sentence_reference else None,
                  "batch_name": f"neurondm-{NOW}" if has_sentence_reference else None,
                  "state": SentenceState.COMPOSE_NOW
                  },
    )
    if created:
        logging.info(f"Sentence for neuron {statement[LABEL]} created.")

    return sentence, created


def create_or_update_connectivity_statement(statement: Dict, sentence: Sentence) -> Tuple[ConnectivityStatement, bool]:
    reference_uri = statement[ID]
    defaults = {
        "sentence": sentence,
        "knowledge_statement": statement[LABEL],
        "sex": get_sex(statement),
        "circuit_type": get_circuit_type(statement),
        "functional_circuit_role": get_functional_circuit_role(statement),
        "phenotype": get_phenotype(statement),
        "projection_phenotype": get_projection_phenotype(statement),
        "reference_uri": statement[ID],
        "state": CSState.EXPORTED,
    }

    connectivity_statement, created = ConnectivityStatement.objects.get_or_create(
        reference_uri=reference_uri,
        defaults=defaults
    )
    if not created:
        if has_changes(connectivity_statement, statement, defaults):
            ConnectivityStatement.objects.filter(reference_uri=reference_uri).update(**defaults)
            fields_to_refresh = [field for field in defaults.keys() if field != 'state']
            connectivity_statement.refresh_from_db(fields=fields_to_refresh)
            add_ingestion_system_note(connectivity_statement)

    if statement.get(VALIDATION_ERRORS):
        errors = '; '.join(statement[VALIDATION_ERRORS])
        do_transition_to_invalid(connectivity_statement, errors)

    update_many_to_many_fields(connectivity_statement, statement)

    return connectivity_statement, created


def has_changes(connectivity_statement, statement, defaults):
    for field, value in defaults.items():
        if field in ['sex', 'functional_circuit_role', 'phenotype', 'projection_phenotype']:
            current_fk_id = getattr(connectivity_statement, f'{field}_id')
            new_fk_id = value.id if value is not None else None
            if current_fk_id != new_fk_id:
                return True
        else:
            # For simple fields, directly compare the values
            if getattr(connectivity_statement, field) != value:
                return True

    # Check for changes in species
    current_species = set(species.ontology_uri for species in connectivity_statement.species.all())
    new_species = set(statement.get(SPECIES, []))
    if current_species != new_species:
        return True

    # Check for changes in provenance
    current_provenance = set(provenance.uri for provenance in connectivity_statement.provenance_set.all())
    new_provenance = set(statement.get(PROVENANCE, []))
    if current_provenance != new_provenance:
        return True

    # Check for changes in forward_connection
    current_forward_connections = set(connection.id for connection in connectivity_statement.forward_connection.all())
    new_forward_connections = set(statement.get(FORWARD_CONNECTION, []))
    if current_forward_connections != new_forward_connections:
        return True

    # Check for changes in origins
    current_origins = set(origin.ontology_uri for origin in connectivity_statement.origins.all())
    new_origins = statement[ORIGINS].anatomical_entities
    if current_origins != new_origins:
        return True

    # Check for changes in vias
    current_vias = [
        {
            'anatomical_entities': set(via.anatomical_entities.all().values_list('ontology_uri', flat=True)),
            'from_entities': set(via.from_entities.all().values_list('ontology_uri', flat=True))
        }
        for via in connectivity_statement.via_set.order_by('order').all()
    ]
    new_vias = statement[VIAS]

    if len(current_vias) != len(new_vias):
        return True

    for current_via, new_via in zip(current_vias, new_vias):
        if (new_via.anatomical_entities != current_via['anatomical_entities'] or
                new_via.from_entities != current_via['from_entities']):
            return True

    # Check for changes in destinations
    current_destinations = connectivity_statement.destinations.all()
    new_destinations = statement[DESTINATIONS]

    if len(current_destinations) != len(new_destinations):
        return True

    # We may need to change this algorithm when multi-destination is supported by neurondm

    current_destinations_anatomical_entities = set(
        uri for destination in current_destinations
        for uri in destination.anatomical_entities.all().values_list('ontology_uri', flat=True)
    )
    current_destinations_from_entities = set(
        uri for destination in current_destinations
        for uri in destination.from_entities.all().values_list('ontology_uri', flat=True)
    )

    new_destinations_anatomical_entities = set(
        uri for destination in new_destinations
        for uri in destination.anatomical_entities
    )
    new_destinations_from_entities = set(
        uri for destination in new_destinations
        for uri in destination.from_entities
    )

    if (current_destinations_anatomical_entities != new_destinations_anatomical_entities or
            current_destinations_from_entities != new_destinations_from_entities):
        return True

    # Not checking the Notes because they are kept

    return False


def get_sex(statement: Dict) -> Sex:
    return get_value_or_none(Sex, statement[SEX][0] if statement[SEX] else None)


def get_functional_circuit_role(statement: Dict) -> Optional[FunctionalCircuitRole]:
    if len(statement[FUNCTIONAL_CIRCUIT_ROLE]) > 1:
        logger_service.add_warning(
            LoggableEvent(statement[ID], None, f'Multiple functional circuit roles found.'))

    return get_value_or_none(
        FunctionalCircuitRole, statement[FUNCTIONAL_CIRCUIT_ROLE][0]) if statement[FUNCTIONAL_CIRCUIT_ROLE] else None


def get_circuit_type(statement: Dict):
    if statement[CIRCUIT_TYPE]:
        if len(statement[CIRCUIT_TYPE]) > 1:
            logger_service.add_warning(LoggableEvent(statement[ID], None, f'Multiple circuit types found'))
        return CIRCUIT_TYPE_MAPPING.get(statement[CIRCUIT_TYPE][0], CircuitType.UNKNOWN)
    else:
        logger_service.add_warning(LoggableEvent(statement[ID], None, f'No circuit type found.'))
        return CircuitType.UNKNOWN


def get_phenotype(statement: Dict) -> Optional[Phenotype]:
    if statement[PHENOTYPE]:
        if len(statement[PHENOTYPE]) > 1:
            logger_service.add_warning(LoggableEvent(statement[ID], None, f'Multiple phenotypes found.'))

        for p in statement[PHENOTYPE]:
            try:
                phenotype = Phenotype.objects.get(ontology_uri=p)
                return phenotype
            except Phenotype.DoesNotExist:
                pass

        logger_service.add_warning(LoggableEvent(statement[ID], None, f'No valid phenotype found.'))

    return None


def get_projection_phenotype(statement: Dict) -> Optional[ProjectionPhenotype]:
    if statement[OTHER_PHENOTYPE]:
        last_phenotype_uri = statement[OTHER_PHENOTYPE][-1]
        try:
            projection_phenotype = ProjectionPhenotype.objects.get(ontology_uri=last_phenotype_uri)
            return projection_phenotype
        except ProjectionPhenotype.DoesNotExist:
            pass
    else:
        logger_service.add_warning(LoggableEvent(statement[ID], None, f'No projection phenotypes found.'))
    return None


def do_transition_to_invalid(connectivity_statement: ConnectivityStatement, note: str):
    system_user = User.objects.get(username="system")
    connectivity_statement.invalid(by=system_user)
    connectivity_statement.save()

    Note.objects.create(
        connectivity_statement=connectivity_statement,
        user=User.objects.get(username="system"),
        type=NoteType.ALERT,
        note=f"Invalidated due to the following reasons: {note}"
    )


def update_many_to_many_fields(connectivity_statement: ConnectivityStatement, statement: Dict):
    connectivity_statement.origins.clear()
    connectivity_statement.species.clear()
    # Notes are not cleared because they should be kept

    for provenance in connectivity_statement.provenance_set.all():
        provenance.delete()

    for destination in connectivity_statement.destinations.all():
        destination.delete()

    for via in connectivity_statement.via_set.all():
        via.delete()

    add_origins(connectivity_statement, statement)
    add_vias(connectivity_statement, statement)
    add_destinations(connectivity_statement, statement)
    add_species(connectivity_statement, statement)
    add_provenances(connectivity_statement, statement)
    add_notes(connectivity_statement, statement)


def add_origins(connectivity_statement: ConnectivityStatement, statement: Dict):
    origin_uris = statement[ORIGINS].anatomical_entities
    origins = []
    for uri in origin_uris:
        anatomical_entities = AnatomicalEntity.objects.filter(ontology_uri=uri)
        origins.append(anatomical_entities.first())

    if origins:
        connectivity_statement.origins.add(*origins)


def add_vias(connectivity_statement: ConnectivityStatement, statement: Dict):
    vias_data = [
        Via(connectivity_statement=connectivity_statement, type=via.type, order=via.order)
        for via in statement[VIAS]
    ]
    created_vias = Via.objects.bulk_create(vias_data)

    for via_instance, via_data in zip(created_vias, statement[VIAS]):
        for uri in via_data.anatomical_entities:
            anatomical_entities = AnatomicalEntity.objects.filter(ontology_uri=uri)
            via_instance.anatomical_entities.add(anatomical_entities.first())
        for uri in via_data.from_entities:
            from_entity = AnatomicalEntity.objects.filter(ontology_uri=uri).first()
            via_instance.from_entities.add(from_entity)


def add_destinations(connectivity_statement: ConnectivityStatement, statement: Dict):
    destinations_data = [
        Destination(connectivity_statement=connectivity_statement, type=dest.type)
        for dest in statement[DESTINATIONS]
    ]

    created_destinations = Destination.objects.bulk_create(destinations_data)

    for destination_instance, dest_data in zip(created_destinations, statement[DESTINATIONS]):
        for uri in dest_data.anatomical_entities:
            anatomical_entity = AnatomicalEntity.objects.filter(ontology_uri=uri).first()
            destination_instance.anatomical_entities.add(anatomical_entity)

        for uri in dest_data.from_entities:
            from_entity = AnatomicalEntity.objects.filter(ontology_uri=uri).first()
            destination_instance.from_entities.add(from_entity)


def add_notes(connectivity_statement: ConnectivityStatement, statement: Dict):
    for note in statement[NOTE_ALERT]:
        Note.objects.create(connectivity_statement=connectivity_statement,
                            user=User.objects.get(username="system"),
                            type=NoteType.ALERT,
                            note=note)


def add_provenances(connectivity_statement: ConnectivityStatement, statement: Dict):
    # todo: check if it's fine to add all provenances, in the past we were only adding the first
    provenances_list = statement[PROVENANCE] if statement[PROVENANCE] else [statement[ID]]
    provenances = (Provenance(connectivity_statement=connectivity_statement, uri=provenance) for provenance in
                   provenances_list)
    Provenance.objects.bulk_create(provenances)


def add_species(connectivity_statement: ConnectivityStatement, statement: Dict):
    species = Specie.objects.filter(ontology_uri__in=statement[SPECIES])
    connectivity_statement.species.add(*species)


def add_ingestion_system_note(connectivity_statement: ConnectivityStatement):
    Note.objects.create(connectivity_statement=connectivity_statement,
                        user=User.objects.get(username="system"),
                        type=NoteType.ALERT,
                        note=f"Overwritten by manual ingestion")


def update_forward_connections(statements: List):
    for statement in statements:
        connectivity_statement = ConnectivityStatement.objects.get(reference_uri=statement[ID])
        connectivity_statement.forward_connection.clear()
        for uri in statement[FORWARD_CONNECTION]:
            try:
                forward_statement = ConnectivityStatement.objects.get(reference_uri=uri)
            except ConnectivityStatement.DoesNotExist:
                # connectivity statement state should have been set to invalid prior
                continue
            connectivity_statement.forward_connection.add(forward_statement)


def update_upstream_statements():
    invalid_visited = set()
    initial_invalid_statements = ConnectivityStatement.objects.filter(state=CSState.INVALID)

    for statement in initial_invalid_statements:
        propagate_invalid_state(statement, invalid_visited)


def propagate_invalid_state(connectivity_statement: ConnectivityStatement, invalid_visited: Set,
                            previous_reason: str = ''):
    statement_uri = connectivity_statement.reference_uri

    if statement_uri in invalid_visited:
        return

    if connectivity_statement.state == CSState.INVALID:
        invalid_visited.add(statement_uri)

        # Fetch backward connections directly from the database
        backward_connections = ConnectivityStatement.objects.filter(
            forward_connection=connectivity_statement
        )

        for backward_cs in backward_connections:
            current_reason = ''
            if backward_cs.state != CSState.INVALID:
                # Build the reason string
                current_reason = (f"statement with id {backward_cs.id} is invalid because its "
                                  f"forward connection with id {connectivity_statement.id} is invalid")
                if previous_reason:
                    current_reason += f" because {previous_reason}"

                # Transition the backward statement to an invalid state with the built reason
                do_transition_to_invalid(backward_cs, current_reason)
            else:
                # TODO: Should we update the reason?
                pass

            # Recursively propagate invalid state
            propagate_invalid_state(backward_cs, invalid_visited, current_reason)
