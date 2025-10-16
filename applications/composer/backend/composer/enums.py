
from django.db import models
from composer.pure_enums import (
    CircuitType as PureCircuitType,
    SentenceState as PureSentenceState,
    CSState as PureCSState,
)


# Create your enums here.
class Laterality(models.TextChoices):
    RIGHT = "RIGHT", "Right"
    LEFT = "LEFT", "Left"


class Projection(models.TextChoices):
    IPSI = "IPSI", "ipsilateral"
    CONTRAT = "CONTRAT", "contralateral"
    BI = "BI", "bilateral"


class CircuitType(models.TextChoices):
    """
    Django TextChoices wrapper for CircuitType.
    Uses values from pure_enums.CircuitType as the single source of truth.
    """
    SENSORY = PureCircuitType.SENSORY.value, "Sensory"
    MOTOR = PureCircuitType.MOTOR.value, "Motor"
    INTRINSIC = PureCircuitType.INTRINSIC.value, "Intrinsic"
    PROJECTION = PureCircuitType.PROJECTION.value, "Projection"
    ANAXONIC = PureCircuitType.ANAXONIC.value, "Anaxonic"


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
    """
    Django TextChoices wrapper for SentenceState.
    Uses values from pure_enums.SentenceState as the single source of truth.
    """
    OPEN = PureSentenceState.OPEN.value
    NEEDS_FURTHER_REVIEW = PureSentenceState.NEEDS_FURTHER_REVIEW.value
    COMPOSE_LATER = PureSentenceState.COMPOSE_LATER.value
    READY_TO_COMPOSE = PureSentenceState.READY_TO_COMPOSE.value
    COMPOSE_NOW = PureSentenceState.COMPOSE_NOW.value
    COMPLETED = PureSentenceState.COMPLETED.value
    EXCLUDED = PureSentenceState.EXCLUDED.value


class CSState(models.TextChoices):
    """
    Django TextChoices wrapper for CSState.
    Uses values from pure_enums.CSState as the single source of truth.
    """
    DRAFT = PureCSState.DRAFT.value
    COMPOSE_NOW = PureCSState.COMPOSE_NOW.value
    IN_PROGRESS = PureCSState.IN_PROGRESS.value
    TO_BE_REVIEWED = PureCSState.TO_BE_REVIEWED.value
    REVISE = PureCSState.REVISE.value
    REJECTED = PureCSState.REJECTED.value
    NPO_APPROVED = PureCSState.NPO_APPROVED.value
    EXPORTED = PureCSState.EXPORTED.value
    DEPRECATED = PureCSState.DEPRECATED.value
    INVALID = PureCSState.INVALID.value


class NoteType(models.TextChoices):
    PLAIN = "plain"
    DIFFERENT = "different"
    TRANSITION = "transition"
    ALERT = "alert"


class MetricEntity(models.TextChoices):
    SENTENCE = "sentence"
    CONNECTIVITY_STATEMENT = "connectivity statement"


class RelationshipType(models.TextChoices):
    TRIPLE_SINGLE = "triple_single", "Triple - Single select"
    TRIPLE_MULTI = "triple_multi", "Triple - Multi select"
    ANATOMICAL_MULTI = "anatomical_multi", "Anatomical Entity - Multi select"
    TEXT = "text", "Text area"