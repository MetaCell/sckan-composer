from enum import Enum
from typing import Set


class NeuronDMOrigin:
    def __init__(self, anatomical_entities_uri: Set):
        self.anatomical_entities = anatomical_entities_uri


class NeuronDMVia:
    def __init__(self, anatomical_entities_uri: Set, from_entities: Set, order: int, type: str):
        self.anatomical_entities = anatomical_entities_uri
        self.from_entities = from_entities
        self.order = order
        self.type = type


class NeuronDMDestination:
    def __init__(self, anatomical_entities_uri: Set, from_entities: Set, type: str):
        self.anatomical_entities = anatomical_entities_uri
        self.from_entities = from_entities
        self.type = type


class LoggableEvent:
    def __init__(self, statement_id, entity_id, message):
        self.statement_id = statement_id
        self.entity_id = entity_id
        self.message = message


class AxiomType(Enum):
    ORIGIN = 'origin'
    VIA = 'via'
    DESTINATION = 'destination'


class ValidationErrors:
    def __init__(self):
        self.entities = set()
        self.sex = set()
        self.species = set()
        self.forward_connection = set()
        self.axiom_not_found = set()
        self.non_specified = []

    def to_string(self) -> str:
        error_messages = []
        if self.entities:
            error_messages.append(f"Entities not found: {', '.join(self.entities)}")
        if self.sex:
            error_messages.append(f"Sex information not found: {', '.join(self.sex)}")
        if self.species:
            error_messages.append(f"Species not found: {', '.join(self.species)}")
        if self.forward_connection:
            error_messages.append(
                f"Forward connections not found: {', '.join(self.forward_connection)}")
        if self.axiom_not_found:
            error_messages.append(f"Axioms not found for: {', '.join(self.axiom_not_found)}")
        if self.non_specified:
            error_messages.extend(self.non_specified)

        return '; '.join(error_messages) if error_messages else "No validation errors."

    def has_errors(self) -> bool:
        return bool(
            self.entities or
            self.sex or
            self.species or
            self.forward_connection or
            self.axiom_not_found or
            self.non_specified
        )