import logging
from django.dispatch import receiver
from django.db.models.signals import post_save, m2m_changed, post_delete
from django.contrib.auth import get_user_model
from django_fsm.signals import post_transition

from composer.services.state_services import ConnectivityStatementStateService
from composer.services.export.helpers.export_batch import compute_metrics
from composer.services.layers_service import update_from_entities_on_deletion
from composer.services.statement_service import (
    get_suffix_for_statement_preview,
    get_prefix_for_statement_preview,
)
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
from .services.graph_service import recompile_journey_path


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
    system_user = User.objects.get(username="system")
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
def connectivity_statement_origins_changed(sender, instance, action, pk_set, **kwargs):
    """
    Signal handler for changes in the origins ManyToMany relationship.

    - Deletes the graph_rendering_state on 'post_add', 'post_remove', or 'post_clear'.
    - Calls `update_from_entities_on_deletion` for each deleted entity on 'post_remove'.
    """
    if action in ["post_add", "post_remove", "post_clear"]:
        try:
            instance.graph_rendering_state.delete()
        except GraphRenderingState.DoesNotExist:
            pass
        except ValueError:
            pass
        recompile_journey_path(instance)

    # Call `update_from_entities_on_deletion` for each removed entity
    if action == "post_remove" and pk_set:
        for deleted_entity_id in pk_set:
            update_from_entities_on_deletion(instance, deleted_entity_id)


# Signals for Via anatomical_entities
@receiver(m2m_changed, sender=Via.anatomical_entities.through)
def via_anatomical_entities_changed(sender, instance, action, pk_set, **kwargs):
    if action in ["post_add", "post_remove", "post_clear"]:
        try:
            instance.connectivity_statement.graph_rendering_state.delete()
        except GraphRenderingState.DoesNotExist:
            pass
        except ValueError:
            pass
        recompile_journey_path(instance.connectivity_statement)

    # Call `update_from_entities_on_deletion` for each removed entity
    if action == "post_remove" and pk_set:
        for deleted_entity_id in pk_set:
            update_from_entities_on_deletion(
                instance.connectivity_statement, deleted_entity_id
            )


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
        recompile_journey_path(instance.connectivity_statement)


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
        recompile_journey_path(instance.connectivity_statement)


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
        recompile_journey_path(instance.connectivity_statement)


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
@receiver(
    m2m_changed, sender=Sentence.tags.through, dispatch_uid="sentence_tags_changed"
)
@receiver(
    m2m_changed,
    sender=ConnectivityStatement.tags.through,
    dispatch_uid="cs_tags_changed",
)
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


@receiver(
    m2m_changed,
    sender=ConnectivityStatement.species.through,
    dispatch_uid="update_prefix_for_species",
)
@receiver(
    m2m_changed,
    sender=ConnectivityStatement.origins.through,
    dispatch_uid="update_suffix_for_origins",
)
@receiver(
    [post_save, post_delete],
    sender=ConnectivityStatement,
    dispatch_uid="update_prefix_suffix_for_statement",
)
def update_prefix_suffix_for_connectivity_statement_preview(
    sender, instance, action=None, **kwargs
):
    if not isinstance(instance, ConnectivityStatement):
        return

    relevant_suffix_fields = [
        "circuit_type",
        "projection",
        "projection_phenotype_id",
        "laterality",
        "apinatomy_model",
    ]
    relevant_prefix_fields = ["sex", "phenotype"]
    relevant_fields = relevant_suffix_fields + relevant_prefix_fields

    updated_fields = kwargs.get("update_fields", []) or []
    has_relevant_field_changed = any(
        field in updated_fields for field in relevant_fields
    )

    update_prefix = False
    update_suffix = False

    if sender == ConnectivityStatement.species.through:
        update_prefix = action in ["post_add", "post_remove", "post_clear"]
    elif sender == ConnectivityStatement.origins.through:
        update_suffix = action in ["post_add", "post_remove", "post_clear"]
    elif has_relevant_field_changed:
        update_prefix = update_suffix = True

    if not (update_prefix or update_suffix):
        return

    update_fields = []

    if update_prefix:
        instance.statement_prefix = get_prefix_for_statement_preview(instance)
        update_fields.append("statement_prefix")

    if update_suffix:
        instance.statement_suffix = get_suffix_for_statement_preview(instance)
        update_fields.append("statement_suffix")

    if update_fields:
        try:
            instance.save(update_fields=update_fields)
        except Exception as e:
            logging.error(
                f"Error updating prefix/suffix for ConnectivityStatement {instance.id}: {str(e)}"
            )


@receiver(post_save, sender=ConnectivityStatement)
def set_has_statement_been_exported(sender, instance, **kwargs):
    if instance.state == CSState.EXPORTED and not instance.has_statement_been_exported:
        instance.has_statement_been_exported = True
        instance.save(update_fields=["has_statement_been_exported"])
