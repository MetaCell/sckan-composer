import aiohttp
import asyncio
import crossref_commons.retrieval
import csv
import os
import re

from asgiref.sync import sync_to_async
from django.core.management.base import BaseCommand
from lxml import etree

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

MAX_PARALLEL_JOBS = 10


def to_none(value):
    return None if value == "0" or len(str(value)) == 0 else value


async def pmcid_title_extractor(session, url):
    title = None
    async with session.get(url) as resp:
        xml = await resp.text()
        parser = etree.XMLParser(ns_clean=True, recover=True, encoding="utf-8")
        try:
            root = etree.fromstring(bytes(xml, encoding="utf-8"), parser)
            metadata = root.findall("GetRecord/record/metadata/", root.nsmap)[0]
            title = metadata.findall("dc:title", metadata.nsmap)[0].text
        except:
            pass
    return title


async def pmid_title_extractor(session, url):
    title = None
    async with session.get(url) as resp:
        content = await resp.text()
        m = re.match('.*"citation_title".*?content="(.*?)"', content, flags=re.DOTALL)
        try:
            title = m.group(1)
        except:
            pass
    return title


async def doi_title_extractor(session, doi):
    try:
        doc = crossref_commons.retrieval.get_publication_as_json(doi)
        return doc["title"][0]
    except:
        return None


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
    try:
        sentence, created = await Sentence.objects.aget_or_create(
            external_ref=external_ref,
            batch_name=batch_name,
            defaults={
                "title": title,
                "text": text,
                "doi": doi,
                "pmid": pmid,
                "pmcid": pmcid,
            },
        )
        if created:
            url = None
            if sentence.doi:
                url = sentence.doi
                title_extractor = doi_title_extractor
            elif sentence.pmid:
                url = sentence.pmid_uri
                title_extractor = pmid_title_extractor
            elif sentence.pmcid:
                pmcid = sentence.pmcid.replace("PMC", "")
                url = f"https://www.ncbi.nlm.nih.gov/pmc/oai/oai.cgi?verb=GetRecord&identifier=oai:pubmedcentral.nih.gov:{pmcid}&metadataPrefix=oai_dc"
                title_extractor = pmcid_title_extractor
            if url:
                new_title = await title_extractor(session, url)
                if new_title:
                    sentence.title = new_title[0:199]
            await sync_to_async(sentence.save)()
            print(
                f"{rowid}: sentence created: batch {batch_name}, ref {external_ref}, pmid {pmid}, pmcid {pmcid}, doi {doi}."
            )
    except Exception as e:
        print(
            f"{rowid}: batch {batch_name}, ref {external_ref} ... skipped! Exception {e}"
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

                rows = []
                for row in nlpreader:
                    rows.append(row)

                row_counter = 0
                while row_counter < len(rows):
                    async with aiohttp.ClientSession() as session:
                        tasks = []
                        for i in range(0, MAX_PARALLEL_JOBS):  # max parallel
                            row = rows[row_counter]
                            row_counter += 1
                            rowid = row[ID]
                            out_of_scope = row[OUT_OF_SCOPE].lower()
                            if out_of_scope and out_of_scope.lower() == "yes":
                                # skip out of scope records
                                self.stdout.write(f"{rowid}: out of scope.")
                                continue
                            tasks.append(
                                asyncio.create_task(
                                    save_sentence(session, row, default_batch_name)
                                )
                            )
                        await asyncio.gather(*tasks)
