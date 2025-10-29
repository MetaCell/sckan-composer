from composer.pure_enums import ConnectivityErrors
from composer.services.state_services import ConnectivityStatementStateService


def get_connectivity_errors(connectivity_statement):
    errors = []
    if not ConnectivityStatementStateService.is_forward_connection_valid(connectivity_statement):
        errors.append(ConnectivityErrors.INVALID_FORWARD_CONNECTION.value)
    return errors
