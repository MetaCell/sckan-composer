import aiohttp
import asyncio
import csv
import os

from asgiref.sync import sync_to_async
from django.db import models
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


def to_none(value):
    return None if value == "0" or len(str(value)) == 0 else value


async def save_sentence(session, row, default_batch_name):
    rowid = row[ID]
    pmid = to_none(row[PMID])
    pmcid = to_none(row[PMCID])
    doi = to_none(row[DOI])
    text = row[SENTENCE]
    external_ref = row[EXTERNAL_REF]
    batch_name = to_none(row[BATCH_NAME])
    if not batch_name:
        batch_name = default_batch_name
    title = text[0:199]
    sentence, created = await Sentence.objects.aget_or_create(
        external_ref=external_ref,
        batch_name=batch_name,
        defaults={"title": title, "text": text, "doi": doi, "pmid": pmid, "pmcid": pmcid},
    )
    if created:
        url = None
        if sentence.doi:
            url = sentence.doi_uri
        elif sentence.pmid:
            url = sentence.pmid_uri
        elif sentence.pmcid:
            pmcid = sentence.pmcid.replace("PMC", "")
            url = f"https://www.ncbi.nlm.nih.gov/pmc/oai/oai.cgi?verb=GetRecord&identifier=oai:pubmedcentral.nih.gov:{pmcid}&metadataPrefix=oai_dc"
        if url:
            async with session.get(url) as resp:
                page = await resp.text()
                print(page)
                sentence.save()
                print(
                    f"{rowid}: sentence created: batch {batch_name}, ref {external_ref}, pmid {pmid}, pmcid {pmcid}, doi {doi}."
                )
        else:
            sentence.save()
            print(
                f"{rowid}: sentence created: batch {batch_name}, ref {external_ref}, pmid {pmid}, pmcid {pmcid}, doi {doi}."
            )


class Command(BaseCommand):
    help = "Ingests NLP Sentence CSV file(s)"

    def add_arguments(self, parser):
        parser.add_argument("csv_files", nargs="+", type=str)

    def to_none(self, value):
        return None if value == "0" or len(str(value)) == 0 else value

    def handle(self, *args, **options):
        asyncio.run(self.ingest(*args, **options))

    async def ingest(self, *args, **options):
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

                async with aiohttp.ClientSession() as session:
                    tasks = []
                    for row in nlpreader:
                        rowid = row[ID]
                        out_of_scope = row[OUT_OF_SCOPE].lower()
                        if out_of_scope and out_of_scope.lower() == "yes":
                            # skip out of scope records
                            self.stdout.write(f"{rowid}: out of scope.")
                            continue
                        tasks.append(save_sentence(session, row, default_batch_name))
                    await asyncio.gather(*tasks)
