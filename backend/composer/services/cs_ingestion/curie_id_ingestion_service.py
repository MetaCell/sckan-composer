from .logging_service import LoggerService
from .neurondm_script import main as get_statements_from_neurondm
from composer.services.cs_ingestion.helpers.common_helpers import ID
from composer.models import ConnectivityStatement

logger_service = LoggerService()


def ingest_curie_id_to_statements(full_imports=[], label_imports=[]):
	statements_list = get_statements_from_neurondm(
            full_imports=full_imports, label_imports=label_imports, logger_service_param=logger_service)
	for statement in statements_list:
		try:
			connectivity_statement = ConnectivityStatement.objects.get(
				reference_uri=statement[ID])
			connectivity_statement.curie_id = statement["label"]
			connectivity_statement.save(update_fields=["curie_id"])
		except ConnectivityStatement.DoesNotExist:
			pass
