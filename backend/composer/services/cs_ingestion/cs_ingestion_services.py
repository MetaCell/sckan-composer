from typing import List, Dict, Optional, Tuple

from composer.models import AnatomicalEntity, Sentence, ConnectivityStatement, Sex, FunctionalCircuitRole, \
    ProjectionPhenotype, Phenotype, Specie, Provenance, Via, Note, User, Destination
import logging
from datetime import datetime
from .neurondm_script import main as get_statements_from_neurondm
from ...enums import (
    CircuitType,
    NoteType,
    CSState, SentenceState
)

ID = "id"
ORIGINS = "origins"
DESTINATIONS = "destinations"
VIAS = "vias"
LABEL = "label"
SENTENCE_NUMBER = 'sentence_number'
ENTITY_URI = 'loc'
TYPE = 'type'
CIRCUIT_TYPE = 'circuit_type'
FUNCTIONAL_CIRCUIT_ROLE = 'circuit_role'
SEX = 'sex'
PHENOTYPE = 'phenotype'
OTHER_PHENOTYPE = 'other_phenotypes'
SPECIES = 'species'
PROVENANCE = 'provenance'
NOTE_ALERT = 'note_alert'
FORWARD_CONNECTION = "forward_connection"
CIRCUIT_TYPE_MAPPING = {
    "http://uri.interlex.org/tgbugs/uris/readable/IntrinsicPhenotype": CircuitType.INTRINSIC,
    "http://uri.interlex.org/tgbugs/uris/readable/ProjectionPhenotype": CircuitType.PROJECTION,
    "http://uri.interlex.org/tgbugs/uris/readable/MotorPhenotype": CircuitType.MOTOR,
    "http://uri.interlex.org/tgbugs/uris/readable/SensoryPhenotype": CircuitType.SENSORY,
    "": CircuitType.UNKNOWN
}

NOW = datetime.now().strftime("%Y%m%d%H%M%S")


def ingest_statements():
    statements_list = get_statements_from_neurondm()

    valid_statements = validate_statements(statements_list)
    for statement in valid_statements:
        sentence, sentence_created = get_or_create_sentence(statement)

        connectivity_statement, statement_created = get_or_create_connectivity_statement(statement, sentence)

        if not statement_created:
            if should_overwrite(connectivity_statement, statement):
                defaults = generate_connectivity_statement_defaults(statement, sentence)
                ConnectivityStatement.objects.filter(id=connectivity_statement.id).update(**defaults)
                update_many_to_many_fields(connectivity_statement, statement)
                add_ingestion_system_note(connectivity_statement)

    update_forward_connections(valid_statements)


def validate_statements(statement_list: List):
    valid_statements = []
    for statement in statement_list:
        # skip statements with entities not found in db (log the ones skipped)
        if has_invalid_entities(statement):
            continue
        # skip statements with sex not found in db
        if has_invalid_sex(statement):
            continue
        # skip statements with species not found in db
        if has_invalid_species(statement):
            continue

        if len(statement[ORIGINS].anatomical_entities) == 0:
            continue

        valid_statements.append(statement)

    return valid_statements


def has_invalid_entities(statement: Dict) -> bool:
    invalid_entities = []

    # Check origins
    for uri in statement[ORIGINS].anatomical_entities:
        if not found_entity(uri):
            invalid_entities.append({"entity": uri, "prop": ORIGINS})

    # Check destinations
    for destination in statement[DESTINATIONS]:
        for uri in destination.anatomical_entities:
            if not found_entity(uri):
                invalid_entities.append({"entity": uri, "prop": DESTINATIONS})

    # Check vias
    for via in statement[VIAS]:
        for uri in via.anatomical_entities:
            if not found_entity(uri):
                invalid_entities.append({"entity": uri, "prop": VIAS})

    if invalid_entities:
        logging.warning(
            f'Skip statement {statement[LABEL]} due to the following entities not found in composer db: {invalid_entities}')
        return True
    return False


def has_invalid_sex(statement: Dict) -> bool:
    if statement[SEX]:
        if len(statement[SEX]) > 1:
            logging.warning(
                f'Warning: Multiple sexes found in statement for {statement[LABEL]}. Only checking the first one.')

        first_sex_uri = statement[SEX][0]
        if not Sex.objects.filter(ontology_uri=first_sex_uri).exists():
            logging.warning(f'Skip statement {statement[LABEL]} due to sex {first_sex_uri} not found in composer db')
            return True
    return False


def has_invalid_species(statement: Dict) -> bool:
    for species_uri in statement[SPECIES]:
        if not Specie.objects.filter(ontology_uri=species_uri).exists():
            logging.warning(
                f'Skip statement {statement[LABEL]} due to species {species_uri} not found in composer db')
            return True
    return False


def get_or_create_sentence(statement: Dict) -> Tuple[Sentence, bool]:
    text = f'{statement[LABEL]} created from neurondm on {NOW}'
    has_sentence_reference = len(statement[SENTENCE_NUMBER]) > 0

    if len(statement[SENTENCE_NUMBER]) > 1:
        logging.warning(f'Multiple sentence numbers found in statement for {statement[LABEL]}. Using the first one.')

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
        sentence.save()
    return sentence, created


def should_overwrite(connectivity_statement: ConnectivityStatement, statement: Dict) -> bool:
    if connectivity_statement.destinations.count() > 1:
        logging.warning(f'Skip statement {statement[LABEL]} due to:'
                        f' statement already found and has multiple destinations')
        return False

    if connectivity_statement.state != CSState.EXPORTED:
        logging.warning(f'Skip statement {statement[LABEL]} due to:'
                        f' statement already found and is not in {CSState.EXPORTED} state')
        return False

    return True


def get_or_create_connectivity_statement(statement: Dict, sentence: Sentence) -> Tuple[ConnectivityStatement, bool]:
    reference_uri = statement[ID]
    defaults = generate_connectivity_statement_defaults(statement, sentence)
    connectivity_statement, created = ConnectivityStatement.objects.get_or_create(
        reference_uri__exact=reference_uri,
        defaults=defaults
    )
    if created:
        update_many_to_many_fields(connectivity_statement, statement)

    return connectivity_statement, created


def generate_connectivity_statement_defaults(statement: Dict, sentence: Sentence) -> Dict:
    return {
        "sentence": sentence,
        "knowledge_statement": statement[LABEL],
        "sex": get_sex(statement),
        "circuit_type": get_circuit_type(statement),
        "functional_circuit_role": get_functional_circuit_role(statement),
        "phenotype": get_phenotype(statement),
        "projection_phenotype": get_projection_phenotype(statement),
        "state": CSState.EXPORTED,  # TODO: Confirm if this is fine
        "reference_uri": statement[ID],
    }


def get_sex(statement: Dict) -> Sex:
    return get_value_or_none(Sex, statement[SEX][0] if statement[SEX] else None)


def get_functional_circuit_role(statement: Dict) -> Optional[FunctionalCircuitRole]:
    # Log a warning if there are multiple functional circuit roles
    if len(statement[FUNCTIONAL_CIRCUIT_ROLE]) > 1:
        logging.warning(
            f'Warning: Multiple functional circuit roles found in statement for {statement[LABEL]}. '
            f'Only the first one will be used.')

    return get_value_or_none(
        FunctionalCircuitRole, statement[FUNCTIONAL_CIRCUIT_ROLE][0]) if statement[FUNCTIONAL_CIRCUIT_ROLE] else None


def get_circuit_type(statement: Dict):
    if statement[CIRCUIT_TYPE]:
        if len(statement[CIRCUIT_TYPE]) > 1:
            logging.warning(
                f'Warning: Multiple circuit types found in statement for {statement[LABEL]}. '
                f'Only the first one will be used.')
        return CIRCUIT_TYPE_MAPPING.get(statement[CIRCUIT_TYPE][0], CircuitType.UNKNOWN)
    else:
        logging.warning(f'No circuit type found for statement {statement[LABEL]}. Using UNKNOWN.')
        return CircuitType.UNKNOWN


def get_phenotype(statement: Dict) -> Optional[Phenotype]:
    if statement[PHENOTYPE]:
        if len(statement[PHENOTYPE]) > 1:
            logging.warning(
                f'Warning: Multiple circuit types found in statement for {statement[LABEL]}. '
                f'The first valid one will be used.')

        for p in statement[PHENOTYPE]:
            try:
                phenotype = Phenotype.objects.get(ontology_uri=p)
                return phenotype
            except Phenotype.DoesNotExist:
                logging.warning(f'Skip phenotype {p} at statement {statement[LABEL]} not found in composer db')

        logging.warning(f'No valid phenotype found at statement {statement[LABEL]}')

    return None


def get_projection_phenotype(statement: Dict) -> Optional[ProjectionPhenotype]:
    if statement[OTHER_PHENOTYPE]:
        last_phenotype_uri = statement[OTHER_PHENOTYPE][-1]
        try:
            projection_phenotype = ProjectionPhenotype.objects.get(ontology_uri=last_phenotype_uri)
            return projection_phenotype
        except ProjectionPhenotype.DoesNotExist:
            logging.warning(
                f'Projection phenotype {last_phenotype_uri} not found in database for statement {statement[LABEL]}')
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
    for statement in statements:
        connectivity_statement = get_connectivity_statement_by_reference_uri(statement[ID])
        if connectivity_statement:
            if should_overwrite(connectivity_statement, statement):
                # Clear existing forward connections
                connectivity_statement.forward_connection.clear()

                for uri in statement[FORWARD_CONNECTION]:
                    forward_statement = get_connectivity_statement_by_reference_uri(uri)
                    if forward_statement:
                        connectivity_statement.forward_connection.add(forward_statement)
                    else:
                        logging.warning(
                            f"No statement found for forward connection URI: "
                            f"{uri} in statement {statement[LABEL]}")
        else:
            # Should never happen because we create them prior
            logging.warning(f"No connectivity statement found for reference URI: {statement[ID]}")


def get_connectivity_statement_by_reference_uri(reference_uri: str) -> Optional[ConnectivityStatement]:
    try:
        return ConnectivityStatement.objects.get(reference_uri__exact=reference_uri)
    except ConnectivityStatement.DoesNotExist:
        return None


def get_value_or_none(model, prop):
    if prop:
        try:
            return model.objects.filter(ontology_uri=prop).first()
        except model.DoesNotExist:
            logging.warning(f'{model.__name__} with uri {prop} not found in the database')
            return None
    else:
        return None


def found_entity(uri: str) -> bool:
    return AnatomicalEntity.objects.filter(ontology_uri=uri).exists()
