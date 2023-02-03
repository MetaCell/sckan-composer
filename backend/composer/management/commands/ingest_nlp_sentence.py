import csv

from django.core.management.base import BaseCommand

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

    def to_none(self, value):
        return None if value == "0" or len(str(value)) == 0 else value

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
                    out_of_scope = row[OUT_OF_SCOPE].lower()
                    if out_of_scope and out_of_scope.lower() == "yes":
                        # skip out of scope records
                        self.stdout.write(f"{rowid}: out of scope.")
                        continue
                    pmid = self.to_none(row[PMID])
                    pmcid = self.to_none(row[PMCID])
                    doi = self.to_none(row[DOI])
                    text = row[SENTENCE]
                    title = text[0:199]
                    sentence, created = Sentence.objects.get_or_create(
                        pmid=pmid,
                        pmcid=pmcid,
                        doi=doi,
                        text=text,
                        defaults={"title": title},
                    )
                    if created:
                        self.stdout.write(
                            f"{rowid}: sentence created with pmid {pmid}, pmcid {pmcid}, doi {doi}."
                        )
                        sentence.save()
