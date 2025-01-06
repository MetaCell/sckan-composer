import time

from django.core.management.base import BaseCommand
from composer.services.cs_ingestion.curie_id_ingestion_service import ingest_curie_id_to_statements


class Command(BaseCommand):
    help = "Ingests Statement's Curie ID - from neurondm pyp package"

    def add_arguments(self, parser):
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
        full_imports = options['full_imports']
        label_imports = options['label_imports']

        start_time = time.time()
        ingest_curie_id_to_statements(full_imports, label_imports)
        end_time = time.time()

        duration = end_time - start_time

        self.stdout.write(self.style.SUCCESS(
            f"Ingestion for curie ID - completed in {duration:.2f} seconds."))
