# Generated by Django 4.1.4 on 2024-07-08 13:40

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("composer", "0054_auto_20240709_0909"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="layer",
            options={"verbose_name": "Layer", "verbose_name_plural": "Layers"},
        ),
        migrations.AlterModelOptions(
            name="region",
            options={"verbose_name": "Region", "verbose_name_plural": "Regions"},
        ),
        migrations.RenameField(
            model_name="anatomicalentityintersection",
            old_name="layer_meta",
            new_name="layer",
        ),
        migrations.RenameField(
            model_name="anatomicalentityintersection",
            old_name="region_meta",
            new_name="region",
        ),
    ]
