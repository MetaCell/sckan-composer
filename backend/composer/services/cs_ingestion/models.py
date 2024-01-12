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


class LoggableError:
    def __init__(self, statement_id, entity_id, message):
        self.statement_id = statement_id
        self.entity_id = entity_id
        self.message = message

