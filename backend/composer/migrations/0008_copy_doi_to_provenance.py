# Generated by Django 4.1.4 on 2023-04-21 11:42

from django.core.exceptions import ObjectDoesNotExist
from django.db import connection, migrations

from composer.utils import doi_uri

def create_provenances(apps, schema_editor):
    ConnectivityStatement = apps.get_model('composer', 'ConnectivityStatement')
    Provenance = apps.get_model('composer', 'Provenance')
    # create the provenances from the dois
    with connection.cursor() as cursor:
        cursor.execute("SELECT doi, connectivity_statement_id from composer_doi")
        dois = cursor.fetchall()
        for doi in dois:
            uri = doi_uri(doi[0])
            connectivity_statement_id=doi[1]
            try:
                connectivity_statement = ConnectivityStatement.objects.get(id=connectivity_statement_id)
                Provenance.objects.create(connectivity_statement=connectivity_statement, uri=uri)
            except ObjectDoesNotExist:
                # CS doesnt exists, skip the doi
                ...


class Migration(migrations.Migration):
    dependencies = [
        ("composer", "0007_rename_doi_to_provenance"),
    ]

    operations = [
        migrations.RunPython(create_provenances),
    ]