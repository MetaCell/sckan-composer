import json
import os
from django.conf import settings
from django.contrib.auth.models import User
from composer.constants import INGESTION_ANOMALIES_LOG_PATH, INGESTION_INGESTED_LOG_PATH
from composer.services.workflows.ingestion_utils import (
    get_ingestion_timestamp,
    get_ingestion_temp_file_paths,
)


def get_volume_directory(current_app) -> str:
    return f"{current_app.harness.deployment.volume.name}:{settings.MEDIA_ROOT}"


def run_ingestion_workflow(
    user: User,
    update_upstream: bool = False,
    update_anatomical_entities: bool = False,
    disable_overwrite: bool = False,
    full_imports: list = None,
    label_imports: list = None,
    population_file_path: str = None,
    timestamp: str = None,
) -> None:
    from cloudharness.workflows import tasks, operations
    from cloudharness.applications import (
        get_current_configuration,
        ApplicationConfiguration,
    )

    current_app = get_current_configuration()

    # Get sender email from configuration
    app_conf: ApplicationConfiguration = get_current_configuration()
    from_email = app_conf["notifications"]["email"]["from_email"]

    # Create unique filenames for intermediate data
    if timestamp is None:
        timestamp = get_ingestion_timestamp()
    
    temp_paths = get_ingestion_temp_file_paths(timestamp)
    composer_data_file = temp_paths['composer_data']
    intermediate_file = temp_paths['intermediate']
    anomalies_log_file = temp_paths['anomalies_log']

    # Ensure the directory exists
    os.makedirs(os.path.dirname(intermediate_file), exist_ok=True)

    # Step 0: Get composer data (custom relationships and alert URIs) from database
    step0_command = [
        "python",
        "manage.py",
        "get_composer_data",
        f"--output_filepath={composer_data_file}",
    ]

    get_composer_data_task = tasks.CustomTask(
        name="get-composer-data-task",
        image_name="composer",
        command=step0_command,
    )

    # Build command for step 1: process_neurondm
    step1_command = [
        "python",
        "process_neurondm_standalone.py",
        f"--input_filepath={composer_data_file}",
        f"--output_filepath={intermediate_file}",
        f"--anomalies_csv_output={INGESTION_ANOMALIES_LOG_PATH}",
        f"--ingested_csv_output={INGESTION_INGESTED_LOG_PATH}",
    ]
    
    if full_imports:
        step1_command.append("--full_imports")
        step1_command.extend(full_imports)
    
    if label_imports:
        step1_command.append("--label_imports")
        step1_command.extend(label_imports)
    
    if population_file_path:
        step1_command.append(f"--population_file={population_file_path}")

    # Step 1: Process neurondm (uses composer-neurondm image with neurondm packages)
    process_task = tasks.CustomTask(
        name="process-neurondm-task",
        image_name="composer-neurondm",
        command=step1_command,
    )

    # Build command for step 2: ingest_to_database
    step2_command = [
        "python",
        "manage.py",
        "ingest_to_database",
        f"--input_filepath={intermediate_file}",
        f"--anomalies_csv_input={INGESTION_ANOMALIES_LOG_PATH}",
    ]
    
    if update_upstream:
        step2_command.append("--update_upstream")
    
    if update_anatomical_entities:
        step2_command.append("--update_anatomical_entities")
    
    if disable_overwrite:
        step2_command.append("--disable_overwrite")
    
    # Add force_state_transition if population filtering is enabled
    # This allows state transitions when ingesting pre-filtered populations
    if population_file_path is not None:
        step2_command.append("--force_state_transition")

    # Step 2: Ingest to database (uses composer image with Django)
    ingest_task = tasks.CustomTask(
        name="ingest-to-database-task",
        image_name="composer",
        command=step2_command,
    )

    # on-exit notify task
    on_exit_notify = {
        "image": "composer-notify",
        "queue": "default",  # not needed but required by cloudharness
        "payload": json.dumps(
            {
                "type": "ingestion",
                "email": user.email,
            }
        ),
        "command": ["python", "notify.py"],
        "sender_email": from_email,
    }

    # Create pipeline operation with all three tasks
    op = operations.PipelineOperation(
        basename="ingestion-op",
        tasks=[
            get_composer_data_task,  # Step 0: Get composer data from database
            process_task,             # Step 1: Process neurondm
            ingest_task,             # Step 2: Ingest to database
        ],
        shared_directory=get_volume_directory(current_app),
        on_exit_notify=on_exit_notify,
    )

    op.execute()
