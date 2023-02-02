import csv

from django.core.management.base import BaseCommand

from composer.models import AnatomicalEntity

URI = "o"
NAME = "o_label"
SYNONYM = "o_synonym"

class Command(BaseCommand):
    help = "Ingests Anatomical Entities CSV file(s)"

    def add_arguments(self, parser):
        parser.add_argument("csv_files", nargs="+", type=str)
        
    def _save(self, name, ontology_uri):
        anatomical_entity, created = AnatomicalEntity.objects.get_or_create(
            name__iexact=name,
            defaults={"ontology_uri": ontology_uri, "name": name},
        )
        if created:
            self.stdout.write(
                f"Anatomical Entity {name} created."
            )
            anatomical_entity.save()

    def handle(self, *args, **options):
        for csv_file in options["csv_files"]:
            with open(
                csv_file, newline="", encoding="utf-8", errors="ignore"
            ) as csvfile:
                aereader = csv.DictReader(
                    csvfile,
                    delimiter=";",
                    quotechar='"',
                )
                for row in aereader:
                    ontology_uri = row[URI]
                    name = row[NAME]
                    synonym = row[SYNONYM] or None
                    self._save(name, ontology_uri)
                    if synonym:
                        self._save(synonym, ontology_uri)
