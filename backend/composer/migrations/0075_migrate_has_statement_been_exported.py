# Generated by Django 4.1.4 on 2025-02-05 08:51

from django.db import migrations
from django.db.models import Q
from composer.enums import CSState


def migrate_has_statement_been_exported(apps, schema_editor):
    ConnectivityStatement = apps.get_model("composer", "ConnectivityStatement")

    # Get all connectivity statements associated with an export batch
    statements_to_update = ConnectivityStatement.objects.filter(
        Q(exportbatch__isnull=False) | Q(state=CSState.EXPORTED)
    )

    # Perform a bulk update to set `has_statement_been_exported = True`
    statements_to_update.update(has_statement_been_exported=True)

class Migration(migrations.Migration):

    dependencies = [
        ("composer", "0074_connectivitystatement_has_statement_been_exported"),
    ]

    operations = [
        migrations.RunPython(migrate_has_statement_been_exported),
    ]
