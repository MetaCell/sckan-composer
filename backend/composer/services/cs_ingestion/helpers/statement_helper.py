from typing import Dict, Tuple, List

from django.contrib.auth.models import User

from composer.enums import CSState, NoteType
from composer.management.commands.ingest_nlp_sentence import ID
from composer.models import Sentence, ConnectivityStatement, Note, Specie, Provenance
from composer.services.cs_ingestion.helpers.anatomical_entities_helper import add_origins, add_vias, add_destinations
from composer.services.cs_ingestion.helpers.changes_detector import has_changes
from composer.services.cs_ingestion.helpers.common_helpers import LABEL, VALIDATION_ERRORS, STATE, NOTE_ALERT, \
    PROVENANCE, SPECIES, FORWARD_CONNECTION
from composer.services.cs_ingestion.helpers.getters import get_sex, get_circuit_type, get_functional_circuit_role, \
    get_phenotype, get_projection_phenotype
from composer.services.cs_ingestion.helpers.notes_helper import do_transition_to_invalid_with_note, create_invalid_note, \
    add_ingestion_system_note, do_transition_to_exported
from composer.services.cs_ingestion.models import ValidationErrors


def create_or_update_connectivity_statement(statement: Dict, sentence: Sentence, update_anatomical_entities: bool) -> \
        Tuple[ConnectivityStatement, bool]:
    reference_uri = statement[ID]
    defaults = {
        "sentence": sentence,
        "knowledge_statement": statement[LABEL],
        "sex": get_sex(statement),
        "circuit_type": get_circuit_type(statement),
        "functional_circuit_role": get_functional_circuit_role(statement),
        "phenotype": get_phenotype(statement),
        "projection_phenotype": get_projection_phenotype(statement),
        "reference_uri": statement[ID],
        "state": CSState.EXPORTED,
    }

    connectivity_statement, created = ConnectivityStatement.objects.get_or_create(
        reference_uri=reference_uri,
        defaults=defaults
    )
    if not created:        
        if has_changes(connectivity_statement, statement, defaults):
            defaults_without_state = {field: value for field, value in defaults.items() if field != 'state'}
            ConnectivityStatement.objects.filter(reference_uri=reference_uri).update(**defaults_without_state)
            connectivity_statement = ConnectivityStatement.objects.filter(reference_uri=reference_uri).first()
            add_ingestion_system_note(connectivity_statement)

    validation_errors = statement.get(VALIDATION_ERRORS, ValidationErrors())

    if validation_errors.has_errors():
        error_message = validation_errors.to_string()
        if connectivity_statement.state != CSState.INVALID:
            do_transition_to_invalid_with_note(connectivity_statement, error_message)
        else:
            create_invalid_note(connectivity_statement, error_message)
    else:
        if connectivity_statement.state != CSState.EXPORTED:
            do_transition_to_exported(connectivity_statement)

    update_many_to_many_fields(connectivity_statement, statement, update_anatomical_entities)
    statement[STATE] = connectivity_statement.state

    return connectivity_statement, created


def update_many_to_many_fields(connectivity_statement: ConnectivityStatement, statement: Dict,
                               update_anatomical_entities: bool):
    connectivity_statement.origins.clear()
    connectivity_statement.species.clear()
    # Notes are not cleared because they should be kept

    for provenance in connectivity_statement.provenance_set.all():
        provenance.delete()

    for destination in connectivity_statement.destinations.all():
        destination.delete()

    for via in connectivity_statement.via_set.all():
        via.delete()

    add_origins(connectivity_statement, statement, update_anatomical_entities)
    add_vias(connectivity_statement, statement, update_anatomical_entities)
    add_destinations(connectivity_statement, statement, update_anatomical_entities)
    add_species(connectivity_statement, statement)
    add_provenances(connectivity_statement, statement)
    add_notes(connectivity_statement, statement)


def add_notes(connectivity_statement: ConnectivityStatement, statement: Dict):
    for note in statement[NOTE_ALERT]:
        Note.objects.create(connectivity_statement=connectivity_statement,
                            user=User.objects.get(username="system"),
                            type=NoteType.ALERT,
                            note=note)


def add_provenances(connectivity_statement: ConnectivityStatement, statement: Dict):
    provenances_list = statement[PROVENANCE] if statement[PROVENANCE] else [statement[ID]]
    provenances = (Provenance(connectivity_statement=connectivity_statement, uri=provenance) for provenance in
                   provenances_list)
    Provenance.objects.bulk_create(provenances)


def add_species(connectivity_statement: ConnectivityStatement, statement: Dict):
    species = Specie.objects.filter(ontology_uri__in=statement[SPECIES])
    connectivity_statement.species.add(*species)


def update_forward_connections(statements: List):
    for statement in statements:
        connectivity_statement = ConnectivityStatement.objects.get(reference_uri=statement[ID])
        connectivity_statement.forward_connection.clear()
        for uri in statement[FORWARD_CONNECTION]:
            try:
                forward_statement = ConnectivityStatement.objects.get(reference_uri=uri)
            except ConnectivityStatement.DoesNotExist:
                assert statement[STATE] == CSState.INVALID, \
                    f"connectivity_statement {connectivity_statement} should be invalid due to forward connection {uri} not found but it isn't"
                continue
            connectivity_statement.forward_connection.add(forward_statement)
