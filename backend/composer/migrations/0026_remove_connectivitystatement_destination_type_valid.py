# Generated by Django 4.1.4 on 2023-04-06 16:10

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("composer", "0025_remove_connectivitystatement_state_valid_and_more"),
    ]

    operations = [
        migrations.RemoveConstraint(
            model_name="connectivitystatement",
            name="destination_type_valid",
        ),
    ]
