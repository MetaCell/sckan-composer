import json
from urllib.parse import urljoin
from django.conf import settings
from django.contrib.auth.models import User
from datetime import datetime
from version import VERSION

def get_volume_directory(current_app) -> str:
    return f"{current_app.harness.deployment.volume.name}:{settings.MEDIA_ROOT}"


def run_export_workflow(user: User, scheme: str = "https") -> None:
    from cloudharness.workflows import tasks, operations
    from cloudharness.applications import get_current_configuration
    from cloudharness.utils.config import CloudharnessConfig


    current_app = get_current_configuration()
    domain = CloudharnessConfig.get_domain()

    version_str = str(VERSION).replace(".", "-")
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    filename = f"export_v{version_str}_{timestamp}.csv"

    # Media-relative path
    filepath = f"{settings.MEDIA_ROOT}/exports/{filename}"
    media_path = f"{settings.MEDIA_URL}exports/{filename}"
    base_url = f"{scheme}://{domain}"
    file_url = urljoin(base_url, media_path)

    # Main export task
    export_task = tasks.CustomTask(
        name="export-task",
        image_name="composer",
        command=[
            "python",
            "manage.py",
            "export_csv",
            f"--user_id={user.id}",
            f"--filepath={filepath}",
        ],
    )

    # on-exit notify task
    on_exit_notify = {
        "image": "composer-notify",
        "queue": "default",  # not needed but required by cloudharness
        "payload": json.dumps(
            {
                "file_url": file_url,
                "email": user.email,
            }
        ),
        "command": ["python", "notify.py"],
    }

    op = operations.PipelineOperation(
        basename="export-op",
        tasks=[
            export_task,
        ],
        shared_directory=get_volume_directory(current_app),
        on_exit_notify=on_exit_notify,
    )

    op.execute()
