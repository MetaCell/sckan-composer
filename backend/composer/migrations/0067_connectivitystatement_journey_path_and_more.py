# Generated by Django 4.1.4 on 2025-01-20 12:33

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("composer", "0066_connectivitystatement_curie_id"),
    ]

    operations = [
        migrations.AddField(
            model_name="connectivitystatement",
            name="journey_path",
            field=models.JSONField(blank=True, null=True),
        )
    ]
