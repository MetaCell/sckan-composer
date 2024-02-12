# Generated by Django 4.1.4 on 2024-02-12 16:20

from django.db import migrations


def change_not_specified_to_null(apps, schema_editor):
    ConnectivityStatement = apps.get_model('composer', 'ConnectivityStatement')
    ConnectivityStatement.objects.filter(laterality='UNKNOWN').update(laterality=None)
    ConnectivityStatement.objects.filter(projection='UNKNOWN').update(projection=None)
    ConnectivityStatement.objects.filter(circuit_type='UNKNOWN').update(circuit_type=None)


class Migration(migrations.Migration):
    dependencies = [
        ("composer", "0035_alter_connectivitystatement_circuit_type_and_more"),
    ]

    operations = [
        # CONVERT UNKNOWN TO NULL
        migrations.RunPython(change_not_specified_to_null),
    ]
