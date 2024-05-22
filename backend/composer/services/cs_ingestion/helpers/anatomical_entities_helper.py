from typing import Dict

from django.db import IntegrityError, transaction
from neurondm import orders

from composer.enums import CSState
from composer.models import ConnectivityStatement, AnatomicalEntityMeta, Via, Destination, AnatomicalEntity, Layer, \
    Region, AnatomicalEntityIntersection
from composer.services.cs_ingestion.exceptions import EntityNotFoundException
from composer.services.cs_ingestion.helpers.common_helpers import ORIGINS, VIAS, DESTINATIONS


def add_origins(connectivity_statement: ConnectivityStatement, statement: Dict, update_anatomic_entities: bool):
    for entity in statement[ORIGINS].anatomical_entities:
        try:
            add_entity_to_instance(connectivity_statement, 'origins', entity, update_anatomic_entities)
        except (EntityNotFoundException, AnatomicalEntityMeta.DoesNotExist):
            assert connectivity_statement.state == CSState.INVALID, f"connectivity_statement {connectivity_statement} should be invalid due to entity {entity} not found but it isn't"
        except IntegrityError as e:
            raise e


def add_vias(connectivity_statement: ConnectivityStatement, statement: Dict, update_anatomic_entities: bool):
    for neurondm_via in statement[VIAS]:
        via_instance = Via.objects.create(connectivity_statement=connectivity_statement,
                                          type=neurondm_via.type,
                                          order=neurondm_via.order)
        add_entities_to_connection(via_instance,
                                   neurondm_via.anatomical_entities,
                                   neurondm_via.from_entities,
                                   connectivity_statement, update_anatomic_entities)


def add_destinations(connectivity_statement: ConnectivityStatement, statement: Dict, update_anatomic_entities: bool):
    for neurondm_destination in statement[DESTINATIONS]:
        destination_instance = Destination.objects.create(connectivity_statement=connectivity_statement,
                                                          type=neurondm_destination.type)
        add_entities_to_connection(destination_instance,
                                   neurondm_destination.anatomical_entities,
                                   neurondm_destination.from_entities,
                                   connectivity_statement, update_anatomic_entities)


def add_entities_to_connection(instance, anatomical_entities, from_entities, connectivity_statement,
                               update_anatomic_entities: bool):
    try:
        for entity in anatomical_entities:
            add_entity_to_instance(instance, 'anatomical_entities', entity, update_anatomic_entities)

        for entity in from_entities:
            add_entity_to_instance(instance, 'from_entities', entity, update_anatomic_entities)

    except (EntityNotFoundException, AnatomicalEntity.DoesNotExist):
        assert connectivity_statement.state == CSState.INVALID, \
            f"connectivity_statement {connectivity_statement} should be invalid due to entity {entity} not found but it isn't"
    except IntegrityError as e:
        raise e


def add_entity_to_instance(instance, entity_field, entity, update_anatomic_entities: bool):
    if isinstance(entity, orders.rl):
        complex_anatomical_entity, _ = get_or_create_complex_entity(str(entity.region), str(entity.layer),
                                                                    update_anatomic_entities)
        getattr(instance, entity_field).add(complex_anatomical_entity)
    else:
        anatomical_entity, _ = get_or_create_simple_entity(str(entity))
        getattr(instance, entity_field).add(anatomical_entity)


def get_or_create_complex_entity(region_uri, layer_uri, update_anatomical_entities=False):
    try:
        layer = Layer.objects.get(ontology_uri=layer_uri)
    except Layer.DoesNotExist:
        layer = None

    try:
        region = Region.objects.get(ontology_uri=region_uri)
    except Region.DoesNotExist:
        region = None

    if update_anatomical_entities:
        if not layer:
            try:
                layer_meta = AnatomicalEntityMeta.objects.get(ontology_uri=layer_uri)
                layer, _ = convert_anatomical_entity_to_specific_type(layer_meta, Layer)
            except AnatomicalEntityMeta.DoesNotExist:
                raise EntityNotFoundException(f"Layer meta not found for URI: {layer_uri}")

        if not region:
            try:
                region_meta = AnatomicalEntityMeta.objects.get(ontology_uri=region_uri)
                region, _ = convert_anatomical_entity_to_specific_type(region_meta, Region)
            except AnatomicalEntityMeta.DoesNotExist:
                raise EntityNotFoundException(f"Region meta not found for URI: {layer_uri}")
    else:
        if not layer or not region:
            raise EntityNotFoundException("Required Layer or Region not found.")

    intersection, _ = AnatomicalEntityIntersection.objects.get_or_create(layer=layer, region=region)
    anatomical_entity, created = AnatomicalEntity.objects.get_or_create(region_layer=intersection)

    return anatomical_entity, created


def get_or_create_simple_entity(ontology_uri: str):
    try:
        anatomical_entity_meta = AnatomicalEntityMeta.objects.get(ontology_uri=ontology_uri)
        anatomical_entity, created = AnatomicalEntity.objects.get_or_create(simple_entity=anatomical_entity_meta)
        return anatomical_entity, created
    except AnatomicalEntityMeta.DoesNotExist:
        raise EntityNotFoundException(f"Anatomical entity meta not found for URI: {ontology_uri}")


def convert_anatomical_entity_to_specific_type(entity_meta, target_model):
    """
    Convert an AnatomicalEntityMeta instance to a more specific subclass type (Layer or Region).
    Attempts to delete the original instance and create the new specific instance atomically.
    """
    defaults = {'name': entity_meta.name, 'ontology_uri': entity_meta.ontology_uri}

    try:
        with transaction.atomic():
            # Delete the anatomical entity meta in the incorrect type
            entity_meta.delete()
            # Create a new anatomical entity in the new specific type
            specific_entity, created = target_model.objects.get_or_create(
                ontology_uri=entity_meta.ontology_uri,
                defaults=defaults
            )
            return specific_entity, created
    except IntegrityError as e:
        raise IntegrityError(
            f"Failed to convert AnatomicalEntityMeta to {target_model.__name__} due to integrity error: {e}")
