from django.core.management.base import BaseCommand

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

    def handle(self, *args, **options):
        folder = options.get("folder", None)
        export_connectivity_statements(ConnectivityStatement.objects.to_be_exported(), folder)
