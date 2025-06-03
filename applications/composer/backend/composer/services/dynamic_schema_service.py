from composer.enums import RelationshipType
from composer.models import Relationship


from collections import OrderedDict

def inject_dynamic_relationship_schema(schema):
    """
    Adds dynamic `statement_triples` fields into ConnectivityStatement schema.
    """

    try:
        relationships = Relationship.objects.order_by("order").all()
    except Exception:
        return

    dynamic_properties = OrderedDict()
    for rel in relationships:
        field = {
            "title": rel.title,
        }

        if rel.type == RelationshipType.TEXT:
            field["type"] = "string"

        elif rel.type == RelationshipType.SINGLE:
            field.update({
                "type": ["string", "null"],
            })

        elif rel.type == RelationshipType.MULTI:
            field.update({
                "type": "array",
                "items": {
                    "type": "object",
                }
            })

        dynamic_properties[rel.predicate_name] = field

    cs_schema = schema.get("ConnectivityStatement", {}).get("schema", {})
    cs_schema.setdefault("properties", {}).setdefault("statement_triples", {
        "type": "object",
        "properties": OrderedDict()
    })["properties"] = dynamic_properties

