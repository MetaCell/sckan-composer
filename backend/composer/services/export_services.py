from typing import Dict, Callable, List

from composer.enums import NoteType
from composer.models import Tag, ConnectivityStatement

SPECIES_TYPE = 'hasInstanceInTaxon'


class Row:
    def __init__(self, structure: str, identifier: str, relationship: str, curation_notes: str):
        self.structure = structure
        self.identifier = identifier
        self.relationship = relationship
        self.curation_notes = curation_notes


def generate_csv_attributes_mapping() -> Dict[str, Callable]:
    attributes_map = {
        "Sentence Number": lambda cs, row: cs.sentence.id,
        "NLP-ID": lambda cs, row: cs.id,
        "Neuron population label (A to B via C)": lambda cs, row: cs.journey,
        "Type": lambda cs, row: cs.ans_division.name,
        "Structure": lambda cs, row: row.structure,
        "Identifier": lambda cs, row: row.identifier,
        "Relationship": lambda cs, row: row.relationship,
        "Observed in species": lambda cs, row: ', '.join([specie.name for specie in cs.species]),
        "Different from existing": lambda cs, row: cs.notes.filter(type=NoteType.SPECIES_DIFFERENT).exists(),
        "Curation notes": lambda cs, row: row.curation_notes,
        "Reference (pubmed ID, DOI or text)": lambda cs, row: ', '.join([doi for doi in cs.doi_set.all()]),
        "Approved by SAWG": lambda cs, row: cs.approved_by_sawg,
        "Proposed action": lambda cs, row: 'Add',
        "Added to SCKAN (time stamp)": lambda cs, row: cs.modified_date,
    }
    exportable_tags = Tag.objects.filter(exportable=True)
    for tag in exportable_tags:
        attributes_map[tag.name] = lambda cs, row: cs.tags.filter(name=tag.name).exists()


def get_rows(cs: ConnectivityStatement) -> List:
    rows = [Row(cs.origin.name, cs.origin.ontology_uri, 'Soma', '\n'.join([note.note for note in cs.notes])),
            Row(cs.destination.name, cs.destination.ontology_uri, cs.destination_type, '')]
    for via in cs.via_set.all().order_by('display_order'):
        rows.append(Row(via.anatomical_entity.name, via.anatomical_entity.ontology_uri, via.type, ''))

    for specie in cs.species:
        rows.append(Row(specie.name, specie.ontology_uri, SPECIES_TYPE, ''))

    rows.append(Row(cs.biological_sex.name, cs.biological_sex.ontology_uri, 'Sex', ''))
    # todo: add phenotypes

    return rows
