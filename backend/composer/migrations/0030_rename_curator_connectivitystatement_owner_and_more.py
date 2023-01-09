# Generated by Django 4.1.4 on 2023-01-09 10:17

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("composer", "0029_alter_provenance_pmcid_alter_provenance_pmid_and_more"),
    ]

    operations = [
        migrations.RenameField(
            model_name="connectivitystatement",
            old_name="curator",
            new_name="owner",
        ),
        migrations.AddField(
            model_name="provenance",
            name="owner",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.DO_NOTHING,
                to=settings.AUTH_USER_MODEL,
                verbose_name="Curator",
            ),
        ),
    ]
