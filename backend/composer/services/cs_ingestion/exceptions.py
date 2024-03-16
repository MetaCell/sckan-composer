class NeuronDMInconsistency(Exception):
    def __init__(self, statement_id, entity_id, message):
        self.statement_id = statement_id
        self.entity_id = entity_id
        self.message = message
        super().__init__(f"StatementID: {statement_id}, EntityID: {entity_id}, Error: {message}")


class EntityNotFoundException(Exception):
    pass
