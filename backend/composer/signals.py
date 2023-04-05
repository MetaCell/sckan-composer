from django.dispatch import receiver

from django_fsm.signals import post_transition

from .enums import NoteType
from .models import ConnectivityStatement, Note, Sentence


@receiver(post_transition)
def post_transition_callback(sender, instance, name, source, target, **kwargs):
    method_kwargs = kwargs.get("method_kwargs", {})
    user = method_kwargs.get("by")
    if issubclass(sender, ConnectivityStatement):
        connectivity_statement = instance
    else:
        connectivity_statement = None
    if issubclass(sender, Sentence):
        sentence = instance
    else:
        sentence = None
    Note.objects.create(
        user=user,
        type=NoteType.TRANSITION,
        connectivity_statement=connectivity_statement,
        sentence=sentence,
        note=f"Transitioned from {source} to {target}",
    )
