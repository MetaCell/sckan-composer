# Generated by Django 4.1.4 on 2024-07-17 14:10

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("composer", "0058_auto_20240717_1550"),
    ]

    operations = [
        migrations.AddConstraint(
            model_name="anatomicalentityintersection",
            constraint=models.UniqueConstraint(
                fields=("layer", "region"), name="unique_layer_region_combination"
            ),
        ),
        migrations.AddConstraint(
            model_name="layer",
            constraint=models.UniqueConstraint(
                fields=("ae_meta",), name="unique_layer_ae_meta"
            ),
        ),
        migrations.AddConstraint(
            model_name="region",
            constraint=models.UniqueConstraint(
                fields=("ae_meta",), name="unique_region_ae_meta"
            ),
        ),
    ]
