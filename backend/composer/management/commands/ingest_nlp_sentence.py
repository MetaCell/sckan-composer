import csv
import os

from django.core.management.base import BaseCommand

from composer.models import Sentence

ID = "id"
PMID = "pmid"
PMCID = "pmcid"
DOI = "doi"
BATCH_NAME = "batch_name"
EXTERNAL_REF = "sentence_id"
SENTENCE = "sentence"
SENTENCE_ID = "sentence_id"
OUT_OF_SCOPE = "out_of_scope"


class Command(BaseCommand):
    help = "Ingests NLP Sentence CSV file(s)"

    def add_arguments(self, parser):
        parser.add_argument("csv_files", nargs="+", type=str)

    def to_none(self, value):
        return None if value == "0" or len(str(value)) == 0 else value

    def handle(self, *args, **options):
        for csv_file_name in options["csv_files"]:
            with open(
                csv_file_name, newline="", encoding="utf-8", errors="ignore"
            ) as csvfile:
                nlpreader = csv.DictReader(
                    csvfile,
                    delimiter=";",
                    quotechar='"',
                )
                default_batch_name = os.path.basename(csv_file_name)
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
                    external_ref = row[EXTERNAL_REF]
                    batch_name = self.to_none(row[BATCH_NAME])
                    if not batch_name:
                        batch_name = default_batch_name
                    title = text[0:199]
                    sentence, created = Sentence.objects.get_or_create(
                        external_ref=external_ref,
                        batch_name=batch_name,
                        defaults={"title": title, "text": text, "doi": doi, "pmid": pmid, "pmcid": pmcid},
                    )
                    if created:
                        self.stdout.write(
                            f"{rowid}: sentence created: batch {batch_name}, ref {external_ref}, pmid {pmid}, pmcid {pmcid}, doi {doi}."
                        )
                        sentence.save()
