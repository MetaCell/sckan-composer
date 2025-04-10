# Generated manually

from django.db import migrations
from .helpers.curie_id_generator import generate_connectivity_statement_curie_id_for_composer_statements
from composer.enums import CSState


def generate_curie_ids(apps, schema_editor):
    """
    Generate curie_ids for exported connectivity statements that don't have them.
    """
    ConnectivityStatement = apps.get_model('composer', 'ConnectivityStatement')
    
    # Get all exported connectivity statements without curie_ids
    statements = ConnectivityStatement.objects.filter(
        state=CSState.EXPORTED,
        curie_id__isnull=True,
    ).select_related('population')

    # Generate and save curie_ids
    for statement in statements:
        curie_id = generate_connectivity_statement_curie_id_for_composer_statements(statement)
        if curie_id:
            statement.curie_id = curie_id
            statement.save(update_fields=['curie_id'])


class Migration(migrations.Migration):

    dependencies = [
        ("composer", "0082_alter_sentence_batch_name"),
    ]

    operations = [
        migrations.RunPython(
            generate_curie_ids,
            reverse_code=migrations.RunPython.noop
        ),
    ]
