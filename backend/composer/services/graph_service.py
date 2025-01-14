from typing import List
from django.apps import apps

JOURNEY_DELIMITER = '\\'


def generate_paths(origins, vias, destinations):
    paths = []
    # Calculate the total number of layers, including origins and destinations
    destination_layer = max([via.order for via in vias] + [0]) + 2 if vias else 1

    # Handle direct connections from origins to destinations
    for origin in origins:
        for destination in destinations:
            # Directly use pre-fetched 'from_entities' without triggering additional queries
            if origin in destination.from_entities.all() or (not destination.from_entities.exists() and len(vias) == 0):
                for dest_entity in destination.anatomical_entities.all():
                    paths.append([(str(origin.id), origin.name, 0), (str(dest_entity.id), dest_entity.name, destination_layer)])

    # Handle connections involving vias
    if vias:
        for origin in origins:
            # Generate paths through vias for each origin
            paths.extend(create_paths_from_origin(origin, vias, destinations, [(str(origin.id), origin.name, 0)], destination_layer))

    # Remove duplicates from the generated paths
    unique_paths = [list(path) for path in set(tuple(path) for path in paths)]

    return unique_paths


def create_paths_from_origin(origin, vias, destinations, current_path, destination_layer):
    # Base case: if there are no more vias to process
    if not vias:
        # Generate direct connections from the current path to destinations
        return [current_path + [(str(dest_entity.id), dest_entity.name, destination_layer)] for dest in destinations
                for dest_entity in dest.anatomical_entities.all()
                if current_path[-1][1] in list(
                a.name for a in dest.from_entities.all()) or not dest.from_entities.exists()]

    new_paths = []
    for idx, current_via in enumerate(vias):
        # Determine the layer of the current via
        via_layer = current_via.order + 1
        # This checks if the last node in the current path is one of the nodes that can lead to the current via.
        # In other words, it checks if there is a valid connection
        # from the last node in the current path to the current via.
        if (current_path[-1][1] in list(a.name for a in current_via.from_entities.all())
                or (not current_via.from_entities.exists() and current_path[-1][2] == via_layer - 1)):
            for entity in current_via.anatomical_entities.all():
                # Build new sub-paths including the current via entity
                new_sub_path = current_path + [(str(entity.id), entity.name, via_layer)]
                # Recursively call to build paths from the next vias
                new_paths.extend(create_paths_from_origin(origin, vias[idx + 1:], destinations,
                                                          new_sub_path, destination_layer))

                # Check for direct connections to destinations from the current via
                for dest in destinations:
                    for dest_entity in dest.anatomical_entities.all():
                        if entity.name in list(a.name for a in dest.from_entities.all()):
                            # Add path to destinations directly from the current via
                            new_paths.append(new_sub_path + [(str(dest_entity.id), dest_entity.name, destination_layer)])
    
    return new_paths


def consolidate_paths(paths):
    merges_made = True

    while merges_made:
        merges_made = False
        consolidated = []
        used_indices = set()

        for i, path in enumerate(paths):
            if i in used_indices:
                continue

            merged_path = path
            for j, other_path in enumerate(paths):
                if i != j and j not in used_indices and can_merge(path, other_path):
                    merged_path = merge_paths(merged_path, other_path)
                    used_indices.add(j)
                    merges_made = True

            consolidated.append(merged_path)
            used_indices.add(i)

        paths = consolidated + [paths[i] for i in range(len(paths)) if i not in used_indices]

    return paths


def can_merge(path1, path2):
    # Ensure paths are of the same length
    if len(path1) != len(path2):
        return False

    differences = 0
    for (p1_id, p1, layer1), (p2_id, p2, layer2) in zip(path1, path2):
        # Split nodes into individual entities
        p1_entities = set(p1.split(JOURNEY_DELIMITER))
        p2_entities = set(p2.split(JOURNEY_DELIMITER))

        # Only consider merging if the layers are the same
        if layer1 == layer2:
            # Check if the entities differ and are not subsets of each other
            if p1_entities != p2_entities and not p1_entities.issubset(p2_entities) and not p2_entities.issubset(
                    p1_entities):
                differences += 1
                if differences > 1:
                    return False
        else:
            # If layers are different and entities are not identical, it's a difference
            if p1_entities != p2_entities:
                return False

    # Only allow merging if there is exactly one difference and it occurs in the same layer
    return differences <= 1


def merge_paths(path1, path2):
    merged_path = []
    for (p1_id, p1, layer1), (p2_id, p2, layer2) in zip(path1, path2):
        if p1 == p2 and layer1 == layer2:
            merged_path.append((p1_id, p1, layer1))
        else:
            p1_ids = str(p1_id).split(JOURNEY_DELIMITER)
            p2_ids = str(p2_id).split(JOURNEY_DELIMITER)
            p1_nodes = p1.split(JOURNEY_DELIMITER)
            p2_nodes = p2.split(JOURNEY_DELIMITER)
            merged_nodes = set(p1_nodes + p2_nodes)
            merged_nodes_dict = {}
            for i in range(len(p1_nodes)):
                merged_nodes_dict[p1_nodes[i]] = p1_ids[i]
            for i in range(len(p2_nodes)):
                merged_nodes_dict[p2_nodes[i]] = p2_ids[i]
            
            sorted_merged_nodes = sorted(merged_nodes)
            sorted_merged_nodes_id = [merged_nodes_dict[node] for node in sorted_merged_nodes]  ## also set the node ids in the same order
            merged_path.append((JOURNEY_DELIMITER.join(sorted_merged_nodes_id), JOURNEY_DELIMITER.join(sorted_merged_nodes), layer1))
    return merged_path


def compile_journey(connectivity_statement) -> List[str]:
    """
   Generates a string of descriptions of journey paths for a given connectivity statement.

   Args:
       connectivity_statement: The connectivity statement containing origins, vias, and destinations.

   Returns:
       A string with each journey path description on a new line.
   """
    # Extract origins, vias, and destinations from the connectivity statement
    Via = apps.get_model('composer', 'Via')
    Destination = apps.get_model('composer', 'Destination')
    Origin = apps.get_model('composer', 'AnatomicalEntity')

    vias = list(Via.objects.filter(connectivity_statement__id=connectivity_statement.id))
    destinations = list(Destination.objects.filter(connectivity_statement__id=connectivity_statement.id))
    origins = list(Origin.objects.filter(
        origins_relations__id=connectivity_statement.id).distinct())

    # Generate all paths and then consolidate them
    all_paths2 = generate_paths(origins, vias, destinations)
    consolidated_paths = consolidate_paths(all_paths2)
    return consolidated_paths


def get_journey_path_from_consolidated_paths(consolidated_paths):
    journey_paths = [[((node[1].replace(JOURNEY_DELIMITER, ' or '), node[2]) if (
        node[2] == 0 or path.index(node) == len(path) - 1) else (
        node[1].replace(JOURNEY_DELIMITER, ', '), node[2])) for node in path] for path in consolidated_paths]
    return journey_paths


def build_journey_description(consolidated_paths, connectivity_statement):
    journey_paths = get_journey_path_from_consolidated_paths(
        consolidated_paths)
    Via = apps.get_model('composer', 'Via')
    vias = list(Via.objects.filter(
        connectivity_statement=connectivity_statement))

    # Create sentences for each journey path
    journey_descriptions = []
    for path in journey_paths:
        origin_names = path[0][0]
        destination_names = path[-1][0]
        via_names = ' via '.join([node for node, layer in path if 0 < layer < len(vias) + 1])

        if via_names:
            sentence = f"from {origin_names} to {destination_names} via {via_names}"
        else:
            sentence = f"from {origin_names} to {destination_names}"

        journey_descriptions.append(sentence)
    return journey_descriptions


def build_journey_entities(consolidated_paths, connectivity_statement):
    entities = []
    Via = apps.get_model('composer', 'Via')
    vias = list(Via.objects.filter(
        connectivity_statement=connectivity_statement))

    for path in consolidated_paths:
        origin_splits = path[0][0].split(JOURNEY_DELIMITER)
        destination_splits = path[-1][0].split(JOURNEY_DELIMITER)
        entity = {
            'origins': [
                {'label': path[0][1].split(JOURNEY_DELIMITER)[i], 'id': path[0][0].split(JOURNEY_DELIMITER)[i]} for i in range(len(origin_splits))
            ],
            'destinations': [
                {'label': path[-1][1].split(JOURNEY_DELIMITER)[i], 'id': path[-1][0].split(JOURNEY_DELIMITER)[i]} for i in range(len(destination_splits))
            ],
            'vias': [{'label': node, 'id': node_id} for node_id, node, layer in path if 0 < layer < len(vias) + 1]
        }
        entities.append(entity)
    return entities


def recompile_journey_path(instance):
    instance.journey_path = compile_journey(instance)
    instance.save(update_fields=["journey_path"])
