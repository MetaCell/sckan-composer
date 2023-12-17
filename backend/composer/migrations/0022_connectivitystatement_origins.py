# Generated by Django 4.1.4 on 2023-10-23 15:32

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("composer", "0021_connectivitystatement_forward_connection"),
    ]

    operations = [
        migrations.AddField(
            model_name="connectivitystatement",
            name="origins",
            field=models.ManyToManyField(
                related_name="origins_relations", to="composer.anatomicalentity"
            ),
        ),
    ]
