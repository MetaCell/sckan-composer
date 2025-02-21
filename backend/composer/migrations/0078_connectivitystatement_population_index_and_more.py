# Generated by Django 4.2.19 on 2025-02-21 20:31

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("composer", "0077_remove_connectivitystatement_state_valid_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="connectivitystatement",
            name="population_index",
            field=models.PositiveIntegerField(
                blank=True,
                help_text="Index of this statement within its assigned population.",
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="populationset",
            name="last_used_index",
            field=models.PositiveIntegerField(
                default=0,
                help_text="Tracks the last assigned population index to ensure sequential numbering.",
            ),
        ),
    ]
