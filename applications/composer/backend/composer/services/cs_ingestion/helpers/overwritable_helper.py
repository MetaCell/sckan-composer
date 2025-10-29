from typing import List, Any, Dict, Set, Optional

from composer.enums import CSState, SentenceState
from composer.models import Sentence, ConnectivityStatement
from composer.constants import INGESTION_ANOMALIES_LOG_PATH, INGESTION_INGESTED_LOG_PATH
from composer.services.cs_ingestion.helpers.common_helpers import ID
from composer.services.cs_ingestion.logging_service import STATEMENT_INCORRECT_STATE, SENTENCE_INCORRECT_STATE, \
    LoggerService
from composer.services.cs_ingestion.models import LoggableAnomaly

logger_service = LoggerService(
    ingestion_anomalies_log_path=INGESTION_ANOMALIES_LOG_PATH,
    ingested_log_path=INGESTION_INGESTED_LOG_PATH
)



def filter_statements_by_population_uris(statements_list, population_uris):
    """
    Filter statements to only include those with URIs in the population_uris set.
    
    Args:
        statements_list: List of statements from neurondm
        population_uris: Set of URIs to filter by. If None, no filtering is applied.
                        If empty set, all statements are filtered out.
    
    Returns:
        Filtered list of statements
    """
    if population_uris is None:
        # No population file was provided, return all statements
        return statements_list
    
    # Population file was provided (even if empty), filter statements
    return [
        statement for statement in statements_list
        if statement[ID] in population_uris
    ]


def get_overwritable_and_new_statements(statements_list: List[Dict[str, Any]], disable_overwrite: bool=False, force_overwrite: bool=False) -> List[Dict[str, Any]]:
    
    overwritable_and_new_statements = [
        statement for statement in statements_list
        if is_new_or_overwritable_statement(statement, disable_overwrite, force_overwrite)
    ]
    return overwritable_and_new_statements


def is_new_or_overwritable_sentence(statement: Dict, disable_overwrite: bool) -> bool:
    """
    If disable_overwrite is True, then the sentence is considered invalid for overwriting - if it already exists in the database.
    """
    try:
        sentence = Sentence.objects.get(doi__iexact=statement[ID])
        if disable_overwrite:
            return False
    except Sentence.DoesNotExist:
        return True
    return can_sentence_be_overwritten(sentence, statement)


def is_new_or_overwritable_statement(statement: Dict, disable_overwrite: bool, force_overwrite: bool=False) -> bool:
    """
    If disable_overwrite is True, then the statement is considered invalid for overwriting - if it already exists in the database.
    However, if force_overwrite is True, statements should be updatable regardless of their status (unless disable_overwrite is True).
    
    Args:
        statement: The statement dictionary
        disable_overwrite: If True, prevents all overwrites
        force_overwrite: If True, allows overwriting statements in any state (e.g., when ingesting pre-filtered populations)
    """
    
    statement_uri = statement[ID]
    
    try:
        connectivity_statement = ConnectivityStatement.objects.get(reference_uri=statement_uri)
        
        # If disable_overwrite is True, then no overwrites should happen
        if disable_overwrite:
            return False
            
        # If force_overwrite is True, allow overwriting regardless of state
        if force_overwrite:
            return True
            
    except ConnectivityStatement.DoesNotExist:
        return True
    
    return can_statement_be_overwritten(connectivity_statement, statement)


def can_statement_be_overwritten(connectivity_statement: ConnectivityStatement, statement) -> bool:
    if connectivity_statement.state != CSState.EXPORTED and connectivity_statement.state != CSState.INVALID:
        logger_service.add_anomaly(LoggableAnomaly(statement[ID], None, STATEMENT_INCORRECT_STATE))
        return False

    return True


def can_sentence_be_overwritten(sentence: Sentence, statement: Dict) -> bool:
    if sentence.state != SentenceState.COMPOSE_NOW:
        logger_service.add_anomaly(LoggableAnomaly(statement[ID], None, SENTENCE_INCORRECT_STATE))
        return False
    return True
