# Generated by Django 4.1.4 on 2023-02-13 16:09

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("composer", "0015_alter_sentence_external_ref"),
    ]

    operations = [
        migrations.CreateModel(
            name="BiologicalSex",
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
                ("name", models.CharField(db_index=True, max_length=200, unique=True)),
                ("uri", models.URLField(blank=True, null=True)),
            ],
            options={
                "verbose_name_plural": "Biological Sex",
                "ordering": ["name"],
            },
        ),
        migrations.AddField(
            model_name="specie",
            name="uri",
            field=models.URLField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name="connectivitystatement",
            name="biological_sex",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.DO_NOTHING,
                to="composer.biologicalsex",
            ),
        ),
    ]
