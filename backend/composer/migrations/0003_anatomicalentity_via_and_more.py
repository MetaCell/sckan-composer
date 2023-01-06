# Generated by Django 4.1.4 on 2022-12-30 08:27

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("composer", "0002_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="AnatomicalEntity",
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
                ("name", models.CharField(max_length=200, unique=True)),
                ("ontology_uri", models.URLField()),
            ],
            options={
                "verbose_name_plural": "Anatomical Entities",
                "ordering": ["name"],
            },
        ),
        migrations.CreateModel(
            name="Via",
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
                ("ordering", models.IntegerField()),
                (
                    "anatomical_entity",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.DO_NOTHING,
                        to="composer.anatomicalentity",
                        verbose_name="Anatomical Entity",
                    ),
                ),
                (
                    "connectivity_statement",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="composer.connectivitystatement",
                        verbose_name="Connectivity Statement",
                    ),
                ),
            ],
            options={
                "verbose_name_plural": "Via",
                "ordering": ["ordering"],
            },
        ),
        migrations.AddField(
            model_name="connectivitystatement",
            name="destination",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.DO_NOTHING,
                related_name="destination",
                to="composer.anatomicalentity",
                verbose_name="Destination",
            ),
        ),
        migrations.AddField(
            model_name="connectivitystatement",
            name="origin",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.DO_NOTHING,
                related_name="origin",
                to="composer.anatomicalentity",
                verbose_name="Origin",
            ),
        ),
    ]
