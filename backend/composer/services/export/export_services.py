import typing
from django.contrib.auth.models import User
from django.db import transaction
from django.db.models import QuerySet

from composer.services.export.helpers.csv import create_csv
from composer.services.export.helpers.export_batch import (
    create_export_batch,
    do_transition_to_exported_and_get_available_export_batch,
)
from composer.models import (
    ExportBatch,
)


def export_connectivity_statements(
    qs: QuerySet, user: User, folder_path: typing.Optional[str]
) -> typing.Tuple[str, ExportBatch]:
    with transaction.atomic():
        # Ensure create_export_batch and do_transition_to_exported_and_get_available_export_batch are in one database transaction
        export_batch = create_export_batch(qs, user)
        export_batch = do_transition_to_exported_and_get_available_export_batch(
            export_batch, user
        )

    export_file = create_csv(export_batch, folder_path)
    return export_file, export_batch
