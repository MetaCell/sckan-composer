# Generated by Django 4.1.4 on 2023-06-08 10:42

from django.db import migrations, models
import django.db.models.functions.text


class Migration(migrations.Migration):
    dependencies = [
        ("composer", "0019_anatomicalentity_anatomicalentity_upper_name"),
    ]

    operations = [
        migrations.RemoveIndex(
            model_name="anatomicalentity",
            name="anatomicalentity_upper_name",
        ),
        migrations.AlterField(
            model_name="anatomicalentity",
            name="name",
            field=models.CharField(db_index=True, max_length=200),
        ),
        migrations.AddConstraint(
            model_name="anatomicalentity",
            constraint=models.UniqueConstraint(
                django.db.models.functions.text.Upper("name"),
                name="ae_unique_upper_name",
            ),
        ),
    ]
