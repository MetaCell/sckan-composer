# Generated by Django 4.1.4 on 2023-05-31 14:29

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("composer", "0012_auto_20230502_1630"),
    ]

    operations = [
        migrations.AlterField(
            model_name="connectivitystatement",
            name="phenotype",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                to="composer.phenotype",
                verbose_name="Phenotype",
            ),
        ),
    ]