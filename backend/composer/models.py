from django.contrib.auth.models import User
from django.db import models

from django_fsm import FSMField, transition

from .services import ProvenanceStatementService


# Create your enums here.
class Laterality(models.TextChoices):
    IPSI    = "IPSI", "Ipsi"
    CONTRAT = "ONTRAT", "Contrat"
    BI      = "BI", "Bilateral"
    UNKNOWN = "UNKNOWN", "Not specified"


class CircuitType(models.TextChoices):
    SENSORY    = "SENSORY", "Sensory"
    MOTOR      = "MOTOR", "Motor"
    INTRINSIC  = "INTRINSIC", "Intrinsic"
    PROJECTION = "PROJECTION", "Projection"
    ANAXONIC   = "ANAXONIC", "Anaxonic"
    UNKNOWN    = "UNKNOWN", "Not specified"
    

class DestinationType(models.TextChoices):
    # axon sensory ending, axon terminal, axon sensory terminal
    AXON_SE = "AXON-SE", "Axon sensory ending"
    AXON_T  = "AXON-T", "Axon terminal"
    AXON_ST = "AXON-ST", "Axon sensory terminal"
    UNKNOWN = "UNKNOW", "Not specified"


class ProvenanceState(models.TextChoices):
    OPEN           = "open"
    TO_BE_REVIEWED = "to_be_reviewed"
    COMPOSE_LATER  = "compose_later"
    COMPOSE_NOW    = "compose_now"
    EXCLUDED       = "excluded"
    DUPLICATE      = "duplicate"


class CSState(models.TextChoices):
    # Connectivity Statement States
    DRAFT              = "draft"
    COMPOSE_NOW        = "compose_now"
    CURATED            = "curated"
    EXCLUDED           = "excluded"
    REJECTED           = "rejected"
    TO_BE_REVIEWED     = "to_be_reviewed"
    CONNECTION_MISSING = "connection_missing"
    NPO_APPROVED       = "npo_approved"
    APPROVED           = "approved"

# Create your models here.
class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    is_triageOperator = models.BooleanField(default=False)
    is_curator = models.BooleanField(default=False)
    is_reviewer = models.BooleanField(default=False)


class AnsDivision(models.Model):
    """ANS Division"""
    name = models.CharField(max_length=200, db_index=True, unique=True)

    def __str__(self):
        return self.name
    
    class Meta:
        ordering = ["name"]
        verbose_name_plural = "ANS Divisions"


class Specie(models.Model):
    """Specie"""
    name = models.CharField(max_length=200, db_index=True, unique=True)

    def __str__(self):
        return self.name
    
    class Meta:
        ordering = ["name"]
        verbose_name_plural = "Species"


class AnatomicalEntity(models.Model):
    """Anatomical Entity"""
    name = models.CharField(max_length=200, db_index=True, unique=True)
    ontology_uri = models.URLField()

    def __str__(self):
        return self.name
    
    class Meta:
        ordering = ["name"]
        verbose_name_plural = "Anatomical Entities"


class NoteTag(models.Model):
    """Note Tag"""
    tag = models.CharField(max_length=200, db_index=True, unique=True)

    def __str__(self):
        return self.tag

    class Meta:
        ordering = ["tag"]
        verbose_name_plural = "Note Tags"


class Provenance(models.Model):
    """Provenance"""
    title = models.CharField(max_length=200, db_index=True)
    description = models.TextField(db_index=True)
    pmid = models.BigIntegerField(db_index=True)
    uri = models.URLField()
    state = FSMField(default=ProvenanceState.OPEN, protected=True)

    def __str__(self):
        return self.title

    # states
    @transition(field=state, source=[ProvenanceState.TO_BE_REVIEWED, ProvenanceState.COMPOSE_LATER], target=ProvenanceState.OPEN)
    def open(self):
        ...
    @transition(field=state, source=ProvenanceState.OPEN, target=ProvenanceState.TO_BE_REVIEWED)
    def to_be_reviewed(self):
        ...
    @transition(field=state, source=ProvenanceState.OPEN, target=ProvenanceState.COMPOSE_LATER)
    def compose_later(self):
        ...
    @transition(field=state, source=ProvenanceState.TO_BE_REVIEWED, target=ProvenanceState.COMPOSE_NOW)
    def compose_now(self):
        ProvenanceStatementService(self).do_transition_compose_now()
    @transition(field=state, source=ProvenanceState.OPEN, target=ProvenanceState.EXCLUDED)
    def excluded(self):
        ...
    @transition(field=state, source=ProvenanceState.OPEN, target=ProvenanceState.DUPLICATE)
    def duplicate(self):
        ...

    class Meta:
        ordering = ["title"]
        verbose_name_plural = "Provenances"
        constraints = [
            models.CheckConstraint(check=models.Q(state__in=[l[0] for l in ProvenanceState.choices]), name="provenance_state_valid"),
        ]


class ConnectivityStatement(models.Model):
    """Connectivity Statement"""
    provenance = models.ForeignKey(Provenance, verbose_name="Provenance", on_delete=models.DO_NOTHING)
    knowledge_statement = models.TextField(db_index=True)
    uri = models.URLField()
    state = FSMField(default=CSState.DRAFT, protected=True)
    origin = models.ForeignKey(AnatomicalEntity, verbose_name="Origin", on_delete=models.DO_NOTHING, related_name="origin", null=True, blank=True)
    destination = models.ForeignKey(AnatomicalEntity, verbose_name="Destination", on_delete=models.DO_NOTHING, related_name="destination", null=True, blank=True)
    destination_type = models.CharField(max_length=10, default=DestinationType.UNKNOWN, choices=DestinationType.choices)
    curator = models.ForeignKey(User, verbose_name="Curator", on_delete=models.DO_NOTHING, null=True, blank=True)
    path = models.ManyToManyField(AnatomicalEntity, verbose_name="Path", through="Via",blank=True)
    laterality = models.CharField(max_length=20, default=Laterality.UNKNOWN, choices=Laterality.choices)
    circuit_type = models.CharField(max_length=20, default=CircuitType.UNKNOWN, choices=CircuitType.choices)
    ans_division = models.ForeignKey(AnsDivision, verbose_name="ANS Division", on_delete=models.DO_NOTHING, null=True, blank=True)
    species = models.ManyToManyField(Specie, verbose_name="Species", blank=True)
    biological_sex = models.CharField(max_length=200, null=True, blank=True)
    apinatomy_model = models.CharField(max_length=200, null=True, blank=True)

    def __str__(self):
        suffix = ""
        if len(self.knowledge_statement) > 49:
            suffix = "..."
        return f"{self.knowledge_statement[:50]}{suffix}"
    
    # states
    @transition(field=state, source=[CSState.DRAFT, CSState.REJECTED], target=CSState.COMPOSE_NOW)
    def compose_now(self):
        pass
    @transition(field=state, source=[CSState.COMPOSE_NOW, CSState.CONNECTION_MISSING], target=CSState.CURATED)
    def curated(self):
        pass
    @transition(field=state, source=CSState.COMPOSE_NOW, target=CSState.CONNECTION_MISSING)
    def connection_missing(self):
        pass
    @transition(field=state, source=CSState.CURATED, target=CSState.TO_BE_REVIEWED)
    def to_be_reviewed(self):
        pass
    @transition(field=state, source=CSState.TO_BE_REVIEWED, target=CSState.EXCLUDED)
    def excluded(self):
        pass
    @transition(field=state, source=CSState.TO_BE_REVIEWED, target=CSState.REJECTED)
    def rejected(self):
        pass
    @transition(field=state, source=CSState.TO_BE_REVIEWED, target=CSState.NPO_APPROVED)
    def npo_approved(self):
        pass
    @transition(field=state, source=CSState.NPO_APPROVED, target=CSState.APPROVED)
    def approved(self):
        pass
        

    class Meta:
        ordering = ["knowledge_statement"]
        verbose_name_plural = "Connectivity Statements"
        constraints = [
            models.CheckConstraint(check=models.Q(state__in=[l[0] for l in CSState.choices]), name="state_valid"),
            models.CheckConstraint(check=models.Q(laterality__in=[l[0] for l in Laterality.choices]), name="laterality_valid"),
            models.CheckConstraint(check=models.Q(circuit_type__in=[c[0] for c in CircuitType.choices]), name="circuit_type_valid"),
        ]


class Via(models.Model):
    """Via"""
    connectivity_statement = models.ForeignKey(ConnectivityStatement, verbose_name="Connectivity Statement", on_delete=models.CASCADE, related_name="path_set")
    anatomical_entity = models.ForeignKey(AnatomicalEntity, verbose_name="Anatomical Entity", on_delete=models.DO_NOTHING)
    ordering = models.PositiveIntegerField(
        default=0,
        blank=False,
        null=False,
    )

    def __str__(self):
        return f"{self.connectivity_statement} - {self.anatomical_entity}"
    
    class Meta:
        ordering = ["ordering"]
        verbose_name_plural = "Via"


class Note(models.Model):
    """Note"""
    note = models.TextField()
    tags = models.ManyToManyField(NoteTag, verbose_name="Tags")
    user = models.ForeignKey(User, verbose_name="User", on_delete=models.DO_NOTHING)
    provenance = models.ForeignKey(Provenance, verbose_name="Provenance", on_delete=models.DO_NOTHING, null=True, blank=True, related_name="notes")
    connectivity_statement = models.ForeignKey(ConnectivityStatement, verbose_name="Connectivity Statement", on_delete=models.CASCADE, null=True, blank=True, related_name="notes")

    def __str__(self):
        return self.note

    class Meta:
        ordering = ["note"]
        verbose_name_plural = "Notes"
        constraints = [
            models.CheckConstraint(check=
                models.Q(
                    provenance__isnull=False,
                    connectivity_statement__isnull=True,
                )
                | models.Q(
                    provenance__isnull=True,
                    connectivity_statement__isnull=False,
                ), name="only_provenance_or_connectivity_statement"),
        ]
