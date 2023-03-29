# Generated by Django 4.1.4 on 2023-03-24 18:20

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("composer", "0021_note_type"),
    ]

    operations = [
        migrations.AddField(
            model_name="via",
            name="type",
            field=models.CharField(
                choices=[("AXON", "Axon"), ("DENDRITE", "Dendrite")],
                default="AXON",
                max_length=8,
            ),
        ),
    ]