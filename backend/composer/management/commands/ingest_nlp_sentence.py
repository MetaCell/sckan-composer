import csv

from django.core.management.base import BaseCommand
from django.db import connection

from composer.models import Provenance


ID = "id"
PMID = "pmid"
PMCID = "pmcid"
DOI = "doi"
SENTENCE = "sentence"


class Command(BaseCommand):
    help = "Ingests NLP Sentence CSV file(s)"

    def add_arguments(self, parser):
        parser.add_argument("csv_files", nargs="+", type=str)

    def handle(self, *args, **options):
        for csv_file in options["csv_files"]:
            with open(
                csv_file, newline="", encoding="utf-8", errors="ignore"
            ) as csvfile:
                nlpreader = csv.DictReader(
                    csvfile,
                    delimiter=";",
                    quotechar='"',
                )
                for row in nlpreader:
                    rowid = row[ID]
                    pmid = row[PMID] if row[PMID] != "0" else None
                    pmcid = row[PMCID] if row[PMCID] != "0" else None
                    doi = row[DOI] if row[DOI] != "0" else None
                    description = row[SENTENCE]
                    title = description[0:199]
                    provenance, created = Provenance.objects.get_or_create(
                        pmid=pmid,
                        pmcid=pmcid,
                        defaults={"title": title, "description": description},
                    )
                    if created:
                        self.stdout.write(
                            f"{rowid}: provenance created with pmid {pmid}, pmcid {pmcid}."
                        )
                        provenance.save()
                    else:
                        self.stdout.write(
                            f"{rowid}: provenance with pmid {pmid}, pmcid {pmcid} found, updating."
                        )
                        dirty = False
                        if provenance.description != description:
                            provenance.description = description
                            dirty = True
                        if provenance.title is None:
                            provenance.title = title
                            dirty = True
                        if dirty:
                            provenance.save()
