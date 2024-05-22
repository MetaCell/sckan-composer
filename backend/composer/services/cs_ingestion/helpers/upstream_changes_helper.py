from typing import Set, Dict

from composer.enums import CSState
from composer.models import ConnectivityStatement
from composer.services.cs_ingestion.helpers.notes_helper import do_transition_to_invalid_with_note, create_invalid_note


def update_upstream_statements():
    invalid_visited = set()
    connectivity_statements_invalid_reasons = {}

    initial_invalid_statements = ConnectivityStatement.objects.filter(state=CSState.INVALID)

    for statement in initial_invalid_statements:
        propagate_invalid_state(statement, invalid_visited, connectivity_statements_invalid_reasons)

    for statement_uri, (connectivity_statement, reasons) in connectivity_statements_invalid_reasons.items():
        all_reasons = '; '.join(reasons)

        # Perform transition and create a note only if not already invalid
        if connectivity_statement.state != CSState.INVALID:
            do_transition_to_invalid_with_note(connectivity_statement, all_reasons)
        else:
            create_invalid_note(connectivity_statement, all_reasons)


def propagate_invalid_state(connectivity_statement: ConnectivityStatement, invalid_visited: Set,
                            connectivity_statements_invalid_reasons: Dict, previous_reason: str = ''):
    statement_uri = connectivity_statement.reference_uri

    if statement_uri in invalid_visited:
        return

    invalid_visited.add(statement_uri)

    # Fetch backward connections directly from the database
    backward_connections = ConnectivityStatement.objects.filter(
        forward_connection=connectivity_statement
    )

    for backward_cs in backward_connections:
        # Build the reason string
        current_reason = (f"statement with id {backward_cs.id} is invalid because its "
                          f"forward connection with id {connectivity_statement.id} is invalid")
        if previous_reason:
            current_reason += f" because {previous_reason}"

        # Accumulate reasons in connectivity_statements_invalid_reasons, store ConnectivityStatement object with reasons
        if backward_cs.reference_uri not in connectivity_statements_invalid_reasons:
            connectivity_statements_invalid_reasons[backward_cs.reference_uri] = (backward_cs, [])
        connectivity_statements_invalid_reasons[backward_cs.reference_uri][1].append(current_reason)

        # Recursively propagate invalid state
        propagate_invalid_state(backward_cs, invalid_visited, connectivity_statements_invalid_reasons, current_reason)
