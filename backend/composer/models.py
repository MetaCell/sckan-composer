from django.contrib.auth.models import User
from django.db import models

from django_fsm import FSMField, transition


# Create your enums here.
class Laterality(models.TextChoices):
    IPSI    = "1", "Ipsi"
    CONTRAT = "2", "Contrat"
    BI      = "3", "Bilateral"
    UNKNOWN = "4", "Not specified"


class CircuitType(models.TextChoices):
    SENSORY    = "1", "Sensory"
    MOTOR      = "2", "Motor"
    INTRINSIC  = "3", "Instrinsic"
    PROJECTION = "4", "Projection"
    ANAXONIC   = "5", "Anaxonic"
    UNKNOWN    = "6", "Not specified"
    

class DestinationType(models.TextChoices):
    # axon sensory ending, axon terminal, axon sensory terminal
    AXON_SE = "1", "Axon sensory ending"
    AXON_T  = "2", "Axon terminal"
    AXON_ST = "3", "Axon sensory terminal"


# Create your models here.
class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    is_triageOperator = models.BooleanField(default=False)
    is_curator = models.BooleanField(default=False)
    is_reviewer = models.BooleanField(default=False)


class AnsDivision(models.Model):
    name = models.CharField(max_length=200, db_index=True, unique=True)

    def __str__(self):
        return self.name
    
    class Meta:
        ordering = ["name"]
        verbose_name_plural = "ANS Divisions"


class Specie(models.Model):
    name = models.CharField(max_length=200, db_index=True, unique=True)

    def __str__(self):
        return self.name
    
    class Meta:
        ordering = ["name"]
        verbose_name_plural = "Species"


class AnatomicalEntity(models.Model):
    name = models.CharField(max_length=200, db_index=True, unique=True)
    ontology_uri = models.URLField()

    def __str__(self):
        return self.name
    
    class Meta:
        ordering = ["name"]
        verbose_name_plural = "Anatomical Entities"


class NoteTag(models.Model):
    tag = models.CharField(max_length=200, db_index=True, unique=True)

    def __str__(self):
        return self.tag

    class Meta:
        ordering = ["tag"]
        verbose_name_plural = "Note Tags"


class Provenance(models.Model):
    title = models.CharField(max_length=200, db_index=True)
    description = models.TextField(db_index=True)
    pmid = models.BigIntegerField(db_index=True)
    pmcid = models.BigIntegerField(db_index=True)
    uri = models.URLField()
    laterality = models.CharField(max_length=1, default=Laterality.UNKNOWN, choices=Laterality.choices)
    circuit_type = models.CharField(max_length=1, default=CircuitType.UNKNOWN, choices=CircuitType.choices)
    ans_division = models.ForeignKey(AnsDivision, verbose_name="ANS Division", on_delete=models.DO_NOTHING)
    species = models.ManyToManyField(Specie, verbose_name="Species")
    biological_sex = models.CharField(max_length=200, null=True)
    apinatomy_model = models.CharField(max_length=200, null=True)

    def __str__(self):
        return self.title

    class Meta:
        ordering = ["title"]
        verbose_name_plural = "Provenances"
        constraints = [
            models.CheckConstraint(check=models.Q(laterality__in=[l[0] for l in Laterality.choices]), name="laterality_valid"),
            models.CheckConstraint(check=models.Q(circuit_type__in=[c[0] for c in CircuitType.choices]), name="circuit_type_valid"),
        ]



class ConnectivityStatement(models.Model):
    class STATE:
        OPEN               = "open"
        COMPOSE_LATER      = "compose_later"
        COMPOSE_NOW        = "compose_now"
        CURATED            = "curated"
        EXCLUDED           = "excluded"
        REVIEWED           = "reviewed"
        CONNECTION_MISSING = "connection_missing"
        APPROVED           = "approved"

    provenance = models.ForeignKey(Provenance, verbose_name="Provenance", on_delete=models.DO_NOTHING)
    knowledge_statement = models.TextField(db_index=True)
    uri = models.URLField()
    state = FSMField(default=STATE.OPEN, protected=True)
    origin = models.ForeignKey(AnatomicalEntity, verbose_name="Origin", on_delete=models.DO_NOTHING, related_name="origin", null=True)
    destination = models.ForeignKey(AnatomicalEntity, verbose_name="Destination", on_delete=models.DO_NOTHING, related_name="destination", null=True)
    destination_type = models.CharField(max_length=1, default=DestinationType.AXON_SE, choices=DestinationType.choices, null=True)
    curator = models.ForeignKey(User, verbose_name="Curator", on_delete=models.DO_NOTHING, null=True, blank=True)
    path = models.ManyToManyField(AnatomicalEntity, verbose_name="Path", through="Via")

    def __str__(self):
        suffix = ""
        if len(self.knowledge_statement) > 49:
            suffix = "..."
        return f"{self.knowledge_statement[:50]}{suffix}"
    
    # states
    @transition(field=state, source=[STATE.OPEN, STATE.COMPOSE_LATER], target=STATE.COMPOSE_NOW)
    def compose_now(self):
        pass
    @transition(field=state, source=STATE.OPEN, target=STATE.COMPOSE_LATER)
    def compose_later(self):
        pass
    @transition(field=state, source=[STATE.OPEN, STATE.CURATED], target=STATE.EXCLUDED)
    def excluded(self):
        pass
    @transition(field=state, source=STATE.COMPOSE_NOW, target=STATE.CURATED)
    def curated(self):
        pass
    @transition(field=state, source=STATE.CURATED, target=STATE.REVIEWED)
    def reviewed(self):
        pass
    @transition(field=state, source=STATE.CURATED, target=STATE.CONNECTION_MISSING)
    def connection_missing(self):
        pass
    @transition(field=state, source=STATE.CONNECTION_MISSING, target=STATE.REVIEWED)
    def connection_solved(self):
        pass
    @transition(field=state, source=STATE.REVIEWED, target=STATE.APPROVED)
    def approved(self):
        pass

    class Meta:
        ordering = ["knowledge_statement"]
        verbose_name_plural = "Connectivity Statements"


class Via(models.Model):
    connectivity_statement = models.ForeignKey(ConnectivityStatement, verbose_name="Connectivity Statement", on_delete=models.CASCADE)
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
    note = models.TextField()
    tags = models.ManyToManyField(NoteTag, verbose_name="Tags")
    user = models.ForeignKey(User, verbose_name="User", on_delete=models.DO_NOTHING)
    provenance = models.ForeignKey(Provenance, verbose_name="Provenance", on_delete=models.DO_NOTHING, null=True, blank=True)
    connectivity_statement = models.ForeignKey(ConnectivityStatement, verbose_name="Connectivity Statement", on_delete=models.CASCADE, null=True, blank=True)

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
