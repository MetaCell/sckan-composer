# Generated by Django 4.1.4 on 2024-12-18 08:28

from django.db import migrations
from .helpers.journey_computation import get_compile_journey_for_migration

def update_journey_fields(apps, schema_editor):
    ConnectivityStatement = apps.get_model('composer', 'ConnectivityStatement')
    for cs in ConnectivityStatement.objects.all():
        cs.journey_path = get_compile_journey_for_migration(cs)
        cs.save(update_fields=["journey_path"])


class Migration(migrations.Migration):

    dependencies = [
        ("composer", "0066_connectivitystatement_curie_id_and_add_journey_path"),
    ]

    operations = [
        migrations.RunPython(update_journey_fields),
    ]
