from django.core.management.base import BaseCommand
from django.contrib.auth.models import User

from composer.enums import CSState
from composer.models import ConnectivityStatement
from composer.services.export_services import (
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

    def handle(self, *args, **options):
        folder: str = options.get("folder", None)
        state = options.get("state", CSState.NPO_APPROVED)
        username = options.get("username", None)
        user = User.objects.get(username=username)
        qs = ConnectivityStatement.objects.filter(state=state)
        export_connectivity_statements(qs=qs, user=user, folder_path=folder)
