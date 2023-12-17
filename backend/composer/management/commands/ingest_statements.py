from django.core.management.base import BaseCommand, CommandError
from composer.services.cs_ingestion.cs_ingestion_services import ingest_statements


class Command(BaseCommand):
    help = "Ingests Statements from neurondm pyp package"

    def handle(self, *args, **options):
        ingest_statements()
