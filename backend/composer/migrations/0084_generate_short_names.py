from django.db import migrations
from .helpers.short_name_generator import generate_connectivity_statement_short_name
from composer.enums import CSState


def generate_short_names(apps, schema_editor):
    """
    Generate short names for exported connectivity statements that don't have them.
    """
    ConnectivityStatement = apps.get_model("composer", "ConnectivityStatement")

    # Get all exported connectivity statements without short names (from composer)
    statements = ConnectivityStatement.objects.filter(
        state=CSState.EXPORTED,
        short_name__isnull=True,
        curie_id__isnull=True,
    ).select_related("population")

    for statement in statements:
        short_name = generate_connectivity_statement_short_name(statement)
        if short_name:
            statement.short_name = short_name
            statement.save(update_fields=["short_name"])


class Migration(migrations.Migration):

    dependencies = [
        ("composer", "0083_connectivitystatement_short_name"),
    ]

    operations = [
        migrations.RunPython(generate_short_names),
    ]
