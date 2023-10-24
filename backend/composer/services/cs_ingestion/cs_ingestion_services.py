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


def pick_first_phenotype(phenotypes_list, statement):
    if len(phenotypes_list) == 0:
        return None
    elif len(phenotypes_list) > 1:
        logging.warning(
            f'Multiple phenotypes found, ignore the following {phenotypes_list[1:]} at statement {statement[LABEL]}')
    return phenotypes_list[0]


def validate_statements(statement_list):
    valid_statements = []
    for statement in statement_list:
        if has_invalid_entities(statement):
            continue
        if has_invalid_sex(statement):
            continue
        if has_invalid_species(statement):
            continue

        valid_statements.append(statement)

    return valid_statements


def create_artifact_sentence(statement):
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
    if has_prop(prop):
        if model == AnatomicalEntity:
            return model.objects.filter(ontology_uri=prop[0])[0]
        else:
            return model.objects.get(ontology_uri=prop[0])
    else:
        return None


def do_transition_to_compose_now(sentence: Sentence, user: User):
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


def do_transition_to_exported(statement: ConnectivityStatement, user: User):
    cs = ConnectivityStatementService(statement).do_transition(
        CSState.EXPORTED, user
    )
    cs.save()


def do_state_transitions(sentence: Sentence):
    system_user = User.objects.get(username="system")
    s = do_transition_to_compose_now(sentence, system_user)
    for statement in s.connectivitystatement_set.all():
        available_transitions = [
            available_state.target
            for available_state in statement.get_available_user_state_transitions(
                system_user
            )
        ]
        # after the sentence and statement transitioned to compose_now, we need to update the statement state to exported 
        if CSState.EXPORTED in available_transitions:
            do_transition_to_exported(statement, system_user)


def ingest_statements():
    statements_list = get_statements_from_neurondm()

    # validation
    # skip statements with more than one destinations (dest field is now an array of ditcs including entity and type). Path is also now an array of dicts including entity and type.
    # skip statements with entities not found in db (log the ones skipped)
    # skip statements with sex not found in db
    # skip statements with species not found in db
    valid_statements = validate_statements(statements_list)

    # create an artifact sentence to relate to the statements
    for statement in valid_statements:
        sentence = create_artifact_sentence(statement)

        reference_uri = statement[ID]
        knowledge_statement = statement[LABEL]
        origin = get_value_or_none(AnatomicalEntity, statement[ORIGIN])
        circuit_type_uri = statement[CIRCUIT_TYPE][0] if has_prop(statement[CIRCUIT_TYPE]) else ""
        circuit_type = CIRCUIT_TYPE_MAPPING[circuit_type_uri]
        sex = get_value_or_none(Sex, statement[SEX])
        functional_circuit_role = get_value_or_none(FunctionalCircuitRole, statement[FUNCTIONAL_CIRCUIT_ROLE])
        # some values from neurondm's phenotype field are not mapped in composer db. Add only the first one founded in composer db, if any
        phenotypes_list = get_valid_phenotypes(statement)
        phenotype = pick_first_phenotype(phenotypes_list, statement)
        # other phenotypes includes 3 predicates, we will only store hasProjectionPhenotype which belongs to the last element of the other_phenotypes list from neurondm
        try:
            projection_phenotype = ProjectionPhenotype.objects.get(ontology_uri=statement[OTHER_PHENOTYPE][-1])
        except:
            projection_phenotype = None

        # create the statement

        connectivity_statement, created = ConnectivityStatement.objects.get_or_create(
            reference_uri__exact=reference_uri,
            defaults={
                "sentence": sentence, "knowledge_statement": knowledge_statement, "reference_uri": reference_uri,
                "circuit_type": circuit_type, "sex": sex, "functional_circuit_role": functional_circuit_role,
                "phenotype": phenotype, "projection_phenotype": projection_phenotype
            }
        )
        # add the many to many fields: path, species, provenances, notes
        if created:
            species = Specie.objects.filter(ontology_uri__in=statement[SPECIES])
            connectivity_statement.species.add(*species)
            connectivity_statement.origins.add(origin)
            if has_prop(statement[DESTINATION]):
                for dest in statement[DESTINATION]:
                    destination_entity = AnatomicalEntity.objects.filter(ontology_uri=dest[ENTITY_URI]).first()
                    destination_type = dest.get(TYPE, DestinationType.UNKNOWN)

                    if destination_entity:
                        destination_instance, _ = Destination.objects.get_or_create(
                            connectivity_statement=connectivity_statement,
                            defaults={
                                "type": destination_type
                            }
                        )
                        destination_instance.anatomical_entities.add(destination_entity)


            # TODO add display_order criteria on neurondm update
            vias = (Via(connectivity_statement=connectivity_statement,
                        anatomical_entity=AnatomicalEntity.objects.filter(ontology_uri=via[ENTITY_URI])[0],
                        type=via[TYPE]) for via in statement[VIAS])
            Via.objects.bulk_create(vias)
            provenances_list = statement[PROVENANCE][0].split(", ") if has_prop(statement[PROVENANCE]) else [
                statement[ID]]
            provenances = (Provenance(connectivity_statement=connectivity_statement, uri=provenance) for provenance in
                           provenances_list)
            Provenance.objects.bulk_create(provenances)
            # only 5 statements have a note_alert but they were all filtered out since at least one of their anatomical entities was not found in composer db
            if has_prop(statement[NOTE_ALERT]):
                Note.objects.create(connectivity_statement=connectivity_statement,
                                    user=User.objects.get(username="system"), type=NoteType.ALERT,
                                    note=statement[NOTE_ALERT][0])
            connectivity_statement.save()

            # transitions sentence from  open --> compose_now, and statement from draft --> compose_now --> exported 
            do_state_transitions(sentence)
