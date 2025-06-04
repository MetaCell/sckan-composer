from composer.enums import RelationshipType
from composer.models import Relationship
from collections import OrderedDict

def inject_dynamic_relationship_schema(schema):
    """
    Adds dynamic `statement_triples` fields into ConnectivityStatement schema and uiSchema,
    respecting Relationship.order for both schema key order and uiSchema rendering order.
    """

    try:
        relationships = Relationship.objects.order_by("order").all()
    except Exception:
        return

    dynamic_properties = OrderedDict()
    ui_order = []

    for rel in relationships:
        rel_id = str(rel.id)
        ui_order.append(rel_id)

        field = {
            "title": rel.title,
        }

        if rel.type == RelationshipType.TEXT:
            field["type"] = "string"
        elif rel.type == RelationshipType.SINGLE:
            field["type"] = ["string", "null"]
        elif rel.type == RelationshipType.MULTI:
            field["type"] = "array"
            field["items"] = {"type": "object"}

        dynamic_properties[rel_id] = field

    # === Inject into schema ===
    cs_schema = schema.get("ConnectivityStatement", {}).get("schema", {})
    cs_schema.setdefault("properties", {})["statement_triples"] = {
        "type": "object",
        "properties": dynamic_properties
    }

    # === Inject into uiSchema ===
    cs_ui_schema = schema.get("ConnectivityStatement", {}).get("uiSchema", {})
    cs_ui_schema.setdefault("statement_triples", {})["ui:order"] = ui_order