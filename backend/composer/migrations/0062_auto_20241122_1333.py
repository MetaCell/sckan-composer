# Generated by Django 4.1.4 on 2024-11-22 12:33

"""
This migration script migrates the notes of type TRANSITION to be associated with the system user.
And convert their note to the new format - "User {user.first_name} {user.last_name} transitioned this record from {from_state} to {to_state}"
"""

from django.db import migrations
from composer.enums import NoteType


def migrate_notes_to_system_user(apps, schema_editor):
    User = apps.get_model('auth', 'User')
    Note = apps.get_model('composer', 'Note')

    system_user = User.objects.get(username='system')
    notes = Note.objects.filter(type=NoteType.TRANSITION)
    for note in notes:
        note_parts = note.note.split(' ')
        from_state = note_parts[2]
        to_state = note_parts[4]
        new_note = f"User {note.user.first_name} {note.user.last_name} transitioned this record from {from_state} to {to_state}"
        note.note = new_note
        note.user = system_user
        note.save()


class Migration(migrations.Migration):

    dependencies = [
        ("composer", "0061_graphrenderingstate_and_more"),
    ]

    operations = [
        migrations.RunPython(migrate_notes_to_system_user),
    ]
