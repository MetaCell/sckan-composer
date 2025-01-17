from .logging_service import LoggerService
from .neurondm_script import main as get_statements_from_neurondm
from composer.services.cs_ingestion.helpers.common_helpers import ID
from composer.models import ConnectivityStatement
from django.core.exceptions import FieldDoesNotExist

logger_service = LoggerService()

def check_if_connectivity_statement_field_exists(cs_field):
	try:
		ConnectivityStatement._meta.get_field(cs_field)
	except FieldDoesNotExist:
		raise ValueError(f"Field '{cs_field}' does not exist in ConnectivityStatement model.")

def ingest_neurondm_new_field_to_statements(neurondm_field, cs_field, full_imports=[], label_imports=[]):
	check_if_connectivity_statement_field_exists(cs_field)
	
	statements_list = get_statements_from_neurondm(
            full_imports=full_imports, label_imports=label_imports, logger_service_param=logger_service)
	for statement in statements_list:
		try:
			if neurondm_field not in statement:
				raise KeyError(f"Field '{neurondm_field}' not found in neurondm.")
			connectivity_statement = ConnectivityStatement.objects.get(
				reference_uri=statement[ID])
			setattr(connectivity_statement, cs_field,
			        statement[neurondm_field])
			connectivity_statement.save(update_fields=[cs_field])
		except ConnectivityStatement.DoesNotExist:
			pass	
		except KeyError as e:
			raise 