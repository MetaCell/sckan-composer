import time

from django.core.management.base import BaseCommand
from composer.services.cs_ingestion.cs_ingestion_services import ingest_statements


class Command(BaseCommand):
    help = "Ingests Statements from neurondm"

    def add_arguments(self, parser):
        parser.add_argument(
            '--update_upstream',
            action='store_true',
            help='Set this flag to update upstream statements.',
        )
        parser.add_argument(
            '--update_anatomical_entities',
            action='store_true',
            help='Set this flag to try move anatomical entities to specific layer, region.',
        )
        parser.add_argument(
            '--disable_overwrite',
            action='store_true',
            help='Set this flag to overwrite existing statements.',
        )

        parser.add_argument(
            '--full_imports',
            nargs='*',
            help='List of full imports to include in the ingestion.',
        )
        parser.add_argument(
            '--label_imports',
            nargs='*',
            help='List of label imports to include in the ingestion.',
        )

    def handle(self, *args, **options):
        update_upstream = options['update_upstream']
        update_anatomical_entities = options['update_anatomical_entities']
        disable_overwrite = options['disable_overwrite']
        full_imports = options['full_imports']
        label_imports = options['label_imports']

        start_time = time.time()

        ingest_statements(update_upstream, update_anatomical_entities, disable_overwrite, full_imports, label_imports)

        end_time = time.time()

        duration = end_time - start_time

        self.stdout.write(self.style.SUCCESS(f"Ingestion completed in {duration:.2f} seconds."))