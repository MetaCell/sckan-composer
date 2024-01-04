# Generated by Django 4.1.4 on 2023-12-11 15:44

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("composer", "0031_alter_sentence_options_alter_via_order"),
    ]

    operations = [
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
                default="UNKNOWN",
                max_length=20,
            ),
        ),
    ]