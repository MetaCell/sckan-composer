import csv

from django.core.management.base import BaseCommand
from django.db import connection

from composer.models import Sentence

ID = "id"
PMID = "pmid"
PMCID = "pmcid"
DOI = "doi"
SENTENCE = "sentence"
OUT_OF_SCOPE = "out_of_scope"


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
                    out_of_scope = row[OUT_OF_SCOPE].lower()
                    if out_of_scope and out_of_scope.lower() == "yes":
                        # skip out of scope records
                        self.stdout.write(f"{rowid}: out of scope.")
                        continue
                    rowid = row[ID]
                    pmid = row[PMID] if row[PMID] != "0" else None
                    pmcid = row[PMCID] if row[PMCID] != "0" else None
                    doi = row[DOI] if row[DOI] != "0" else None
                    text = row[SENTENCE]
                    title = text[0:199]
                    sentence, created = Sentence.objects.get_or_create(
                        pmid=pmid,
                        pmcid=pmcid,
                        text=text,
                        defaults={"title": title},
                    )
                    if created:
                        self.stdout.write(
                            f"{rowid}: sentence created with pmid {pmid}, pmcid {pmcid}."
                        )
                        sentence.save()
