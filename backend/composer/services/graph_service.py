def generate_paths(origins, vias, destinations):
    paths = []

    # If there are no vias, handle direct connections from origins to destinations
    if not vias:
        for origin in origins:
            for destination in destinations:
                if origin in destination.from_entities.all() or not destination.from_entities.exists():
                    # Assuming destination.anatomical_entities.all() returns AnatomicalEntity objects
                    for dest_entity in destination.anatomical_entities.all():
                        paths.append([origin.name, dest_entity.name])
    else:
        # Handle connections involving vias
        for origin in origins:
            paths.extend(create_paths_from_origin(origin, vias, destinations, [origin.name]))

    return paths


def create_paths_from_origin(origin, vias, destinations, current_path):
    if not vias:
        # If there are no more vias, connect directly to destinations
        return [current_path + [dest_entity.name] for dest in destinations for dest_entity in
                dest.anatomical_entities.all()
                if
                current_path[-1] in list(a.name for a in dest.from_entities.all()) or not dest.from_entities.exists()]

    # Current via layer to process
    current_via = vias[0]

    new_paths = []
    # Check direct connections to destinations before proceeding to next via
    for dest in destinations:
        for dest_entity in dest.anatomical_entities.all():
            if current_path[-1] in list(a.name for a in dest.from_entities.all()):
                new_paths.append(current_path + [dest_entity.name])

    for entity in current_via.anatomical_entities.all():
        if current_path[-1] in list(
                a.name for a in current_via.from_entities.all()) or not current_via.from_entities.exists():
            # Proceed to next layer or to destinations
            new_paths.extend(create_paths_from_origin(origin, vias[1:], destinations, current_path + [entity.name]))

    return new_paths


def consolidate_paths(paths):
    # Flag to track if any merges happened in the current iteration
    merges_made = True

    while merges_made:
        merges_made = False
        consolidated = []
        used_indices = set()

        for i, path in enumerate(paths):
            if i in used_indices:
                continue

            for j, other_path in enumerate(paths):
                if i != j and j not in used_indices and can_merge(path, other_path):
                    # Merge paths and mark indices as used
                    path = merge_paths(path, other_path)
                    used_indices.add(j)
                    merges_made = True

            consolidated.append(path)

        paths = consolidated

    return consolidated


def can_merge(path1, path2):
    if len(path1) != len(path2):
        return False

    difference_count = 0
    for node1, node2 in zip(path1, path2):
        if node1 != node2:
            difference_count += 1
            if difference_count > 1:
                return False

    return difference_count == 1


def merge_paths(path1, path2):
    merged_path = []
    for node1, node2 in zip(path1, path2):
        if node1 == node2:
            merged_path.append(node1)
        else:
            # Combine different nodes and ensure no duplicates
            merged_nodes = set(node1.split(", ") + node2.split(", "))
            merged_path.append(", ".join(sorted(merged_nodes)))

    return merged_path
