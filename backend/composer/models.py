from django.contrib.auth.models import User
from django.db import models, transaction
from django.db.models import Q, CheckConstraint
from django.db.models.expressions import F
from django.forms.widgets import Input as InputWidget
from django_fsm import FSMField, transition
from django.core.exceptions import ImproperlyConfigured
from composer.services.graph_service import build_journey_description, build_journey_entities

from composer.services.layers_service import update_from_entities_on_deletion
from composer.services.state_services import (
    ConnectivityStatementStateService,
    SentenceStateService,
)
from .enums import (
    CircuitType,
    CSState,
    DestinationType,
    Laterality,
    MetricEntity,
    SentenceState,
    NoteType,
    ViaType,
    Projection,
)
from .utils import doi_uri, pmcid_uri, pmid_uri, create_reference_uri


# from django_fsm_log.decorators import fsm_log_by


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
                "phenotype",
                "sentence",
                "sex",
            )
            .prefetch_related("notes", "tags", "provenance_set", "species", "origins", "destinations")
        )

    def excluding_draft(self):
        return self.get_queryset().exclude(state=CSState.DRAFT)

    def exported(self):
        return self.get_queryset().filter(state=CSState.EXPORTED)


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


class NoteManager(models.Manager):
    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .select_related("user", "sentence", "connectivity_statement")
        )


class ViaManager(models.Manager):
    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .prefetch_related('anatomical_entities', 'from_entities')
        )


class DestinationManager(models.Manager):
    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .prefetch_related('anatomical_entities', 'from_entities')
        )


# Mixins


class BulkActionMixin:
    """
    Mixin providing a common interface for bulk actions.
    This mixin does not subclass models.Model, so you can use it in any model.
    """

    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
        # If the class is a Django model (it has _meta), enforce the existence of a 'tags' field.
        if hasattr(cls, '_meta'):
            try:
                cls._meta.get_field("tags")
            except Exception as e:
                raise ImproperlyConfigured(
                    f"The model '{cls.__name__}' must define a 'tags' field."
                ) from e

    def assign_owner(self, requested_by, owner):
        raise NotImplementedError("Subclasses must implement assign_owner().")

    def get_state_service(self):
        raise NotImplementedError("Subclasses must implement get_state_service().")

# Create your models here.
class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    is_triage_operator = models.BooleanField(default=False)
    is_curator = models.BooleanField(default=False)
    is_reviewer = models.BooleanField(default=False)


class Phenotype(models.Model):
    """Phenotype"""

    name = models.CharField(max_length=200, db_index=True, unique=True)
    ontology_uri = models.URLField(default="")

    def __str__(self):
        return self.name

    @property
    def phenotype_str(self):
        return str(self.name) if self.name else ''

    class Meta:
        ordering = ["name"]
        verbose_name_plural = "Phenotypes"


class Specie(models.Model):
    """Specie"""

    name = models.CharField(max_length=200, db_index=True, unique=True)
    ontology_uri = models.URLField()

    def __str__(self):
        return self.name

    class Meta:
        ordering = ["name"]
        verbose_name_plural = "Species"


class Sex(models.Model):
    """Sex"""

    name = models.CharField(max_length=200, db_index=True, unique=True)
    ontology_uri = models.URLField()

    def __str__(self):
        return self.name

    class Meta:
        ordering = ["name"]
        verbose_name_plural = "Sex"


class FunctionalCircuitRole(models.Model):
    """FunctionalCircuitRole"""

    name = models.CharField(max_length=200, db_index=True, unique=True)
    ontology_uri = models.URLField()

    def __str__(self):
        return self.name

    class Meta:
        ordering = ["name"]
        verbose_name_plural = "Funtional Circuit Roles"


class ProjectionPhenotype(models.Model):
    """ProjectionPhenotype"""

    name = models.CharField(max_length=200, db_index=True, unique=True)
    ontology_uri = models.URLField()

    def __str__(self):
        return self.name

    class Meta:
        ordering = ["name"]
        verbose_name_plural = "Projection Phenotypes"


class AnatomicalEntityMeta(models.Model):
    name = models.CharField(max_length=200, db_index=True)
    ontology_uri = models.URLField(unique=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ["name"]
        verbose_name = "Anatomical Entity"
        verbose_name_plural = "Anatomical Entities"


class Layer(models.Model):
    layer_id = models.BigAutoField(primary_key=True, auto_created=True)
    ae_meta = models.ForeignKey(AnatomicalEntityMeta, on_delete=models.CASCADE, related_name='layer_meta', null=False)

    def __str__(self):
        return self.ae_meta.name

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

    class Meta:
        verbose_name = "Layer"
        verbose_name_plural = "Layers"
        constraints = [
            models.UniqueConstraint(fields=['ae_meta'], name='unique_layer_ae_meta')
        ]


class Region(models.Model):
    region_id = models.BigAutoField(primary_key=True, auto_created=True)
    ae_meta = models.ForeignKey(AnatomicalEntityMeta, on_delete=models.CASCADE, related_name='region_meta', null=False)

    def __str__(self):
        return self.ae_meta.name

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

    class Meta:
        verbose_name = "Region"
        verbose_name_plural = "Regions"
        constraints = [
            models.UniqueConstraint(fields=['ae_meta'], name='unique_region_ae_meta')
        ]


class AnatomicalEntityIntersection(models.Model):
    layer = models.ForeignKey(AnatomicalEntityMeta, on_delete=models.CASCADE, related_name='layer_intersection')
    region = models.ForeignKey(AnatomicalEntityMeta, on_delete=models.CASCADE, related_name='region_intersection')

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

    class Meta:
        verbose_name = "Region/Layer Combination"
        verbose_name_plural = "Region/Layer Combinations"
        constraints = [
            models.UniqueConstraint(fields=['layer', 'region'], name='unique_layer_region_combination')
        ]

    def __str__(self):
        return f"{self.region.name} ({self.layer.name})"


class AnatomicalEntity(models.Model):
    simple_entity = models.OneToOneField(AnatomicalEntityMeta, on_delete=models.CASCADE, null=True, blank=True)
    region_layer = models.OneToOneField(AnatomicalEntityIntersection, on_delete=models.CASCADE, null=True, blank=True)

    @property
    def name(self):
        if self.simple_entity:
            return str(self.simple_entity)
        if self.region_layer:
            return str(self.region_layer)
        return 'Unknown Anatomical Entity'

    @property
    def ontology_uri(self):
        if self.simple_entity:
            return self.simple_entity.ontology_uri
        elif self.region_layer:
            return f'{self.region_layer.region.ontology_uri},{self.region_layer.layer.ontology_uri}'
        return 'Unknown URI'

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Anatomical Entity"
        verbose_name_plural = "Anatomical Entities"
        constraints = [
            CheckConstraint(
                check=(
                        Q(simple_entity__isnull=False, region_layer__isnull=True) |
                        Q(simple_entity__isnull=True, region_layer__isnull=False)
                ),
                name='check_anatomical_entity_exclusivity'
            )
        ]


class Synonym(models.Model):
    anatomical_entity = models.ForeignKey(AnatomicalEntity, on_delete=models.CASCADE,
                                          related_name="synonyms", null=True)
    name = models.CharField(max_length=200, db_index=True)

    class Meta:
        unique_together = ('anatomical_entity', 'name',)


class Tag(models.Model):
    """Tag"""

    tag = models.CharField(max_length=200, db_index=True, unique=True)
    exportable = models.BooleanField(default=False)

    def __str__(self):
        return self.tag

    class Meta:
        ordering = ["tag"]
        verbose_name_plural = "Tags"


class Sentence(models.Model, BulkActionMixin):
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
        source=[SentenceState.OPEN, SentenceState.READY_TO_COMPOSE, SentenceState.COMPOSE_LATER,
                SentenceState.EXCLUDED],
        target=SentenceState.NEEDS_FURTHER_REVIEW,
        conditions=[SentenceStateService.can_be_reviewed],
        permission=SentenceStateService.has_permission_to_transition_to_needs_further_review,
    )
    def needs_further_review(self, *args, **kwargs):
        ...

    @transition(
        field=state, source=[SentenceState.OPEN, SentenceState.NEEDS_FURTHER_REVIEW],
        target=SentenceState.COMPOSE_LATER,
        permission=SentenceStateService.has_permission_to_transition_to_compose_later,
    )
    def compose_later(self, *args, **kwargs):
        ...

    @transition(
        field=state, source=[SentenceState.OPEN, SentenceState.COMPOSE_LATER,
                             SentenceState.NEEDS_FURTHER_REVIEW],
        target=SentenceState.READY_TO_COMPOSE,
        permission=SentenceStateService.has_permission_to_transition_to_ready_to_compose,
    )
    def ready_to_compose(self, *args, **kwargs):
        ...

    @transition(
        field=state,
        source=SentenceState.READY_TO_COMPOSE,
        target=SentenceState.COMPOSE_NOW,
        conditions=[SentenceStateService.can_be_composed],
        permission=SentenceStateService.has_permission_to_transition_to_compose_now,

    )
    def compose_now(self, *args, **kwargs):
        SentenceStateService(self).do_transition_compose_now(*args, **kwargs)

    @transition(
        field=state,
        source=[SentenceState.OPEN, SentenceState.COMPOSE_NOW],
        target=SentenceState.COMPLETED,
        permission=SentenceStateService.has_permission_to_transition_to_completed,

    )
    def completed(self, *args, **kwargs):
        ...

    @transition(field=state, source=[SentenceState.OPEN, SentenceState.COMPLETED],
                target=SentenceState.EXCLUDED,
                permission=SentenceStateService.has_permission_to_transition_to_excluded)
    def excluded(self, *args, **kwargs):
        ...

    def assign_owner(self, requested_by, owner=None):
        if owner is None:
            owner = requested_by

        if SentenceStateService(self).can_assign_owner(requested_by):
            self.owner = owner
            self.save(update_fields=["owner"])

            # Update the owner of related draft ConnectivityStatements
            ConnectivityStatement.objects.filter(
                sentence=self,
                state=CSState.DRAFT
            ).update(owner=owner)

    def auto_assign_owner(self, request):
        if SentenceStateService(self).should_set_owner(request):
            self.owner = request.user
            self.save(update_fields=["owner"])

            # Update the owner of related draft ConnectivityStatements
            ConnectivityStatement.objects.filter(
                sentence=self,
                state=CSState.DRAFT
            ).update(owner=request.user)


    def get_state_service(self):
        """
        Returns the state service instance for this Sentence.
        """
        return SentenceStateService(self)
    
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
        return self.notes.exclude(type=NoteType.TRANSITION).exists()

    class Meta:
        ordering = ["text"]
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


class ConnectivityStatement(models.Model, BulkActionMixin):
    """Connectivity Statement"""

    objects = ConnectivityStatementManager()
    all_objects = models.Manager()

    sentence = models.ForeignKey(
        Sentence, verbose_name="Sentence", on_delete=models.DO_NOTHING
    )
    knowledge_statement = models.TextField(db_index=True, blank=True)
    state = FSMField(default=CSState.DRAFT, protected=True)
    origins = models.ManyToManyField(AnatomicalEntity, related_name='origins_relations')
    owner = models.ForeignKey(
        User, verbose_name="Curator", on_delete=models.SET_NULL, null=True, blank=True
    )

    laterality = models.CharField(
        max_length=20, choices=Laterality.choices, null=True, blank=True
    )
    projection = models.CharField(
        max_length=20, choices=Projection.choices, null=True, blank=True
    )
    circuit_type = models.CharField(
        max_length=20, choices=CircuitType.choices, null=True, blank=True
    )
    # TODO for next releases we could have only 1 field for phenotype + an intermediate table with the phenotype's categories such as circuit_type, laterality, projection, functional_circuit_role, projection_phenotype among others
    phenotype = models.ForeignKey(
        Phenotype,
        verbose_name="Phenotype",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    species = models.ManyToManyField(Specie, verbose_name="Species", blank=True)
    tags = models.ManyToManyField(Tag, verbose_name="Tags", blank=True)
    sex = models.ForeignKey(Sex, on_delete=models.DO_NOTHING, null=True, blank=True)
    forward_connection = models.ManyToManyField(
        "self",
        blank=True,
        symmetrical=False,
    )
    apinatomy_model = models.CharField(max_length=200, null=True, blank=True)
    additional_information = models.TextField(null=True, blank=True)
    reference_uri = models.URLField(null=True, blank=True, unique=True)
    functional_circuit_role = models.ForeignKey(
        FunctionalCircuitRole,
        on_delete=models.DO_NOTHING,
        null=True,
        blank=True,
    )
    projection_phenotype = models.ForeignKey(
        ProjectionPhenotype,
        on_delete=models.DO_NOTHING,
        null=True,
        blank=True,
    )
    curie_id = models.CharField(max_length=500, null=True, blank=True)
    created_date = models.DateTimeField(auto_now_add=True, db_index=True)
    modified_date = models.DateTimeField(auto_now=True, db_index=True)
    journey_path = models.JSONField(null=True, blank=True)
    statement_prefix = models.TextField(null=True, blank=True)
    statement_suffix = models.TextField(null=True, blank=True)

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
            CSState.IN_PROGRESS,
            CSState.INVALID,
            CSState.EXPORTED,
        ],
        target=CSState.COMPOSE_NOW,
        permission=ConnectivityStatementStateService.has_permission_to_transition_to_compose_now,
    )
    def compose_now(self, *args, **kwargs):
        ...

    @transition(
        field=state,
        source=[CSState.COMPOSE_NOW, CSState.TO_BE_REVIEWED, CSState.REVISE],
        target=CSState.IN_PROGRESS,
        permission=ConnectivityStatementStateService.has_permission_to_transition_to_in_progress,
    )
    def in_progress(self, *args, **kwargs):
        ...

    @transition(
        field=state,
        source=[CSState.IN_PROGRESS, CSState.REJECTED],
        target=CSState.TO_BE_REVIEWED,
        conditions=[ConnectivityStatementStateService.can_be_reviewed],
        permission=ConnectivityStatementStateService.has_permission_to_transition_to_to_be_reviewed,
    )
    def to_be_reviewed(self, *args, **kwargs):
        ...

    @transition(field=state,
                source=CSState.TO_BE_REVIEWED,
                target=CSState.REJECTED,
                permission=ConnectivityStatementStateService.has_permission_to_transition_to_rejected,
                )
    def rejected(self, *args, **kwargs):
        ...

    @transition(field=state,
                source=[CSState.TO_BE_REVIEWED, CSState.NPO_APPROVED],
                target=CSState.REVISE,
                permission=ConnectivityStatementStateService.has_permission_to_transition_to_revise,
                )
    def revise(self, *args, **kwargs):
        ...

    @transition(field=state,
                source=CSState.TO_BE_REVIEWED,
                target=CSState.NPO_APPROVED,
                conditions=[ConnectivityStatementStateService.is_valid],
                permission=ConnectivityStatementStateService.has_permission_to_transition_to_npo_approval,
                )
    def npo_approved(self, *args, **kwargs):
        ...

    @transition(
        field=state,
        source=[
            CSState.NPO_APPROVED,
            CSState.INVALID
        ],
        target=CSState.EXPORTED,
        conditions=[ConnectivityStatementStateService.is_valid],
        permission=ConnectivityStatementStateService.has_permission_to_transition_to_exported,
    )
    def exported(self, *args, **kwargs):
        ...

    @transition(
        field=state,
        source=[
            CSState.DRAFT,
            CSState.COMPOSE_NOW,
            CSState.IN_PROGRESS,
            CSState.REJECTED,
            CSState.REVISE,
            CSState.TO_BE_REVIEWED,
            CSState.NPO_APPROVED,
            CSState.EXPORTED,
        ],
        target=CSState.INVALID,
        permission=ConnectivityStatementStateService.has_permission_to_transition_to_invalid,
    )
    def invalid(self, *args, **kwargs):
        ...

    @property
    def export_id(self):
        return f"CPR:{self.id:06d}"

    @property
    def has_notes(self):
        return self.notes.exclude(type=NoteType.TRANSITION).exists()

    @property
    def tag_list(self):
        return ", ".join(self.tags.all().values_list("tag", flat=True))

    def get_previous_layer_entities(self, via_order):
        if via_order == 0:
            return set(self.origins.all())
        else:
            return set(self.via_set.get(order=via_order - 1).anatomical_entities.all())

    def get_journey(self):
        return build_journey_description(self.journey_path)

    def get_entities_journey(self):
        return build_journey_entities(self.journey_path)

    def get_laterality_description(self):
        laterality_map = {
            Laterality.RIGHT.value: "on the right side of the body",
            Laterality.LEFT.value: "on the left side of the body",
        }
        return laterality_map.get(self.laterality, None)

    def assign_owner(self, requested_by, owner=None):
        if owner is None:
            owner = requested_by
        
        if ConnectivityStatementStateService(self).can_assign_owner(requested_by):
            self.owner = owner
            self.save(update_fields=["owner"])

    def auto_assign_owner(self, request):
        if ConnectivityStatementStateService(self).should_set_owner(request):
            self.owner = request.user
            self.save(update_fields=["owner"])

    def get_state_service(self):
        """
        Returns the state service instance for this Sentence.
        """
        return ConnectivityStatementStateService(self)

    def save(self, *args, **kwargs):
        if not self.pk and self.sentence and not self.owner:
            self.owner = self.sentence.owner

        super().save(*args, **kwargs)

        if self.reference_uri is None:
            self.reference_uri = create_reference_uri(self.pk)
            self.save(update_fields=["reference_uri"])

    def set_origins(self, origin_ids):
        self.origins.set(origin_ids, clear=True)
        self.save()

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
                check=Q(projection__in=[p[0] for p in Projection.choices]),
                name="projection_valid",
            )
        ]


class GraphRenderingState(models.Model):
    connectivity_statement = models.OneToOneField(
        ConnectivityStatement,
        on_delete=models.CASCADE,
        related_name='graph_rendering_state',
    )
    serialized_graph = models.JSONField()  # Stores the serialized diagram model
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    saved_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True
    )


class AbstractConnectionLayer(models.Model):
    connectivity_statement = models.ForeignKey(ConnectivityStatement, on_delete=models.CASCADE)
    anatomical_entities = models.ManyToManyField(AnatomicalEntity, blank=True)
    from_entities = models.ManyToManyField(AnatomicalEntity, blank=True)

    class Meta:
        abstract = True


class Destination(AbstractConnectionLayer):
    connectivity_statement = models.ForeignKey(
        ConnectivityStatement,
        on_delete=models.CASCADE,
        related_name="destinations"  # Overridden related_name
    )

    anatomical_entities = models.ManyToManyField(AnatomicalEntity, blank=True,
                                                 related_name='destination_connection_layers')

    type = models.CharField(
        max_length=12,
        choices=DestinationType.choices,
        default=DestinationType.UNKNOWN
    )

    objects = DestinationManager()

    class Meta:
        constraints = [
            models.CheckConstraint(
                check=Q(type__in=[dt[0] for dt in DestinationType.choices]),
                name="destination_type_valid",
            ),
        ]


class Via(AbstractConnectionLayer):
    anatomical_entities = models.ManyToManyField(AnatomicalEntity, blank=True,
                                                 related_name='via_connection_layers')

    objects = ViaManager()

    type = models.CharField(
        max_length=20,
        choices=ViaType.choices,
        default=ViaType.AXON
    )
    order = models.IntegerField()

    def save(self, *args, **kwargs):
        with transaction.atomic():
            # Check if the object already exists in the database
            if not self.pk:
                self.order = Via.objects.filter(connectivity_statement=self.connectivity_statement).count()
            else:
                # Fetch the existing object from the database
                old_via = Via.objects.get(pk=self.pk)
                # If the 'order' field has changed, clear the 'from_entities'
                if old_via.order != self.order:
                    self._update_order_for_other_vias(old_via.order)
                    self.from_entities.clear()

            super(Via, self).save(*args, **kwargs)

    def _update_order_for_other_vias(self, old_order):
        temp_order = -1  # A temporary order value outside the normal range
        with transaction.atomic():
            # Temporarily set the order of the current object to a unique value
            Via.objects.filter(pk=self.pk).update(order=temp_order)

            # Fetch the affected Vias before updating
            if old_order < self.order:
                affected_vias = list(Via.objects.filter(
                    connectivity_statement=self.connectivity_statement,
                    order__gt=old_order, order__lte=self.order
                ))
                Via.objects.filter(
                    connectivity_statement=self.connectivity_statement,
                    order__gt=old_order, order__lte=self.order
                ).update(order=F('order') - 1)
            elif old_order > self.order:
                affected_vias = list(Via.objects.filter(
                    connectivity_statement=self.connectivity_statement,
                    order__lt=old_order, order__gte=self.order
                ))
                Via.objects.filter(
                    connectivity_statement=self.connectivity_statement,
                    order__lt=old_order, order__gte=self.order
                ).update(order=F('order') + 1)

            # Clear 'from_entities' for the fetched affected Vias
            for via in affected_vias:
                via.from_entities.clear()

            # Finally, set the correct order for the current object
            Via.objects.filter(pk=self.pk).update(order=self.order)

    def delete(self, *args, **kwargs):
        with transaction.atomic():
            # Collect the IDs of the anatomical entities from 'from_entities'
            anatomical_entities_ids = list(self.anatomical_entities.values_list("id", flat=True))

            # Call update_from_entities_on_deletion for each entity ID
            for entity_id in anatomical_entities_ids:
                update_from_entities_on_deletion(self.connectivity_statement, entity_id)

            # Proceed with the deletion
            super().delete(*args, **kwargs)

            # Update the order of remaining 'Via' instances
            vias_to_update = Via.objects.filter(
                connectivity_statement=self.connectivity_statement, order__gt=self.order
            )
            vias_to_update.update(order=F("order") - 1)

    class Meta:
        ordering = ["order"]
        verbose_name_plural = "Via"
        constraints = [
            models.CheckConstraint(
                check=Q(type__in=[vt[0] for vt in ViaType.choices]),
                name="via_type_valid",
            ),
        ]


class Provenance(models.Model):
    """Provenance"""

    connectivity_statement = models.ForeignKey(
        ConnectivityStatement, on_delete=models.CASCADE
    )
    uri = models.URLField()

    def __str__(self):
        return self.uri

    class Meta:
        verbose_name_plural = "Provenances"

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

    objects = NoteManager()
    all_objects = models.Manager()

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
    sentences_created = models.IntegerField(
        default=0, help_text="Number of sentences created since the previous export"
    )
    connectivity_statements_created = models.IntegerField(
        default=0,
        help_text="Number of connectivity statements created since the previous export",
    )
    connectivity_statements = models.ManyToManyField(
        ConnectivityStatement, help_text="Connectivity statements in this export batch"
    )

    @property
    def get_count_sentences_created_since_this_export(self):
        return Sentence.objects.filter(
            created_date__gt=self.created_at,
        ).count()

    @property
    def get_count_connectivity_statements_created_since_this_export(self):
        return ConnectivityStatement.objects.filter(
            created_date__gt=self.created_at, state=CSState.NPO_APPROVED
        ).count()

    @property
    def get_count_connectivity_statements_modified_since_this_export(self):
        return (
            ConnectivityStatement.objects.filter(
                modified_date__gt=self.created_at, state=CSState.NPO_APPROVED
            )
            .exclude(state=CSState.EXPORTED)
            .count()
        )  # exclude statements that are in EXPORTED state

    @property
    def get_count_connectivity_statements_in_this_export(self):
        return self.connectivity_statements.count()

    class Meta:
        ordering = ["-created_at"]
        verbose_name_plural = "Export Batches"


class ExportMetrics(models.Model):
    """Export Metrics"""

    export_batch = models.ForeignKey(ExportBatch, on_delete=models.CASCADE)
    entity = models.CharField(
        max_length=max((len(state[1]) for state in MetricEntity.choices)),
        choices=MetricEntity.choices,
    )
    state = models.CharField(
        max_length=max(
            (len(state[1]) for state in CSState.choices + SentenceState.choices)
        )
    )
    count = models.IntegerField()

    class Meta:
        verbose_name_plural = "Export Metrics"
        ordering = ["id"]
        constraints = [
            models.UniqueConstraint(
                fields=["export_batch", "entity", "state"],
                name="unique_state_per_export_batch",
            ),
        ]


class AlertType(models.Model):
    name = models.CharField(max_length=200, unique=True)
    predicate = models.CharField(max_length=200)
    uri = models.URLField(unique=True)

    def __str__(self):
        return self.name


class StatementAlert(models.Model):
    connectivity_statement = models.ForeignKey(
        ConnectivityStatement,
        on_delete=models.CASCADE,
        related_name='statement_alerts'
    )
    alert_type = models.ForeignKey(
        AlertType,
        on_delete=models.CASCADE,
        related_name='statement_alerts'
    )
    text = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    saved_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    class Meta:
        unique_together = ('connectivity_statement', 'alert_type')

    def __str__(self):
        return f"{self.alert_type.name} for Statement {self.connectivity_statement.id}"
