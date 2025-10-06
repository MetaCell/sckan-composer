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
        parser.add_argument(
            '--population_file',
            type=str,
            help='Path to a text file containing population URIs (one per line). When provided, ONLY statements matching these URIs will be processed for ingestion.',
        )

    def handle(self, *args, **options):
        update_upstream = options['update_upstream']
        update_anatomical_entities = options['update_anatomical_entities']
        disable_overwrite = options['disable_overwrite']
        full_imports = options['full_imports']
        label_imports = options['label_imports']
        population_file = options['population_file']

        # Read population URIs from file if provided
        population_uris = None
        if population_file:
            try:
                with open(population_file, 'r', encoding='utf-8') as f:
                    population_uris = set(line.strip() for line in f if line.strip())
                self.stdout.write(f"Loaded {len(population_uris)} population URIs from {population_file}")
            except FileNotFoundError:
                self.stderr.write(self.style.ERROR(f"Population file not found: {population_file}"))
                return
            except Exception as e:
                self.stderr.write(self.style.ERROR(f"Error reading population file: {e}"))
                return

        start_time = time.time()

        result = ingest_statements(update_upstream, update_anatomical_entities, disable_overwrite, full_imports, label_imports, population_uris)

        end_time = time.time()

        duration = end_time - start_time

        if result['success']:
            self.stdout.write(self.style.SUCCESS(
                f"Ingestion completed successfully in {duration:.2f} seconds.\n"
                f"Total statements: {result['total_statements']}\n"
                f"Successfully ingested: {result['successful_statements']}\n"
                f"Failed: {result['failed_statements']}"
            ))
            if result['failed_statements'] > 0:
                self.stdout.write(self.style.WARNING(
                    f"\nNote: {result['failed_statements']} statement(s) failed during ingestion. "
                    f"Check the anomalies log file for details."
                ))
        else:
            self.stderr.write(self.style.ERROR(
                f"Ingestion failed after {duration:.2f} seconds.\n"
                f"Total statements: {result['total_statements']}\n"
                f"Successfully ingested: {result['successful_statements']}\n"
                f"Failed: {result['failed_statements']}\n"
                f"Check logs for details."
            ))