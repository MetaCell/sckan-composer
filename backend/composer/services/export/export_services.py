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

from silk.profiling.profiler import silk_profile

@silk_profile(name="Export Connectivity Statements")
def export_connectivity_statements(
    qs: QuerySet, user: User, folder_path: typing.Optional[str]
) -> typing.Tuple[str, ExportBatch]:
    with silk_profile(name="Transaction: Export Connectivity Statements"):
        with transaction.atomic():
            export_batch = create_export_batch(user)
            export_batch = transition_statements_to_exported(export_batch, qs)

    export_file = create_csv(export_batch, folder_path)
    return export_file, export_batch
