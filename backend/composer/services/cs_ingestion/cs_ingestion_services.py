from composer.models import AnatomicalEntity, Sentence, ConnectivityStatement, Sex, FunctionalCircuitRole, \
    ProjectionPhenotype, Phenotype, Specie, Provenance, Via, Note, User, Destination
import logging
from datetime import datetime
from .neurondm_script import main as get_statements_from_neurondm
from ...enums import (
    CircuitType,
    NoteType,
    DestinationType,
    SentenceState,
    CSState
)

from ..state_services import SentenceService, ConnectivityStatementService

ID = "id"
ORIGIN = "origin"
DESTINATION = "dest"
VIAS = "path"
LABEL = "label"
SENTENCE_NUMBER = 'sentence_number'
ENTITY_URI = 'loc'
TYPE = 'type'
CIRCUIT_TYPE = 'circuit_type'
SEX = 'sex'
FUNCTIONAL_CIRCUIT_ROLE = 'dont_know_fcrp'
PHENOTYPE = 'phenotype'
OTHER_PHENOTYPE = 'other_phenotype'
SPECIES = 'species'
PROVENANCE = 'provenance'
NOTE_ALERT = 'note_alert'
CIRCUIT_TYPE_MAPPING = {
    "http://uri.interlex.org/tgbugs/uris/readable/IntrinsicPhenotype": CircuitType.INTRINSIC,
    "http://uri.interlex.org/tgbugs/uris/readable/ProjectionPhenotype": CircuitType.PROJECTION,
    "http://uri.interlex.org/tgbugs/uris/readable/MotorPhenotype": CircuitType.MOTOR,
    "http://uri.interlex.org/tgbugs/uris/readable/SensoryPhenotype": CircuitType.SENSORY,
    "": CircuitType.UNKNOWN
}

NOW = datetime.now().strftime("%Y%m%d%H%M%S")


def not_found_entity(entity):
    if len(AnatomicalEntity.objects.filter(ontology_uri=entity)) == 0:
        return True
    return False


def has_invalid_entities(statement):
    invalid_entities = [
    ]
    if has_prop(statement[ORIGIN]) and not_found_entity(statement[ORIGIN][0]):
        invalid_entities.append({"entity": statement[ORIGIN][0], "prop": ORIGIN})
    if has_prop(statement[DESTINATION]) and not_found_entity(statement[DESTINATION][0][ENTITY_URI]):
        invalid_entities.append({"entity": statement[DESTINATION][0][ENTITY_URI], "prop": DESTINATION})
    if has_prop(statement[VIAS]):
        for entity in statement[VIAS]:
            if not_found_entity(entity[ENTITY_URI]):
                invalid_entities.append({"entity": entity[ENTITY_URI], "prop": VIAS})

    if len(invalid_entities) > 0:
        logging.warning(
            f'Skip statement {statement[LABEL]} due to the following entities not found in composer db: {invalid_entities}')
        return True
    return False


def has_invalid_sex(statement):
    if has_prop(statement[SEX]) and len(Sex.objects.filter(ontology_uri=statement[SEX][0])) == 0:
        logging.warning(f'Skip statement {statement[LABEL]} due to sex {statement[SEX][0]} not found in composer db')
        return True
    else:
        return False


def has_invalid_species(statement):
    if has_prop(statement[SPECIES]):
        for s in statement[SPECIES]:
            try:
                Specie.objects.get(ontology_uri=s)
                return False
            except:
                logging.warning(f'Skip statement {statement[LABEL]} due to specie {s} not found in composer db')
                return True
    return False


def get_valid_phenotypes(statement):
    valid_phenotypes = []
    if has_prop(statement[PHENOTYPE]):
        for p in statement[PHENOTYPE]:
            try:
                phenotype = Phenotype.objects.get(ontology_uri=p)
                valid_phenotypes.append(phenotype)
            except:
                logging.warning(f'Skip phenotype {p} at statement {statement[LABEL]} not found in composer db ')
    return valid_phenotypes


def get_first_phenotype(statement):
    # some values from neurondm's phenotype field are not mapped in composer db.
    # Add only the first one founded in composer db, if any
    phenotypes_list = get_valid_phenotypes(statement)
    if len(phenotypes_list) == 0:
        return None
    elif len(phenotypes_list) > 1:
        logging.warning(
            f'Multiple phenotypes found, ignore the following {phenotypes_list[1:]} at statement {statement[LABEL]}')
    return phenotypes_list[0]


def validate_statements(statement_list):
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

        valid_statements.append(statement)

    return valid_statements


def get_or_create_sentence(statement):
    text = f'{statement[LABEL]} created from neurondm on {NOW}'
    has_sentence_reference = len(statement[SENTENCE_NUMBER]) > 0
    sentence, created = Sentence.objects.get_or_create(
        doi__iexact=statement[ID],
        defaults={"title": text[0:185], "text": text,
                  "doi": statement[ID],
                  "external_ref": statement[SENTENCE_NUMBER][0] if has_sentence_reference else None,
                  "batch_name": f"neurondm-{NOW}" if has_sentence_reference else None
                  },
    )
    if created:
        logging.info(f"Sentence for neuron {statement[LABEL]} created.")
        sentence.save()
    return sentence


def has_prop(prop):
    return True if len(prop) > 0 else False


def get_value_or_none(model, prop):
    if prop:
        try:
            return model.objects.filter(ontology_uri=prop).first()
        except model.DoesNotExist:
            logging.warning(f'{model.__name__} with uri {prop} not found in the database')
            return None
    else:
        return None


def get_projetion_phenotype(statement):
    # other phenotypes includes 3 predicates, we will only store hasProjectionPhenotype
    # which belongs to the last element of the other_phenotypes list from neurondm
    try:
        projection_phenotype = ProjectionPhenotype.objects.get(ontology_uri=statement[OTHER_PHENOTYPE][-1])
    except:
        projection_phenotype = None
    return projection_phenotype


def ingest_statements():
    statements_list = get_statements_from_neurondm()

    valid_statements = validate_statements(statements_list)
    for statement in valid_statements:
        # create an artifact sentence to relate to the statements
        sentence = get_or_create_sentence(statement)
        connectivity_statement, skip_update = get_or_create_connectivity_statement(statement, sentence)
        # add the many-to-many fields:  species, provenances, notes, origins, vias, destinations
        if not skip_update:
            update_many_to_many_fields(connectivity_statement, statement)


def update_many_to_many_fields(connectivity_statement, statement):
    # Clear existing many-to-many relations
    connectivity_statement.origins.clear()
    connectivity_statement.destinations.clear()
    connectivity_statement.vias.clear()
    connectivity_statement.species.clear()
    connectivity_statement.provenances.clear()
    # Notes are kept

    # Add new many-to-many relations
    add_origins(connectivity_statement, statement)
    add_vias(connectivity_statement, statement)
    add_destinations(connectivity_statement, statement)
    add_species(connectivity_statement, statement)
    add_provenances(connectivity_statement, statement)
    add_notes(connectivity_statement, statement)


def get_or_create_connectivity_statement(statement, sentence):
    reference_uri = statement[ID]
    existing_cs = ConnectivityStatement.objects.filter(reference_uri__exact=reference_uri).first()

    # If CS exists and is in 'compose now' state, skip
    if existing_cs and existing_cs.state == CSState.COMPOSE_NOW:
        return existing_cs, True

    # Update or create ConnectivityStatement
    defaults = {
        "sentence": sentence,
        "knowledge_statement": statement[LABEL],
        "circuit_type": CIRCUIT_TYPE_MAPPING.get(statement.get(CIRCUIT_TYPE, [""])[0], CircuitType.UNKNOWN),
        "sex": get_value_or_none(Sex, statement[SEX][0] if has_prop(statement[SEX]) else None),
        "functional_circuit_role": get_value_or_none(FunctionalCircuitRole,
                                                     statement[FUNCTIONAL_CIRCUIT_ROLE][0] if has_prop(
                                                         statement[FUNCTIONAL_CIRCUIT_ROLE]) else None),
        "phenotype": get_first_phenotype(statement),
        "projection_phenotype": get_projetion_phenotype(statement)
    }

    connectivity_statement = ConnectivityStatement.objects.update_or_create(
        reference_uri__exact=reference_uri,
        defaults=defaults
    )

    return connectivity_statement, False


def add_origins(connectivity_statement, statement):
    origins = [origin for origin in (get_value_or_none(AnatomicalEntity, o)
                                     for o in statement[ORIGIN]) if origin]
    connectivity_statement.origins.add(*origins)


def add_vias(connectivity_statement, statement):
    vias_data = [
        Via(connectivity_statement=connectivity_statement, type=via[TYPE], order=index)
        for index, via in enumerate(statement[VIAS])
    ]
    # Crate vias
    created_vias = Via.objects.bulk_create(vias_data)

    # Add anatomical entities to vias
    for via_instance, via_data in zip(created_vias, statement[VIAS]):
        anatomical_entities = AnatomicalEntity.objects.filter(
            ontology_uri__in=via_data[ENTITY_URI]
        )
        via_instance.anatomical_entities.set(anatomical_entities)


def add_destinations(connectivity_statement, statement):
    destinations_data = [
        Destination(connectivity_statement=connectivity_statement, type=dest.get(TYPE, DestinationType.UNKNOWN))
        for dest in statement[DESTINATION]
    ]

    # Create destinations
    created_destinations = Destination.objects.bulk_create(destinations_data)

    # Add anatomical entities to destinations
    for destination_instance, dest_data in zip(created_destinations, statement[DESTINATION]):
        destination_entity = AnatomicalEntity.objects.filter(ontology_uri=dest_data[ENTITY_URI]).first()
        if destination_entity:
            destination_instance.anatomical_entities.add(destination_entity)


def add_notes(connectivity_statement, statement):
    # only 5 statements have a note_alert but they were all filtered out
    # since at least one of their anatomical entities was not found in composer db
    if has_prop(statement[NOTE_ALERT]):
        Note.objects.create(connectivity_statement=connectivity_statement,
                            user=User.objects.get(username="system"), type=NoteType.ALERT,
                            note=statement[NOTE_ALERT][0])


def add_provenances(connectivity_statement, statement):
    provenances_list = statement[PROVENANCE][0].split(", ") if has_prop(statement[PROVENANCE]) else [
        statement[ID]]
    provenances = (Provenance(connectivity_statement=connectivity_statement, uri=provenance) for provenance in
                   provenances_list)
    Provenance.objects.bulk_create(provenances)


def add_species(connectivity_statement, statement):
    species = Specie.objects.filter(ontology_uri__in=statement[SPECIES])
    connectivity_statement.species.add(*species)


def do_state_transitions(sentence: Sentence, connectivity_statement: ConnectivityStatement):
    system_user = User.objects.get(username="system")
    transition_sentence_to_compose_now(sentence, system_user)
    transition_statement_to_exported(connectivity_statement, system_user)


def transition_sentence_to_compose_now(sentence: Sentence, user: User):
    available_transitions = [
        available_state.target
        for available_state in sentence.get_available_user_state_transitions(
            user
        )
    ]
    if SentenceState.COMPOSE_NOW in available_transitions:
        # we need to update the state to compose_now when the system user has the permission to do so
        sentence = SentenceService(sentence).do_transition(
            SentenceState.COMPOSE_NOW, user
        )
        sentence.save()
    return sentence


def transition_statement_to_exported(connectivity_statement: ConnectivityStatement, system_user: User):
    available_transitions = [
        available_state.target
        for available_state in connectivity_statement.get_available_user_state_transitions(
            system_user
        )
    ]
    # we need to update the statement state to exported
    if CSState.EXPORTED in available_transitions:
        cs = ConnectivityStatementService(connectivity_statement).do_transition(
            CSState.EXPORTED, system_user
        )
        cs.save()
