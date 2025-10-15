import json
import time

from django.core.management.base import BaseCommand
from composer.services.cs_ingestion.cs_ingestion_services import get_composer_data


class Command(BaseCommand):
    help = "Get composer data (custom relationships and alert types) from database and save to file"

    def add_arguments(self, parser):
        parser.add_argument(
            '--output_file',
            type=str,
            required=True,
            help='Path to output JSON file where data will be saved',
        )

    def handle(self, *args, **options):
        output_file = options['output_file']

        start_time = time.time()

        try:
            # Fetch composer data
            self.stdout.write("Fetching composer data from database...")
            composer_data = get_composer_data()

            # Save to JSON file
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(composer_data, f, indent=2)

            end_time = time.time()
            duration = end_time - start_time

            self.stdout.write(self.style.SUCCESS(
                f"Successfully saved {len(composer_data['custom_relationships'])} custom relationships "
                f"and {len(composer_data['statement_alert_uris'])} alert URIs to {output_file} in {duration:.2f} seconds."
            ))

        except Exception as e:
            end_time = time.time()
            duration = end_time - start_time
            self.stderr.write(self.style.ERROR(
                f"Failed to get data after {duration:.2f} seconds: {e}"
            ))

