from django.core.exceptions import ValidationError
from django.dispatch import receiver
from django.db.models.signals import post_save, m2m_changed, pre_save

from django_fsm.signals import post_transition

from .enums import CSState, NoteType
from .models import ConnectivityStatement, ExportBatch, Note, Sentence, Synonym, \
    AnatomicalEntity, Layer, Region, AnatomicalEntityMeta
from .services.export_services import compute_metrics, ConnectivityStatementStateService


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


@receiver(post_transition)
def post_transition_cs(sender, instance, name, source, target, **kwargs):
    if issubclass(sender, ConnectivityStatement):
        if target == CSState.COMPOSE_NOW and source in (
                CSState.NPO_APPROVED,
                CSState.EXPORTED,
        ):
            # add important tag to CS when transition to COMPOSE_NOW from NPO Approved or Exported
            instance = ConnectivityStatementStateService.add_important_tag(instance)

@receiver(post_save, sender=Layer)
def create_layer_anatomical_entity(sender, instance=None, created=False, **kwargs):
    if created and instance:
        AnatomicalEntity.objects.create(simple_entity=instance.layer_ae_meta) 

@receiver(post_save, sender=Region)
def create_region_anatomical_entity(sender, instance=None, created=False, **kwargs):
    if created and instance:
        AnatomicalEntity.objects.create(simple_entity=instance.region_ae_meta)

