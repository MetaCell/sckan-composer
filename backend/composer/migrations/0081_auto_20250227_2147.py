# Generated by Django 4.2.19 on 2025-02-27 20:47

from django.db import migrations


def set_reference_uri_to_null_for_statements_without_population(apps, schema_editor):
    """
    Sets reference_uri to NULL for all ConnectivityStatements that do not have a population.
    """
    ConnectivityStatement = apps.get_model("composer", "ConnectivityStatement")

    # Bulk update: Set reference_uri to NULL where population is missing
    ConnectivityStatement.objects.filter(population__isnull=True).update(reference_uri=None)



class Migration(migrations.Migration):

    dependencies = [
        ("composer", "0080_auto_20250227_1851"),
    ]

    operations = [
        migrations.RunPython(set_reference_uri_to_null_for_statements_without_population),
    ]