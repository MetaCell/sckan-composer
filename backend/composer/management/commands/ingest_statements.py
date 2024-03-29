import time

from django.core.management.base import BaseCommand, CommandError
from composer.services.cs_ingestion.cs_ingestion_services import ingest_statements


class Command(BaseCommand):
    help = "Ingests Statements from neurondm pyp package"

    def add_arguments(self, parser):
        parser.add_argument(
            '--update_upstream',
            action='store_true',
            help='Set this flag to update upstream statements.',
        )

    def handle(self, *args, **options):
        update_upstream = options['update_upstream']

        start_time = time.time()

        ingest_statements(update_upstream)

        end_time = time.time()

        duration = end_time - start_time

        self.stdout.write(self.style.SUCCESS(f"Ingestion completed in {duration:.2f} seconds."))