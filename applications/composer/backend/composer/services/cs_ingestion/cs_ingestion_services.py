import logging

from django.db import transaction

from composer.models import AlertType
from composer.services.cs_ingestion.helpers.overwritable_helper import (
    filter_statements_by_population_uris,
    get_overwritable_and_new_statements,
)
from composer.services.cs_ingestion.helpers.sentence_helper import (
    get_or_create_sentence,
)
from composer.services.cs_ingestion.helpers.validators import validate_statements
from .helpers.statement_helper import (
    create_or_update_connectivity_statement,
    update_forward_connections,
)
from .helpers.upstream_changes_helper import update_upstream_statements
from .logging_service import LoggerService
from .models import LoggableAnomaly, Severity
from .neurondm_script import main as get_statements_from_neurondm

logger_service = LoggerService()

def ingest_statements(
    update_upstream=False,
    update_anatomical_entities=False,
    disable_overwrite=False,
    full_imports=[],
    label_imports=[],
    population_uris=None,
):

    statements_list = get_statements_from_neurondm(
        full_imports=full_imports,
        label_imports=label_imports,
        logger_service_param=logger_service,
        statement_alert_uris=set(AlertType.objects.values_list("uri", flat=True)),
    )
    
    # Filter statements by population URIs if a population file was provided
    statements_list = filter_statements_by_population_uris(statements_list, population_uris)
    
    overridable_and_new_statements = get_overwritable_and_new_statements(
        statements_list, disable_overwrite, population_uris
    )
    statements = validate_statements(
        overridable_and_new_statements, update_anatomical_entities
    )

    successful_statements = []
    failed_statements = []
    
    try:
        with transaction.atomic():
            for statement in statements:
                try:
                    sentence, _ = get_or_create_sentence(statement)
                    create_or_update_connectivity_statement(
                        statement, sentence, update_anatomical_entities, logger_service, population_uris
                    )
                    successful_statements.append(statement)
                except Exception as e:
                    # Log the error and continue with next statement
                    statement_id = statement.get('id', statement.get('reference_uri', 'Unknown'))
                    error_message = f"Failed to ingest statement {statement_id}: {str(e)}"
                    logger_service.add_anomaly(
                        LoggableAnomaly(
                            statement_id=statement_id,
                            entity_id=None,
                            message=error_message,
                            severity=Severity.ERROR,
                        )
                    )
                    failed_statements.append(statement)
                    logging.error(error_message)

            # Only update forward connections for successfully processed statements
            if successful_statements:
                update_forward_connections(successful_statements)

    except Exception as e:
        # This catches any unexpected errors outside individual statement processing
        logger_service.add_anomaly(
            LoggableAnomaly(
                statement_id=None,
                entity_id=None,
                message=f"Critical error during ingestion: {str(e)}",
                severity=Severity.ERROR,
            )
        )
        logging.error(f"Critical error during ingestion: {e}")
        # Even if there's a critical error, we've already processed what we could
        successful_transaction = len(successful_statements) > 0
    else:
        successful_transaction = True

    logger_service.write_anomalies_to_file()

    if successful_transaction:
        if update_upstream:
            update_upstream_statements()
        logger_service.write_ingested_statements_to_file(successful_statements)
    
    # Return success status and statistics
    return {
        'success': successful_transaction,
        'total_statements': len(statements),
        'successful_statements': len(successful_statements),
        'failed_statements': len(failed_statements)
    }
