from django.contrib.auth.models import User
from django.db import models, transaction
from django.db.models import Q, CheckConstraint
from django.db.models.expressions import F
from django.forms.widgets import Input as InputWidget
from django_fsm import FSMField, transition
from django.core.exceptions import ImproperlyConfigured
from composer.services.graph_service import build_journey_description, build_journey_entities
from django.core.exceptions import ValidationError

from composer.services.layers_service import update_from_entities_on_deletion
from composer.services.state_services import (
    ConnectivityStatementStateService,
    SentenceStateService,
    is_system_user
)
from .enums import (
    CircuitType,
    CSState,
    DestinationType,
    Laterality,
    MetricEntity,
    RelationshipType,
    SentenceState,
    NoteType,
    ViaType,
    Projection,
)
from .utils import (
    doi_uri,
    pmcid_uri,
    pmid_uri,
    create_reference_uri,
    is_valid_population_name,
)
import re
from composer.utils import generate_connectivity_statement_curie_id_for_composer_statements


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


def validate_provenance_uri(value):
    """Validate that the URI is a valid DOI, PMID, PMCID, or URL"""
    if not value or not value.strip():
        raise ValidationError("URI cannot be empty.")
    
    uri = value.strip()
    
    # DOI patterns
    doi_patterns = [
        r'^10\.\d{4,}/[a-zA-Z0-9\-._():]+(?:/[a-zA-Z0-9\-._():]+)*$',  # Standard DOI format - no consecutive slashes
        r'^doi:10\.\d{4,}/[a-zA-Z0-9\-._():]+(?:/[a-zA-Z0-9\-._():]+)*$',  # DOI with prefix
        r'^https?://doi\.org/10\.\d{4,}/[a-zA-Z0-9\-._():]+(?:/[a-zA-Z0-9\-._():]+)*$',  # DOI URL
        r'^https?://dx\.doi\.org/10\.\d{4,}/[a-zA-Z0-9\-._():]+(?:/[a-zA-Z0-9\-._():]+)*$',  # Alternative DOI URL
    ]
    
    # PMID patterns
    pmid_patterns = [
        r'^PMID:\s*\d+$',  # PMID with prefix
        r'^https?://pubmed\.ncbi\.nlm\.nih\.gov/\d+/?$',  # PubMed URL
    ]
    
    # PMCID patterns
    pmcid_patterns = [
        r'^PMC\d+$',  # PMC ID format
        r'^PMCID:\s*PMC\d+$',  # PMCID with prefix
        r'^https?://www\.ncbi\.nlm\.nih\.gov/pmc/articles/PMC\d+/?$',  # PMC URL
    ]
    
    # URL pattern
    url_pattern = r'^https?://[a-zA-Z0-9\-.]+(:[0-9]+)?(/[a-zA-Z0-9\-._~!$&\'()*+,;=:@]+)*(\?[a-zA-Z0-9\-._~!$&\'()*+,;=:@/?]*)?(\#[a-zA-Z0-9\-._~!$&\'()*+,;=:@/?]*)?$'
    
    # Check if it matches any of the valid patterns
    all_patterns = doi_patterns + pmid_patterns + pmcid_patterns + [url_pattern]
    
    for pattern in all_patterns:
        if re.match(pattern, uri, re.IGNORECASE):
            return
    
    # If none match, raise validation error
    raise ValidationError(
        "URI must be a valid DOI (e.g., '10.1000/xyz123' or 'https://doi.org/10.1000/xyz123'), "
        "PMID (e.g., 'PMID:12345678' or 'https://pubmed.ncbi.nlm.nih.gov/12345678'), "
        "PMCID (e.g., 'PMC1234567' or 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC1234567'), "
        "or a valid URL (e.g., 'https://example.com')."
    )


class ProvenanceUriField(models.CharField):
    """Custom field for provenance URIs that accepts DOI, PMID, PMCID, or URLs"""
    
    def __init__(self, *args, **kwargs):
        kwargs['validators'] = kwargs.get('validators', []) + [validate_provenance_uri]
        super().__init__(*args, **kwargs)


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
            .exclude(state=CSState.DEPRECATED)
        )

    def excluding_draft(self):
        return self.get_queryset().exclude(state=CSState.DRAFT)

    def exported(self):
        return self.get_queryset().filter(state=CSState.EXPORTED)

    def public_export(self):
        return self.get_queryset().filter(
            state__in=[CSState.NPO_APPROVED, CSState.EXPORTED]
        )


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


class AnatomicalEntityManager(models.Manager):
    def get_queryset(self):
        return (
            super()
            .get_queryset().select_related(
            'simple_entity',
            'region_layer',
            'region_layer__region',
            'region_layer__layer').prefetch_related('synonyms')
        )

    def get_by_ontology_uri(self, uri):
        """
        Return the first AnatomicalEntity matching the given ontology_uri in any of its possible locations.
        """
        return self.get_queryset().filter(
            Q(simple_entity__ontology_uri=uri) |
            Q(region_layer__region__ontology_uri=uri) |
            Q(region_layer__layer__ontology_uri=uri)
        ).first()


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


class PopulationSet(models.Model):
    """Population Set"""

    name = models.CharField(
        max_length=200,
        db_index=True,
        unique=True,
        validators=[is_valid_population_name],
    )
    description = models.TextField(null=True, blank=True)
    last_used_index = models.PositiveIntegerField(default=0, help_text="Tracks the last assigned population index to ensure sequential numbering.")

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        self.name = self.name.lower()
        super().save(*args, **kwargs)

    class Meta:
        ordering = ["name"]
        verbose_name_plural = "Population Sets"


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
    objects = AnatomicalEntityManager()
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
        constraints = [
            models.UniqueConstraint(
                fields=['anatomical_entity', 'name'],
                name='unique_synonym_per_entity'
            )
        ]


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
    external_ref = models.CharField(max_length=100, db_index=True, null=True, blank=True)
    state = FSMField(default=SentenceState.OPEN, protected=True)
    pmid = PmIdField(db_index=True, null=True, blank=True)
    pmcid = PmcIdField(max_length=100, db_index=True, null=True, blank=True)
    doi = DoiField(max_length=100, db_index=True, null=True, blank=True)
    batch_name = models.CharField(max_length=100, null=True, blank=True, db_index=True)
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
        field=state,
        source=[SentenceState.OPEN, SentenceState.NEEDS_FURTHER_REVIEW],
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
        """
        This function assigns an owner to the Sentence instance.
        
        This logic is also implemented in the bulk `assign_owner` function for performance reasons.
        If any changes are made here, ensure the bulk function is updated accordingly.
        """
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
    state = FSMField(default=CSState.DRAFT, protected=True, db_index=True)
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
    reference_uri = models.URLField(null=True, blank=True, db_index=True)
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
    population = models.ForeignKey(
        PopulationSet,
        verbose_name="Population Set",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    population_index = models.PositiveIntegerField(null=True, blank=True, help_text="Index of this statement within its assigned population.")
    has_statement_been_exported = models.BooleanField(default=False)

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

    def _perform_export_logic(self):
        """
        Common logic for exporting a connectivity statement.
        This method handles population index assignment, reference URI creation,
        and marking the statement as exported.
        """
        with transaction.atomic():
            update_fields = ["has_statement_been_exported"]
            # Only update population_index if the statement hasn't been exported yet
            if not self.has_statement_been_exported:
                next_index = self.population.last_used_index + 1
                self.population_index = next_index
                update_fields.append("population_index")

                # Update the population's last_used_index in the same transaction.
                self.population.last_used_index = next_index
                self.population.save(update_fields=["last_used_index"])

                # Create a reference URI if it doesn't exist (statements created in composer)
                if not self.reference_uri:
                    self.reference_uri = create_reference_uri(
                        self.population, self.population_index
                    )
                    update_fields.append("reference_uri")

                # Set the curie_id - if not already set - for statements from the composer
                if not self.curie_id:
                    self.curie_id = generate_connectivity_statement_curie_id_for_composer_statements(self)
                    update_fields.append("curie_id")

            # Mark the statement as exported.
            self.has_statement_been_exported = True
            self.save(update_fields=update_fields)

    @transition(
        field=state,
        source=[CSState.NPO_APPROVED, CSState.INVALID],
        target=CSState.EXPORTED,
        conditions=[
            ConnectivityStatementStateService.is_valid,
            ConnectivityStatementStateService.has_populationset,
        ],
        permission=ConnectivityStatementStateService.has_permission_to_transition_to_exported,
    )
    def exported(self, *args, **kwargs):
        self._perform_export_logic()

    @transition(
        field=state,
        source=[
            CSState.DRAFT,
            CSState.COMPOSE_NOW,
            CSState.IN_PROGRESS,
            CSState.TO_BE_REVIEWED,
            CSState.REVISE,
            CSState.REJECTED,
            CSState.NPO_APPROVED,
            CSState.INVALID,
        ],
        target=CSState.EXPORTED,
        conditions=[
            ConnectivityStatementStateService.is_valid,
            ConnectivityStatementStateService.has_populationset,
        ],
        permission=ConnectivityStatementStateService.has_permission_to_transition_to_exported,
    )
    def system_exported(self, *args, **kwargs):
        """
        Transition to exported state that can be called by system users from any state.
        This is typically used during ingestion with population files.
        """
        self._perform_export_logic()

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
        self.has_statement_been_exported = True
        self.save(update_fields = ["has_statement_been_exported"])

    @transition(
        field=state,
        source=[
            CSState.COMPOSE_NOW,
            CSState.IN_PROGRESS,
            CSState.REJECTED,
            CSState.REVISE,
            CSState.TO_BE_REVIEWED,
            CSState.NPO_APPROVED,
            CSState.EXPORTED,
        ],
        target=CSState.DEPRECATED,
        conditions=[
            ConnectivityStatementStateService.can_be_deprecated,
        ],
        permission=ConnectivityStatementStateService.has_permission_to_transition_to_deprecated,
    )
    def deprecated(self, *args, **kwargs):
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
        return build_journey_description(self.journey_path) if self.journey_path else []

    def get_entities_journey(self):
        return build_journey_entities(self.journey_path) if self.journey_path else []

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

    def validate_population_change(self):
        if self.pk and self.has_statement_been_exported:

            original_population = (
                self.__class__.objects.filter(pk=self.pk)
                .values_list("population", flat=True)
                .first()
            )
            if (
                original_population is not None
                and original_population != (self.population.id if self.population else None)
            ):
                raise ValidationError(
                    "Cannot change population set after the statement has been exported."
                )

    def clean(self):
        super().clean()
        self.validate_population_change()

    def save(self, *args, **kwargs):
        if not self.pk and self.sentence and not self.owner:
            self.owner = self.sentence.owner

        self.clean()
        super().save(*args, **kwargs)

    def delete(self, user=None, *args, **kwargs):
        """
        Soft delete by transitioning to DEPRECATED if has_statement_been_exported is True.
        Otherwise, perform an actual deletion.
        """
        if self.has_statement_been_exported:
            if not user:
                raise ValidationError("User is required to deprecate the statement before deletion.")

            try:
                state_service = ConnectivityStatementStateService(self)
                state_service.do_transition(CSState.DEPRECATED.value, user=user)

                self.save(update_fields=["state"])
            except Exception as e:
                raise ValidationError(f"Cannot deprecate the connectivity statement: {e}")
        else:
            super().delete(*args, **kwargs)

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
            ),
            models.UniqueConstraint(
                fields=['reference_uri'],
                condition=~Q(state=CSState.DEPRECATED),
                name="unique_reference_uri_active"
            )
        ]


class Relationship(models.Model):

    title = models.CharField(max_length=255)
    predicate_name = models.CharField(max_length=255)
    predicate_uri = models.URLField()
    type = models.CharField(max_length=10, choices=RelationshipType.choices)
    order = models.PositiveIntegerField(default=0)

    def __str__(self):
        return self.title

    class Meta:
        ordering = ["order"]
        constraints = [
            models.UniqueConstraint(
                fields=['title', 'predicate_name', 'predicate_uri'],
                name='unique_relationship'
            )
        ]

class Triple(models.Model):
    relationship = models.ForeignKey(Relationship, on_delete=models.CASCADE, related_name="triples")
    name = models.CharField(max_length=255)
    uri = models.URLField()

    def __str__(self):
        return f"{self.name} ({self.relationship.title})"

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['name', 'uri', 'relationship'],
                name='unique_triple_per_relationship'
            )
        ]


class ConnectivityStatementTriple(models.Model):
    connectivity_statement = models.ForeignKey(ConnectivityStatement, on_delete=models.CASCADE, related_name="statement_triples")
    relationship = models.ForeignKey(Relationship, on_delete=models.CASCADE)
    triple = models.ForeignKey(Triple, null=True, blank=True, on_delete=models.SET_NULL)
    free_text = models.TextField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['connectivity_statement', 'relationship', 'triple'],
                name='unique_statement_relationship_triple'
            )
        ]

    def clean(self):
        if self.triple and self.free_text:
            raise ValidationError("Only one of 'triple' or 'free_text' should be set.")
        if not self.triple and not self.free_text:
            raise ValidationError("One of 'triple' or 'free_text' must be set.")
        if self.relationship.type == RelationshipType.TEXT and self.triple:
            raise ValidationError("Text relationships must use 'free_text', not 'triple'.")
        if self.relationship.type in [RelationshipType.SINGLE, RelationshipType.MULTI] and self.free_text:
            raise ValidationError("Select-type relationships must use 'triple', not 'free_text'.")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

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

    def _get_available_entities_before_order(self, order_index):
        """
        Returns a set of AnatomicalEntity IDs available from layers before the given order_index.
        Includes origins and entities from preceding Via layers.
        """
        available_entities = set(self.connectivity_statement.origins.values_list('id', flat=True))
        preceding_vias = Via.objects.filter(
            connectivity_statement=self.connectivity_statement,
            order__lt=order_index
        ).prefetch_related('anatomical_entities')

        for via in preceding_vias:
            available_entities.update(via.anatomical_entities.values_list('id', flat=True))
        return available_entities

    def _conditionally_clear_from_entities(self):
        """
        Clears 'from_entities' if any selected entity is no longer available
        in the preceding layers based on the current order.
        """
        current_from_entity_ids = set(self.from_entities.values_list('id', flat=True))
        if not current_from_entity_ids:
            return  # Nothing selected, nothing to clear

        available_entity_ids = self._get_available_entities_before_order(self.order)

        # Check if all selected 'from_entities' are still available
        if not current_from_entity_ids.issubset(available_entity_ids):
            self.from_entities.clear()

    def save(self, *args, **kwargs):
        with transaction.atomic():
            order_changed = False
            old_order = None
            if not self.pk:
                # Assign order for new Via
                self.order = Via.objects.filter(connectivity_statement=self.connectivity_statement).count()
            else:
                # Check if order changed for existing Via
                old_via = Via.objects.filter(pk=self.pk).first()
                if old_via and old_via.order != self.order:
                    order_changed = True
                    old_order = old_via.order

            # Save the instance first to establish PK if new, or update fields including potentially the order
            super(Via, self).save(*args, **kwargs)

            if order_changed and old_order is not None:
                # Update orders of other Vias and conditionally clear their from_entities
                affected_vias = self._update_order_for_other_vias(old_order)
                # Conditionally clear from_entities for the moved Via itself
                self._conditionally_clear_from_entities()
                # Conditionally clear from_entities for affected Vias
                for via in affected_vias:
                    # Reload via to get updated order before checking
                    via.refresh_from_db()
                    via._conditionally_clear_from_entities()


    def _update_order_for_other_vias(self, old_order):
        """
        Updates the order of other Via instances when this instance's order changes.
        Returns the list of affected Via instances.
        """
        affected_vias = []
        temp_order = -1  # A temporary order value outside the normal range

        with transaction.atomic():
            # Temporarily move the current Via out of the way
            Via.objects.filter(pk=self.pk).update(order=temp_order)

            # Adjust orders of other Vias
            if old_order < self.order:
                # Moved down: Decrement order of Vias between old and new position
                vias_to_update = Via.objects.filter(
                    connectivity_statement=self.connectivity_statement,
                    order__gt=old_order, order__lte=self.order
                )
                affected_vias = list(vias_to_update) # Capture before update
                vias_to_update.update(order=F('order') - 1)
            elif old_order > self.order:
                # Moved up: Increment order of Vias between new and old position
                vias_to_update = Via.objects.filter(
                    connectivity_statement=self.connectivity_statement,
                    order__lt=old_order, order__gte=self.order
                )
                affected_vias = list(vias_to_update) # Capture before update
                vias_to_update.update(order=F('order') + 1)

            Via.objects.filter(pk=self.pk).update(order=self.order)

        return affected_vias # Return the list of vias whose order was changed

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
    uri = ProvenanceUriField(max_length=500)

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
            created_date__gt=self.created_at
        ).count()

    @property
    def get_count_connectivity_statements_modified_since_this_export(self):
        return (
            ConnectivityStatement.objects.filter(
                modified_date__gt=self.created_at
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
        constraints = [
            models.UniqueConstraint(
                fields=['connectivity_statement', 'alert_type'],
                name='unique_statement_alert_type'
            )
        ]

    def __str__(self):
        return f"{self.alert_type.name} for Statement {self.connectivity_statement.id}"
