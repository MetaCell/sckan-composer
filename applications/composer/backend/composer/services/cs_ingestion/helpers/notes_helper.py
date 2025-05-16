from django.contrib.auth.models import User

from composer.enums import NoteType
from composer.models import ConnectivityStatement, Note


def add_ingestion_system_note(connectivity_statement: ConnectivityStatement):
    Note.objects.create(connectivity_statement=connectivity_statement,
                        user=User.objects.get(username="system"),
                        type=NoteType.ALERT,
                        note=f"Overwritten by manual ingestion")


def do_transition_to_invalid_with_note(connectivity_statement: ConnectivityStatement, note: str):
    system_user = User.objects.get(username="system")
    connectivity_statement.invalid(by=system_user)
    connectivity_statement.save()

    create_invalid_note(connectivity_statement, note)


def create_invalid_note(connectivity_statement: ConnectivityStatement, note: str):
    Note.objects.create(
        connectivity_statement=connectivity_statement,
        user=User.objects.get(username="system"),
        type=NoteType.ALERT,
        note=f"Invalidated due to the following reason(s): {note}"
    )


def do_transition_to_exported(connectivity_statement: ConnectivityStatement):
    system_user = User.objects.get(username="system")
    connectivity_statement.exported(by=system_user)
    connectivity_statement.save()
