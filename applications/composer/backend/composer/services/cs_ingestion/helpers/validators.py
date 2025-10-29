from typing import List, Dict, Any, Set, Type

from neurondm import orders

from composer.models import ConnectivityStatement, Sex, Specie, Region, AnatomicalEntityMeta, Layer
from composer.constants import INGESTION_ANOMALIES_LOG_PATH, INGESTION_INGESTED_LOG_PATH
from composer.services.cs_ingestion.helpers.common_helpers import ID, VALIDATION_ERRORS, ORIGINS, DESTINATIONS, VIAS, \
    SEX, SPECIES, FORWARD_CONNECTION
from composer.services.cs_ingestion.logging_service import LoggerService
from composer.services.cs_ingestion.models import ValidationErrors, LoggableAnomaly
from django.db.models import Model as DjangoModel

logger_service = LoggerService(
    ingestion_anomalies_log_path=INGESTION_ANOMALIES_LOG_PATH,
    ingested_log_path=INGESTION_INGESTED_LOG_PATH
)


def validate_statements(statements: List[Dict[str, Any]], update_anatomical_entities: bool) -> List[Dict[str, Any]]:
    db_reference_uris = set(ConnectivityStatement.objects.values_list('reference_uri', flat=True))
    input_statement_ids = {statement[ID] for statement in statements}
    statement_ids = input_statement_ids.union(db_reference_uris)

    for statement in statements:
        # Initialize validation_errors if not already present
        if VALIDATION_ERRORS not in statement:
            statement[VALIDATION_ERRORS] = ValidationErrors()

        # Validate entities, sex, and species, updating validation_errors accordingly
        annotate_invalid_entities(statement, update_anatomical_entities)
        annotate_invalid_sex(statement)
        annotate_invalid_species(statement)

        # Validate forward connection
        annotate_invalid_forward_connections(statement, statement_ids)

    return statements


def annotate_invalid_entities(statement: Dict, update_anatomical_entities: bool) -> bool:
    has_invalid_entities = False

    entities_to_check = list(statement[ORIGINS].anatomical_entities)
    entities_to_check.extend(entity for dest in statement[DESTINATIONS] for entity in dest.anatomical_entities)
    entities_to_check.extend(entity for via in statement[VIAS] for entity in via.anatomical_entities)

    for entity in entities_to_check:
        if isinstance(entity, orders.rl):
            region_found = found_entity(entity.region, Region if not update_anatomical_entities else None)
            layer_found = found_entity(entity.layer, Layer if not update_anatomical_entities else None)
            if not region_found:
                statement[VALIDATION_ERRORS].entities.add(entity.region)
                has_invalid_entities = True
            if not layer_found:
                statement[VALIDATION_ERRORS].entities.add(entity.layer)
                has_invalid_entities = True
        else:
            uri = str(entity)
            if not found_entity(uri):
                statement[VALIDATION_ERRORS].entities.add(uri)
                has_invalid_entities = True

    return has_invalid_entities


def annotate_invalid_sex(statement: Dict) -> bool:
    if statement[SEX]:
        if len(statement[SEX]) > 1:
            logger_service.add_anomaly(
                LoggableAnomaly(statement[ID], None, f'Multiple sexes found in statement.'))

            first_sex_uri = statement[SEX][0]
            if not Sex.objects.filter(ontology_uri=first_sex_uri).exists():
                statement[VALIDATION_ERRORS].sex.add(first_sex_uri)
            return True
    return False


def annotate_invalid_species(statement: Dict) -> bool:
    has_invalid_species = False
    for species_uri in statement[SPECIES]:
        if not Specie.objects.filter(ontology_uri=species_uri).exists():
            statement[VALIDATION_ERRORS].species.add(species_uri)
            has_invalid_species = True
    return has_invalid_species


def annotate_invalid_forward_connections(statement: Dict, statement_ids: Set[str]) -> bool:
    has_invalid_forward_connection = False
    for reference_uri in statement[FORWARD_CONNECTION]:
        if reference_uri not in statement_ids:
            statement[VALIDATION_ERRORS].forward_connection.add(reference_uri)
            has_invalid_forward_connection = True
    return has_invalid_forward_connection


def found_entity(uri: str, Model: Type[DjangoModel] = None) -> bool:
    if Model:
        return Model.objects.filter(ae_meta__ontology_uri=uri).exists()
    return AnatomicalEntityMeta.objects.filter(ontology_uri=uri).exists()
