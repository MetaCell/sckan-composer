import csv
import time
from django.core.management.base import BaseCommand
from django.db.utils import IntegrityError
from composer.models import AnatomicalEntity, Synonym

URI = "o"
NAME = "o_label"
SYNONYM = "o_synonym"


class Command(BaseCommand):
    help = "Ingests Anatomical Entities CSV file(s), with robust error handling."

    def add_arguments(self, parser):
        parser.add_argument("csv_files", nargs="+", type=str)
        parser.add_argument("--update_names", action='store_true',
                            help="Update the name even if the entity already exists")
        parser.add_argument("--show_complete_logs", action='store_true',
                            help="Show detailed logs during processing")

    def _process_anatomical_entity(self, name, ontology_uri, synonym, update_names, show_complete_logs, processed_uris):
        try:
            is_first_occurrence = ontology_uri not in processed_uris

            anatomical_entity, created = AnatomicalEntity.objects.get_or_create(
                ontology_uri=ontology_uri,
                defaults={"name": name},
            )
            if not created and update_names and is_first_occurrence:
                if anatomical_entity.name != name:
                    anatomical_entity.name = name
                    anatomical_entity.save()
                    if show_complete_logs:
                        self.stdout.write(
                            self.style.SUCCESS(f"Updated {anatomical_entity.ontology_uri} name to {name}."))

            processed_uris.add(ontology_uri)

            if synonym:
                synonym_exists = anatomical_entity.synonyms.filter(alias__iexact=synonym).exists()
                if not synonym_exists:
                    Synonym.objects.create(anatomical_entity=anatomical_entity, alias=synonym)
                    if show_complete_logs:
                        self.stdout.write(
                            self.style.SUCCESS(f"Synonym '{synonym}' added for {anatomical_entity.ontology_uri}."))
        except IntegrityError as e:
            self.stdout.write(self.style.ERROR(f"Error processing {ontology_uri}: {e}"))

    def handle(self, *args, **options):
        start_time = time.time()
        update_names = options['update_names']
        show_complete_logs = options['show_complete_logs']

        for csv_file in options["csv_files"]:
            processed_uris = set()
            try:
                with open(csv_file, "r", encoding="utf-8", errors="ignore") as f:
                    total_lines = sum(1 for _ in f)

                with open(csv_file, newline="", encoding="utf-8", errors="ignore") as csvfile:
                    reader = csv.DictReader(csvfile, delimiter=",", quotechar='"')
                    current_line = 0
                    for row in reader:
                        current_line += 1
                        if current_line % 100 == 0 or current_line == total_lines:
                            self.stdout.write(self.style.NOTICE(f"Processing line {current_line}/{total_lines}"))

                        ontology_uri = row[URI].strip()
                        name = row[NAME].strip()
                        synonym = row[SYNONYM].strip() if row[SYNONYM] else None

                        self._process_anatomical_entity(name, ontology_uri, synonym, update_names, show_complete_logs,
                                                        processed_uris)
            except FileNotFoundError:
                self.stdout.write(self.style.ERROR(f"File {csv_file} does not exist."))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"An error occurred while processing {csv_file}: {e}"))

        end_time = time.time()
        self.stdout.write(self.style.SUCCESS(f"Operation completed in {end_time - start_time:.2f} seconds."))
