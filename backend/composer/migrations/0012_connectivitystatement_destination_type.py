# Generated by Django 4.1.4 on 2023-01-02 07:33

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('composer', '0011_note_user'),
    ]

    operations = [
        migrations.AddField(
            model_name='connectivitystatement',
            name='destination_type',
            field=models.CharField(choices=[('1', 'Axon sensory ending'), ('2', 'Axon terminal'), ('3', 'Axon sensory terminal')], default='1', max_length=1, null=True),
        ),
    ]