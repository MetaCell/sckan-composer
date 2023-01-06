# Generated by Django 4.1.4 on 2023-01-06 09:37

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("composer", "0026_remove_provenance_uri_provenance_pmcid_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="Doi",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("doi", models.CharField(max_length=200)),
                (
                    "connectivity_statement",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="composer.connectivitystatement",
                    ),
                ),
            ],
            options={
                "verbose_name_plural": "DOIs",
                "ordering": ["doi"],
            },
        ),
    ]
