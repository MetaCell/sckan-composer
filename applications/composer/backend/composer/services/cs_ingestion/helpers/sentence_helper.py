import logging
from datetime import datetime
from typing import Dict, Tuple

from composer.enums import SentenceState
from composer.models import Sentence
from composer.constants import INGESTION_ANOMALIES_LOG_PATH, INGESTION_INGESTED_LOG_PATH
from composer.services.cs_ingestion.helpers.common_helpers import SENTENCE_NUMBER, LABEL, ID
from composer.services.cs_ingestion.logging_service import LoggerService
from composer.services.cs_ingestion.models import LoggableAnomaly

NOW = datetime.now().strftime("%Y%m%d%H%M%S")
logger_service = LoggerService(
    ingestion_anomalies_log_path=INGESTION_ANOMALIES_LOG_PATH,
    ingested_log_path=INGESTION_INGESTED_LOG_PATH
)


def get_or_create_sentence(statement: Dict) -> Tuple[Sentence, bool]:
    text = f'{statement[LABEL]} created from neurondm on {NOW}'
    has_sentence_reference = len(statement[SENTENCE_NUMBER]) > 0

    if len(statement[SENTENCE_NUMBER]) > 1:
        logger_service.add_anomaly(
            LoggableAnomaly(statement[ID], None, f'Multiple sentence numbers found.'))

    sentence, created = Sentence.objects.get_or_create(
        doi__iexact=statement[ID],
        defaults={"title": text[0:185],
                  "text": text,
                  "doi": statement[ID],
                  "external_ref": statement[SENTENCE_NUMBER][0] if has_sentence_reference else None,
                  "batch_name": f"neurondm-{NOW}" if has_sentence_reference else None,
                  "state": SentenceState.COMPOSE_NOW
                  },
    )
    if created:
        logging.info(f"Sentence for neuron {statement[LABEL]} created.")

    return sentence, created
