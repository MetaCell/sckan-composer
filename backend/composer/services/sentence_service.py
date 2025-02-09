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


def assign_tag(sentences, tag_id):
    """
    Assigns a tag to the selected sentences.
    Instead of looping over each sentence and calling `.add()`,
    it uses the through model and bulk_create with ignore_conflicts to add associations.
    Returns a list of sentence IDs that received the new tag.
    """
    tag = get_object_or_404(Tag, id=tag_id)
    sentence_ids = list(sentences.values_list("id", flat=True))

    # Identify which sentences do not already have this tag.
    existing_ids = list(
        Sentence.tags.through.objects.filter(
            tag_id=tag.id, sentence_id__in=sentence_ids
        ).values_list("sentence_id", flat=True)
    )
    new_ids = set(sentence_ids) - set(existing_ids)
    associations = [
        Sentence.tags.through(sentence_id=sentence_id, tag_id=tag.id)
        for sentence_id in new_ids
    ]
    Sentence.tags.through.objects.bulk_create(associations, ignore_conflicts=True)
    return list(new_ids)


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
