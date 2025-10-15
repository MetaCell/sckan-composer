import json
import pickle
import time

from django.core.management.base import BaseCommand
from composer.services.cs_ingestion.cs_ingestion_services import step1_process_neurondm


class Command(BaseCommand):
    help = "Step 1: Process NeuroDM neurons, execute custom code, and filter by population (no database ingestion)"

    def add_arguments(self, parser):
        parser.add_argument(
            '--full_imports',
            nargs='*',
            help='List of full imports to include in the processing.',
        )
        parser.add_argument(
            '--label_imports',
            nargs='*',
            help='List of label imports to include in the processing.',
        )
        parser.add_argument(
            '--population_file',
            type=str,
            help='Path to a text file containing population URIs (one per line). When provided, ONLY neurons matching these URIs will be processed.',
        )
        parser.add_argument(
            '--output_file',
            type=str,
            required=True,
            help='Path to output file where processed statements will be saved. Use .json for JSON format or .pkl for pickle format.',
        )

    def handle(self, *args, **options):
        full_imports = options['full_imports']
        label_imports = options['label_imports']
        population_file = options['population_file']
        output_file = options['output_file']

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

        try:
            # Step 1: Process NeuroDM neurons
            self.stdout.write("Processing NeuroDM neurons...")
            statements_list = step1_process_neurondm(
                full_imports=full_imports,
                label_imports=label_imports,
                population_uris=population_uris,
            )

            # Save statements to file
            if output_file.endswith('.json'):
                with open(output_file, 'w', encoding='utf-8') as f:
                    json.dump(statements_list, f, indent=2)
            elif output_file.endswith('.pkl'):
                with open(output_file, 'wb') as f:
                    pickle.dump(statements_list, f)
            else:
                self.stderr.write(self.style.ERROR(
                    "Output file must have .json or .pkl extension"
                ))
                return

            end_time = time.time()
            duration = end_time - start_time

            self.stdout.write(self.style.SUCCESS(
                f"Successfully processed {len(statements_list)} statements in {duration:.2f} seconds."
            ))
            self.stdout.write(self.style.SUCCESS(f"Statements saved to {output_file}"))

        except Exception as e:
            end_time = time.time()
            duration = end_time - start_time
            self.stderr.write(self.style.ERROR(
                f"Processing failed after {duration:.2f} seconds: {e}"
            ))
