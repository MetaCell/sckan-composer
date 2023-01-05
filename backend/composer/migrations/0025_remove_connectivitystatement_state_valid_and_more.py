# Generated by Django 4.1.4 on 2023-01-05 10:49

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('composer', '0024_provenance_state_provenance_provenance_state_valid'),
    ]

    operations = [
        migrations.RemoveConstraint(
            model_name='connectivitystatement',
            name='state_valid',
        ),
        migrations.AddConstraint(
            model_name='connectivitystatement',
            constraint=models.CheckConstraint(check=models.Q(('state__in', ['draft', 'compose_now', 'curated', 'excluded', 'rejected', 'to_be_reviewed', 'connection_missing', 'npo_approved', 'approved'])), name='state_valid'),
        ),
    ]
