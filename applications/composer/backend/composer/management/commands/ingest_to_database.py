import json
import pickle
import time

from django.core.management.base import BaseCommand
from composer.services.cs_ingestion.cs_ingestion_services import ingest_to_database
from composer.services.cs_ingestion.logging_service import LoggerService


class Command(BaseCommand):
    help = "Step 2: Ingest pre-processed statements into the database"

    def add_arguments(self, parser):
        parser.add_argument(
            '--input_file',
            type=str,
            required=True,
            help='Path to input file containing processed statements from Step 1. Use .json or .pkl format.',
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
            '--anomalies_log',
            type=str,
            help='Path to anomalies log JSON file (will be appended to if exists)',
        )

    def handle(self, *args, **options):
        input_file = options['input_file']
        update_upstream = options['update_upstream']
        update_anatomical_entities = options['update_anatomical_entities']
        disable_overwrite = options['disable_overwrite']
        force_state_transition = options['force_state_transition']
        anomalies_log = options.get('anomalies_log')

        # Load statements from file
        try:
            if input_file.endswith('.json'):
                with open(input_file, 'r', encoding='utf-8') as f:
                    statements_list = json.load(f)
            elif input_file.endswith('.pkl'):
                with open(input_file, 'rb') as f:
                    statements_list = pickle.load(f)
            else:
                self.stderr.write(self.style.ERROR(
                    "Input file must have .json or .pkl extension"
                ))
                return
            
            self.stdout.write(f"Loaded {len(statements_list)} statements from {input_file}")
        except FileNotFoundError:
            self.stderr.write(self.style.ERROR(f"Input file not found: {input_file}"))
            return
        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Error loading statements: {e}"))
            return

        start_time = time.time()

        # Create logger service for this step
        # If anomalies_log provided, it will be used as the output path
        if anomalies_log:
            logger_service = LoggerService(ingestion_anomalies_log_path=anomalies_log)
            # Load any previous anomalies from the JSON file (e.g., from process_neurondm step)
            logger_service.load_anomalies_from_json(anomalies_log)
        else:
            logger_service = LoggerService()

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
            self.stdout.write(f"Saved {len(logger_service.anomalies)} total anomalies to {logger_service.ingestion_anomalies_log_path}")

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
