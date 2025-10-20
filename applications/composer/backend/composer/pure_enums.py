from enum import Enum


class ConnectivityErrors(Enum):
    INVALID_FORWARD_CONNECTION = "Invalid forward connection"


class BulkActionType(str, Enum):
    ASSIGN_USER = "assign_user"
    ASSIGN_TAG = "assign_tag"
    WRITE_NOTE = "write_note"
    CHANGE_STATUS = "change_status"
    ASSIGN_POPULATION_SET = "assign_population_set"


class CircuitType(str, Enum):
    """
    Circuit type enumeration - Django-independent.
    This is the single source of truth for circuit type values.
    """
    SENSORY = "SENSORY"
    MOTOR = "MOTOR"
    INTRINSIC = "INTRINSIC"
    PROJECTION = "PROJECTION"
    ANAXONIC = "ANAXONIC"


class SentenceState(str, Enum):
    """
    Sentence state enumeration - Django-independent.
    This is the single source of truth for sentence state values.
    """
    OPEN = "open"
    NEEDS_FURTHER_REVIEW = "needs_further_review"
    COMPOSE_LATER = "compose_later"
    READY_TO_COMPOSE = "ready_to_compose"
    COMPOSE_NOW = "compose_now"
    COMPLETED = "completed"
    EXCLUDED = "excluded"


class CSState(str, Enum):
    """
    Connectivity Statement state enumeration - Django-independent.
    This is the single source of truth for CS state values.
    """
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
