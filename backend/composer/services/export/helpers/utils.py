def escape_newlines(value):
    return value.replace("\\", "\\\\").replace("\n", "\\n")


def get_connected_from_info(entities):
    connected_from_info = (
        [(entity.name, entity.ontology_uri) for entity in entities] if entities else []
    )
    connected_from_names = "; ".join(name for name, _ in connected_from_info)
    connected_from_uris = "; ".join(uri for _, uri in connected_from_info)
    return connected_from_names, connected_from_uris
