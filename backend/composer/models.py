from django.contrib.auth.models import User
from django.db import models
from django.db.models import Q

from django_fsm import FSMField, transition

from .services import ConnectivityStatementService, ProvenanceService
from .enums import Laterality, CircuitType, DestinationType, ProvenanceState, CSState


# Create your models here.
class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    is_triage_operator = models.BooleanField(default=False)
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


class Tag(models.Model):
    """Tag"""

    tag = models.CharField(max_length=200, db_index=True, unique=True)

    def __str__(self):
        return self.tag

    class Meta:
        ordering = ["tag"]
        verbose_name_plural = "Tags"


class Provenance(models.Model):
    """Provenance"""

    title = models.CharField(max_length=200, db_index=True)
    description = models.TextField(db_index=True)
    state = FSMField(default=ProvenanceState.OPEN, protected=True)
    pmid = models.BigIntegerField(db_index=True, null=True, blank=True)
    pmcid = models.CharField(max_length=10, db_index=True, null=True, blank=True)
    tags = models.ManyToManyField(Tag, verbose_name="Tags")
    owner = models.ForeignKey(
        User,
        verbose_name="Triage Operator",
        on_delete=models.DO_NOTHING,
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.title

    # states
    @transition(
        field=state,
        source=[ProvenanceState.TO_BE_REVIEWED, ProvenanceState.COMPOSE_LATER],
        target=ProvenanceState.OPEN,
    )
    def open(self):
        ...

    @transition(
        field=state, source=ProvenanceState.OPEN, target=ProvenanceState.TO_BE_REVIEWED
    )
    def to_be_reviewed(self):
        ...

    @transition(
        field=state, source=ProvenanceState.OPEN, target=ProvenanceState.COMPOSE_LATER
    )
    def compose_later(self):
        ...

    @transition(
        field=state,
        source=ProvenanceState.TO_BE_REVIEWED,
        target=ProvenanceState.COMPOSE_NOW,
    )
    def compose_now(self):
        ProvenanceService(self).do_transition_compose_now()

    @transition(
        field=state, source=ProvenanceState.OPEN, target=ProvenanceState.EXCLUDED
    )
    def excluded(self):
        ...

    @transition(
        field=state, source=ProvenanceState.OPEN, target=ProvenanceState.DUPLICATE
    )
    def duplicate(self):
        ...

    def assign_owner(self, request):
        if ProvenanceService(self).should_set_owner(request):
            self.owner = request.user
            self.save(update_fields=["owner"])

    @property
    def pmid_uri(self):
        return f"https://pubmed.ncbi.nlm.nih.gov/{self.pmid}/" if self.pmid else None

    @property
    def pmcid_uri(self):
        return (
            f"https://www.ncbi.nlm.nih.gov/pmc/articles/{self.pmcid}/"
            if self.pmcid
            else None
        )

    class Meta:
        ordering = ["title"]
        verbose_name_plural = "Provenances"
        constraints = [
            models.CheckConstraint(
                check=Q(state__in=[l[0] for l in ProvenanceState.choices]),
                name="provenance_state_valid",
            ),
            models.CheckConstraint(
                check=Q(pmid__isnull=False) | Q(pmcid__isnull=False),
                name="provenance_pmid_pmcd_valid",
            ),
        ]


class Via(models.Model):
    """Via"""

    connectivity_statement = models.ForeignKey(
        "ConnectivityStatement",
        on_delete=models.CASCADE,
    )
    anatomical_entity = models.ForeignKey(AnatomicalEntity, on_delete=models.DO_NOTHING)
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


class ConnectivityStatement(models.Model):
    """Connectivity Statement"""

    provenance = models.ForeignKey(
        Provenance, verbose_name="Provenance", on_delete=models.DO_NOTHING
    )
    knowledge_statement = models.TextField(db_index=True)
    state = FSMField(default=CSState.DRAFT, protected=True)
    origin = models.ForeignKey(
        AnatomicalEntity,
        verbose_name="Origin",
        on_delete=models.DO_NOTHING,
        related_name="origin",
        null=True,
        blank=True,
    )
    destination = models.ForeignKey(
        AnatomicalEntity,
        verbose_name="Destination",
        on_delete=models.DO_NOTHING,
        related_name="destination",
        null=True,
        blank=True,
    )
    destination_type = models.CharField(
        max_length=10, default=DestinationType.UNKNOWN, choices=DestinationType.choices
    )
    owner = models.ForeignKey(
        User, verbose_name="Curator", on_delete=models.DO_NOTHING, null=True, blank=True
    )
    path = models.ManyToManyField(AnatomicalEntity, through=Via, blank=True)
    laterality = models.CharField(
        max_length=20, default=Laterality.UNKNOWN, choices=Laterality.choices
    )
    circuit_type = models.CharField(
        max_length=20, default=CircuitType.UNKNOWN, choices=CircuitType.choices
    )
    ans_division = models.ForeignKey(
        AnsDivision,
        verbose_name="ANS Division",
        on_delete=models.DO_NOTHING,
        null=True,
        blank=True,
    )
    species = models.ManyToManyField(Specie, verbose_name="Species", blank=True)
    tags = models.ManyToManyField(Tag, verbose_name="Tags")
    biological_sex = models.CharField(max_length=200, null=True, blank=True)
    apinatomy_model = models.CharField(max_length=200, null=True, blank=True)

    def __str__(self):
        suffix = ""
        if len(self.knowledge_statement) > 49:
            suffix = "..."
        return f"{self.knowledge_statement[:50]}{suffix}"

    # states
    @transition(
        field=state,
        source=[CSState.DRAFT, CSState.REJECTED],
        target=CSState.COMPOSE_NOW,
    )
    def compose_now(self):
        pass

    @transition(
        field=state,
        source=[CSState.COMPOSE_NOW, CSState.CONNECTION_MISSING],
        target=CSState.CURATED,
    )
    def curated(self):
        pass

    @transition(
        field=state, source=CSState.COMPOSE_NOW, target=CSState.CONNECTION_MISSING
    )
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

    def assign_owner(self, request):
        if ConnectivityStatementService(self).should_set_owner(request):
            self.owner = request.user
            self.save(update_fields=["owner"])

    class Meta:
        ordering = ["knowledge_statement"]
        verbose_name_plural = "Connectivity Statements"
        constraints = [
            models.CheckConstraint(
                check=Q(state__in=[l[0] for l in CSState.choices]), name="state_valid"
            ),
            models.CheckConstraint(
                check=Q(laterality__in=[l[0] for l in Laterality.choices]),
                name="laterality_valid",
            ),
            models.CheckConstraint(
                check=Q(circuit_type__in=[c[0] for c in CircuitType.choices]),
                name="circuit_type_valid",
            ),
        ]


class Doi(models.Model):
    """DOI see https://doi.org/"""

    connectivity_statement = models.ForeignKey(
        ConnectivityStatement, on_delete=models.CASCADE
    )
    doi = models.CharField(max_length=200)

    @property
    def doi_uri(self):
        return f"https://doi.org/doi/full/{self.doi}"

    def __str__(self):
        return self.doi

    class Meta:
        ordering = ["doi"]
        verbose_name_plural = "D.O.I.s"


class Note(models.Model):
    """Note"""

    note = models.TextField()
    user = models.ForeignKey(User, verbose_name="User", on_delete=models.DO_NOTHING)
    provenance = models.ForeignKey(
        Provenance,
        verbose_name="Provenance",
        on_delete=models.DO_NOTHING,
        null=True,
        blank=True,
        related_name="notes",
    )
    connectivity_statement = models.ForeignKey(
        ConnectivityStatement,
        verbose_name="Connectivity Statement",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="notes",
    )

    def __str__(self):
        return self.note

    class Meta:
        ordering = ["note"]
        verbose_name_plural = "Notes"
        constraints = [
            models.CheckConstraint(
                check=models.Q(
                    provenance__isnull=False,
                    connectivity_statement__isnull=True,
                )
                | models.Q(
                    provenance__isnull=True,
                    connectivity_statement__isnull=False,
                ),
                name="only_provenance_or_connectivity_statement",
            ),
        ]
