# Generated by Django 4.1.4 on 2023-01-03 12:49

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('composer', '0014_remove_provenance_laterality_valid_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='connectivitystatement',
            name='destination_type',
            field=models.CharField(choices=[('AXON_SE', 'Axon sensory ending'), ('AXON_T', 'Axon terminal'), ('AXON_ST', 'Axon sensory terminal')], default='AXON_SE', max_length=25, null=True),
        ),
    ]