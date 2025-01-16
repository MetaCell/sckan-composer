from .logging_service import LoggerService
from .neurondm_script import main as get_statements_from_neurondm
from composer.services.cs_ingestion.helpers.common_helpers import ID
from composer.models import ConnectivityStatement

logger_service = LoggerService()


def ingest_neurondm_new_field_to_statements(neurondm_field, cs_field, full_imports=[], label_imports=[]):
	statements_list = get_statements_from_neurondm(
            full_imports=full_imports, label_imports=label_imports, logger_service_param=logger_service)
	for statement in statements_list:
		try:
			connectivity_statement = ConnectivityStatement.objects.get(
				reference_uri=statement[ID])
			setattr(connectivity_statement, cs_field,
			        statement[neurondm_field])
			connectivity_statement.save(update_fields=[cs_field])
		except ConnectivityStatement.DoesNotExist:
			pass
