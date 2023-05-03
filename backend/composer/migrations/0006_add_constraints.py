# Generated by Django 4.1.4 on 2023-04-20 14:44

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("composer", "0005_update_laterality"),
    ]

    operations = [
        migrations.AddConstraint(
            model_name="connectivitystatement",
            constraint=models.CheckConstraint(
                check=models.Q(("laterality__in", ["RIGHT", "LEFT", "UNKNOWN"])),
                name="laterality_valid",
            ),
        ),
        migrations.AddConstraint(
            model_name="connectivitystatement",
            constraint=models.CheckConstraint(
                check=models.Q(
                    ("projection__in", ["IPSI", "CONTRAT", "BI", "UNKNOWN"])
                ),
                name="projection_valid",
            ),
        ),
    ]
