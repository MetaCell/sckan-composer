# Generated by Django 4.1.4 on 2024-02-01 13:26

from django.db import migrations, models


def change_not_specified_to_null(apps, schema_editor):
    ConnectivityStatement = apps.get_model('composer', 'ConnectivityStatement')
    ConnectivityStatement.objects.filter(laterality='UNKNOWN').update(laterality=None)
    ConnectivityStatement.objects.filter(projection='UNKNOWN').update(projection=None)
    ConnectivityStatement.objects.filter(circuit_type='UNKNOWN').update(circuit_type=None)


class Migration(migrations.Migration):
    dependencies = [
        ("composer", "0032_alter_connectivitystatement_projection"),
    ]

    operations = [
        # ADD the null=True option to the circuit_type, laterality and projection fields
        migrations.AlterField(
            model_name="connectivitystatement",
            name="circuit_type",
            field=models.CharField(
                choices=[
                    ("SENSORY", "Sensory"),
                    ("MOTOR", "Motor"),
                    ("INTRINSIC", "Intrinsic"),
                    ("PROJECTION", "Projection"),
                    ("ANAXONIC", "Anaxonic"),
                    ("UNKNOWN", "Not specified"),
                ],
                max_length=20,
                null=True,
            ),
        ),
        migrations.AlterField(
            model_name="connectivitystatement",
            name="laterality",
            field=models.CharField(
                choices=[
                    ("RIGHT", "Right"),
                    ("LEFT", "Left"),
                    ("UNKNOWN", "Not specified"),
                ],
                max_length=20,
                null=True,
            ),
        ),
        migrations.AlterField(
            model_name="connectivitystatement",
            name="projection",
            field=models.CharField(
                choices=[
                    ("IPSI", "Ipsilateral"),
                    ("CONTRAT", "Contralateral"),
                    ("BI", "Bilateral"),
                    ("UNKNOWN", "Not specified"),
                ],
                max_length=20,
                null=True,
            ),
        ),
        migrations.AlterField(
            model_name="connectivitystatement",
            name="species",
            field=models.ManyToManyField(
                blank=True, null=True, to="composer.specie", verbose_name="Species"
            ),
        ),

        # CONVERT UNKNOWN TO NULL
        migrations.RunPython(change_not_specified_to_null),


        # Remove the UNKNOWN option from the circuit_type, laterality and projection fields
        migrations.RemoveConstraint(
            model_name="connectivitystatement",
            name="circuit_type_valid",
        ),
        migrations.RemoveConstraint(
            model_name="connectivitystatement",
            name="laterality_valid",
        ),
        migrations.RemoveConstraint(
            model_name="connectivitystatement",
            name="projection_valid",
        ),
        migrations.AlterField(
            model_name="connectivitystatement",
            name="circuit_type",
            field=models.CharField(
                choices=[
                    ("SENSORY", "Sensory"),
                    ("MOTOR", "Motor"),
                    ("INTRINSIC", "Intrinsic"),
                    ("PROJECTION", "Projection"),
                    ("ANAXONIC", "Anaxonic"),
                ],
                max_length=20,
                null=True,
            ),
        ),
        migrations.AlterField(
            model_name="connectivitystatement",
            name="laterality",
            field=models.CharField(
                choices=[("RIGHT", "Right"), ("LEFT", "Left")], max_length=20, null=True
            ),
        ),
        migrations.AlterField(
            model_name="connectivitystatement",
            name="projection",
            field=models.CharField(
                choices=[
                    ("IPSI", "Ipsilateral"),
                    ("CONTRAT", "Contralateral"),
                    ("BI", "Bilateral"),
                ],
                max_length=20,
                null=True,
            ),
        ),
        migrations.AddConstraint(
            model_name="connectivitystatement",
            constraint=models.CheckConstraint(
                check=models.Q(("laterality__in", ["RIGHT", "LEFT"])),
                name="laterality_valid",
            ),
        ),
        migrations.AddConstraint(
            model_name="connectivitystatement",
            constraint=models.CheckConstraint(
                check=models.Q(
                    (
                        "circuit_type__in",
                        ["SENSORY", "MOTOR", "INTRINSIC", "PROJECTION", "ANAXONIC"],
                    )
                ),
                name="circuit_type_valid",
            ),
        ),
        migrations.AddConstraint(
            model_name="connectivitystatement",
            constraint=models.CheckConstraint(
                check=models.Q(("projection__in", ["IPSI", "CONTRAT", "BI"])),
                name="projection_valid",
            ),
        ),
    ]
