from django.shortcuts import get_object_or_404
from django.db import transaction
from django_fsm import TransitionNotAllowed
from composer.models import Sentence, Tag, Note, User
from composer.services.state_services import SentenceStateService



def assign_owner(sentences, requested_by, owner_id):
    """
    For each sentence, call sentence.assign_owner(requested_by, owner).
    
    Returns a list of sentence IDs that were successfully updated.
    """
    success_ids = []

    owner = get_object_or_404(User, id=owner_id)

    for sentence in sentences:
        try:
            with transaction.atomic():
                sentence.assign_owner(requested_by, owner)
            success_ids.append(sentence.id)
        except Exception:
            # On failure (e.g. not allowed to assign owner), skip this sentence.
            continue

    return success_ids


def assign_tags(sentences, tag_ids):
    """
    Updates the tags for the selected sentences.
    - Ensures only the provided tags remain.
    - Removes any tags that are not in the provided list.
    - Uses bulk operations for efficiency.
    """
    existing_tag_ids = set(Tag.objects.filter(id__in=tag_ids).values_list("id", flat=True))

    with transaction.atomic():
        for sentence in sentences:
            current_tags = set(sentence.tags.values_list("id", flat=True))

            # Determine which tags to add and remove
            tags_to_add = existing_tag_ids - current_tags
            tags_to_remove = current_tags - existing_tag_ids

            # Remove unwanted tags
            if tags_to_remove:
                sentence.tags.remove(*tags_to_remove)

            # Add missing tags
            associations = [
                Sentence.tags.through(sentence_id=sentence.id, tag_id=tag_id)
                for tag_id in tags_to_add
            ]
            Sentence.tags.through.objects.bulk_create(associations, ignore_conflicts=True)

    return sentences


def write_note(sentences, user, note_text):
    """
    Adds a note to each selected sentence using bulk_create for efficiency.
    Returns the number of sentences for which notes were added.
    """
    notes_to_create = [
        Note(user=user, sentence=sentence, note=note_text) for sentence in sentences
    ]
    Note.objects.bulk_create(notes_to_create)
    return notes_to_create


def change_status(sentences, new_status, user=None):
    """
    Uses Django FSM to apply valid state transitions.
    Wraps each sentence update in its own transaction to isolate failures.
    Returns a list of sentence IDs that were successfully updated.
    """
    success_ids = []

    for sentence in sentences:
        try:
            with transaction.atomic():
                state_service = SentenceStateService(sentence)
                state_service.do_transition(new_status, user)
                sentence.save()
            success_ids.append(sentence.id)
        except (TransitionNotAllowed, AttributeError):
            # Skip sentences that fail to transition.
            continue

    return success_ids


def assign_population_set(sentences, population_set_id):
    # TODO: Implement this function.
    # For now, simply return an empty list or raise a NotImplementedError.
    return []
