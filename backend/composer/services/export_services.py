import csv
import datetime
import logging
import os
import tempfile
import typing

from typing import Dict, Callable, List

from django.contrib.auth.models import User
from django.db import transaction
from django.db.models import Count, QuerySet
from django.utils import timezone

from composer.enums import NoteType, ExportRelationships, CircuitType, Laterality, MetricEntity, SentenceState, CSState
from composer.exceptions import UnexportableConnectivityStatement
from composer.models import (
    Tag,
    ConnectivityStatement,
    ExportBatch,
    ExportMetrics,
    Sentence,
    Specie,
    Via,
)
from composer.services.state_services import ConnectivityStatementService
from composer.services.filesystem_service import create_dir_if_not_exists
from composer.enums import CSState

HAS_NERVE_BRANCHES_TAG = "Has nerve branches"
TEMP_CIRCUIT_MAP = {
    CircuitType.INTRINSIC: "http://uri.interlex.org/tgbugs/uris/readable/IntrinsicPhenotype",
    CircuitType.PROJECTION: "http://uri.interlex.org/tgbugs/uris/readable/ProjectionPhenotype",
    CircuitType.MOTOR: "http://uri.interlex.org/tgbugs/uris/readable/MotorPhenotype",
    CircuitType.SENSORY: "http://uri.interlex.org/tgbugs/uris/readable/SensoryPhenotype",
}

TEMP_LATERALITY_MAP = {
    Laterality.IPSI: "http://purl.obolibrary.org/obo/PATO_0002035",
    Laterality.CONTRAT: "http://uri.interlex.org/base/ilx_0793864",
    Laterality.BI: "http://purl.obolibrary.org/obo/PATO_0000618",
}

TEMP_PHENOTYPE_MAP = {
    "enteric": "http://uri.interlex.org/tgbugs/uris/readable/EntericPhenotype",
    "sympathetic post-ganglionic phenotype": "http://uri.interlex.org/tgbugs/uris/readable/neuron-phenotype-sym-post",
    "sympathetic pre-ganglionic phenotype": "http://uri.interlex.org/tgbugs/uris/readable/neuron-phenotype-sym-pre",
    "parasympathetic post-ganglionic phenotype": "http://uri.interlex.org/tgbugs/uris/readable/neuron-phenotype-para-post",
    "parasympathetic pre-ganglionic phenotype": "http://uri.interlex.org/tgbugs/uris/readable/neuron-phenotype-para-pre",
}


class Row:
    def __init__(
        self,
        structure: str,
        identifier: str,
        relationship: str,
        curation_notes: str,
        review_notes: str,
    ):
        self.structure = structure
        self.identifier = identifier
        self.relationship = relationship
        self.curation_notes = curation_notes
        self.review_notes = review_notes


def get_sentence_number(cs: ConnectivityStatement, row: Row):
    return cs.sentence.id


def get_nlp_id(cs: ConnectivityStatement, row: Row):
    return cs.id


def get_neuron_population_label(cs: ConnectivityStatement, row: Row):
    return cs.journey


def get_type(cs: ConnectivityStatement, row: Row):
    return cs.ans_division.name


def get_structure(cs: ConnectivityStatement, row: Row):
    return row.structure


def get_identifier(cs: ConnectivityStatement, row: Row):
    return row.identifier


def get_relationship(cs: ConnectivityStatement, row: Row):
    return row.relationship


def get_observed_in_species(cs: ConnectivityStatement, row: Row):
    return ", ".join([specie.name for specie in cs.species.all()])


def escape_newlines(value):
    return value.replace("\\", "\\\\").replace("\n", "\\n")


def get_different_from_existing(cs: ConnectivityStatement, row: Row):
    return escape_newlines(
        "\n".join([note.note for note in cs.notes.filter(type=NoteType.DIFFERENT)])
    )


def get_curation_notes(cs: ConnectivityStatement, row: Row):
    return escape_newlines(row.curation_notes.replace("\\", "\\\\"))


def get_review_notes(cs: ConnectivityStatement, row: Row):
    return escape_newlines(row.review_notes.replace("\\", "\\\\"))


def get_reference(cs: ConnectivityStatement, row: Row):
    return ", ".join([doi.doi for doi in cs.doi_set.all()])


def is_approved_by_sawg(cs: ConnectivityStatement, row: Row):
    return "Yes"


def get_proposed_action(cs: ConnectivityStatement, row: Row):
    return "Add"


def get_added_to_sckan_timestamp(cs: ConnectivityStatement, row: Row):
    return cs.modified_date


def has_nerve_branches(cs: ConnectivityStatement, row: Row) -> bool:
    return cs.tags.filter(tag=HAS_NERVE_BRANCHES_TAG).exists()


def get_tag_filter(tag_name):
    def tag_filter(cs, row):
        return cs.tags.filter(tag=tag_name).exists()

    return tag_filter


def generate_csv_attributes_mapping() -> Dict[str, Callable]:
    attributes_map = {
        "Sentence Number": get_sentence_number,
        "NLP-ID": get_nlp_id,
        "Neuron population label (A to B via C)": get_neuron_population_label,
        "Type": get_type,
        "Structure": get_structure,
        "Identifier": get_identifier,
        "Relationship": get_relationship,
        "Observed in species": get_observed_in_species,
        "Different from existing": get_different_from_existing,
        "Curation notes": get_curation_notes,
        "Reference (pubmed ID, DOI or text)": get_reference,
        "Has nerve branches": has_nerve_branches,
        "Approved by SAWG": is_approved_by_sawg,
        "Review notes": get_review_notes,
        "Proposed action": get_proposed_action,
        "Added to SCKAN (time stamp)": get_added_to_sckan_timestamp,
    }
    exportable_tags = Tag.objects.filter(exportable=True)
    for tag in exportable_tags:
        attributes_map[tag.tag] = get_tag_filter(tag.tag)

    return attributes_map


def get_origin_row(cs: ConnectivityStatement):
    review_notes = "\n".join(
        [note.note for note in cs.notes.filter(type=NoteType.PLAIN)]
    )
    curation_notes = "\n".join([note.note for note in cs.sentence.notes.all()])
    return Row(
        cs.origin.name,
        cs.origin.ontology_uri,
        ExportRelationships.soma.name,
        curation_notes,
        review_notes,
    )


def get_destination_row(cs: ConnectivityStatement):
    return Row(
        cs.destination.name,
        cs.destination.ontology_uri,
        cs.get_destination_type_display(),
        "",
        "",
    )


def get_via_row(via: Via):
    return Row(
        via.anatomical_entity.name,
        via.anatomical_entity.ontology_uri,
        via.get_type_display(),
        "",
        "",
    )


def get_specie_row(specie: Specie):
    return Row(
        specie.name,
        specie.ontology_uri,
        ExportRelationships.hasInstanceInTaxon.name,
        "",
        "",
    )


def get_biological_sex_row(cs: ConnectivityStatement):
    return Row(
        cs.biological_sex.name,
        cs.biological_sex.ontology_uri,
        ExportRelationships.hasBiologicalSex.name,
        "",
        "",
    )


def get_circuit_role_row(cs: ConnectivityStatement):
    return Row(
        cs.get_circuit_type_display(),
        TEMP_CIRCUIT_MAP.get(cs.circuit_type, ""),
        ExportRelationships.hasCircuitRolePhenotype.name,
        "",
        "",
    )


def get_laterality_row(cs: ConnectivityStatement):
    return Row(
        cs.get_laterality_display(),
        TEMP_LATERALITY_MAP.get(cs.laterality, ""),
        ExportRelationships.hasProjectionLaterality.name,
        "",
        "",
    )


def get_phenotype_row(cs: ConnectivityStatement):
    return Row(
        cs.ans_division.name,
        TEMP_PHENOTYPE_MAP.get(cs.ans_division.name, ""),
        ExportRelationships.hasPhenotype.name,
        "",
        "",
    )


def get_rows(cs: ConnectivityStatement) -> List:
    rows = []
    try:
        rows.append(get_origin_row(cs))
    except Exception:
        raise UnexportableConnectivityStatement("Error getting origin row")

    try:
        rows.append(get_destination_row(cs))
    except Exception:
        raise UnexportableConnectivityStatement("Error getting destination row")

    for via in cs.via_set.all().order_by("display_order"):
        try:
            rows.append(get_via_row(via))
        except Exception:
            raise UnexportableConnectivityStatement("Error getting via row")

    for specie in cs.species.all():
        try:
            rows.append(get_specie_row(specie))
        except Exception:
            raise UnexportableConnectivityStatement("Error getting specie row")

    try:
        rows.append(get_biological_sex_row(cs))
    except Exception:
        raise UnexportableConnectivityStatement("Error getting biological sex row")

    try:
        rows.append(get_circuit_role_row(cs))
    except Exception:
        raise UnexportableConnectivityStatement("Error getting circuit role row")

    try:
        rows.append(get_laterality_row(cs))
    except Exception:
        raise UnexportableConnectivityStatement("Error getting laterality row")

    try:
        rows.append(get_phenotype_row(cs))
    except Exception:
        raise UnexportableConnectivityStatement("Error getting phenotype row")

    return rows


def create_export_batch(qs: QuerySet, user: User) -> ExportBatch:
    # do transition to EXPORTED state
    export_batch = ExportBatch.objects.create(user=user)
    export_batch.connectivity_statements.set(qs)
    export_batch.save()
    return export_batch


def compute_metrics(export_batch: ExportBatch):
    # will be executed by post_save signal on ExportBatch
    last_export_batch = ExportBatch.objects.all().order_by("-created_at").first()
    if last_export_batch:
        last_export_batch_created_at = last_export_batch.created_at
    else:
        last_export_batch_created_at = None

    # compute the metrics for this export
    sentences_created_qs = Sentence.objects.all()
    if last_export_batch_created_at:
        sentences_created_qs = Sentence.objects.filter(
            created_date__gt=last_export_batch_created_at,
        )
    export_batch.sentences_created = sentences_created_qs.count()

    connectivity_statements_created_qs = ConnectivityStatement.objects.all().exclude(state=CSState.DRAFT) # skip draft statements
    if last_export_batch_created_at:
        connectivity_statements_created_qs = ConnectivityStatement.objects.filter(
            created_date__gt=last_export_batch_created_at,
        )
    export_batch.connectivity_statements_created = connectivity_statements_created_qs.count()

    export_batch.save()

    # compute the state metrics for this export
    connectivity_statement_metrics = ConnectivityStatement.objects.values("state").annotate(count=Count("state"))
    for metric in connectivity_statement_metrics:
        ExportMetrics.objects.create(
            export_batch=export_batch,
            entity=MetricEntity.CONNECTIVITY_STATEMENT,
            state=CSState(metric["state"]),
            count=metric["count"],
        )
    sentence_metrics = Sentence.objects.values("state").annotate(count=Count("state"))
    for metric in sentence_metrics:
        ExportMetrics.objects.create(
            export_batch=export_batch,
            entity=MetricEntity.SENTENCE,
            state=SentenceState(metric["state"]),
            count=metric["count"],
        )
    # ExportMetrics
    return export_batch


def do_transition_to_exported(export_batch: ExportBatch, user: User):
    system_user = User.objects.get(username="system")
    for connectivity_statement in export_batch.connectivity_statements.all():
        available_transitions = [
            available_state.target
            for available_state in connectivity_statement.get_available_user_state_transitions(
                system_user
            )
        ]
        if CSState.EXPORTED in available_transitions:
            # we need to update the state to exported when we are in the NP0 approved state and the system user has the permission to do so
            cs = ConnectivityStatementService(connectivity_statement).do_transition(
                CSState.EXPORTED, system_user, user
            )
            cs.save()


def dump_export_batch(export_batch, folder_path: typing.Optional[str] = None) -> str:
    # returns the path of the exported file
    if folder_path is None:
        folder_path = tempfile.gettempdir()

    now = datetime.datetime.now()
    filename = f'export_{now.strftime("%Y-%m-%d_%H-%M-%S")}.csv'
    filepath = os.path.join(folder_path, filename)
    create_dir_if_not_exists(folder_path)

    csv_attributes_mapping = generate_csv_attributes_mapping()

    with open(filepath, "w", newline="") as csvfile:
        writer = csv.writer(csvfile)
        # Write header row
        headers = csv_attributes_mapping.keys()
        writer.writerow(headers)

        # Write data rows
        for obj in export_batch.connectivity_statements.all():
            try:
                rows = get_rows(obj)
            except UnexportableConnectivityStatement as e:
                logging.warning(
                    f"Connectivity Statement with id {obj.id} skipped due to {e}"
                )
                continue
            for row in rows:
                row_content = []
                for key in csv_attributes_mapping:
                    row_content.append(csv_attributes_mapping[key](obj, row))
                writer.writerow(row_content)
    return filepath


def export_connectivity_statements(
    qs: QuerySet, user: User, folder_path: typing.Optional[str]
) -> typing.Tuple[str, ExportBatch]:
    with transaction.atomic():
        # make sure create_export_batch and do_transition_to_exported are in one database transaction
        export_batch = create_export_batch(qs, user)
        do_transition_to_exported(export_batch, user)
    export_file = dump_export_batch(export_batch, folder_path)
    return export_file, export_batch
