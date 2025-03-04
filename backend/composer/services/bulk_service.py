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


def assign_tags(instances, add_tag_ids, remove_tag_ids):
    """
    For each instance in the queryset:
      - Bulk add associations for tags in add_tag_ids (if not already present).
      - Bulk remove associations for tags in remove_tag_ids (if present).
    
    Returns the number of processed instances.
    """

    # Validate add and remove tag IDs
    valid_add_tag_ids = list(
        Tag.objects.filter(id__in=add_tag_ids).values_list("id", flat=True)
    )
    valid_remove_tag_ids = list(
        Tag.objects.filter(id__in=remove_tag_ids).values_list("id", flat=True)
    )

    # Get the many-to-many field info.
    m2m_field = instances.model._meta.get_field("tags")
    through_model = m2m_field.remote_field.through
    # Use the m2m_field name that references the source model.
    source_field_name = m2m_field.m2m_field_name()  # might be "sentence" or "connectivitystatement"
    # Ensure we work with the underlying ID field.
    if not source_field_name.endswith("_id"):
        source_field_name += "_id"

    instance_ids = list(instances.values_list("id", flat=True))

    # 1. Bulk remove associations for tags in the remove list.
    if valid_remove_tag_ids:
        through_model.objects.filter(
            **{f"{source_field_name}__in": instance_ids},
            tag_id__in=valid_remove_tag_ids
        ).delete()

    # 2. Bulk insert associations for tags in the add list.
    associations = []
    batch_size = 1000
    for instance_id in instance_ids:
        for tag_id in valid_add_tag_ids:
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

    return len(instance_ids)


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
    from django.db.models import Q


def assign_population_set(instances, population_set_id):
    """
    Assigns the given population_set_id to all ConnectivityStatement instances in 'instances'
    that are eligible to change their population. An instance is eligible if either:
      - It has not yet been exported (has_statement_been_exported is False), or
      - It is exported but already has the given population_set_id.

    If the provided instances are not ConnectivityStatements (e.g. Sentences),
    a NotImplementedError is raised.

    Returns:
        int: The number of instances successfully updated.
    """
    model = getattr(instances, "model", None)

    if not hasattr(model, "population"):
        raise NotImplementedError(
            "assign_population_set is not implemented for non-ConnectivityStatement models."
        )

    # Allowed to update if not exported or (if exported) already assigned to the target population.
    allowed_condition = Q(has_statement_been_exported=False) | Q(
        population=population_set_id
    )

    qs_allowed = instances.filter(allowed_condition)
    n_updated = qs_allowed.update(population=population_set_id)
    return n_updated


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
        return {"transitions": [], "original_state": None}

    state_field_name = "state"

    states = set(queryset.values_list(state_field_name, flat=True).distinct())

    if len(states) > 1:
        return {"transitions": [], "original_state": None}

    original_state = list(states)[0]
    first_obj = queryset.first()

    # Get available state transitions for the first object
    if hasattr(first_obj, "get_available_state_transitions"):
        state_field = first_obj._meta.get_field(state_field_name)
        transitions = {
            transition.name
            for transition in get_available_FIELD_transitions_without_conditions_check(
                first_obj, state_field
            )
            if transition.name != CSState.DEPRECATED  # Exclude deprecated state
        }

        return {"transitions": list(transitions), "original_state": original_state}

    return {"transitions": list(transitions), "original_state": original_state}


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
