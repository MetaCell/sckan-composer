import json
import os
from django.conf import settings
from django.contrib.auth.models import User
from datetime import datetime
from composer.constants import INGESTION_TEMP_DIR


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
) -> None:
    from cloudharness.workflows import tasks, operations
    from cloudharness.applications import get_current_configuration

    current_app = get_current_configuration()

    # Create unique filenames for intermediate data
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    composer_data_file = f"{settings.MEDIA_ROOT}/{INGESTION_TEMP_DIR}/composer_data_{timestamp}.json"
    intermediate_file = f"{settings.MEDIA_ROOT}/{INGESTION_TEMP_DIR}/statements_{timestamp}.json"
    anomalies_log_file = f"{settings.MEDIA_ROOT}/{INGESTION_TEMP_DIR}/anomalies_{timestamp}.json"

    # Ensure the directory exists
    os.makedirs(os.path.dirname(intermediate_file), exist_ok=True)

    # Step 0: Get composer data (custom relationships and alert URIs) from database
    step0_command = [
        "python",
        "manage.py",
        "get_composer_data",
        f"--output_file={composer_data_file}",
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
        f"--output_file={intermediate_file}",
        f"--composer_data={composer_data_file}",
        f"--anomalies_log={anomalies_log_file}",
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
        f"--input_file={intermediate_file}",
        f"--anomalies_log={anomalies_log_file}",
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
