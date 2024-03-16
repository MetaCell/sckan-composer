import csv
import time
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.db.utils import IntegrityError
from composer.models import AnatomicalEntity, Synonym

URI = "o"
NAME = "o_label"
SYNONYM = "o_synonym"
BULK_LIMIT = 100


class Command(BaseCommand):
    help = "Ingests Anatomical Entities CSV file(s), with robust error handling."

    def add_arguments(self, parser):
        parser.add_argument("csv_files", nargs="+", type=str)
        parser.add_argument("--update_names", action='store_true',
                            help="Update the name even if the entity already exists")
        parser.add_argument("--show_complete_logs", action='store_true',
                            help="Show detailed logs during processing")

    def _process_anatomical_entity(self, name, ontology_uri, synonym, update_names, show_complete_logs, processed_uris,
                                   synonym_accumulator):
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

            if synonym and synonym.lower() not in [s.alias.lower() for s in anatomical_entity.synonyms.all()]:
                synonym_accumulator.append(Synonym(anatomical_entity=anatomical_entity, alias=synonym))
                if show_complete_logs:
                    self.stdout.write(
                        self.style.SUCCESS(f"Synonym '{synonym}' added for {anatomical_entity.ontology_uri}."))
        except IntegrityError as e:
            self.stdout.write(self.style.ERROR(f"Error processing {ontology_uri}: {e}"))

    @transaction.atomic
    def handle(self, *args, **options):
        start_time = time.time()
        update_names = options['update_names']
        show_complete_logs = options['show_complete_logs']
        synonym_accumulator = []

        for csv_file in options["csv_files"]:
            processed_uris = set()
            try:
                with open(csv_file, newline="", encoding="utf-8", errors="ignore") as csvfile:
                    reader = csv.DictReader(csvfile, delimiter=",", quotechar='"')
                    for current_line, row in enumerate(reader, start=1):
                        if current_line % 100 == 0:
                            self.stdout.write(self.style.NOTICE(f"Processing line {current_line}"))

                        ontology_uri = row[URI].strip()
                        name = row[NAME].strip()
                        synonym = row[SYNONYM].strip() if row[SYNONYM] else None

                        self._process_anatomical_entity(name, ontology_uri, synonym, update_names, show_complete_logs,
                                                        processed_uris, synonym_accumulator)

                        if len(synonym_accumulator) >= BULK_LIMIT:
                            Synonym.objects.bulk_create(synonym_accumulator)
                            synonym_accumulator = []

            except FileNotFoundError:
                self.stdout.write(self.style.ERROR(f"File {csv_file} does not exist."))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"An error occurred while processing {csv_file}: {e}"))

            # Ensure any remaining synonyms are created
            if synonym_accumulator:
                Synonym.objects.bulk_create(synonym_accumulator)

        end_time = time.time()
        self.stdout.write(self.style.SUCCESS(f"Operation completed in {end_time - start_time:.2f} seconds."))
