# Generated by Django 4.1.4 on 2022-12-29 15:53

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django_fsm


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("composer", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="AnsDivision",
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
            ],
            options={
                "verbose_name_plural": "ANS Divisions",
                "ordering": ["name"],
            },
        ),
        migrations.CreateModel(
            name="Specie",
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
            ],
            options={
                "verbose_name_plural": "Species",
                "ordering": ["name"],
            },
        ),
        migrations.CreateModel(
            name="Provenance",
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
                ("title", models.CharField(max_length=200)),
                ("description", models.TextField()),
                ("pmid", models.BigIntegerField()),
                ("pmcid", models.BigIntegerField()),
                ("uri", models.URLField()),
                (
                    "laterality",
                    models.CharField(
                        choices=[
                            ("1", "Ipsi"),
                            ("2", "Contrat"),
                            ("3", "Bilateral"),
                            ("4", "Not specified"),
                        ],
                        default="4",
                        max_length=1,
                    ),
                ),
                (
                    "circuit_type",
                    models.CharField(
                        choices=[
                            ("1", "Sensory"),
                            ("2", "Motor"),
                            ("3", "Instrinsic"),
                            ("4", "Projection"),
                            ("5", "Anaxonic"),
                            ("6", "Not specified"),
                        ],
                        default="6",
                        max_length=1,
                    ),
                ),
                ("biological_sex", models.CharField(max_length=200, null=True)),
                ("apinatomy_model", models.CharField(max_length=200, null=True)),
                (
                    "ans_division",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.DO_NOTHING,
                        to="composer.ansdivision",
                        verbose_name="ANS Division",
                    ),
                ),
                (
                    "species",
                    models.ManyToManyField(
                        to="composer.specie", verbose_name="Species"
                    ),
                ),
            ],
            options={
                "verbose_name_plural": "Provenances",
                "ordering": ["title"],
            },
        ),
        migrations.CreateModel(
            name="Profile",
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
                ("isTriageOperator", models.BooleanField(default=False)),
                ("isCurator", models.BooleanField(default=False)),
                ("isReviewer", models.BooleanField(default=False)),
                (
                    "user",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="ConnectivityStatement",
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
                ("knowledge_statement", models.TextField()),
                ("uri", models.URLField()),
                (
                    "state",
                    django_fsm.FSMField(default="open", max_length=50, protected=True),
                ),
                (
                    "provenance",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.DO_NOTHING,
                        to="composer.provenance",
                        verbose_name="Provenance",
                    ),
                ),
            ],
            options={
                "verbose_name_plural": "Connectivity Statements",
                "ordering": ["knowledge_statement"],
            },
        ),
        migrations.AddConstraint(
            model_name="provenance",
            constraint=models.CheckConstraint(
                check=models.Q(("laterality__in", ["1", "2", "3", "4"])),
                name="laterality_valid",
            ),
        ),
        migrations.AddConstraint(
            model_name="provenance",
            constraint=models.CheckConstraint(
                check=models.Q(("circuit_type__in", ["1", "2", "3", "4", "5", "6"])),
                name="circuit_type_valid",
            ),
        ),
    ]
