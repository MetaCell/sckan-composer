from django.conf import settings


def get_volume_directory(current_app) -> str:
    return f"{current_app.harness.deployment.volume.name}:{settings.MEDIA_ROOT}"


def run_export_workflow(username):
    from cloudharness.workflows import tasks, operations
    from cloudharness.applications import get_current_configuration

    current_app = get_current_configuration()

    # Main export task
    export_task = tasks.CustomTask(
        name="export-task",
        image_name="composer",
        command=[
            "python", "manage.py", "test_workflows",
            f"--username={username}",
            f"--folder={settings.MEDIA_ROOT}"
        ]
    )

    # on-exit notify task
    on_exit_notify = {
        "image": "composer-notify",
        'queue': "default", # not needed but required by cloudharness
        'payload': f'{username}', # not needed but required by cloudharness
        'command': ['python', 'notify.py', username]
    }

    ttl_strategy={
    'secondsAfterCompletion': 3600,        # keep for 1 hour
    'secondsAfterSuccess': 600,            # 10 mins
    'secondsAfterFailure': 3600
}

    op = operations.PipelineOperation(
        basename="export-op",
        tasks=[export_task,],
        shared_directory=get_volume_directory(current_app),
        on_exit_notify=on_exit_notify,
        ttl_strategy=ttl_strategy,
    )

    op.execute()
