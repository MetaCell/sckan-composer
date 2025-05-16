import csv
from typing import List, Dict

from composer.enums import CSState, SentenceState
from composer.services.cs_ingestion.helpers.common_helpers import ID, LABEL, STATE, VALIDATION_ERRORS
from composer.services.cs_ingestion.models import LoggableAnomaly

AXIOM_NOT_FOUND = "Entity not found in any axiom"
SENTENCE_INCORRECT_STATE = f"Sentence already found and is not in {SentenceState.COMPOSE_NOW} state"
STATEMENT_INCORRECT_STATE = f"Statement already found and is not in {CSState.EXPORTED} or {CSState.INVALID} state"

INCONSISTENT_AXIOMS = "Region and layer found in different axioms"


class SingletonMeta(type):
    """
    This is a thread-safe implementation of Singleton.
    """
    _instances = {}

    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            instance = super().__call__(*args, **kwargs)
            cls._instances[cls] = instance
        return cls._instances[cls]


class LoggerService(metaclass=SingletonMeta):
    def __init__(self, ingestion_anomalies_log_path='ingestion_anomalies_log.csv',
                 ingested_log_path='ingested_log.csv'):
        self.anomalies_log_path = ingestion_anomalies_log_path
        self.ingested_log_path = ingested_log_path
        self.anomalies = []

    def add_anomaly(self, error: LoggableAnomaly):
        self.anomalies.append(error)

    def write_anomalies_to_file(self):
        with open(self.anomalies_log_path, 'w', newline='') as file:
            writer = csv.writer(file)
            for anomaly in self.anomalies:
                writer.writerow([anomaly.severity.value, anomaly.statement_id, anomaly.entity_id, anomaly.message])

    def write_ingested_statements_to_file(self, statements: List[Dict]):
        with open(self.ingested_log_path, 'w', newline='') as file:
            writer = csv.writer(file)
            for statement in statements:
                reason = statement[VALIDATION_ERRORS].to_string() or ''
                writer.writerow([statement[ID], statement[LABEL], statement[STATE], reason])
