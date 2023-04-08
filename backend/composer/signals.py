from django.dispatch import receiver
from django.db.models.signals import post_save

from django_fsm.signals import post_transition

from .enums import NoteType
from .models import ConnectivityStatement, ExportBatch, Note, Sentence
from .services.export_services import compute_metrics

@receiver(post_save, sender=ExportBatch)
def export_batch_post_save(sender, instance=None, created=False, **kwargs):
    if created and instance:
        # Compute the statistics for the export batch
        compute_metrics(instance)


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
