import logging
from datetime import datetime
from typing import List, Dict, Optional, Tuple, Set

from django.db import transaction

from composer.models import AnatomicalEntity, Sentence, ConnectivityStatement, Sex, FunctionalCircuitRole, \
    ProjectionPhenotype, Phenotype, Specie, Provenance, Via, Note, User, Destination
from .helpers import get_value_or_none, found_entity, \
    update_model_instance, ORIGINS, DESTINATIONS, VIAS, LABEL, SEX, SPECIES, ID, FORWARD_CONNECTION, SENTENCE_NUMBER, \
    FUNCTIONAL_CIRCUIT_ROLE, CIRCUIT_TYPE, CIRCUIT_TYPE_MAPPING, PHENOTYPE, OTHER_PHENOTYPE, NOTE_ALERT, PROVENANCE
from .logging_service import LoggerService, ENTITY_NOT_FOUND, SEX_NOT_FOUND, SPECIES_NOT_FOUND, MULTIPLE_DESTINATIONS, \
    STATEMENT_INCORRECT_STATE, FORWARD_CONNECTION_NOT_FOUND, SENTENCE_INCORRECT_STATE
from .models import LoggableError
from .neurondm_script import main as get_statements_from_neurondm
from ...enums import (
    CircuitType,
    NoteType,
    CSState, SentenceState
)

NOW = datetime.now().strftime("%Y%m%d%H%M%S")

logger_service = LoggerService()


def ingest_statements():
    statements_list = get_statements_from_neurondm(logger_service=logger_service)
    valid_statements = validate_statements(statements_list)

    successful_transaction = True
    try:
        with transaction.atomic():
            for statement in valid_statements:
                sentence, _ = get_or_create_sentence(statement)
                create_or_update_connectivity_statement(statement, sentence)

            update_forward_connections(valid_statements)
    except Exception as e:
        logger_service.add_error(LoggableError(statement_id=None, entity_id=None, message=str(e)))
        successful_transaction = False

    logger_service.write_errors_to_file()

    if successful_transaction:
        logger_service.write_ingested_statements_to_file(valid_statements)


def validate_statements(statement_list: List) -> List[Dict]:
    valid_statements = validate_statement_properties(statement_list)
    return validate_statement_dependencies(valid_statements)


def validate_statement_properties(statement_list: List) -> List[Dict]:
    valid_statements = []
    for statement in statement_list:
        if has_invalid_entities(statement) or has_invalid_sex(statement) or has_invalid_species(statement) \
                or has_invalid_sentence(statement) or has_invalid_statement(statement):
            continue

        valid_statements.append(statement)

    return valid_statements


def has_invalid_entities(statement: Dict) -> bool:
    found_invalid_entities = False

    # Consolidate all URIs to check
    uris_to_check = list(statement[ORIGINS].anatomical_entities)
    uris_to_check.extend(uri for dest in statement[DESTINATIONS] for uri in dest.anatomical_entities)
    uris_to_check.extend(uri for via in statement[VIAS] for uri in via.anatomical_entities)

    # Check all URIs and log if not found
    for uri in uris_to_check:
        if not found_entity(uri):
            logger_service.add_error(LoggableError(statement[ID], uri, ENTITY_NOT_FOUND))
            found_invalid_entities = True

    return found_invalid_entities


def has_invalid_sex(statement: Dict) -> bool:
    if statement[SEX]:
        if len(statement[SEX]) > 1:
            logging.warning(f'Multiple sexes found in statement for {statement[LABEL]}.')

        first_sex_uri = statement[SEX][0]
        if not Sex.objects.filter(ontology_uri=first_sex_uri).exists():
            logger_service.add_error(LoggableError(statement[ID], first_sex_uri, SEX_NOT_FOUND))
            return True
    return False


def has_invalid_species(statement: Dict) -> bool:
    for species_uri in statement[SPECIES]:
        if not Specie.objects.filter(ontology_uri=species_uri).exists():
            logger_service.add_error(LoggableError(statement[ID], species_uri, SPECIES_NOT_FOUND))
            return True
    return False


def has_invalid_sentence(statement: Dict) -> bool:
    try:
        sentence = Sentence.objects.get(doi__iexact=statement[ID])
    except Sentence.DoesNotExist:
        return False
    return not can_sentence_be_overwritten(sentence, statement)


def has_invalid_statement(statement: Dict) -> bool:
    try:
        connectivity_statement = ConnectivityStatement.objects.get(reference_uri__exact=statement[ID])
    except ConnectivityStatement.DoesNotExist:
        return False
    return not can_statement_be_overwritten(connectivity_statement, statement)


def can_statement_be_overwritten(connectivity_statement: ConnectivityStatement, statement) -> bool:
    if connectivity_statement.destinations.count() > 1:
        logger_service.add_error(LoggableError(statement[ID], None, MULTIPLE_DESTINATIONS))
        return False

    if connectivity_statement.state != CSState.EXPORTED:
        logger_service.add_error(LoggableError(statement[ID], None, STATEMENT_INCORRECT_STATE))
        return False

    return True


def can_sentence_be_overwritten(sentence: Sentence, statement: Dict) -> bool:
    if sentence.state != SentenceState.COMPOSE_NOW:
        logger_service.add_error(LoggableError(statement[ID], None, SENTENCE_INCORRECT_STATE))
        return False
    return True


def validate_statement_dependencies(statements: List) -> List[Dict]:
    statement_ids = {statement[ID] for statement in statements}

    valid_statements = []

    for statement in statements:
        if has_valid_forward_connections(statement, statement_ids):
            valid_statements.append(statement)

    return valid_statements


def has_valid_forward_connections(statement: Dict, statement_ids: Set[str]) -> bool:
    for reference_uri in statement[FORWARD_CONNECTION]:
        if reference_uri not in statement_ids:
            logger_service.add_error(LoggableError(statement[ID], reference_uri, FORWARD_CONNECTION_NOT_FOUND))
            return False
    return True


def get_or_create_sentence(statement: Dict) -> Tuple[Sentence, bool]:
    text = f'{statement[LABEL]} created from neurondm on {NOW}'
    has_sentence_reference = len(statement[SENTENCE_NUMBER]) > 0

    if len(statement[SENTENCE_NUMBER]) > 1:
        logging.warning(f'Multiple sentence numbers found in statement for {statement[LABEL]}.')

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

    if ConnectivityStatement.objects.filter(reference_uri__exact=reference_uri).exists():
        ConnectivityStatement.objects.filter(reference_uri__exact=reference_uri).update(**defaults)
        connectivity_statement = ConnectivityStatement.objects.get(reference_uri__exact=reference_uri)
        created = False
    else:
        connectivity_statement = ConnectivityStatement.objects.create(**defaults)
        created = True

    update_many_to_many_fields(connectivity_statement, statement)
    if not created:
        add_ingestion_system_note(connectivity_statement)

    return connectivity_statement, created


def get_sex(statement: Dict) -> Sex:
    return get_value_or_none(Sex, statement[SEX][0] if statement[SEX] else None)


def get_functional_circuit_role(statement: Dict) -> Optional[FunctionalCircuitRole]:
    if len(statement[FUNCTIONAL_CIRCUIT_ROLE]) > 1:
        logging.warning(f'Multiple functional circuit roles found in statement for {statement[LABEL]}.')

    return get_value_or_none(
        FunctionalCircuitRole, statement[FUNCTIONAL_CIRCUIT_ROLE][0]) if statement[FUNCTIONAL_CIRCUIT_ROLE] else None


def get_circuit_type(statement: Dict):
    if statement[CIRCUIT_TYPE]:
        if len(statement[CIRCUIT_TYPE]) > 1:
            logging.warning(f'Multiple circuit types found in statement for {statement[LABEL]}.')
        return CIRCUIT_TYPE_MAPPING.get(statement[CIRCUIT_TYPE][0], CircuitType.UNKNOWN)
    else:
        logging.warning(f'No circuit type found for statement {statement[LABEL]}. Using UNKNOWN.')
        return CircuitType.UNKNOWN


def get_phenotype(statement: Dict) -> Optional[Phenotype]:
    if statement[PHENOTYPE]:
        if len(statement[PHENOTYPE]) > 1:
            logging.warning(f'Multiple circuit types found in statement for {statement[LABEL]}.')

        for p in statement[PHENOTYPE]:
            try:
                phenotype = Phenotype.objects.get(ontology_uri=p)
                return phenotype
            except Phenotype.DoesNotExist:
                logging.warning(f'Phenotype {p} not found in composer db')

        logging.warning(f'No valid phenotype found at statement {statement[LABEL]}')

    return None


def get_projection_phenotype(statement: Dict) -> Optional[ProjectionPhenotype]:
    if statement[OTHER_PHENOTYPE]:
        last_phenotype_uri = statement[OTHER_PHENOTYPE][-1]
        try:
            projection_phenotype = ProjectionPhenotype.objects.get(ontology_uri=last_phenotype_uri)
            return projection_phenotype
        except ProjectionPhenotype.DoesNotExist:
            logging.warning(f'Projection phenotype {last_phenotype_uri} not found in composer db')
    else:
        logging.warning(f'No projection phenotypes found for statement {statement[LABEL]}')
    return None


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
    provenances_list = statement[PROVENANCE][0].split(", ") if statement[PROVENANCE] else [statement[ID]]
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
                        note=f"Overwritten by manual ingestion in {NOW}")


def update_forward_connections(statements: List):
    # This method doesn't check if the statements exist because they should have been validated prior
    for statement in statements:
        connectivity_statement = ConnectivityStatement.objects.get(reference_uri__exact=statement[ID])
        connectivity_statement.forward_connection.clear()
        for uri in statement[FORWARD_CONNECTION]:
            forward_statement = ConnectivityStatement.objects.get(reference_uri__exact=uri)
            connectivity_statement.forward_connection.add(forward_statement)
