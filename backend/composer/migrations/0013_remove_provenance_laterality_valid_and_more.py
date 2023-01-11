# Generated by Django 4.1.4 on 2023-01-03 10:21

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("composer", "0012_connectivitystatement_destination_type"),
    ]

    operations = [
        migrations.RemoveConstraint(
            model_name="provenance",
            name="laterality_valid",
        ),
        migrations.RemoveConstraint(
            model_name="provenance",
            name="circuit_type_valid",
        ),
        migrations.AlterField(
            model_name="connectivitystatement",
            name="destination_type",
            field=models.CharField(
                choices=[
                    ("Axon sensory ending", "Axon Se"),
                    ("Axon terminal", "Axon T"),
                    ("Axon sensory terminal", "Axon St"),
                ],
                default="Axon sensory ending",
                max_length=25,
                null=True,
            ),
        ),
        migrations.AlterField(
            model_name="note",
            name="connectivity_statement",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="notes",
                to="composer.connectivitystatement",
                verbose_name="Connectivity Statement",
            ),
        ),
        migrations.AlterField(
            model_name="note",
            name="provenance",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.DO_NOTHING,
                related_name="notes",
                to="composer.provenance",
                verbose_name="Provenance",
            ),
        ),
        migrations.AlterField(
            model_name="provenance",
            name="circuit_type",
            field=models.CharField(
                choices=[
                    ("Sensory", "Sensory"),
                    ("Motor", "Motor"),
                    ("Instrinsic", "Intrinsic"),
                    ("Projection", "Projection"),
                    ("Anaxonic", "Anaxonic"),
                    ("Not specified", "Unknown"),
                ],
                default="Not specified",
                max_length=20,
            ),
        ),
        migrations.AlterField(
            model_name="provenance",
            name="laterality",
            field=models.CharField(
                choices=[
                    ("Ipsi", "Ipsi"),
                    ("Contrat", "Contrat"),
                    ("Bilateral", "Bi"),
                    ("Not specified", "Unknown"),
                ],
                default="Not specified",
                max_length=20,
            ),
        ),
        migrations.AlterField(
            model_name="via",
            name="connectivity_statement",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="path_set",
                to="composer.connectivitystatement",
                verbose_name="Connectivity Statement",
            ),
        ),
        migrations.AddConstraint(
            model_name="provenance",
            constraint=models.CheckConstraint(
                check=models.Q(
                    (
                        "laterality__in",
                        ["Ipsi", "Contrat", "Bilateral", "Not specified"],
                    )
                ),
                name="laterality_valid",
            ),
        ),
        migrations.AddConstraint(
            model_name="provenance",
            constraint=models.CheckConstraint(
                check=models.Q(
                    (
                        "circuit_type__in",
                        [
                            "Sensory",
                            "Motor",
                            "Instrinsic",
                            "Projection",
                            "Anaxonic",
                            "Not specified",
                        ],
                    )
                ),
                name="circuit_type_valid",
            ),
        ),
    ]
