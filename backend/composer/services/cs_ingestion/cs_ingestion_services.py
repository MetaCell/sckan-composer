import logging
from datetime import datetime

from django.db import transaction

from composer.services.cs_ingestion.helpers.overwritable_helper import get_overwritable_statements
from composer.services.cs_ingestion.helpers.sentence_helper import get_or_create_sentence
from composer.services.cs_ingestion.helpers.validators import validate_statements
from .helpers.statement_helper import create_or_update_connectivity_statement, update_forward_connections
from .helpers.upstream_changes_helper import update_upstream_statements
from .logging_service import LoggerService
from .models import LoggableAnomaly, Severity
from .neurondm_script import main as get_statements_from_neurondm


logger_service = LoggerService()


def ingest_statements(update_upstream=False, update_anatomical_entities=False):
    statements_list = get_statements_from_neurondm(logger_service_param=logger_service)
    overridable_statements = get_overwritable_statements(statements_list)
    statements = validate_statements(overridable_statements)

    successful_transaction = True
    try:
        with transaction.atomic():
            for statement in statements:
                sentence, _ = get_or_create_sentence(statement)
                create_or_update_connectivity_statement(statement, sentence, update_anatomical_entities)
            update_forward_connections(statements)

    except Exception as e:
        logger_service.add_anomaly(
            LoggableAnomaly(statement_id=None, entity_id=None, message=str(e), severity=Severity.ERROR))
        successful_transaction = False
        logging.error(f"Ingestion aborted due to {e}")

    logger_service.write_anomalies_to_file()

    if successful_transaction:
        if update_upstream:
            update_upstream_statements()
        logger_service.write_ingested_statements_to_file(statements)



