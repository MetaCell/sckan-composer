from django.core.management.base import BaseCommand
from django.contrib.auth.models import User

from composer.services.export.helpers.csv import create_csv
from composer.enums import CSState
from composer.models import ConnectivityStatement, ExportBatch
from composer.services.export.export_services import (
    export_connectivity_statements,
)


class Command(BaseCommand):
    help = "Export queryset to CSV file"

    def add_arguments(self, parser):
        parser.add_argument(
            "--folder", type=str, help="Folder to store CSV file",
        )
        parser.add_argument(
            "--state", type=str, default=CSState.NPO_APPROVED, help=f"Export only statements with this state, default={CSState.NPO_APPROVED}",
        )
        parser.add_argument(
            "--username", type=str, help="The user to register this export batch to",
        )
        parser.add_argument(
            "--batch_id", type=str, help="AN existing export batch id, used for dumping an existing batch into a csv file",
        )

    def handle(self, *args, **options):
        folder: str = options.get("folder", None)
        batch_id = options.get("batch_id", None)
        export_filename = ""
        if batch_id:
            export_batch = ExportBatch.objects.get(id=batch_id)
            export_filename = create_csv(export_batch, folder_path=folder)
        else:
            state = options.get("state", CSState.NPO_APPROVED)
            username = options.get("username", None)
            user = User.objects.get(username=username)
            qs = ConnectivityStatement.objects.filter(state=state)
            export_filename, _ = export_connectivity_statements(qs=qs, user=user, folder_path=folder)
        self.stdout.write(self.style.SUCCESS(f"Saved export batch to: {export_filename}"))
