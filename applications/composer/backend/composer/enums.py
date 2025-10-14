from enum import Enum

from django.db import models


# Create your enums here.
class Laterality(models.TextChoices):
    RIGHT = "RIGHT", "Right"
    LEFT = "LEFT", "Left"


class Projection(models.TextChoices):
    IPSI = "IPSI", "ipsilateral"
    CONTRAT = "CONTRAT", "contralateral"
    BI = "BI", "bilateral"


# todo: motor and sensory should move to phenotype options per csv
# also anaxonic is not set as option in the csv
class CircuitType(models.TextChoices):
    SENSORY = "SENSORY", "Sensory"
    MOTOR = "MOTOR", "Motor"
    INTRINSIC = "INTRINSIC", "Intrinsic"
    PROJECTION = "PROJECTION", "Projection"
    ANAXONIC = "ANAXONIC", "Anaxonic"


class ViaType(models.TextChoices):
    # axon sensory ending, axon terminal, axon sensory terminal
    AXON = "AXON", "Axon"
    DENDRITE = "DENDRITE", "Dendrite"
    SENSORY_AXON = "SENSORY_AXON", "Axon to PNS"


class DestinationType(models.TextChoices):
    # axon sensory ending, axon terminal, axon sensory terminal
    AXON_T = "AXON-T", "Axon terminal"
    AFFERENT_T = "AFFERENT-T", "Afferent terminal"
    UNKNOWN = "UNKNOWN", "Not specified"


class SentenceState(models.TextChoices):
    OPEN = "open"
    NEEDS_FURTHER_REVIEW = "needs_further_review"
    COMPOSE_LATER = "compose_later"
    READY_TO_COMPOSE = "ready_to_compose"
    COMPOSE_NOW = "compose_now"
    COMPLETED = "completed"
    EXCLUDED = "excluded"


class CSState(models.TextChoices):
    # Connectivity Statement States
    DRAFT = "draft"
    COMPOSE_NOW = "compose_now"
    IN_PROGRESS = "in_progress"
    TO_BE_REVIEWED = "to_be_reviewed"
    REVISE = "revise"
    REJECTED = "rejected"
    NPO_APPROVED = "npo_approved"
    EXPORTED = "exported"
    DEPRECATED = "deprecated"
    INVALID = "invalid"


class NoteType(models.TextChoices):
    PLAIN = "plain"
    DIFFERENT = "different"
    TRANSITION = "transition"
    ALERT = "alert"


class MetricEntity(models.TextChoices):
    SENTENCE = "sentence"
    CONNECTIVITY_STATEMENT = "connectivity statement"


class ConnectivityErrors(Enum):
    INVALID_FORWARD_CONNECTION = "Invalid forward connection"


class BulkActionType(str, Enum):
    ASSIGN_USER = "assign_user"
    ASSIGN_TAG = "assign_tag"
    WRITE_NOTE = "write_note"
    CHANGE_STATUS = "change_status"
    ASSIGN_POPULATION_SET = "assign_population_set"

class RelationshipType(models.TextChoices):
    TRIPLE_SINGLE = "triple_single", "Triple - Single select"
    TRIPLE_MULTI = "triple_multi", "Triple - Multi select"
    ANATOMICAL_MULTI = "anatomical_multi", "Anatomical Entity - Multi select"
    TEXT = "text", "Text area"