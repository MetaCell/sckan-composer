import logging
from typing import Optional, Dict

from composer.enums import CircuitType
from composer.models import AnatomicalEntity, ConnectivityStatement

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

VALIDATION_ERRORS = "validation_errors"


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
    return AnatomicalEntity.objects.filter(ontology_uri=uri).exists()


def update_model_instance(instance, updates: Dict):
    for field, value in updates.items():
        setattr(instance, field, value)
    instance.save()
