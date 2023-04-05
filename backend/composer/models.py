from django.contrib.auth.models import User
from django.db import models
from django.db.models import Q
from django.forms.widgets import Input as InputWidget
from django_fsm import FSMField, transition

from .enums import (
    CircuitType,
    CSState,
    DestinationType,
    Laterality,
    SentenceState,
    NoteType,
    ViaType,
)
from composer.services.state_services import (
    ConnectivityStatementService,
    SentenceService,
)
from .utils import doi_uri, pmcid_uri, pmid_uri


# some django user overwrite
def get_name(self):
    if self.first_name or self.last_name:
        return "{} {}".format(self.first_name, self.last_name)
    return "{}".format(self.username)


User.add_to_class("__str__", get_name)


# custom widget + field classes
class DoiWidget(InputWidget):
    template_name = "composer/forms/widgets/doi_input.html"


class PmIdWidget(InputWidget):
    template_name = "composer/forms/widgets/pmid_input.html"


class PmcIdWidget(InputWidget):
    template_name = "composer/forms/widgets/pmcid_input.html"


class DoiField(models.CharField):
    def formfield(self, *args, **kwargs):
        kwargs.update(
            {
                "widget": DoiWidget,
            }
        )
        return super().formfield(*args, **kwargs)


class PmIdField(models.IntegerField):
    def formfield(self, *args, **kwargs):
        kwargs.update(
            {
                "widget": PmIdWidget,
            }
        )
        return super().formfield(*args, **kwargs)


class PmcIdField(models.CharField):
    def formfield(self, *args, **kwargs):
        kwargs.update(
            {
                "widget": PmcIdWidget,
            }
        )
        return super().formfield(*args, **kwargs)


# Model Managers
class ConnectivityStatementManager(models.Manager):
    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .select_related(
                "owner",
                "origin",
                "destination",
                "ans_division",
                "sentence",
            )
            .prefetch_related("notes", "tags", "species")
        )

    def excluding_draft(self):
        return self.get_queryset().exclude(state=CSState.DRAFT)


class SentenceStatementManager(models.Manager):
    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .select_related(
                "owner",
            )
            .prefetch_related("notes", "tags", "connectivitystatement_set")
        )


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
    ontology_uri = models.URLField()

    def __str__(self):
        return self.name

    class Meta:
        ordering = ["name"]
        verbose_name_plural = "Species"


class BiologicalSex(models.Model):
    """Biological Sex"""

    name = models.CharField(max_length=200, db_index=True, unique=True)
    ontology_uri = models.URLField()

    def __str__(self):
        return self.name

    class Meta:
        ordering = ["name"]
        verbose_name_plural = "Biological Sex"


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
    exportable = models.BooleanField(default=False)

    def __str__(self):
        return self.tag

    class Meta:
        ordering = ["tag"]
        verbose_name_plural = "Tags"


class Sentence(models.Model):
    """Sentence"""

    objects = SentenceStatementManager()

    title = models.CharField(max_length=200, db_index=True)
    text = models.TextField()
    external_ref = models.CharField(max_length=20, db_index=True, null=True, blank=True)
    state = FSMField(default=SentenceState.OPEN, protected=True)
    pmid = PmIdField(db_index=True, null=True, blank=True)
    pmcid = PmcIdField(max_length=20, db_index=True, null=True, blank=True)
    doi = DoiField(max_length=100, db_index=True, null=True, blank=True)
    batch_name = models.CharField(max_length=100, null=True, blank=True)
    tags = models.ManyToManyField(Tag, verbose_name="Tags", blank=True)
    owner = models.ForeignKey(
        User,
        verbose_name="Triage Operator",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    created_date = models.DateTimeField(auto_now_add=True, db_index=True)
    modified_date = models.DateTimeField(auto_now=True, db_index=True)

    def __str__(self):
        return self.title

    # states
    @transition(
        field=state,
        source=[SentenceState.TO_BE_REVIEWED, SentenceState.COMPOSE_LATER],
        target=SentenceState.OPEN,
    )
    def open(self):
        ...

    @transition(
        field=state,
        source=SentenceState.OPEN,
        target=SentenceState.TO_BE_REVIEWED,
        conditions=[SentenceService.can_be_reviewed],
    )
    def to_be_reviewed(self):
        ...

    @transition(
        field=state, source=SentenceState.OPEN, target=SentenceState.COMPOSE_LATER
    )
    def compose_later(self):
        ...

    @transition(
        field=state,
        source=SentenceState.TO_BE_REVIEWED,
        target=SentenceState.COMPOSE_NOW,
        conditions=[SentenceService.can_be_composed],
    )
    def compose_now(self):
        SentenceService(self).do_transition_compose_now()

    @transition(field=state, source=SentenceState.OPEN, target=SentenceState.EXCLUDED)
    def excluded(self):
        ...

    @transition(field=state, source=SentenceState.OPEN, target=SentenceState.DUPLICATE)
    def duplicate(self):
        ...

    def assign_owner(self, request):
        if SentenceService(self).should_set_owner(request):
            self.owner = request.user
            self.save(update_fields=["owner"])

    @property
    def pmid_uri(self) -> str:
        return pmid_uri(self.pmid)

    @property
    def pmcid_uri(self) -> str:
        return pmcid_uri(self.pmcid)

    @property
    def doi_uri(self) -> str:
        return doi_uri(self.doi)

    @property
    def tag_list(self):
        return ", ".join(self.tags.all().values_list("tag", flat=True))

    @property
    def has_notes(self):
        return self.notes.exists()

    class Meta:
        ordering = ["title"]
        verbose_name_plural = "Sentences"
        constraints = [
            models.CheckConstraint(
                check=Q(state__in=[l[0] for l in SentenceState.choices]),
                name="sentence_state_valid",
            ),
            models.CheckConstraint(
                check=~Q(state=SentenceState.COMPOSE_NOW)
                | (
                    Q(state=SentenceState.COMPOSE_NOW)
                    & (
                        Q(pmid__isnull=False)
                        | Q(pmcid__isnull=False)
                        | Q(doi__isnull=False)
                    )
                ),
                name="sentence_pmid_pmcd_valid",
            ),
            models.CheckConstraint(
                check=(Q(external_ref__isnull=True) & Q(batch_name__isnull=True))
                | Q(external_ref__isnull=False) & Q(batch_name__isnull=False),
                name="sentence_externalref_and_batch_valid",
            ),
        ]


class Via(models.Model):
    """Via"""

    connectivity_statement = models.ForeignKey(
        "ConnectivityStatement",
        on_delete=models.CASCADE,
    )
    anatomical_entity = models.ForeignKey(AnatomicalEntity, on_delete=models.DO_NOTHING)
    display_order = models.PositiveIntegerField(
        default=0,
        blank=False,
        null=False,
    )
    type = models.CharField(max_length=8, default=ViaType.AXON, choices=ViaType.choices)

    def __str__(self):
        return f"{self.connectivity_statement} - {self.anatomical_entity}"

    class Meta:
        ordering = ["display_order"]
        verbose_name_plural = "Via"
        constraints = [
            models.CheckConstraint(
                check=Q(type__in=[vt[0] for vt in ViaType.choices]),
                name="via_type_valid",
            ),
        ]


class ConnectivityStatement(models.Model):
    """Connectivity Statement"""

    objects = ConnectivityStatementManager()
    all_objects = models.Manager()

    sentence = models.ForeignKey(
        Sentence, verbose_name="Sentence", on_delete=models.DO_NOTHING
    )
    knowledge_statement = models.TextField(db_index=True, blank=True)
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
        User, verbose_name="Curator", on_delete=models.SET_NULL, null=True, blank=True
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
    tags = models.ManyToManyField(Tag, verbose_name="Tags", blank=True)
    biological_sex = models.ForeignKey(
        BiologicalSex, on_delete=models.DO_NOTHING, null=True, blank=True
    )
    apinatomy_model = models.CharField(max_length=200, null=True, blank=True)
    created_date = models.DateTimeField(auto_now_add=True, db_index=True)
    modified_date = models.DateTimeField(auto_now=True, db_index=True)

    def __str__(self):
        suffix = ""
        if len(self.knowledge_statement) > 49:
            suffix = "..."
        return f"{self.knowledge_statement[:50]}{suffix}"

    # states
    @transition(
        field=state,
        source=[
            CSState.DRAFT,
            CSState.REJECTED,
            CSState.NPO_APPROVED,
            CSState.EXPORTED,
        ],
        permission=lambda instance, user: ConnectivityStatementService.has_permission_to_transition_to_compose_now(
            instance, user
        ),
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

    @transition(
        field=state,
        source=CSState.CURATED,
        target=CSState.TO_BE_REVIEWED,
        conditions=[ConnectivityStatementService.can_be_reviewed],
    )
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

    @transition(
        field=state,
        source=CSState.NPO_APPROVED,
        permission=lambda instance, user: ConnectivityStatementService.has_permission_to_transition_to_exported(
            instance, user
        ),
        target=CSState.EXPORTED,
    )
    def exported(self):
        pass

    @property
    def journey(self):
        return ConnectivityStatementService.compile_journey(self)

    @property
    def has_notes(self):
        return self.notes.exists()

    @property
    def tag_list(self):
        return ", ".join(self.tags.all().values_list("tag", flat=True))

    def assign_owner(self, request):
        if ConnectivityStatementService(self).should_set_owner(request):
            self.owner = request.user
            self.save(update_fields=["owner"])

    class Meta:
        ordering = ["-modified_date"]
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
            models.CheckConstraint(
                check=Q(destination_type__in=[dt[0] for dt in DestinationType.choices]),
                name="destination_type_valid",
            ),
        ]


class Doi(models.Model):
    """DOI see https://doi.org/"""

    connectivity_statement = models.ForeignKey(
        ConnectivityStatement, on_delete=models.CASCADE
    )
    doi = DoiField(max_length=100)

    @property
    def doi_uri(self):
        return doi_uri(self.doi)

    def __str__(self):
        return self.doi

    class Meta:
        ordering = ["doi"]
        verbose_name_plural = "D.O.I.s"


class Note(models.Model):
    """Note"""

    note = models.TextField()
    user = models.ForeignKey(User, verbose_name="User", on_delete=models.DO_NOTHING)
    created_at = models.DateTimeField(auto_now_add=True)
    sentence = models.ForeignKey(
        Sentence,
        verbose_name="Sentence",
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
    type = models.CharField(
        max_length=20, default=NoteType.PLAIN, choices=NoteType.choices
    )

    def __str__(self):
        return self.note

    class Meta:
        ordering = ["-created_at"]
        verbose_name_plural = "Notes"
        constraints = [
            models.CheckConstraint(
                check=models.Q(
                    sentence__isnull=False,
                    connectivity_statement__isnull=True,
                )
                | models.Q(
                    sentence__isnull=True,
                    connectivity_statement__isnull=False,
                ),
                name="only_sentence_or_connectivity_statement",
            ),
            models.CheckConstraint(
                check=Q(type__in=[nt[0] for nt in NoteType.choices]),
                name="note_type_valid",
            ),
        ]


class ExportBatch(models.Model):
    """Export batches"""

    user = models.ForeignKey(User, verbose_name="User", on_delete=models.DO_NOTHING)
    created_at = models.DateTimeField(auto_now_add=True)
    connectivity_statements = models.ManyToManyField(ConnectivityStatement)

    @property
    def get_count_sentences_created_since_this_export(self):
        return Sentence.objects.filter(
            created_date__gt=self.created_at,
        ).count()

    @property
    def get_count_connectivity_statements_created_since_this_export(self):
        return ConnectivityStatement.objects.filter(
            created_date__gt=self.created_at,
            state=CSState.NPO_APPROVED
        ).count()

    @property
    def get_count_connectivity_statements_modified_since_this_export(self):
        return ConnectivityStatement.objects.filter(
            modified_date__gt=self.created_at,
            state=CSState.NPO_APPROVED
        ).exclude(state=CSState.EXPORTED).count() # exclude statements that are in EXPORTED state

    @property
    def get_count_connectivity_statements_in_this_export(self):
        return self.connectivity_statements.count()

    class Meta:
        ordering = ["-created_at"]
        verbose_name_plural = "Export Batches"
