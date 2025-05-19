from django.db import transaction



def update_from_entities_on_deletion(connectivity_statement, deleted_entity_id):
    """
    Updates the 'from_entities' for Layers that used the deleted entity.
    Scoped to the given ConnectivityStatement.
    """
    from composer.models import Destination, Via

    # Filter affected layers within the same ConnectivityStatement
    affected_via_layers = Via.objects.filter(
        connectivity_statement=connectivity_statement,
        from_entities__id=deleted_entity_id
    )

    affected_destination_layers = Destination.objects.filter(
        connectivity_statement=connectivity_statement,
        from_entities__id=deleted_entity_id
    )

    # Update 'from_entities' by removing the deleted entity
    for via in affected_via_layers:
        via.from_entities.remove(deleted_entity_id)

    for destination in affected_destination_layers:
        destination.from_entities.remove(deleted_entity_id)