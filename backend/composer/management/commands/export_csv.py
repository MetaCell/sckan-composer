from django.core.management.base import BaseCommand

from backend.settings import EXPORT_FOLDER
from composer.services.export_services import (
    export_connectivity_statements,
)


class Command(BaseCommand):
    help = "Export queryset to CSV file"

    def add_arguments(self, parser):
        parser.add_argument(
            "--folder", type=str, help="Folder to store CSV file", default=EXPORT_FOLDER
        )

    def handle(self, *args, **options):
        folder = options.get("folder")
        export_connectivity_statements(folder)
