# Generated by Django 4.1.4 on 2023-06-01 10:33

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("composer", "0013_alter_connectivitystatement_phenotype"),
    ]

    operations = [
        migrations.AddField(
            model_name="connectivitystatement",
            name="reference_uri",
            field=models.URLField(blank=True, null=True),
        ),
    ]
