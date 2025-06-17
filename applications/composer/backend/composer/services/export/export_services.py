import typing
from django.contrib.auth.models import User
from django.db import transaction
from django.db.models import QuerySet

from composer.enums import CSState
from composer.services.export.helpers.csv import create_csv
from composer.services.export.helpers.export_batch import (
    create_export_batch,
    transition_statements_to_exported,
)
from composer.models import (
    ConnectivityStatement,
    ExportBatch,
)


def export_connectivity_statements(
    qs: QuerySet, user: User, output_path: typing.Optional[str]
) -> typing.Tuple[str, ExportBatch]:
    with transaction.atomic():
        export_batch = create_export_batch(user)
        export_batch = transition_statements_to_exported(export_batch, qs, user)
        all_statement_ids = ConnectivityStatement.all_objects.exclude(state=CSState.DEPRECATED).values_list('pk', flat=True)
        export_batch.connectivity_statements.set(all_statement_ids)

    export_file = create_csv(export_batch, output_path)
    return export_file, export_batch
