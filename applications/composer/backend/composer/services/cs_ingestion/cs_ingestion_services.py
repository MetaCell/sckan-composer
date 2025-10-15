import logging

from django.db import transaction

from composer.models import AlertType, Relationship
from composer.services.cs_ingestion.helpers.overwritable_helper import (
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


def get_composer_data():
    """
    Get all composer data from the database (custom relationships and alert URIs).
    This step MUST run in the Django environment.
    
    Returns: Dict with 'custom_relationships' and 'statement_alert_uris'
    """
    custom_relationships = list(
        Relationship.objects.filter(
            custom_ingestion_code__isnull=False
        ).exclude(
            custom_ingestion_code=''
        ).values('id', 'title', 'type', 'custom_ingestion_code')
    )
    
    statement_alert_uris = list(AlertType.objects.values_list("uri", flat=True))
    
    return {
        'custom_relationships': custom_relationships,
        'statement_alert_uris': statement_alert_uris,
    }


def process_neurondm(
    full_imports=[],
    label_imports=[],
    population_uris=None,
    composer_data=None,
    logger_service_param=None,
):
    """
    Process NeuroDM neurons, execute custom code, filter by population.
    This is a thin wrapper around get_statements_from_neurondm.
    
    Args:
        full_imports: List of full imports
        label_imports: List of label imports
        population_uris: Set of population URIs to filter (None means all)
        composer_data: Dict with 'custom_relationships' and 'statement_alert_uris' (will query from DB if None)
        logger_service_param: Logger service instance (optional)
        
    Returns: List of composer statement dictionaries
    """
    if logger_service_param is None:
        logger_service_param = LoggerService()
    
    # If composer_data not provided, get it from database
    if composer_data is None:
        composer_data = get_composer_data()
    
    custom_relationships = composer_data.get('custom_relationships', [])
    statement_alert_uris = set(composer_data.get('statement_alert_uris', []))

    statements_list = get_statements_from_neurondm(
        full_imports=full_imports,
        label_imports=label_imports,
        logger_service_param=logger_service_param,
        statement_alert_uris=statement_alert_uris,
        population_uris=population_uris,
        custom_relationships=custom_relationships,
    )
    
    return statements_list


def ingest_to_database(
    statements_list,
    update_upstream=False,
    update_anatomical_entities=False,
    disable_overwrite=False,
    force_state_transition=False,
    logger_service_param=None,
):
    """
    Validate and ingest statements into the database.
    
    Args:
        statements_list: List of composer statement dictionaries from process_neurondm
        update_upstream: Whether to update upstream statements after ingestion
        update_anatomical_entities: Whether to update anatomical entities
        disable_overwrite: Whether to disable overwriting existing statements
        force_state_transition: If True, allows state transitions from any state (e.g., TO_BE_REVIEWED -> EXPORTED).
                               Use when ingesting pre-filtered populations.
        logger_service_param: Logger service instance (optional)
    
    Returns: Boolean indicating successful transaction
    """
    if logger_service_param is None:
        logger_service_param = LoggerService()
    
    overridable_and_new_statements = get_overwritable_and_new_statements(
        statements_list, disable_overwrite, force_overwrite=force_state_transition
    )
    statements = validate_statements(
        overridable_and_new_statements, update_anatomical_entities
    )

    successful_transaction = True
    try:
        with transaction.atomic():
            for statement in statements:
                sentence, _ = get_or_create_sentence(statement)
                create_or_update_connectivity_statement(
                    statement, sentence, update_anatomical_entities, logger_service_param, force_state_transition
                )

            update_forward_connections(statements)

    except Exception as e:
        logger_service_param.add_anomaly(
            LoggableAnomaly(
                statement_id=None,
                entity_id=None,
                message=str(e),
                severity=Severity.ERROR,
            )
        )
        successful_transaction = False
        logging.error(f"Ingestion aborted due to {e}")

    logger_service_param.write_anomalies_to_file()

    if successful_transaction:
        if update_upstream:
            update_upstream_statements()
        logger_service_param.write_ingested_statements_to_file(statements)
    
    return successful_transaction


def ingest_statements(
    update_upstream=False,
    update_anatomical_entities=False,
    disable_overwrite=False,
    full_imports=[],
    label_imports=[],
    population_uris=None,
):
    """
    Complete ingestion process: runs all 3 steps.
    This is a convenience wrapper that maintains backward compatibility.
    """
    # Get composer data (custom relationships and alert URIs)
    composer_data = get_composer_data()
    
    # Process NeuroDM neurons
    statements_list = process_neurondm(
        full_imports=full_imports,
        label_imports=label_imports,
        population_uris=population_uris,
        composer_data=composer_data,
        logger_service_param=logger_service,
    )
    
    # Database ingestion
    # When population_uris is provided, use force_state_transition to allow state changes from any state
    successful_transaction = ingest_to_database(
        statements_list=statements_list,
        update_upstream=update_upstream,
        update_anatomical_entities=update_anatomical_entities,
        disable_overwrite=disable_overwrite,
        force_state_transition=(population_uris is not None),
        logger_service_param=logger_service,
    )
    
    return successful_transaction
