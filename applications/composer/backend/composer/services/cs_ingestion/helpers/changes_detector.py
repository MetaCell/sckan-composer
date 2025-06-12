import rdflib
from neurondm import orders

from composer.models import AnatomicalEntity
from composer.services.cs_ingestion.helpers.common_helpers import VALIDATION_ERRORS, SPECIES, PROVENANCE, ID, \
    FORWARD_CONNECTION, ORIGINS, VIAS, DESTINATIONS
from composer.services.cs_ingestion.models import ValidationErrors


def has_changes(connectivity_statement, statement, defaults):
    validation_errors = statement.get(VALIDATION_ERRORS, ValidationErrors())

    for field, value in defaults.items():
        if field == 'state':
            continue

        if field in ['sex', 'functional_circuit_role', 'phenotype', 'projection_phenotype', 'population']:
            current_fk_id = getattr(connectivity_statement, f'{field}_id')
            new_fk_id = value.id if value is not None else None
            if current_fk_id != new_fk_id:
                return True
        else:
            # For simple fields, directly compare the values
            if getattr(connectivity_statement, field) != value:
                return True

    # Check for changes in species
    current_species = set(species.ontology_uri for species in connectivity_statement.species.all())
    new_species = set(uri for uri in statement.get(SPECIES, []) if uri not in validation_errors.species)
    if current_species != new_species:
        return True

    # Check for changes in provenance
    current_provenance = set(provenance.uri for provenance in connectivity_statement.provenance_set.all())
    new_provenance = set(statement.get(PROVENANCE) or [statement[ID]])
    if current_provenance != new_provenance:
        return True

    # Check for changes in forward_connection
    current_forward_connections = set(
        connection.reference_uri for connection in connectivity_statement.forward_connection.all())
    new_forward_connections = set(
        uri for uri in statement.get(FORWARD_CONNECTION, []) if uri not in validation_errors.forward_connection)
    if current_forward_connections != new_forward_connections:
        return True

    # Check for changes in origins
    current_origins = set(
        get_anatomical_entity_identifier_composer(origin) for origin in connectivity_statement.origins.all())
    new_origins = set(
        get_anatomical_entity_identifier_neurondm(uri) for uri in statement[ORIGINS].anatomical_entities if
        uri not in validation_errors.entities)
    if current_origins != new_origins:
        return True

    # Check for changes in vias
    current_vias = [
        {
            'anatomical_entities': set(
                get_anatomical_entity_identifier_composer(ae) for ae in via.anatomical_entities.all()),
            'from_entities': set(get_anatomical_entity_identifier_composer(ae) for ae in via.from_entities.all())
        }
        for via in connectivity_statement.via_set.order_by('order').all()
    ]
    new_vias = statement[VIAS]

    if len(current_vias) != len(new_vias):
        return True

    for current_via, new_via in zip(current_vias, new_vias):
        new_via_anatomical_entities = set(
            get_anatomical_entity_identifier_neurondm(uri) for uri in new_via.anatomical_entities if
            uri not in validation_errors.entities)

        new_via_from_entities = set(get_anatomical_entity_identifier_neurondm(uri) for uri in new_via.from_entities if
                                    uri not in validation_errors.entities)

        if (new_via_anatomical_entities != current_via['anatomical_entities'] or
                new_via_from_entities != current_via['from_entities']):
            return True

    # Check for changes in destinations
    current_destinations = connectivity_statement.destinations.all()
    new_destinations = statement[DESTINATIONS]

    if len(current_destinations) != len(new_destinations):
        return True

    # We may need to change this algorithm when multi-destination is supported by neurondm

    current_destinations_anatomical_entities = set(
        get_anatomical_entity_identifier_composer(uri) for destination in current_destinations
        for uri in destination.anatomical_entities.all()
    )
    current_destinations_from_entities = set(
        get_anatomical_entity_identifier_composer(uri) for destination in current_destinations
        for uri in destination.from_entities.all()
    )

    new_destinations_anatomical_entities = {get_anatomical_entity_identifier_neurondm(uri) for new_dest in
                                            statement[DESTINATIONS] for uri in
                                            new_dest.anatomical_entities if uri not in validation_errors.entities}

    new_destinations_from_entities = {get_anatomical_entity_identifier_neurondm(uri) for new_dest in
                                      statement[DESTINATIONS] for uri in new_dest.from_entities if
                                      uri not in validation_errors.entities}

    if (current_destinations_anatomical_entities != new_destinations_anatomical_entities or
            current_destinations_from_entities != new_destinations_from_entities):
        return True

    # Not checking the Notes because they are kept
    return False


def get_anatomical_entity_identifier_composer(entity: AnatomicalEntity):
    if entity.region_layer:
        layer_uri = entity.region_layer.layer.ontology_uri
        region_uri = entity.region_layer.region.ontology_uri
        return f"{region_uri}:{layer_uri}"
    return entity.simple_entity.ontology_uri


def get_anatomical_entity_identifier_neurondm(entity: rdflib.term):
    if isinstance(entity, orders.rl):
        return f"{str(entity.region)}:{str(entity.layer)}"
    return str(entity)
