# Generated by Django 4.1.4 on 2023-03-16 17:52

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("composer", "0018_alter_sentence_external_ref_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="connectivitystatement",
            name="knowledge_statement",
            field=models.TextField(blank=True, db_index=True),
        ),
    ]