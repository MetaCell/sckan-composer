# Generated by Django 4.1.4 on 2023-10-24 14:27

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        (
            "composer",
            "0027_remove_connectivitystatement_destination_type_valid_and_more",
        ),
    ]

    operations = [
        migrations.AddField(
            model_name="via",
            name="anatomical_entities",
            field=models.ManyToManyField(
                blank=True, related_name="vias", to="composer.anatomicalentity"
            ),
        ),
        migrations.AddField(
            model_name="via",
            name="order",
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name="via",
            name="anatomical_entity",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.DO_NOTHING,
                to="composer.anatomicalentity",
            ),
        ),
    ]
