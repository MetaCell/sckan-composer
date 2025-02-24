from typing import List

from composer.services.statement_service import get_statement_preview
from composer.services.export.helpers.utils import get_connected_from_info, get_composer_uri
from composer.services.export.helpers.predicate_mapping import (
    DESTINATION_PREDICATE_MAP,
    VIA_PREDICATE_MAP,
    DynamicExportRelationship,
    ExportRelationships,
    IExportRelationship,
)

from composer.enums import (
    CircuitType,
    Laterality,
    NoteType,
    Projection,
)
from composer.models import (
    ConnectivityStatement,
    Specie,
    Via,
    AnatomicalEntity,
    Destination,
)
from composer.services.connections_service import (
    get_complete_from_entities_for_destination,
    get_complete_from_entities_for_via,
)

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


class Row:
    def __init__(
        self,
        object: str,
        object_uri: str,
        predicate_mapping: IExportRelationship,
        object_text: str = "",
        curation_notes: str = "",
        review_notes: str = "",
        layer: str = "",
        connected_from_names: str = "",
        connected_from_uris: str = "",
    ):
        self.object = object
        self.object_uri = object_uri
        self.object_text = object_text
        self.predicate = predicate_mapping.predicate
        self.predicate_uri = predicate_mapping.uri
        self.predicate_relationship = predicate_mapping.label
        self.curation_notes = curation_notes
        self.review_notes = review_notes
        self.layer = layer
        self.connected_from_names = connected_from_names
        self.connected_from_uris = connected_from_uris


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

    # Knowledge Statement Row
    rows.append(get_knowledge_statement_row(cs))

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
        predicate_mapping = DynamicExportRelationship(
            predicate=statement_alert.alert_type.predicate,
            label=statement_alert.alert_type.name,
            uri=statement_alert.alert_type.uri,
        )
        rows.append(
            Row(
                object=statement_alert.alert_type.uri,
                object_uri="",
                predicate_mapping=predicate_mapping,
                object_text=statement_alert.text,
            )
        )
    
    # the composer URI
    rows.append(get_composer_uri_row(cs))
    return rows


def get_knowledge_statement_row(cs: ConnectivityStatement) -> Row:
    """
    Generate the row for the knowledge statement of a connectivity statement.
    """

    return Row(
        object="Knowledge statement",
        object_uri="",
        predicate_mapping=ExportRelationships.composerGenLabel,
        object_text=get_statement_preview(cs, cs.get_journey()) ,
    )


def get_origin_row(origin: AnatomicalEntity, review_notes: str, curation_notes: str):
    predicate_mapping = ExportRelationships.hasSomaLocatedIn
    return Row(
        object=origin.name,
        object_uri=origin.ontology_uri,
        predicate_mapping=predicate_mapping,
        curation_notes=curation_notes,
        review_notes=review_notes,
        layer="1",
    )


def get_destination_row(destination: Destination, total_vias: int):

    predicate_mapping = ExportRelationships[
        DESTINATION_PREDICATE_MAP[destination.type].name
    ]
    from_entities = list(destination.from_entities.all())
    connected_from_entities = (
        from_entities
        if from_entities
        else get_complete_from_entities_for_destination(destination)
    )
    connected_from_names, connected_from_uris = get_connected_from_info(
        connected_from_entities
    )
    layer_value = str(total_vias + 2)

    return [
        Row(
            object=ae.name,
            object_uri=ae.ontology_uri,
            predicate_mapping=predicate_mapping,
            layer=layer_value,
            connected_from_names=connected_from_names,
            connected_from_uris=connected_from_uris,
        )
        for ae in destination.anatomical_entities.all()
    ]


def get_via_row(via: Via):
    predicate_mapping = ExportRelationships[VIA_PREDICATE_MAP[via.type].name]
    from_entities = list(via.from_entities.all())
    connected_from_entities = (
        from_entities if from_entities else get_complete_from_entities_for_via(via)
    )
    connected_from_names, connected_from_uris = get_connected_from_info(
        connected_from_entities
    )
    layer_value = str(via.order + 2)

    return [
        Row(
            object=ae.name,
            object_uri=ae.ontology_uri,
            predicate_mapping=predicate_mapping,
            layer=layer_value,
            connected_from_names=connected_from_names,
            connected_from_uris=connected_from_uris,
        )
        for ae in via.anatomical_entities.all()
    ]


def get_specie_row(specie: Specie):
    predicate_mapping = ExportRelationships.hasInstanceInTaxon
    return Row(
        object=specie.name,
        object_uri=specie.ontology_uri,
        predicate_mapping=predicate_mapping,
    )


def get_sex_row(cs: ConnectivityStatement):
    predicate_mapping = ExportRelationships.hasBiologicalSex
    return Row(
        object=cs.sex.name,
        object_uri=cs.sex.ontology_uri,
        predicate_mapping=predicate_mapping,
    )


def get_circuit_role_row(cs: ConnectivityStatement):
    predicate_mapping = ExportRelationships.hasCircuitRolePhenotype
    return Row(
        object=cs.get_circuit_type_display(),
        object_uri=TEMP_CIRCUIT_MAP.get(cs.circuit_type, ""),
        predicate_mapping=predicate_mapping,
    )


def get_projection_row(cs: ConnectivityStatement):
    predicate_mapping = ExportRelationships.hasProjectionLaterality
    return Row(
        object=cs.get_projection_display(),
        object_uri=TEMP_PROJECTION_MAP.get(cs.projection, ""),
        predicate_mapping=predicate_mapping,
    )


def get_soma_phenotype_row(cs: ConnectivityStatement):
    predicate_mapping = ExportRelationships.hasSomaPhenotype
    return Row(
        object=cs.get_laterality_display(),
        object_uri=TEMP_LATERALITY_MAP.get(cs.laterality, ""),
        predicate_mapping=predicate_mapping,
    )


def get_phenotype_row(cs: ConnectivityStatement):
    predicate_mapping = ExportRelationships.hasAnatomicalSystemPhenotype
    return Row(
        object=cs.phenotype.name if cs.phenotype else "",
        object_uri=cs.phenotype.ontology_uri if cs.phenotype else "",
        predicate_mapping=predicate_mapping,
    )


def get_projection_phenotype_row(cs: ConnectivityStatement):
    predicate_mapping = ExportRelationships.hasProjectionPhenotype
    return Row(
        object=cs.projection_phenotype.name if cs.projection_phenotype else "",
        object_uri=(
            cs.projection_phenotype.ontology_uri if cs.projection_phenotype else ""
        ),
        predicate_mapping=predicate_mapping,
    )


def get_functional_circuit_row(cs: ConnectivityStatement):
    predicate_mapping = ExportRelationships.hasFunctionalCircuitRolePhenotype
    return Row(
        object=cs.functional_circuit_role.name,
        object_uri=cs.functional_circuit_role.ontology_uri,
        predicate_mapping=predicate_mapping,
    )


def get_forward_connection_row(forward_conn: ConnectivityStatement):
    predicate_mapping = ExportRelationships.hasForwardConnection
    return Row(
        object=forward_conn.sentence.pk,
        object_uri=forward_conn.reference_uri,
        predicate_mapping=predicate_mapping,
    )



def get_composer_uri_row(cs: ConnectivityStatement):
    predicate_mapping = ExportRelationships.hasComposerUri
    return Row(
        object="Composer URI",
        object_uri=get_composer_uri(cs),
        predicate_mapping=predicate_mapping,
    )