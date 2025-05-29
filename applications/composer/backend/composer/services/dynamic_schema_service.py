from composer.enums import RelationshipType
from composer.models import Relationship


def inject_dynamic_relationship_schema(schema):
    """
    Dynamically injects `statement_triples` field into ConnectivityStatement schema
    based on Relationship definitions, including enums for select types.
    """

    relationships = Relationship.objects.prefetch_related("triples").all()


    dynamic_properties = {}
    for rel in relationships:
        field = {
            "title": rel.title,
            "type": ["string", "null"],  # default type
        }

        if rel.type == RelationshipType.TEXT:
            field["type"] = "string"

        elif rel.type in [RelationshipType.SINGLE, RelationshipType.MULTI]:
            # Prepare enums and names from related Triples
            enum_values = [triple.id for triple in rel.triples.all()]
            enum_names = [triple.name for triple in rel.triples.all()]
            field["enum"] = enum_values
            field["enumNames"] = enum_names

            if rel.type == RelationshipType.SINGLE:
                field["type"] = ["string", "null"]
            else:  # MULTI
                field = {
                    "title": rel.title,
                    "type": "array",
                    "items": {
                        "type": "string",
                        "enum": enum_values,
                        "enumNames": enum_names,
                    }
                }

        dynamic_properties[rel.predicate_name] = field

    # Inject under statement_triples in ConnectivityStatement schema
    cs_schema = schema.get("ConnectivityStatement", {}).get("schema", {})
    cs_schema.setdefault("properties", {}).setdefault("statement_triples", {
        "type": "object",
        "properties": {}
    })["properties"].update(dynamic_properties)
