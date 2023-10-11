from enum import Enum

from django.db import models


# Create your enums here.
class Laterality(models.TextChoices):
    RIGHT = "RIGHT", "Right"
    LEFT = "LEFT", "Left"
    UNKNOWN = "UNKNOWN", "Not specified"


class Projection(models.TextChoices):
    IPSI = "IPSI", "Ipsi"
    CONTRAT = "CONTRAT", "Contrat"
    BI = "BI", "Bilateral"
    UNKNOWN = "UNKNOWN", "Not specified"


# todo: motor and sensory should move to phenotype options per csv
# also anaxonic is not set as option in the csv
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
    TRANSITION = "transition"
    ALERT = "alert"


class ExportRelationships(models.TextChoices):
    hasBiologicalSex = "hasBiologicalSex", "Sex"
    hasCircuitRolePhenotype = "hasCircuitRolePhenotype", "CircuitRole"
    hasAnatomicalSystemPhenotype = "hasAnatomicalSystemPhenotype", "Phenotype"
    hasFunctionalCircuitRolePhenotype = "hasFunctionalCircuitRolePhenotype", "FunctionalCircuitRole"
    hasInstanceInTaxon = "hasInstanceInTaxon", "Species"
    hasProjectionLaterality = "hasProjectionLaterality", "Laterality"
    hasSomaPhenotype = "hasSomaPhenotype", "SomaPhenotype"
    hasAlert = "hasAlert", "Alert"
    hasSomaLocatedIn = "hasSomaLocatedIn", "Soma"
    hasProjectionPhenotype = "hasProjectionPhenotype", "ProjectionPhenotype"
    hasAxonPresynapticElementIn = "hasAxonPresynapticElementIn", "Axon terminal"
    hasAxonSensorySubcellularElementIn = "hasAxonSensorySubcellularElementIn", "Afferent terminal",
    hasAxonLocatedIn = "hasAxonLocatedIn", "Axon"
    hasDendriteLocatedIn = "hasDendriteLocatedIn", "Dendrite"
    hasForwardConnection = "hasForwardConnectionPhenotype", "Forward Connection"


class MetricEntity(models.TextChoices):
    SENTENCE = "sentence"
    CONNECTIVITY_STATEMENT = "connectivity statement"


class ConnectivityErrors(Enum):
    INVALID_FORWARD_CONNECTION = "Invalid forward connection"
