import importlib
import time

from django.core.management.base import BaseCommand
from composer.services.cs_ingestion.neurondm_new_field_ingestion_service import ingest_neurondm_new_field_to_statements

class Command(BaseCommand):
    help = "Updates composer statements field with neurondm property"

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
        parser.add_argument(
            '--skip_validation',
            action='store_true',
            help='Skip model validation when updating the field.',
        )
        parser.add_argument('--transform_fn', type=str, help='A Python function to apply to the field. Example: "composer.services.cs_ingestion.helpers.getters.get_or_create_populationset".')


    def handle(self, *args, **options):
        full_imports = options.get('full_imports', [])
        label_imports = options.get('label_imports', [])
        cs_field = options['cs_field']
        neurondm_field = options['neurondm_field']
        skip_validation = options['skip_validation']
        transform_fn_path = options.get('transform_fn')

        # Dynamically import the function if provided
        transform_fn = None
        if transform_fn_path:
            try:
                module_name, function_name = transform_fn_path.rsplit(".", 1)
                module = importlib.import_module(module_name)
                transform_fn = getattr(module, function_name)
            except (ImportError, AttributeError) as e:
                self.stdout.write(self.style.ERROR(f"Error loading transform function '{transform_fn_path}': {e}"))
                return

        start_time = time.time()
        try:
            ingest_neurondm_new_field_to_statements(
                neurondm_field, cs_field, full_imports, label_imports, skip_validation, transform_fn
            )
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error during ingestion: {e}"))
            return

        end_time = time.time()
        duration = end_time - start_time

        self.stdout.write(self.style.SUCCESS(
            f"Ingestion for {cs_field} from Neurondm {neurondm_field} completed in {duration:.2f} seconds."
        ))
