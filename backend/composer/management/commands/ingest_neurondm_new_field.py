import time

from django.core.management.base import BaseCommand
from composer.services.cs_ingestion.neurondm_new_field_ingestion_service import ingest_neurondm_new_field_to_statements
from composer.enums import NeurondmIngestionMapping


class Command(BaseCommand):
    help = "Ingests Statement's fields from neurondm pyp package"

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
        parser.add_argument(
            '--cs_field',
            required=True,
            help='The field name in ConnectivityStatement to update.',
        )
        parser.add_argument(
            '--neurondm_field',
            required=True,
            help='The field name in Neurondm to ingest.',
        )

    def handle(self, *args, **options):
        full_imports = options['full_imports']
        label_imports = options['label_imports']
        cs_field = options['cs_field']
        neurondm_field = options['neurondm_field']

        start_time = time.time()
        try:
            ingest_neurondm_new_field_to_statements(
                neurondm_field, cs_field, full_imports, label_imports)
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error during ingestion: {e}"))
            return
        end_time = time.time()

        duration = end_time - start_time

        self.stdout.write(self.style.SUCCESS(
            f"Ingestion for {cs_field} from Neurondm {neurondm_field} completed in {duration:.2f} seconds."))
