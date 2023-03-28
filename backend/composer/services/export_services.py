from typing import Dict, Callable, List

from composer.enums import NoteType
from composer.exceptions import UnexportableConnectivityStatement
from composer.models import Tag, ConnectivityStatement, Via, Specie, Note

SPECIES_TYPE = 'hasInstanceInTaxon'


def get_sentence_number(cs, row):
    return cs.sentence.id


def get_nlp_id(cs, row):
    return cs.id


def get_neuron_population_label(cs, row):
    return cs.journey


def get_type(cs, row):
    return cs.ans_division.name


def get_structure(cs, row):
    return row.structure


def get_identifier(cs, row):
    return row.identifier


def get_relationship(cs, row):
    return row.relationship


def get_observed_in_species(cs, row):
    return ', '.join([specie.name for specie in cs.species.all()])


def is_different_from_existing(cs, row):
    return cs.notes.filter(type=NoteType.SPECIES_DIFFERENT).exists()


def get_curation_notes(cs, row):
    return row.curation_notes


def get_review_notes(cs, row):
    return row.review_notes


def get_reference(cs, row):
    return ', '.join([doi.doi for doi in cs.doi_set.all()])


def is_approved_by_sawg(cs, row):
    return 'Yes'


def get_proposed_action(cs, row):
    return 'Add'


def get_added_to_sckan_timestamp(cs, row):
    return cs.modified_date


def get_tag_filter(tag_name):
    def tag_filter(cs, row):
        return cs.tags.filter(tag=tag_name).exists()

    return tag_filter


class Row:
    def __init__(self, structure: str, identifier: str, relationship: str, curation_notes: str, review_notes: str):
        self.structure = structure
        self.identifier = identifier
        self.relationship = relationship
        self.curation_notes = curation_notes
        self.review_notes = review_notes


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
        "Different from existing": is_different_from_existing,
        "Curation notes": get_curation_notes,
        "Reference (pubmed ID, DOI or text)": get_reference,
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
    review_notes = '\n'.join([note.note for note in cs.notes.all()])
    curation_notes = '\n'.join([note.note for note in cs.sentence.notes.all()])
    return Row(cs.origin.name, cs.origin.ontology_uri, 'Soma', curation_notes, review_notes)


def get_destination_row(cs: ConnectivityStatement):
    return Row(cs.destination.name, cs.destination.ontology_uri, cs.get_destination_type_display(), '', '')


def get_via_row(via: Via):
    return Row(via.anatomical_entity.name, via.anatomical_entity.ontology_uri, via.get_type_display(), '', '')


def get_specie_row(specie: Specie):
    return Row(specie.name, specie.ontology_uri, SPECIES_TYPE, '', '')


def get_biological_sex_row(cs: ConnectivityStatement):
    return Row(cs.biological_sex.name, cs.biological_sex.ontology_uri, '', '', '')


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

    for via in cs.via_set.all().order_by('display_order'):
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

    # todo: add phenotypes

    return rows
