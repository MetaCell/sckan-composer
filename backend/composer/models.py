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
    

# Create your models here.
class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    isTriageOperator = models.BooleanField(default=False)
    isCurator = models.BooleanField(default=False)
    isReviewer = models.BooleanField(default=False)


class AnsDivision(models.Model):
    name = models.CharField(max_length=200, unique=True)

    def __str__(self):
        return self.name
    
    class Meta:
        ordering = ["name"]
        verbose_name_plural = "ANS Divisions"


class Specie(models.Model):
    name = models.CharField(max_length=200, unique=True)

    def __str__(self):
        return self.name
    
    class Meta:
        ordering = ["name"]
        verbose_name_plural = "Species"


class Provenance(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    pmid = models.BigIntegerField()
    pmcid = models.BigIntegerField()
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
    knowledge_statement = models.TextField()
    uri = models.URLField()
    state = FSMField(default=STATE.OPEN, protected=True)

    def __str__(self):
        return self.knowledge_statement
    
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
