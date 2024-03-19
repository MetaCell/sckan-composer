import logging

import rdflib
from neurondm import orders

from composer.enums import CircuitType
from composer.models import AnatomicalEntityNew

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
    "": None
}

VALIDATION_ERRORS = "validation_errors"
STATE = "state"


def get_value_or_none(model, prop: str):
    if prop:
        try:
            return model.objects.filter(ontology_uri=prop).first()
        except model.DoesNotExist:
            logging.warning(f'{model.__name__} with uri {prop} not found in the database')
            return None
    else:
        return None


def found_entity(uri: str) -> bool:
    return AnatomicalEntityNew.objects.filter(ontology_uri=uri).exists()