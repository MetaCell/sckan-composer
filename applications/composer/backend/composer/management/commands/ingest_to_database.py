import json
import time

from django.core.management.base import BaseCommand
from composer.services.cs_ingestion.cs_ingestion_services import ingest_to_database
from composer.services.cs_ingestion.logging_service import LoggerService
from composer.services.cs_ingestion.models import convert_statement_from_json
from composer.constants import INGESTION_ANOMALIES_LOG_PATH, INGESTION_INGESTED_LOG_PATH


class Command(BaseCommand):
    help = "Step 2: Ingest pre-processed statements into the database"

    def add_arguments(self, parser):
        parser.add_argument(
            '--input_filepath',
            type=str,
            required=True,
            help='Path to input JSON file containing processed statements from Step 1.',
        )
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
            help='Set this flag to disable overwriting existing statements.',
        )
        parser.add_argument(
            '--force_state_transition',
            action='store_true',
            help='Set this flag to allow state transitions from any state (e.g., TO_BE_REVIEWED -> EXPORTED). Use when ingesting a pre-filtered population.',
        )
        parser.add_argument(
            '--anomalies_csv_input',
            type=str,
            help='Path to input anomalies CSV file from Step 1 (will be merged with new anomalies)',
        )

    def handle(self, *args, **options):
        input_filepath = options['input_filepath']
        update_upstream = options['update_upstream']
        update_anatomical_entities = options['update_anatomical_entities']
        disable_overwrite = options['disable_overwrite']
        force_state_transition = options['force_state_transition']
        anomalies_csv_input = options.get('anomalies_csv_input')

        # Load statements from JSON file
        try:
            if not input_filepath.endswith('.json'):
                self.stderr.write(self.style.ERROR(
                    "Input file must have .json extension"
                ))
                return
            
            with open(input_filepath, 'r', encoding='utf-8') as f:
                statements_list = json.load(f)
            
            # Convert JSON-serialized statements back to object format
            self.stdout.write("Converting JSON statements to object format...")
            statements_list = [convert_statement_from_json(stmt) for stmt in statements_list]
            
            self.stdout.write(f"Loaded {len(statements_list)} statements from {input_filepath}")
        except FileNotFoundError:
            self.stderr.write(self.style.ERROR(f"Input file not found: {input_filepath}"))
            return
        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Error loading statements: {e}"))
            return

        start_time = time.time()

        # Create logger service with explicit paths from constants
        logger_service = LoggerService(
            ingestion_anomalies_log_path=INGESTION_ANOMALIES_LOG_PATH,
            ingested_log_path=INGESTION_INGESTED_LOG_PATH
        )
        
        # Load any previous anomalies from the CSV file (e.g., from process_neurondm step)
        if anomalies_csv_input:
            logger_service.load_anomalies_from_json(anomalies_csv_input)

        try:
            # Step 2: Ingest to database
            self.stdout.write("Ingesting statements to database...")
            success = ingest_to_database(
                statements_list=statements_list,
                update_upstream=update_upstream,
                update_anatomical_entities=update_anatomical_entities,
                disable_overwrite=disable_overwrite,
                force_state_transition=force_state_transition,
                logger_service_param=logger_service,
            )

            end_time = time.time()
            duration = end_time - start_time


            # First convert JSON anomalies to CSV format
            logger_service.write_anomalies_to_file()
            self.stdout.write(f"Saved {len(logger_service.anomalies)} total anomalies to {logger_service.anomalies_log_path}")
            logger_service.write_ingested_statements_to_file(statements_list)
            self.stdout.write(f"Saved ingested statements log to {logger_service.ingested_log_path}")

            if success:
                self.stdout.write(self.style.SUCCESS(
                    f"Ingestion completed successfully in {duration:.2f} seconds."
                ))
            else:
                self.stderr.write(self.style.ERROR(
                    f"Ingestion failed after {duration:.2f} seconds. Check logs for details."
                ))

        except Exception as e:
            end_time = time.time()
            duration = end_time - start_time
            self.stderr.write(self.style.ERROR(
                f"Ingestion failed after {duration:.2f} seconds: {e}"
            ))
