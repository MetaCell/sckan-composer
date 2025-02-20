import csv
import logging
import os
import tempfile
import typing
from typing import Dict, Callable

from django.db.models import Prefetch
from django.utils import timezone

from composer.services.export.helpers.rows import Row, get_rows
from composer.services.export.helpers.utils import escape_newlines
from composer.enums import NoteType
from composer.models import (
    Tag,
    ConnectivityStatement,
    Note,
)
from composer.services.filesystem_service import create_dir_if_not_exists

HAS_NERVE_BRANCHES_TAG = "Has nerve branches"


def create_csv(export_batch, folder_path: typing.Optional[str] = None) -> str:
    if folder_path is None:
        folder_path = tempfile.gettempdir()

    now = timezone.now()
    filename = f'export_{now.strftime("%Y-%m-%d_%H-%M-%S")}.csv'
    filepath = os.path.join(folder_path, filename)
    create_dir_if_not_exists(folder_path)

    csv_attributes_mapping = generate_csv_attributes_mapping()

    # Prefetch related data with filters
    notes_prefetch = Prefetch(
        "notes",
        queryset=Note.objects.filter(type__in=[NoteType.PLAIN, NoteType.DIFFERENT]),
        to_attr="prefetched_notes",
    )
    sentence_notes_prefetch = Prefetch(
        "sentence__notes",
        queryset=Note.objects.all(),
        to_attr="prefetched_sentence_notes",
    )
    tags_prefetch = Prefetch(
        "tags", queryset=Tag.objects.all(), to_attr="prefetched_tags"
    )

    connectivity_statements = export_batch.connectivity_statements.select_related(
        "sentence", "sex", "functional_circuit_role", "projection_phenotype"
    ).prefetch_related(
        "origins",
        notes_prefetch,
        tags_prefetch,
        "species",
        "forward_connection",
        "provenance_set",
        sentence_notes_prefetch,
        "via_set__anatomical_entities",
        "via_set__from_entities",
        "destinations__anatomical_entities",
        "destinations__from_entities",
    )

    with open(filepath, "w", newline="") as csvfile:
        writer = csv.writer(csvfile)
        headers = csv_attributes_mapping.keys()
        writer.writerow(headers)

        for cs in connectivity_statements:
            try:
                rows = get_rows(cs)
            except Exception as e:
                logging.warning(
                    f"Connectivity Statement with id {cs.id} skipped due to {e}"
                )
                continue
            for row in rows:
                try:
                    row_content = [
                        func(cs, row) for func in csv_attributes_mapping.values()
                    ]
                    writer.writerow(row_content)
                except Exception as e:
                    logging.warning(
                        f"Connectivity Statement with id {cs.id} skipped due to {e}"
                    )

    return filepath


def generate_csv_attributes_mapping() -> Dict[str, Callable]:
    attributes_map = {
        "Subject": get_curie_id,
        "Subject URI": get_compr_uri,
        "Predicate": get_predicate,
        "Predicate URI": get_predicate_uri,
        "Predicate Relationship": get_relationship,
        "Object": get_structure,
        "Object URI": get_identifier,
        "Object Text": get_alert_text,
        "Axonal course poset": get_layer,
        "Connected from": get_connected_from_names,
        "Connected from uri": get_connected_from_uri,
        "Curation notes": get_curation_notes,
        "Reference (pubmed ID, DOI or text)": get_reference,
        "Has nerve branches": has_nerve_branches,
        "Approved by SAWG": is_approved_by_sawg,
        "Review notes": get_review_notes,
        "Proposed action": get_proposed_action,
        "Added to SCKAN (time stamp)": get_added_to_sckan_timestamp,
        "Sentence Number": get_sentence_number,
        "NLP-ID": get_nlp_id,
        "Neuron population label (A to B via C)": get_neuron_population_label,
    }
    exportable_tags = Tag.objects.filter(exportable=True)
    for tag in exportable_tags:
        attributes_map[tag.tag] = get_tag_filter(tag.tag)

    return attributes_map


## Same for all rows


def get_sentence_number(cs: ConnectivityStatement, row: Row):
    return cs.sentence.id


def get_curie_id(cs: ConnectivityStatement, row: Row):
    return cs.curie_id if cs.curie_id is not None else ""


def get_compr_uri(cs: ConnectivityStatement, row: Row):
    return cs.compr_uri if cs.compr_uri else ""


def get_nlp_id(cs: ConnectivityStatement, row: Row):
    return cs.export_id


def get_neuron_population_label(cs: ConnectivityStatement, row: Row):
    return " ".join(cs.get_journey())


def get_observed_in_species(cs: ConnectivityStatement, row: Row):
    return ", ".join(specie.name for specie in cs.species.all())


def get_different_from_existing(cs: ConnectivityStatement, row: Row):
    different_notes = [
        note.note for note in cs.prefetched_notes if note.type == NoteType.DIFFERENT
    ]
    return escape_newlines("\n".join(different_notes))


def get_type(cs: ConnectivityStatement, row: Row):
    return cs.phenotype.name if cs.phenotype else ""


def is_approved_by_sawg(cs: ConnectivityStatement, row: Row):
    return "Yes"


def get_proposed_action(cs: ConnectivityStatement, row: Row):
    return "Add"


def get_added_to_sckan_timestamp(cs: ConnectivityStatement, row: Row):
    return cs.modified_date


def has_nerve_branches(cs: ConnectivityStatement, row: Row) -> bool:
    return any(tag.tag == HAS_NERVE_BRANCHES_TAG for tag in cs.prefetched_tags)


def get_tag_filter(tag_name):
    def tag_filter(cs, row):
        return any(tag.tag == tag_name for tag in cs.prefetched_tags)

    return tag_filter


# Different between rows


def get_structure(cs: ConnectivityStatement, row: Row):
    return row.object


def get_identifier(cs: ConnectivityStatement, row: Row):
    return row.object_uri


def get_relationship(cs: ConnectivityStatement, row: Row):
    return row.predicate_relationship


def get_layer(cs: ConnectivityStatement, row: Row):
    return row.layer


def get_connected_from_names(cs: ConnectivityStatement, row: Row):
    return row.connected_from_names


def get_connected_from_uri(cs: ConnectivityStatement, row: Row):
    return row.connected_from_uris


def get_predicate(cs: ConnectivityStatement, row: Row):
    return row.predicate


def get_predicate_uri(cs: ConnectivityStatement, row: Row):
    return row.predicate_uri


def get_alert_text(cs: ConnectivityStatement, row: Row):
    return row.object_text


def get_curation_notes(cs: ConnectivityStatement, row: Row):
    return escape_newlines(row.curation_notes)


def get_review_notes(cs: ConnectivityStatement, row: Row):
    return escape_newlines(row.review_notes)


def get_reference(cs: ConnectivityStatement, row: Row):
    return ", ".join(procenance.uri for procenance in cs.provenance_set.all())
