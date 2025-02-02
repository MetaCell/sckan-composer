# Generated by Django 4.1.4 on 2024-07-10 18:12

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("composer", "0057_alter_layer_ae_meta_alter_region_ae_meta"),
    ]

    operations = [
        migrations.RemoveConstraint(
            model_name="connectivitystatement",
            name="projection_valid",
        ),
        migrations.AlterField(
            model_name="anatomicalentityintersection",
            name="layer",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="layer_intersection",
                to="composer.anatomicalentitymeta",
            ),
        ),
        migrations.AlterField(
            model_name="anatomicalentityintersection",
            name="region",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="region_intersection",
                to="composer.anatomicalentitymeta",
            ),
        ),
    ]
