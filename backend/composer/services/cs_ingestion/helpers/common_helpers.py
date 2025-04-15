import logging

from composer.enums import CircuitType
from composer.models import AnatomicalEntityMeta

ID = "id"
ORIGINS = "origins"
DESTINATIONS = "destinations"
VIAS = "vias"
LABEL = "label"
PREF_LABEL = "pref_label"
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
STATEMENT_ALERTS = "statement_alerts"
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
