from typing import List, Any, Dict

from composer.enums import CSState, SentenceState
from composer.models import Sentence, ConnectivityStatement
from composer.services.cs_ingestion.helpers.common_helpers import ID
from composer.services.cs_ingestion.logging_service import STATEMENT_INCORRECT_STATE, SENTENCE_INCORRECT_STATE, \
    LoggerService
from composer.services.cs_ingestion.models import LoggableAnomaly

logger_service = LoggerService()


def get_overwritable_and_new_statements(statements_list: List[Dict[str, Any]], disable_overwrite: bool=False, population_uris: List[str]=None) -> List[Dict[str, Any]]:
    if population_uris is None:
        population_uris = []
    
    overwritable_and_new_statements = [
        statement for statement in statements_list
        if is_new_or_overwritable_statement(statement, disable_overwrite, population_uris)
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


def is_new_or_overwritable_statement(statement: Dict, disable_overwrite: bool, population_uris: List[str]=None) -> bool:
    """
    If disable_overwrite is True, then the statement is considered invalid for overwriting - if it already exists in the database.
    However, statements with URIs in population_uris should be updatable regardless of their status (unless disable_overwrite is True).
    """
    if population_uris is None:
        population_uris = []
    
    statement_uri = statement[ID]
    
    try:
        connectivity_statement = ConnectivityStatement.objects.get(reference_uri=statement_uri)
        
        # If disable_overwrite is True, then no overwrites should happen, not even the ones from the population file
        if disable_overwrite:
            return False
            
        # If the statement URI is in the population_uris list, it should be updatable regardless of status
        if statement_uri in population_uris:
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
