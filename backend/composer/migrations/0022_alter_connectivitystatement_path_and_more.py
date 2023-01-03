# Generated by Django 4.1.4 on 2023-01-03 13:14

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('composer', '0021_alter_connectivitystatement_apinatomy_model_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='connectivitystatement',
            name='path',
            field=models.ManyToManyField(blank=True, through='composer.Via', to='composer.anatomicalentity', verbose_name='Path'),
        ),
        migrations.AlterField(
            model_name='connectivitystatement',
            name='species',
            field=models.ManyToManyField(blank=True, to='composer.specie', verbose_name='Species'),
        ),
    ]