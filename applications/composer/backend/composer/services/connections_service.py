from composer.models import Via, Destination


def get_complete_from_entities_for_via(via: Via):
    current_order = via.order
    if current_order == 0:
        return via.connectivity_statement.origins.all()
    else:
        previous_via = Via.objects.filter(
            connectivity_statement=via.connectivity_statement,
            order=current_order - 1
        ).first()
        return previous_via.anatomical_entities.all() if previous_via else None


def get_complete_from_entities_for_destination(destination_instance: Destination):
    highest_order_via = Via.objects.filter(
        connectivity_statement=destination_instance.connectivity_statement
    ).order_by('-order').first()
    return highest_order_via.anatomical_entities.all() if highest_order_via else destination_instance.connectivity_statement.origins.all()
