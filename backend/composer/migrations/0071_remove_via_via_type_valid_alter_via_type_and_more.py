# Generated by Django 4.1.4 on 2025-01-15 22:06

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("composer", "0070_auto_20250120_1336"),
    ]

    operations = [
        migrations.RemoveConstraint(
            model_name="via",
            name="via_type_valid",
        ),
        migrations.AlterField(
            model_name="via",
            name="type",
            field=models.CharField(
                choices=[
                    ("AXON", "Axon"),
                    ("DENDRITE", "Dendrite"),
                    ("SENSORY_AXON", "Axon to PNS"),
                ],
                default="AXON",
                max_length=20,
            ),
        ),
        migrations.AddConstraint(
            model_name="via",
            constraint=models.CheckConstraint(
                check=models.Q(("type__in", ["AXON", "DENDRITE", "SENSORY_AXON"])),
                name="via_type_valid",
            ),
        ),
    ]
