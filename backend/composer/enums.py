from enum import Enum

from django.db import models


# Create your enums here.
class Laterality(models.TextChoices):
    IPSI = "IPSI", "Ipsi"
    CONTRAT = "ONTRAT", "Contrat"
    BI = "BI", "Bilateral"
    UNKNOWN = "UNKNOWN", "Not specified"


class CircuitType(models.TextChoices):
    SENSORY = "SENSORY", "Sensory"
    MOTOR = "MOTOR", "Motor"
    INTRINSIC = "INTRINSIC", "Intrinsic"
    PROJECTION = "PROJECTION", "Projection"
    ANAXONIC = "ANAXONIC", "Anaxonic"
    UNKNOWN = "UNKNOWN", "Not specified"


class ViaType(models.TextChoices):
    # axon sensory ending, axon terminal, axon sensory terminal
    AXON = "AXON", "Axon"
    DENDRITE = "DENDRITE", "Dendrite"


class DestinationType(models.TextChoices):
    # axon sensory ending, axon terminal, axon sensory terminal
    AXON_T = "AXON-T", "Axon terminal"
    AFFERENT_T = "AFFERENT-T", "Afferent terminal"
    UNKNOWN = "UNKNOWN", "Not specified"


class SentenceState(models.TextChoices):
    OPEN = "open"
    TO_BE_REVIEWED = "to_be_reviewed"
    COMPOSE_LATER = "compose_later"
    COMPOSE_NOW = "compose_now"
    EXCLUDED = "excluded"
    DUPLICATE = "duplicate"


class CSState(models.TextChoices):
    # Connectivity Statement States
    DRAFT = "draft"
    COMPOSE_NOW = "compose_now"
    CURATED = "curated"
    EXCLUDED = "excluded"
    REJECTED = "rejected"
    TO_BE_REVIEWED = "to_be_reviewed"
    CONNECTION_MISSING = "connection_missing"
    NPO_APPROVED = "npo_approved"
    EXPORTED = "exported"


class NoteType(models.TextChoices):
    PLAIN = "plain"
    DIFFERENT = "different"


class ExportRelationships(Enum):
    hasBiologicalSex = "hasBiologicalSex"
    hasCircuitRolePhenotype = "hasCircuitRolePhenotype"
    hasPhenotype = "hasPhenotype"
    hasFunctionalCircuitRolePhenotype = "hasFunctionalCircuitRolePhenotype"
    hasInstanceInTaxon = "hasInstanceInTaxon"
    hasProjectionLaterality = "hasProjectionLaterality"
    hasSomaPhenotype = "hasSomaPhenotype"
    hasAlert = "hasAlert"
    soma = "Soma"
