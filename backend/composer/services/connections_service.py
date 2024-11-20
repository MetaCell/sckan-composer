from composer.models import Via, Destination


def get_complete_from_entities_for_via(via: Via):
    """
    Optimize retrieval of 'from_entities' for a Via instance.
    """
    current_order = via.order

    # If the current Via is the first in the order, return origins
    if current_order == 0:
        return via.connectivity_statement.origins.all()

    # Use data to find the previous Via
    previous_via = next(
        (v for v in via.connectivity_statement.via_set.all() if v.order == current_order - 1),
        None
    )

    # Return anatomical_entities from the previous via if it exists
    return previous_via.anatomical_entities.all() if previous_via else None



def get_complete_from_entities_for_destination(destination_instance: Destination):
    """
    Optimize retrieval of 'from_entities' for a Destination instance.
    """
    # Find the highest order via from the via_set
    highest_order_via = max(
        destination_instance.connectivity_statement.via_set.all(),
        key=lambda v: v.order,
        default=None
    )

    # Return anatomical_entities from the highest order via if it exists
    return highest_order_via.anatomical_entities.all() if highest_order_via else destination_instance.connectivity_statement.origins.all()
