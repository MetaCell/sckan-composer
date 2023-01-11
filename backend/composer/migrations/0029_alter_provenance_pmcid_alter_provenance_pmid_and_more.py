# Generated by Django 4.1.4 on 2023-01-07 11:28

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("composer", "0028_alter_doi_options_remove_connectivitystatement_uri"),
    ]

    operations = [
        migrations.AlterField(
            model_name="provenance",
            name="pmcid",
            field=models.CharField(blank=True, db_index=True, max_length=10, null=True),
        ),
        migrations.AlterField(
            model_name="provenance",
            name="pmid",
            field=models.BigIntegerField(blank=True, db_index=True, null=True),
        ),
        migrations.AddConstraint(
            model_name="provenance",
            constraint=models.UniqueConstraint(
                models.F("pmid"), models.F("pmcid"), name="provenance_pmid_pmcd_unique"
            ),
        ),
    ]