from typing import List, Any, Dict

from composer.enums import CSState, SentenceState
from composer.models import Sentence, ConnectivityStatement
from composer.services.cs_ingestion.helpers.common_helpers import ID
from composer.services.cs_ingestion.logging_service import STATEMENT_INCORRECT_STATE, SENTENCE_INCORRECT_STATE, \
    LoggerService
from composer.services.cs_ingestion.models import LoggableAnomaly

logger_service = LoggerService()


def get_overwritable_statements(statements_list: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    overwritable_statements = [
        statement for statement in statements_list
        if not has_invalid_sentence(statement) and not has_invalid_statement(statement)
    ]
    return overwritable_statements


def has_invalid_sentence(statement: Dict) -> bool:
    try:
        sentence = Sentence.objects.get(doi__iexact=statement[ID])
    except Sentence.DoesNotExist:
        return False
    return not can_sentence_be_overwritten(sentence, statement)


def has_invalid_statement(statement: Dict) -> bool:
    try:
        connectivity_statement = ConnectivityStatement.objects.get(reference_uri=statement[ID])
    except ConnectivityStatement.DoesNotExist:
        return False
    return not can_statement_be_overwritten(connectivity_statement, statement)


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
