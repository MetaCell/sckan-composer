# Generated by Django 4.1.4 on 2023-04-21 11:43

from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("composer", "0008_copy_doi_to_provenance"),
    ]

    operations = [
        migrations.DeleteModel(
            name="Doi",
        ),
    ]