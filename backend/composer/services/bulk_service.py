from django.shortcuts import get_object_or_404
from django.db import transaction
from django_fsm import TransitionNotAllowed, get_available_user_FIELD_transitions
from functools import reduce
from operator import and_
from django.db.models import ForeignKey, Q
from composer.api.serializers import MinimalUserSerializer
from composer.models import Profile, Tag, Note, User


def assign_owner(instances, requested_by, owner_id):
    """
    For each instance, call instance.assign_owner(requested_by, owner).
    Returns a list of IDs that were successfully updated.
    Assumes the instance implements assign_owner(requested_by, owner) as defined by BulkActionMixinModel.
    """
    success_ids = []
    owner = get_object_or_404(User, id=owner_id)
    for obj in instances:
        try:
            with transaction.atomic():
                obj.assign_owner(requested_by, owner)
            success_ids.append(obj.id)
        except Exception:
            # Skip instances where assign_owner fails (e.g., due to permission or state issues)
            continue
    return success_ids


def assign_tags(instances, tag_ids):
    """
    Updates the tags for each instance.
    Ensures that only the provided tags remain.
    Uses bulk operations for efficiency.
    Returns the processed instances.
    """
    # Determine which tags actually exist.
    existing_tag_ids = set(
        Tag.objects.filter(id__in=tag_ids).values_list("id", flat=True)
    )
    with transaction.atomic():
        for obj in instances:
            current_tags = set(obj.tags.values_list("id", flat=True))
            tags_to_add = existing_tag_ids - current_tags
            tags_to_remove = current_tags - existing_tag_ids

            # Remove any tags that are not in the provided list.
            if tags_to_remove:
                obj.tags.remove(*tags_to_remove)

            # Dynamically determine the through model and foreign-key field name.
            through_model = obj._meta.get_field("tags").remote_field.through
            m2m_field = obj._meta.get_field("tags")
            field_name = m2m_field.m2m_field_name() + "_id"
            associations = [
                through_model(**{field_name: obj.id, "tag_id": tag_id})
                for tag_id in tags_to_add
            ]
            through_model.objects.bulk_create(associations, ignore_conflicts=True)
    return instances


def write_note(instances, user, note_text):
    """
    Adds a note to each selected instance using bulk_create for efficiency.
    Determines the proper foreign key for Note using the instance’s get_note_field() method.
    Returns the number of notes created.
    """
    notes_to_create = []
    for obj in instances:
        note_field = _get_note_field_for_instance(obj)
        note_kwargs = {
            "user": user,
            "note": note_text,
            note_field: obj,
        }
        notes_to_create.append(Note(**note_kwargs))
    Note.objects.bulk_create(notes_to_create)
    return len(notes_to_create)


def change_status(instances, new_status, user=None):
    """
    Uses Django FSM to apply valid state transitions on each instance.
    Assumes each instance implements get_state_service() to return its appropriate state service.
    Returns a list of IDs for instances that were successfully updated.
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
    return success_ids


def assign_population_set(instances, population_set_id):
    # TODO: Implement this function generically.
    # For now, you might raise a NotImplementedError.
    raise NotImplementedError("assign_population_set is not implemented yet.")


def _get_note_field_for_instance(instance):
    for field in Note._meta.fields:
        # Check if the field is a ForeignKey and the related model matches the instance’s class.
        if isinstance(field, ForeignKey) and field.related_model == instance.__class__:
            return field.name
    raise Exception(f"No matching Note field for model {instance.__class__.__name__}")


def get_assignable_users_data(roles=None):
    """
    Returns minimal user data for profiles whose role field(s) match.

    :param roles: A list of role field names on Profile to filter by.
                  For example, ['is_curator', 'is_triage_operator'].
                  If None, no role filtering is applied.
    :return: Serialized minimal user data.
    """
    if roles:
        # Build a Q object that ORs all role filters.
        q = Q()
        for role in roles:
            q |= Q(**{role: True})
        assignable_users = Profile.objects.filter(q).select_related("user")
    else:
        assignable_users = Profile.objects.all().select_related("user")
    return MinimalUserSerializer([p.user for p in assignable_users], many=True).data


def get_common_transitions(queryset, user):
    transitions_list = []
    for obj in queryset:
        if hasattr(obj, "get_available_state_transitions"):
            state_field = obj._meta.get_field("state")
            transitions = {
                transition.name
                for transition in get_available_user_FIELD_transitions(obj, user, state_field)
            }
            transitions_list.append(transitions)
    if transitions_list:
        common = set.intersection(*transitions_list)
    else:
        common = set()
    return list(common)
