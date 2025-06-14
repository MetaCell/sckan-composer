import typing
from django.contrib.auth.models import User
from django.db import transaction
from django.db.models import QuerySet

from composer.services.export.helpers.csv import create_csv
from composer.services.export.helpers.export_batch import (
    create_export_batch,
    transition_statements_to_exported,
)
from composer.models import (
    ExportBatch,
)


def export_connectivity_statements(
    qs: QuerySet, user: User, output_path: typing.Optional[str]
) -> typing.Tuple[str, ExportBatch]:
    with transaction.atomic():
        export_batch = create_export_batch(user)
        export_batch = transition_statements_to_exported(export_batch, qs, user)

    export_file = create_csv(export_batch, output_path)
    return export_file, export_batch
