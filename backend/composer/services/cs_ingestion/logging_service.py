import csv
from typing import List

from composer.enums import CSState
from composer.models import ConnectivityStatement
from composer.services.cs_ingestion.models import LoggableError

AXIOM_NOT_FOUND = "Entity not found in any axiom"
ENTITY_NOT_FOUND = "Entity not found in composer db"
SEX_NOT_FOUND = "Sex not found in composer db"
SPECIES_NOT_FOUND = "Species not found in composer db"
MULTIPLE_DESTINATIONS = "Statement already found and has multiple destinations"
INCORRECT_STATE = f"Statement already found and is not in {CSState.EXPORTED} state"
FORWARD_CONNECTION_NOT_FOUND = "Forward connection reference not found"


class LoggerService:
    def __init__(self, error_log_path='error_log.csv', success_log_path='success_log.csv'):
        self.error_log_path = error_log_path
        self.success_log_path = success_log_path
        self.errors = []

    def add_error(self, error: LoggableError):
        self.errors.append(error)

    def write_errors_to_file(self):
        with open(self.error_log_path, 'a', newline='') as file:
            writer = csv.writer(file)
            for error in self.errors:
                writer.writerow([error.statement_id, error.entity_id, error.message])

    def write_ingested_statements_to_file(self, statements: List[ConnectivityStatement]):
        with open(self.success_log_path, 'a', newline='') as file:
            writer = csv.writer(file)
            for statement in statements:
                writer.writerow([statement.reference_uri, statement.knowledge_statement])
