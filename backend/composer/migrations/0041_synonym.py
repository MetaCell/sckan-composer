# Generated by Django 4.1.4 on 2024-03-13 17:15

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("composer", "0040_auto_20240213_1301"),
    ]

    operations = [
        migrations.CreateModel(
            name="Synonym",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("name", models.CharField(db_index=True, max_length=200)),
                (
                    "anatomical_entity",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="synonyms",
                        to="composer.anatomicalentity",
                    ),
                ),
            ],
        ),
    ]
