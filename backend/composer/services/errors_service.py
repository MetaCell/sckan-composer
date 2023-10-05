from composer.enums import ConnectivityErrors
from composer.services.state_services import ConnectivityStatementService


def get_connectivity_errors(connectivity_statement):
    errors = []
    if not ConnectivityStatementService.is_forward_connection_valid(connectivity_statement):
        errors.append(ConnectivityErrors.INVALID_FORWARD_CONNECTION.value)
    return errors
