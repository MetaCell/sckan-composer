from django.db import migrations


def update_destination_type(apps, schema_editor):
    ConnectivityStatement = apps.get_model('composer', 'ConnectivityStatement')

    # Update existing records with removed options to the new one
    ConnectivityStatement.objects.filter(
        destination_type__in=["AXON-SE", "AXON-ST"]
    ).update(destination_type="AFFERENT-T")

    # Update existing records with typo
    ConnectivityStatement.objects.filter(
        destination_type__in=["UNKNOW"]
    ).update(destination_type="UNKNOWN")


class Migration(migrations.Migration):
    dependencies = [
        ("composer", "0026_connectivitystatement_created_date_and_more"),  # Replace with the name of your previous migration
    ]

    operations = [
        migrations.RunPython(update_destination_type),
    ]
