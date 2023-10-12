import requests
import crossref_commons.retrieval
import csv
import os
import re

from asgiref.sync import sync_to_async
from datetime import datetime
from typing import List
from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from lxml import etree

from composer.models import Note, Sentence, NoteType

ID = "id"
PMID = "pmid"
PMCID = "pmcid"
DOI = "doi"
BATCH_NAME = "batch_name"
COMMENT_SENDER_NAME = "comment_sender_name"
EXTERNAL_REF = "sentence_id"
SENTENCE = "sentence"
SENTENCE_ID = "sentence_id"
STATEMENT_ID = "statement_id"
OUT_OF_SCOPE = "out_of_scope"
REG_TIME = "reg_time"
COMMENT = "comment"


def to_none(value):
    return None if value == "0" or len(str(value)) == 0 else value


def pmcid_title_extractor(url):
    title = None
    resp = requests.get(url)
    xml = resp.text
    parser = etree.XMLParser(ns_clean=True, recover=True, encoding="utf-8")
    try:
        root = etree.fromstring(bytes(xml, encoding="utf-8"), parser)
        metadata = root.findall("GetRecord/record/metadata/", root.nsmap)[0]
        title = metadata.findall("dc:title", metadata.nsmap)[0].text
    except:
        pass
    return title


def pmid_title_extractor(url):
    title = None
    resp = requests.get(url)
    content = resp.text
    m = re.match('.*"citation_title".*?content="(.*?)"', content, flags=re.DOTALL)
    try:
        title = m.group(1)
    except:
        pass
    return title


def doi_title_extractor(doi):
    try:
        doc = crossref_commons.retrieval.get_publication_as_json(doi)
        return doc["title"][0]
    except:
        return None


def find_sentence(batch_name, doi, pmid, pmcid):
    sentences = Sentence.objects.filter(batch_name=batch_name)
    if doi:
        sentences = sentences.filter(doi=doi)
    else:
        sentences = sentences.filter(doi__isnull=True)
    if pmid:
        sentences = sentences.filter(pmid=pmid)
    else:
        sentences = sentences.filter(pmid__isnull=True)
    if pmcid:
        sentences = sentences.filter(pmcid=pmcid)
    else:
        sentences = sentences.filter(pmcid__isnull=True)
    for sentence in sentences:
        return sentence
    return None


def save_sentence(row, default_batch_name):
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
    sentence = find_sentence(batch_name, doi, pmid, pmcid)
    is_dirty = False
    if not sentence:
        sentence, created = Sentence.objects.get_or_create(
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
                new_title = title_extractor(url)
                if new_title:
                    sentence.title = new_title[0:199]
            print(
                f"{rowid}: sentence created: batch {batch_name}, ref {external_ref}, pmid {pmid}, pmcid {pmcid}, doi {doi}."
            )
            is_dirty = True
        else:
            print(
                f"{rowid}: sentence skipped: batch {batch_name}, ref {external_ref}, pmid {pmid}, pmcid {pmcid}, doi {doi}."
            )            
    else:
        if not text in sentence.text:
            sentence.text += f"\n\n\n{text}"
            print(
                f"{rowid}: sentence merged with {sentence.external_ref}: batch {batch_name}, ref {external_ref}, pmid {pmid}, pmcid {pmcid}, doi {doi}."
            )
            is_dirty = True
        else:
            print(
                f"{rowid}: sentence equals with {sentence.external_ref}: batch {batch_name}, ref {external_ref}, pmid {pmid}, pmcid {pmcid}, doi {doi}."
            )                
    if is_dirty:
        sentence.save()
    return external_ref, sentence.external_ref


class Command(BaseCommand):
    help = "Ingests NLP Sentence CSV file(s)"

    def add_arguments(self, parser):
        parser.add_argument("csv_files", nargs="+", type=str)

    def to_none(self, value):
        return None if value == "0" or len(str(value)) == 0 else value

    def handle(self, *args, **options):
        self.ingest(*args, **options)

    def ingest(self, *args, **options):
        for csv_file_name in options["csv_files"]:
            sentences, external_refs = self.ingest_sentences(csv_file_name)
            self.ingest_comments(csv_file_name=csv_file_name, sentences=sentences, external_refs=external_refs)

    def ingest_sentences(self, csv_file_name) -> List[dict]:
        sentences = []
        external_refs = {}
        with open(
            csv_file_name, newline="", encoding="utf-8", errors="ignore"
        ) as csvfile:
            nlpreader = csv.DictReader(
                csvfile,
                delimiter=",",
                quotechar='"',
            )
            default_batch_name = os.path.basename(csv_file_name)

            sentences = []
            for row in nlpreader:
                sentences.append(row)
                rowid = row[ID]
                out_of_scope = row[OUT_OF_SCOPE].lower()
                if out_of_scope and out_of_scope.lower() == "yes":
                    # skip out of scope records
                    self.stdout.write(f"{rowid}: out of scope.")
                    continue
                ref_from, ref_to = save_sentence(row, default_batch_name)
                external_refs.update({ref_from: ref_to})
        return sentences, external_refs

    def ingest_comments(self, csv_file_name, sentences, external_refs):
        comments_file_name = csv_file_name[0:csv_file_name.find(".csv")]+"_comments.csv"
        if os.path.exists(comments_file_name):
            with open(
                comments_file_name, newline="", encoding="utf-8", errors="ignore"
            ) as csvfile:
                comments_reader = csv.DictReader(
                    csvfile,
                    delimiter=",",
                    quotechar='"',
                )
                default_batch_name = os.path.basename(csv_file_name)
                
                users = []
                for user in User.objects.all().order_by("id"):
                    users.append(user)

                for comment in comments_reader:
                    statement_id = comment[STATEMENT_ID]
                    
                    # search the sentence from the sentence csv
                    sentence = next(sentence
                                    for sentence in sentences
                                    if sentence["id"] == statement_id
                                    and sentence[BATCH_NAME] == comment[BATCH_NAME])
                    if sentence[OUT_OF_SCOPE].lower() == "yes":
                        # the sentence is out of scope, skip the comment
                        continue

                    external_ref = external_refs[sentence[EXTERNAL_REF]]
                    batch_name = to_none(sentence[BATCH_NAME])
                    if not batch_name:
                        batch_name = default_batch_name
                    # select the corresponding sentence database entity
                    db_sentence = Sentence.objects.get(
                        external_ref=external_ref,
                        batch_name=batch_name,
                    )

                    note = comment[COMMENT]
                    comment_sender_name = comment[COMMENT_SENDER_NAME]
                    try:
                        # search the user that created the comment
                        user = next(user for user in users if user.get_full_name() == comment_sender_name)
                    except StopIteration:
                        # user does not exist, take the first one
                        user = users[0]
                        note = f"[{comment_sender_name}] {note}"
                    reg_time = datetime.strptime(comment[REG_TIME], '%Y-%m-%d %H:%M:%S')
                    
                    note, created = Note.objects.get_or_create(
                        sentence=db_sentence,
                        user=user,
                        note=note,
                        type=NoteType.PLAIN
                    )
                    if created:
                        # created_at is auto set on Note creation, let's update it
                        # to the comment's reg_time
                        note.created_at = reg_time
                        note.save()
