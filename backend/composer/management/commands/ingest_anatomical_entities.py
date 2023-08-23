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

    def _create_ae(self, name, ontology_uri):
        found = AnatomicalEntity.objects.filter(name__iexact=name).exists()
        if not found:
            return AnatomicalEntity(
                name=name,
                ontology_uri=ontology_uri
            )
        return None
        # anatomical_entity, created = AnatomicalEntity.objects.get_or_create(
        #     name__iexact=name,
        #     defaults={"ontology_uri": ontology_uri, "name": name},
        # )
        # if created:
        #     self.stdout.write(f"Anatomical Entity {name} created.")
        #     anatomical_entity.save()

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
                bulk = []
                self.stdout.write("Start ingestion of Anatomical Entities")
                for row in aereader:
                    ontology_uri = row[URI]
                    name = row[NAME]
                    synonym = row[SYNONYM] or None
                    ae = self._create_ae(name, ontology_uri)
                    if ae:
                        bulk.append(ae)
                    if synonym:
                        ae = self._create_ae(synonym, ontology_uri)
                        if ae:
                            bulk.append(ae)
                    if len(bulk) > 100:
                        self.stdout.write(f"{len(bulk)} new Anatomical Entities created.")
                        AnatomicalEntity.objects.bulk_create(bulk, ignore_conflicts=True)
                        bulk = []
                if len(bulk) > 0:
                    # insert the remaining
                    self.stdout.write(f"{len(bulk)} new Anatomical Entities created.")
                    AnatomicalEntity.objects.bulk_create(bulk, ignore_conflicts=True)
