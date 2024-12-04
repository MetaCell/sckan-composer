from django.core.exceptions import ValidationError
from django.dispatch import receiver
from django.db.models.signals import post_save, m2m_changed, pre_save, post_delete
from django.contrib.auth import get_user_model
from django_fsm.signals import post_transition
from .utils import update_modified_date
from .enums import CSState, NoteType
from .models import (
    ConnectivityStatement,
    Destination,
    ExportBatch,
    GraphRenderingState,
    Note,
    Sentence,
    AnatomicalEntity,
    Layer,
    Region,
    Via,
)
from .services.export_services import compute_metrics, ConnectivityStatementStateService


@receiver(post_save, sender=ExportBatch)
def export_batch_post_save(sender, instance=None, created=False, **kwargs):
    if created and instance:
        # Compute the statistics for the export batch
        compute_metrics(instance)


@receiver(post_transition)
def post_transition_callback(sender, instance, name, source, target, **kwargs):
    User = get_user_model()
    method_kwargs = kwargs.get("method_kwargs", {})
    user = method_kwargs.get("by")
    system_user = User.objects.get(username='system')
    if issubclass(sender, ConnectivityStatement):
        connectivity_statement = instance
    else:
        connectivity_statement = None
    if issubclass(sender, Sentence):
        sentence = instance
    else:
        sentence = None
    Note.objects.create(
        user=system_user,
        type=NoteType.TRANSITION,
        connectivity_statement=connectivity_statement,
        sentence=sentence,
        note=f"User {user.first_name} {user.last_name} transitioned this record from {source} to {target}",
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
        AnatomicalEntity.objects.get_or_create(simple_entity=instance.ae_meta)


@receiver(post_save, sender=Region)
def create_region_anatomical_entity(sender, instance=None, created=False, **kwargs):
    if created and instance:
        AnatomicalEntity.objects.get_or_create(simple_entity=instance.ae_meta)


@receiver(post_delete, sender=AnatomicalEntity)
def delete_associated_entities(sender, instance, **kwargs):
    # Delete the associated simple_entity if it exists
    if instance.simple_entity:
        instance.simple_entity.delete()

    # Delete the associated region_layer if it exists
    if instance.region_layer:
        instance.region_layer.delete()


# Signals for ConnectivityStatement origins
@receiver(m2m_changed, sender=ConnectivityStatement.origins.through)
def connectivity_statement_origins_changed(sender, instance, action, **kwargs):
    if action in ["post_add", "post_remove", "post_clear"]:
        try:
            instance.graph_rendering_state.delete()
        except GraphRenderingState.DoesNotExist:
            pass
        except ValueError:
            pass


# Signals for Via anatomical_entities
@receiver(m2m_changed, sender=Via.anatomical_entities.through)
def via_anatomical_entities_changed(sender, instance, action, **kwargs):
    if action in ["post_add", "post_remove", "post_clear"]:
        try:
            instance.connectivity_statement.graph_rendering_state.delete()
        except GraphRenderingState.DoesNotExist:
            pass
        except ValueError:
            pass


# Signals for Via from_entities
@receiver(m2m_changed, sender=Via.from_entities.through)
def via_from_entities_changed(sender, instance, action, **kwargs):
    if action in ["post_add", "post_remove", "post_clear"]:
        try:
            instance.connectivity_statement.graph_rendering_state.delete()
        except GraphRenderingState.DoesNotExist:
            pass
        except ValueError:
            pass


# Signals for Destination anatomical_entities
@receiver(m2m_changed, sender=Destination.anatomical_entities.through)
def destination_anatomical_entities_changed(sender, instance, action, **kwargs):
    if action in ["post_add", "post_remove", "post_clear"]:
        try:
            instance.connectivity_statement.graph_rendering_state.delete()
        except GraphRenderingState.DoesNotExist:
            pass
        except ValueError:
            pass


# Signals for Destination from_entities
@receiver(m2m_changed, sender=Destination.from_entities.through)
def destination_from_entities_changed(sender, instance, action, **kwargs):
    if action in ["post_add", "post_remove", "post_clear"]:
        try:
            instance.connectivity_statement.graph_rendering_state.delete()
        except GraphRenderingState.DoesNotExist:
            pass
        except ValueError:
            pass


# Signals for Via model changes
@receiver(post_save, sender=Via)
@receiver(post_delete, sender=Via)
def via_changed(sender, instance, **kwargs):
    try:
        instance.connectivity_statement.graph_rendering_state.delete()
    except GraphRenderingState.DoesNotExist:
        pass
    except ValueError:
        pass


# Signals for Destination model changes
@receiver(post_save, sender=Destination)
@receiver(post_delete, sender=Destination)
def destination_changed(sender, instance, **kwargs):
    try:
        instance.connectivity_statement.graph_rendering_state.delete()
    except GraphRenderingState.DoesNotExist:
        pass
    except ValueError:
        pass

# TAG: If a sentence/CS tag is changed, update the modified_date
@receiver(m2m_changed, sender=Sentence.tags.through, dispatch_uid="sentence_tags_changed")
@receiver(m2m_changed, sender=ConnectivityStatement.tags.through, dispatch_uid="cs_tags_changed")
def sentence_and_cs_tags_changed(sender, instance, action, **kwargs):
    if action in ["post_add", "post_remove", "post_clear"]:
        update_modified_date(instance)

# NOTE: If a note is added, updated, or deleted, update the modified_date of the sentence/CS
@receiver(post_save, sender=Note, dispatch_uid="note_post_save")
@receiver(post_delete, sender=Note, dispatch_uid="note_post_delete")
def note_post_save_and_delete(sender, instance, **kwargs):
    if instance.sentence:
        update_modified_date(instance.sentence)
    if instance.connectivity_statement:
        update_modified_date(instance.connectivity_statement)
