# Generated by Django 4.1.4 on 2024-07-10 14:46

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("composer", "0056_rename_layer_ae_meta_layer_ae_meta_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="layer",
            name="ae_meta",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="layer_meta",
                to="composer.anatomicalentitymeta",
            ),
        ),
        migrations.AlterField(
            model_name="region",
            name="ae_meta",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="region_meta",
                to="composer.anatomicalentitymeta",
            ),
        ),
    ]
