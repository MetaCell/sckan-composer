# Generated by Django 4.1.4 on 2024-02-13 13:01

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("composer", "0038_alter_connectivitystatement_circuit_type_and_more"),
    ]

    operations = [
        migrations.RemoveConstraint(
            model_name="connectivitystatement",
            name="state_valid",
        ),
        migrations.RemoveConstraint(
            model_name="sentence",
            name="sentence_state_valid",
        ),
        migrations.AlterField(
            model_name="exportmetrics",
            name="state",
            field=models.CharField(max_length=20),
        ),
    ]
