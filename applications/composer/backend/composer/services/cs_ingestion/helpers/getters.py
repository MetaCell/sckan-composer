from typing import Dict, Optional

from composer.models import (
    Sex,
    FunctionalCircuitRole,
    Phenotype,
    ProjectionPhenotype,
    PopulationSet,
)
from composer.services.cs_ingestion.helpers.common_helpers import get_value_or_none, SEX, FUNCTIONAL_CIRCUIT_ROLE, ID, \
    CIRCUIT_TYPE, CIRCUIT_TYPE_MAPPING, PHENOTYPE, OTHER_PHENOTYPE
from composer.services.cs_ingestion.logging_service import LoggerService
from composer.services.cs_ingestion.models import LoggableAnomaly

logger_service = LoggerService()


def get_sex(statement: Dict) -> Sex:
    return get_value_or_none(Sex, statement[SEX][0] if statement[SEX] else None)


def get_functional_circuit_role(statement: Dict) -> Optional[FunctionalCircuitRole]:
    if len(statement[FUNCTIONAL_CIRCUIT_ROLE]) > 1:
        logger_service.add_anomaly(
            LoggableAnomaly(statement[ID], None, f'Multiple functional circuit roles found.'))

    return get_value_or_none(
        FunctionalCircuitRole, statement[FUNCTIONAL_CIRCUIT_ROLE][0]) if statement[FUNCTIONAL_CIRCUIT_ROLE] else None


def get_circuit_type(statement: Dict):
    if statement[CIRCUIT_TYPE]:
        if len(statement[CIRCUIT_TYPE]) > 1:
            logger_service.add_anomaly(LoggableAnomaly(statement[ID], None, f'Multiple circuit types found'))
        return CIRCUIT_TYPE_MAPPING.get(statement[CIRCUIT_TYPE][0], None)
    else:
        logger_service.add_anomaly(LoggableAnomaly(statement[ID], None, f'No circuit type found.'))
        return None


def get_phenotype(statement: Dict) -> Optional[Phenotype]:
    if statement[PHENOTYPE]:
        if len(statement[PHENOTYPE]) > 1:
            logger_service.add_anomaly(LoggableAnomaly(statement[ID], None, f'Multiple phenotypes found.'))

        for p in statement[PHENOTYPE]:
            try:
                phenotype = Phenotype.objects.get(ontology_uri=p)
                return phenotype
            except Phenotype.DoesNotExist:
                pass

        logger_service.add_anomaly(LoggableAnomaly(statement[ID], None, f'No valid phenotype found.'))

    return None



def get_or_create_populationset(populationset_name: str) -> PopulationSet:
    populationset, _ = PopulationSet.objects.get_or_create(
        name=populationset_name
    )
    return populationset


def get_projection_phenotype(statement: Dict) -> Optional[ProjectionPhenotype]:
    if statement[OTHER_PHENOTYPE]:
        last_phenotype_uri = statement[OTHER_PHENOTYPE][-1]
        try:
            projection_phenotype = ProjectionPhenotype.objects.get(ontology_uri=last_phenotype_uri)
            return projection_phenotype
        except ProjectionPhenotype.DoesNotExist:
            pass
    else:
        logger_service.add_anomaly(LoggableAnomaly(statement[ID], None, f'No projection phenotypes found.'))
    return None
