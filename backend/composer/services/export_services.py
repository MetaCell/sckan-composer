import csv
import logging
import os
import tempfile
import typing
from typing import Dict, Callable, List

from django.contrib.auth.models import User
from django.db import transaction
from django.db.models import Count, QuerySet, Prefetch
from django.utils import timezone

from composer.enums import (
    CSState,
    NoteType,
    ExportRelationships,
    CircuitType,
    Laterality,
    MetricEntity,
    DestinationType,
    ViaType,
    SentenceState,
    Projection,
)
from composer.exceptions import UnexportableConnectivityStatement
from composer.models import (
    Tag,
    ConnectivityStatement,
    ExportBatch,
    ExportMetrics,
    Sentence,
    Specie,
    Via,
    AnatomicalEntity,
    Destination,
    Note,
)
from composer.services.connections_service import (
    get_complete_from_entities_for_destination,
    get_complete_from_entities_for_via,
)
from ..services.statement_service import create_statement_preview
from composer.services.filesystem_service import create_dir_if_not_exists
from composer.services.state_services import ConnectivityStatementStateService

HAS_NERVE_BRANCHES_TAG = "Has nerve branches"
TEMP_CIRCUIT_MAP = {
    CircuitType.INTRINSIC: "http://uri.interlex.org/tgbugs/uris/readable/IntrinsicPhenotype",
    CircuitType.PROJECTION: "http://uri.interlex.org/tgbugs/uris/readable/HasProjection",
    CircuitType.MOTOR: "http://uri.interlex.org/tgbugs/uris/readable/MotorPhenotype",
    CircuitType.SENSORY: "http://uri.interlex.org/tgbugs/uris/readable/SensoryPhenotype",
}

TEMP_PROJECTION_MAP = {
    Projection.IPSI: "http://purl.obolibrary.org/obo/PATO_0002035",
    Projection.CONTRAT: "http://uri.interlex.org/base/ilx_0793864",
    Projection.BI: "http://purl.obolibrary.org/obo/PATO_0000618",
}

TEMP_LATERALITY_MAP = {
    Laterality.RIGHT: "http://purl.obolibrary.org/obo/PATO_0000367",
    Laterality.LEFT: "http://purl.obolibrary.org/obo/PATO_0000366",
}

TEMP_DESTINATION_PREDICATE_MAP = {
    DestinationType.AFFERENT_T: ExportRelationships.hasAxonSensorySubcellularElementIn,
    DestinationType.AXON_T: ExportRelationships.hasAxonPresynapticElementIn,
}

TEMP_VIA_PREDICATE_MAP = {
    ViaType.AXON: ExportRelationships.hasAxonLocatedIn,
    ViaType.DENDRITE: ExportRelationships.hasDendriteLocatedIn,
}


class Row:
    def __init__(
        self,
        structure: str,
        identifier: str,
        relationship: str,
        predicate: str,
        curation_notes: str = "",
        review_notes: str = "",
        layer: str = "",
        connected_from_names: str = "",
        connected_from_uris: str = "",
        object_text__from_alert_notes: str = "",
    ):
        self.structure = structure
        self.identifier = identifier
        self.relationship = relationship
        self.predicate = predicate
        self.curation_notes = curation_notes
        self.review_notes = review_notes
        self.layer = layer
        self.connected_from_names = connected_from_names
        self.connected_from_uris = connected_from_uris
        self.object_text__from_alert_notes = object_text__from_alert_notes


def get_sentence_number(cs: ConnectivityStatement, row: Row):
    return cs.sentence.id


def get_statement_uri(cs: ConnectivityStatement, row: Row):
    return cs.reference_uri


def get_object_text(cs: ConnectivityStatement, row: Row):
    # object text can be either from - alert notes or statement preview
    if row.object_text__from_alert_notes:
        return row.object_text__from_alert_notes
    else:
        return create_statement_preview(cs, cs.get_journey())

def get_nlp_id(cs: ConnectivityStatement, row: Row):
    return cs.export_id


def get_neuron_population_label(cs: ConnectivityStatement, row: Row):
    return " ".join(cs.get_journey())


def get_type(cs: ConnectivityStatement, row: Row):
    return cs.phenotype.name if cs.phenotype else ""


def get_structure(cs: ConnectivityStatement, row: Row):
    return row.structure


def get_identifier(cs: ConnectivityStatement, row: Row):
    return row.identifier


def get_relationship(cs: ConnectivityStatement, row: Row):
    return row.relationship


def get_layer(cs: ConnectivityStatement, row: Row):
    return row.layer


def get_connected_from_names(cs: ConnectivityStatement, row: Row):
    return row.connected_from_names


def get_connected_from_uri(cs: ConnectivityStatement, row: Row):
    return row.connected_from_uris


def get_predicate(cs: ConnectivityStatement, row: Row):
    return row.predicate


def get_observed_in_species(cs: ConnectivityStatement, row: Row):
    return ", ".join(specie.name for specie in cs.species.all())


def escape_newlines(value):
    return value.replace("\\", "\\\\").replace("\n", "\\n")


def get_different_from_existing(cs: ConnectivityStatement, row: Row):
    different_notes = [
        note.note for note in cs.prefetched_notes if note.type == NoteType.DIFFERENT
    ]
    return escape_newlines("\n".join(different_notes))


def get_curation_notes(cs: ConnectivityStatement, row: Row):
    return escape_newlines(row.curation_notes)


def get_review_notes(cs: ConnectivityStatement, row: Row):
    return escape_newlines(row.review_notes)


def get_reference(cs: ConnectivityStatement, row: Row):
    return ", ".join(procenance.uri for procenance in cs.provenance_set.all())


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


def generate_csv_attributes_mapping() -> Dict[str, Callable]:
    attributes_map = {
        "Subject URI": get_statement_uri,
        "Predicate": get_predicate,
        "Predicate Relationship": get_relationship,
        "Object": get_structure,
        "Object URI": get_identifier,
        "Object Text": get_object_text,
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
        # "Type": get_type,
        # "Observed in species": get_observed_in_species,
        # "Different from existing": get_different_from_existing,
    }
    exportable_tags = Tag.objects.filter(exportable=True)
    for tag in exportable_tags:
        attributes_map[tag.tag] = get_tag_filter(tag.tag)

    return attributes_map


def get_origin_row(origin: AnatomicalEntity, review_notes: str, curation_notes: str):
    return Row(
        origin.name,
        origin.ontology_uri,
        ExportRelationships.hasSomaLocatedIn.label,
        ExportRelationships.hasSomaLocatedIn.value,
        curation_notes,
        review_notes,
        layer="1",
    )


def get_destination_row(destination: Destination, total_vias: int):
    from_entities = list(destination.from_entities.all())
    if from_entities:
        connected_from_entities = from_entities
    else:
        connected_from_entities = get_complete_from_entities_for_destination(destination)

    connected_from_names, connected_from_uris = _get_connected_from_info(connected_from_entities)

    layer_value = str(total_vias + 2)
    return [
        Row(
            ae.name,
            ae.ontology_uri,
            destination.get_type_display(),
            TEMP_DESTINATION_PREDICATE_MAP.get(destination.type),
            "",
            "",
            layer=layer_value,
            connected_from_names=connected_from_names,
            connected_from_uris=connected_from_uris,
        )
        for ae in destination.anatomical_entities.all()
    ]


def get_via_row(via: Via):
    from_entities = list(via.from_entities.all())
    if from_entities:
        connected_from_entities = from_entities
    else:
        connected_from_entities = get_complete_from_entities_for_via(via)

    connected_from_names, connected_from_uris = _get_connected_from_info(connected_from_entities)
    layer_value = str(via.order + 2)

    return [
        Row(
            ae.name,
            ae.ontology_uri,
            via.get_type_display(),
            TEMP_VIA_PREDICATE_MAP.get(via.type),
            "",
            "",
            layer=layer_value,
            connected_from_names=connected_from_names,
            connected_from_uris=connected_from_uris,
        )
        for ae in via.anatomical_entities.all()
    ]


def _get_connected_from_info(entities):
    connected_from_info = [(entity.name, entity.ontology_uri) for entity in entities] if entities else []
    connected_from_names = "; ".join(name for name, _ in connected_from_info)
    connected_from_uris = "; ".join(uri for _, uri in connected_from_info)
    return connected_from_names, connected_from_uris


def get_specie_row(specie: Specie):
    return Row(
        specie.name,
        specie.ontology_uri,
        ExportRelationships.hasInstanceInTaxon.label,
        ExportRelationships.hasInstanceInTaxon.value,
        "",
        "",
    )


def get_sex_row(cs: ConnectivityStatement):
    return Row(
        cs.sex.name,
        cs.sex.ontology_uri,
        ExportRelationships.hasBiologicalSex.label,
        ExportRelationships.hasBiologicalSex.value,
        "",
        "",
    )


def get_circuit_role_row(cs: ConnectivityStatement):
    return Row(
        cs.get_circuit_type_display(),
        TEMP_CIRCUIT_MAP.get(cs.circuit_type, ""),
        ExportRelationships.hasCircuitRolePhenotype.label,
        ExportRelationships.hasCircuitRolePhenotype.value,
        "",
        "",
    )


def get_projection_row(cs: ConnectivityStatement):
    return Row(
        cs.get_projection_display(),
        TEMP_PROJECTION_MAP.get(cs.projection, ""),
        ExportRelationships.hasProjectionLaterality.label,
        ExportRelationships.hasProjectionLaterality.value,
        "",
        "",
    )


def get_soma_phenotype_row(cs: ConnectivityStatement):
    return Row(
        cs.get_laterality_display(),
        TEMP_LATERALITY_MAP.get(cs.laterality, ""),
        ExportRelationships.hasSomaPhenotype.label,
        ExportRelationships.hasSomaPhenotype.value,
        "",
        "",
    )


def get_phenotype_row(cs: ConnectivityStatement):
    phenotype_name = cs.phenotype.name if cs.phenotype else ""
    phenotype_ontology_uri = cs.phenotype.ontology_uri if cs.phenotype else ""
    return Row(
        phenotype_name,
        phenotype_ontology_uri,
        ExportRelationships.hasAnatomicalSystemPhenotype.label,
        ExportRelationships.hasAnatomicalSystemPhenotype.value,
        "",
        "",
    )


def get_projection_phenotype_row(cs: ConnectivityStatement):
    projection_phenotype = cs.projection_phenotype.name if cs.projection_phenotype else ""
    projection_phenotype_ontology_uri = cs.projection_phenotype.ontology_uri if cs.projection_phenotype else ""

    return Row(
        projection_phenotype,
        projection_phenotype_ontology_uri,
        ExportRelationships.hasProjectionPhenotype.label,
        ExportRelationships.hasProjectionPhenotype.value,
        "",
        "",
    )


def get_functional_circuit_row(cs: ConnectivityStatement):
    return Row(
        cs.functional_circuit_role.name,
        cs.functional_circuit_role.ontology_uri,
        ExportRelationships.hasFunctionalCircuitRolePhenotype.label,
        ExportRelationships.hasFunctionalCircuitRolePhenotype.value,
        "",
        "",
    )


def get_forward_connection_row(forward_conn: ConnectivityStatement):
    return Row(
        forward_conn.sentence.pk,
        forward_conn.reference_uri,
        ExportRelationships.hasForwardConnection.label,
        ExportRelationships.hasForwardConnection.value,
        "",
        "",
    )


def get_rows(cs: ConnectivityStatement) -> List[Row]:
    rows = []
    # Use prefetched notes
    plain_notes = [
        note.note for note in cs.prefetched_notes if note.type == NoteType.PLAIN
    ]
    review_notes = "\n".join(plain_notes)
    curation_notes = "\n".join(
        note.note for note in cs.sentence.prefetched_sentence_notes
    )

    # Origins
    origins = cs.origins.all()
    for origin in origins:
        origin_row = get_origin_row(origin, review_notes, curation_notes)
        rows.append(origin_row)

    # Vias (ordered by 'order' attribute)
    vias = cs.via_set.all().order_by("order")
    total_vias = vias.count()
    for via in vias:
        via_rows = get_via_row(via)
        rows.extend(via_rows)

    # Destinations
    destinations = cs.destinations.all()
    for destination in destinations:
        destination_rows = get_destination_row(destination, total_vias)
        rows.extend(destination_rows)

    # Species
    for specie in cs.species.all():
        rows.append(get_specie_row(specie))

    # Sex
    if cs.sex is not None:
        rows.append(get_sex_row(cs))

    # Circuit Role
    if cs.circuit_type is not None:
        rows.append(get_circuit_role_row(cs))

    # Projection
    if cs.projection is not None:
        rows.append(get_projection_row(cs))

    # Soma Phenotype
    if cs.laterality is not None:
        rows.append(get_soma_phenotype_row(cs))

    # Phenotype
    if cs.phenotype is not None:
        rows.append(get_phenotype_row(cs))

    # Projection Phenotype
    if cs.projection_phenotype:
        rows.append(get_projection_phenotype_row(cs))

    # Functional Circuit Role
    if cs.functional_circuit_role:
        rows.append(get_functional_circuit_row(cs))

    # Forward Connections
    for forward_conn in cs.forward_connection.all():
        rows.append(get_forward_connection_row(forward_conn))

    for statement_alert in cs.statement_alerts.all():
        rows.append(Row(
            identifier=statement_alert.alert_type.uri,
            structure="",
            relationship=statement_alert.alert_type.name,
            predicate=statement_alert.alert_type.predicate,
            object_text__from_alert_notes=statement_alert.text,
        ))

    return rows


def create_export_batch(qs: QuerySet, user: User) -> ExportBatch:
    export_batch = ExportBatch.objects.create(user=user)
    export_batch.connectivity_statements.set(qs)
    export_batch.save()
    return export_batch


def compute_metrics(export_batch: ExportBatch):
    last_export_batch = (
        ExportBatch.objects.exclude(id=export_batch.id).order_by("-created_at").first()
    )
    if last_export_batch:
        last_export_batch_created_at = last_export_batch.created_at
    else:
        last_export_batch_created_at = None

    # Compute the metrics for this export
    if last_export_batch_created_at:
        sentences_created_qs = Sentence.objects.filter(
            created_date__gt=last_export_batch_created_at,
        )
    else:
        sentences_created_qs = Sentence.objects.all()
    export_batch.sentences_created = sentences_created_qs.count()

    if last_export_batch_created_at:
        connectivity_statements_created_qs = ConnectivityStatement.objects.filter(
            created_date__gt=last_export_batch_created_at,
        )
    else:
        connectivity_statements_created_qs = ConnectivityStatement.objects.all()
    connectivity_statements_created_qs = connectivity_statements_created_qs.exclude(
        state=CSState.DRAFT
    )  # skip draft statements
    export_batch.connectivity_statements_created = connectivity_statements_created_qs.count()

    # Compute the state metrics for this export
    connectivity_statement_metrics = list(
        ConnectivityStatement.objects.values("state").annotate(count=Count("state"))
    )
    for state in CSState:
        metric = next(
            (x for x in connectivity_statement_metrics if x.get("state") == state),
            {"state": state.value, "count": 0},
        )
        ExportMetrics.objects.create(
            export_batch=export_batch,
            entity=MetricEntity.CONNECTIVITY_STATEMENT,
            state=CSState(metric["state"]),
            count=metric["count"],
        )
    sentence_metrics = list(Sentence.objects.values("state").annotate(count=Count("state")))
    for state in SentenceState:
        metric = next(
            (x for x in sentence_metrics if x.get("state") == state),
            {"state": state.value, "count": 0},
        )
        ExportMetrics.objects.create(
            export_batch=export_batch,
            entity=MetricEntity.SENTENCE,
            state=SentenceState(metric["state"]),
            count=metric["count"],
        )
    return export_batch


def do_transition_to_exported(export_batch: ExportBatch, user: User):
    system_user = User.objects.get(username="system")
    connectivity_statements = export_batch.connectivity_statements.all()
    for connectivity_statement in connectivity_statements:
        available_transitions = [
            available_state.target
            for available_state in connectivity_statement.get_available_user_state_transitions(
                system_user
            )
        ]
        if CSState.EXPORTED in available_transitions:
            cs = ConnectivityStatementStateService(connectivity_statement).do_transition(
                CSState.EXPORTED, system_user, user
            )
            cs.save()


def dump_export_batch(export_batch, folder_path: typing.Optional[str] = None) -> str:
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
            except UnexportableConnectivityStatement as e:
                logging.warning(
                    f"Connectivity Statement with id {cs.id} skipped due to {e}"
                )
                continue

            for row in rows:
                row_content = [func(cs, row) for func in csv_attributes_mapping.values()]
                writer.writerow(row_content)

    return filepath


def export_connectivity_statements(
    qs: QuerySet, user: User, folder_path: typing.Optional[str]
) -> typing.Tuple[str, ExportBatch]:
    with transaction.atomic():
        # Ensure create_export_batch and do_transition_to_exported are in one database transaction
        export_batch = create_export_batch(qs, user)
        do_transition_to_exported(export_batch, user)

    export_file = dump_export_batch(export_batch, folder_path)
    return export_file, export_batch
