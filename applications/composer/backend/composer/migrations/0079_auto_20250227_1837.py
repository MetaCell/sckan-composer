# Migration 1: Reset has_statement_been_exported
from django.db import migrations

def reset_has_statement_been_exported(apps, schema_editor):
    """
    Resets `has_statement_been_exported` for statements that have no population.
    """
    ConnectivityStatement = apps.get_model("composer", "ConnectivityStatement")

    # Reset `has_statement_been_exported`
    ConnectivityStatement.objects.filter(
        has_statement_been_exported=True,
        population__isnull=True
    ).update(has_statement_been_exported=False)

class Migration(migrations.Migration):

    dependencies = [
        ("composer", "0078_connectivitystatement_population_index_and_more"),
    ]

    operations = [
        migrations.RunPython(reset_has_statement_been_exported),
    ]
