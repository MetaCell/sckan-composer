from django.shortcuts import get_object_or_404
from django.db import transaction
from django_fsm import TransitionNotAllowed
from django.db.models import ForeignKey, Q, Count
from composer.services.state_services import (
    get_available_FIELD_transitions_without_conditions_check,
)
from composer.enums import CSState
from composer.models import ConnectivityStatement, Profile, Sentence, Tag, Note, User


def assign_owner(instances, requested_by, owner_id):
    """
    This function optimizes the owner assignment process for bulk updates.
    The same logic exists in the model's `assign_owner` method for single-object updates.
    Any modifications to this logic should be applied to both places to maintain consistency.
    """
    owner = get_object_or_404(User, id=owner_id)
    updated_count = instances.update(owner=owner)

    if instances.model == Sentence:
        ConnectivityStatement.objects.filter(
            sentence__in=instances, state=CSState.DRAFT
        ).update(owner=owner)

    return updated_count


def assign_tags(instances, tag_ids):
    """
    Updates the tags for each instance in the queryset,
    ensuring that only the provided tags remain.
    Returns the number of processed instances.
    """
    existing_tag_ids = list(
        Tag.objects.filter(id__in=tag_ids).values_list("id", flat=True)
    )
    m2m_field = instances.model._meta.get_field("tags")
    through_model = m2m_field.remote_field.through
    source_field_name = m2m_field.m2m_field_name() + "_id"

    # 1. Bulk delete associations for instances that are not in the new set.
    through_model.objects.filter(
        **{f"{source_field_name}__in": instances.values_list("id", flat=True)}
    ).exclude(tag_id__in=existing_tag_ids).delete()

    # 2. Bulk insert missing associations.
    batch_size = 1000
    associations = []
    qs = instances.values_list("id", flat=True).iterator(chunk_size=batch_size)
    for instance_id in qs:
        for tag_id in existing_tag_ids:
            associations.append(
                through_model(**{source_field_name: instance_id, "tag_id": tag_id})
            )
            if len(associations) >= batch_size:
                through_model.objects.bulk_create(
                    associations, ignore_conflicts=True, batch_size=batch_size
                )
                associations = []
    if associations:
        through_model.objects.bulk_create(
            associations, ignore_conflicts=True, batch_size=batch_size
        )

    # Return the count of processed instances.
    return instances.count()


def write_note(instances, user, note_text):
    """
    Adds a note to each selected instance using bulk_create for efficiency.
    Returns the number of notes created.
    """
    # Determine the model class from the queryset
    model_class = (
        instances.model if hasattr(instances, "model") else type(next(iter(instances)))
    )
    note_field = _get_note_field_for_model(model_class)

    notes_to_create = [
        Note(user=user, note=note_text, **{note_field: instance})
        for instance in instances.iterator()
    ]
    Note.objects.bulk_create(notes_to_create)
    return len(notes_to_create)


def change_status(instances, new_status, user=None):
    """
    Uses Django FSM to apply valid state transitions on each instance.
    Assumes each instance implements get_state_service() to return its appropriate state service.
    Returns the number of instances that were successfully updated.
    """
    success_ids = []
    for obj in instances:
        try:
            with transaction.atomic():
                state_service = obj.get_state_service()
                state_service.do_transition(new_status, user)
                obj.save()
            success_ids.append(obj.id)
        except (TransitionNotAllowed, AttributeError):
            continue
    return len(success_ids)


def assign_population_set(instances, population_set_id):
    # TODO: Implement this function generically.
    raise NotImplementedError("assign_population_set is not implemented yet.")


def _get_note_field_for_model(model_class):
    for field in Note._meta.fields:
        if isinstance(field, ForeignKey) and field.related_model == model_class:
            return field.name
    raise Exception(f"No matching Note field for model {model_class.__name__}")


def get_assignable_users_data(roles=None):
    """
    Returns minimal user data for profiles whose role field(s) match.

    :param roles: A list of role field names on Profile to filter by.
                  For example, ['is_curator', 'is_triage_operator'].
                  If None, no role filtering is applied.
    :return: Serialized minimal user data.
    """
    if roles:
        q = Q()
        for role in roles:
            q |= Q(**{role: True})
        assignable_users = Profile.objects.filter(q).select_related("user")
    else:
        assignable_users = Profile.objects.all().select_related("user")
    return assignable_users


def get_common_transitions(queryset, user):
    """
    Get common transitions for a queryset of objects.

    If all objects in the queryset are in the same state, return the available state transitions
    for the first object; otherwise, return an empty list.
    """
    if not queryset.exists():
        return []

    state_field_name = "state"

    states_count = queryset.values_list(state_field_name, flat=True).distinct().count()

    if states_count > 1:
        return []  # If there are multiple distinct states, return an empty list

    # Get the first object (only one exists since all have the same state)
    first_obj = queryset.first()

    # Get available state transitions for the first object
    if hasattr(first_obj, "get_available_state_transitions"):
        state_field = first_obj._meta.get_field(state_field_name)
        transitions = {
            transition.name
            for transition in get_available_FIELD_transitions_without_conditions_check(
                first_obj, state_field
            )
        }
        return list(transitions)

    return []


def get_tags_partition(queryset):
    """
    Compute tag partitions for the given queryset of objects that have a ManyToMany 'tags' field.

    Returns a dictionary with:
      - 'common': IDs of tags that appear on every object.
      - 'union': IDs of tags that appear on at least one object.
      - 'partial': IDs of tags that appear on some (but not all) objects.
      - 'missing': IDs of tags that appear on none of the objects.
    """
    qs_count = queryset.count()
    if qs_count == 0:
        all_tag_ids = set(Tag.objects.all().values_list("id", flat=True))
        return {
            "common": set(),
            "union": set(),
            "partial": set(),
            "missing": all_tag_ids,
        }

    # Get the through model from the 'tags' field.
    m2m_field = queryset.model._meta.get_field("tags")
    through_model = m2m_field.remote_field.through
    # Determine the field name on the through model that references the instance.
    # m2m_field.m2m_field_name() might return 'sentence' for Sentence, but we need to assign by id.
    target_field = m2m_field.m2m_field_name()
    if not target_field.endswith("_id"):
        target_field += "_id"

    # Use the through model to count how many times each tag is attached to objects in the queryset.
    tag_counts = (
        through_model.objects.filter(**{f"{target_field}__in": queryset})
        .values("tag_id")
        .annotate(cnt=Count("tag_id"))
    )

    union_tag_ids = set()
    common_tag_ids = set()
    for entry in tag_counts:
        tag_id = entry["tag_id"]
        union_tag_ids.add(tag_id)
        # If a tag appears in all objects, count equals qs_count.
        if entry["cnt"] == qs_count:
            common_tag_ids.add(tag_id)

    partial_tag_ids = union_tag_ids - common_tag_ids

    # All tags in the system.
    all_tag_ids = set(Tag.objects.all().values_list("id", flat=True))
    missing_tag_ids = all_tag_ids - union_tag_ids

    return {
        "common": common_tag_ids,
        "union": union_tag_ids,
        "partial": partial_tag_ids,
        "missing": missing_tag_ids,
    }
