def generate_paths(origins, vias, destinations):
    paths = []
    # Calculate the total number of layers, including origins and destinations
    number_of_layers = len(vias) + 2 if vias else 2

    # Handle direct connections from origins to destinations
    for origin in origins:
        for destination in destinations:
            # Check if there's a direct connection between the origin and the destination
            if origin in destination.from_entities.all() or (not destination.from_entities.exists() and len(vias) == 0):
                for dest_entity in destination.anatomical_entities.all():
                    # Add path with origin and destination at their respective layers
                    paths.append([(origin.name, 0), (dest_entity.name, number_of_layers - 1)])

    # Handle connections involving vias
    if vias:
        for origin in origins:
            # Generate paths through vias for each origin
            paths.extend(create_paths_from_origin(origin, vias, destinations, [(origin.name, 0)], number_of_layers))

    # Remove duplicates from the generated paths
    unique_paths = [list(path) for path in set(tuple(path) for path in paths)]

    return unique_paths


def create_paths_from_origin(origin, vias, destinations, current_path, number_of_layers):
    # Base case: if there are no more vias to process
    if not vias:
        # Generate direct connections from the current path to destinations
        return [current_path + [(dest_entity.name, number_of_layers - 1)] for dest in destinations
                for dest_entity in dest.anatomical_entities.all()
                if current_path[-1][0] in list(
                a.name for a in dest.from_entities.all()) or not dest.from_entities.exists()]

    new_paths = []
    for idx, current_via in enumerate(vias):
        # Determine the layer of the current via
        via_layer = current_via.order + 1
        # This checks if the last node in the current path is one of the nodes that can lead to the current via.
        # In other words, it checks if there is a valid connection
        # from the last node in the current path to the current via.
        if current_path[-1][0] in list(
                a.name for a in current_via.from_entities.all()) or not current_via.from_entities.exists():
            for entity in current_via.anatomical_entities.all():
                # Build new sub-paths including the current via entity
                new_sub_path = current_path + [(entity.name, via_layer)]
                # Recursively call to build paths from the next vias
                new_paths.extend(
                    create_paths_from_origin(origin, vias[idx + 1:], destinations, new_sub_path, number_of_layers))

                # Check for direct connections to destinations from the current via
                for dest in destinations:
                    for dest_entity in dest.anatomical_entities.all():
                        if entity.name in list(a.name for a in dest.from_entities.all()):
                            # Add path to destinations directly from the current via
                            new_paths.append(new_sub_path + [(dest_entity.name, number_of_layers - 1)])

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

        paths = [p for i, p in enumerate(consolidated) if i not in used_indices]

    return paths


def can_merge(path1, path2):
    # Ensure paths are of the same length
    if len(path1) != len(path2):
        return False

    differences = 0
    for (p1, layer1), (p2, layer2) in zip(path1, path2):
        # Split nodes into individual entities
        p1_entities = set(p1.split(", "))
        p2_entities = set(p2.split(", "))

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
    return differences == 1


def merge_paths(path1, path2):
    merged_path = []
    for (p1, layer1), (p2, layer2) in zip(path1, path2):
        if p1 == p2 and layer1 == layer2:
            merged_path.append((p1, layer1))
        else:
            merged_nodes = set(p1.split(", ") + p2.split(", "))
            merged_path.append((", ".join(sorted(merged_nodes)), layer1))
    return merged_path
