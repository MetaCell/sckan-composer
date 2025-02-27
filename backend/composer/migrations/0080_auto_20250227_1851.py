# Migration 2: Update state and create system notes
from django.db import migrations
from composer.enums import CSState, NoteType

def revert_exported_state(apps, schema_editor):
    """
    Moves `EXPORTED` statements (without population) back to `NPO_APPROVED` and logs notes.
    """
    ConnectivityStatement = apps.get_model("composer", "ConnectivityStatement")
    Note = apps.get_model("composer", "Note")
    User = apps.get_model("auth", "User")

    # Find statements that are still `EXPORTED` but have no population
    statements_moving_to_npo = ConnectivityStatement.objects.filter(
        state=CSState.EXPORTED,
        population__isnull=True
    )

    statement_ids = list(statements_moving_to_npo.values_list("id", flat=True))

    statements_moving_to_npo.update(state=CSState.NPO_APPROVED)

    # Get the system user
    try:
        system_user = User.objects.get(username="system")
    except User.DoesNotExist:
        system_user = None

    # Create system Notes for updated statements
    notes_to_create = [
        Note(
            user=system_user,
            type=NoteType.TRANSITION,
            connectivity_statement_id=statement_id,
            note="Automatically transitioned from EXPORTED to NPO_APPROVED due to missing population set.",
        )
        for statement_id in statement_ids
    ]

    # Bulk insert all Notes at once
    if notes_to_create and system_user:
        Note.objects.bulk_create(notes_to_create)

class Migration(migrations.Migration):

    dependencies = [
        ("composer", "0079_auto_20250227_1837"),
    ]

    operations = [
        migrations.RunPython(revert_exported_state),
    ]
