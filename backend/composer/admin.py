from .views import index
from typing import Any
from django.db.models.query import QuerySet
from django.http import HttpRequest
import nested_admin
from adminsortable2.admin import SortableAdminBase, SortableStackedInline
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from fsm_admin.mixins import FSMTransitionMixin
from django import forms
from django.core.exceptions import ValidationError
from composer.utils import compr_uri
from composer.models import (
    AlertType,
    Phenotype,
    Sex,
    PopulationSet,
    ConnectivityStatement,
    Provenance,
    ExportBatch,
    Note,
    Profile,
    Sentence,
    Specie,
    StatementAlert,
    Tag,
    Via,
    FunctionalCircuitRole,
    ProjectionPhenotype,
    Destination,
    Synonym,
    AnatomicalEntityMeta,
    Layer,
    Region,
    AnatomicalEntityIntersection,
    AnatomicalEntity,
    CSState
)


# Define Inlines

# Define an inline admin descriptor for Profile model
# which acts a bit like a singleton
class ProfileInline(admin.StackedInline):
    model = Profile
    can_delete = False
    verbose_name_plural = "profile"


class ProvenanceInline(admin.StackedInline):
    model = Provenance
    extra = 1


class SynonymInline(admin.StackedInline):
    model = Synonym
    extra = 1


class ProvenanceNestedInline(nested_admin.NestedStackedInline):
    model = Provenance
    extra = 1


class NoteSentenceInline(admin.StackedInline):
    model = Note
    exclude = ("connectivity_statement",)
    readonly_fields = ("created_at",)
    extra = 0
    sortable_options = "disabled"


class NoteConnectivityStatementInline(admin.StackedInline):
    model = Note
    exclude = ("sentence",)
    readonly_fields = ("created_at",)
    extra = 0
    sortable_options = "disabled"


class AlertTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'uri')
    search_fields = ('name', 'uri')


class StatementAlertInline(admin.StackedInline):
    model = StatementAlert
    extra = 1
    autocomplete_fields = ('alert_type', )
    fields = ('alert_type', 'text', 'created_at', 'updated_at')
    readonly_fields = ('created_at', 'updated_at')


class ConnectivityStatementInline(nested_admin.NestedStackedInline):
    model = ConnectivityStatement
    extra = 1
    fields = ("sentence", "knowledge_statement")
    inlines = (ProvenanceNestedInline,)


# Define a new User admin
class UserAdmin(BaseUserAdmin):
    inlines = (ProfileInline,)


class SentenceAdmin(
    FSMTransitionMixin, nested_admin.NestedModelAdmin, admin.ModelAdmin
):
    list_per_page = 10
    # The name of one or more FSMFields on the model to transition
    fsm_field = ("state",)
    readonly_fields = ("state", "batch_name", "external_ref")
    list_display = ("title", "pmid", "pmcid", "doi",
                    "tag_list", "state", "owner")
    list_display_links = ("title", "pmid", "pmcid")
    list_filter = ("state", "owner", "tags__tag")
    search_fields = ("title", "text", "pmid", "pmcid", "doi")

    inlines = (
        ConnectivityStatementInline,
        NoteSentenceInline,
    )


class AnatomicalEntityAdmin(admin.ModelAdmin):
    list_display = ('simple_entity', 'region_layer',
                    'synonyms', 'ontology_uri')
    list_display_links = ('simple_entity', 'region_layer')
    search_fields = (
        'simple_entity__name',  'simple_entity__ontology_uri',
        'region_layer__layer__name', 'region_layer__region__name',
        'region_layer__layer__ontology_uri', 'region_layer__region__ontology_uri',
    )
    inlines = (SynonymInline,)
    autocomplete_fields = ('simple_entity', 'region_layer')

    # we need to make efficient queries to the database to get the list of anatomical entities
    def get_queryset(self, request: HttpRequest) -> QuerySet[Any]:
        return super().get_queryset(request) \
            .select_related('simple_entity', 'region_layer__layer', 'region_layer__region') \
            .prefetch_related('synonyms')

    @admin.display(description="Synonyms")
    def synonyms(self, obj):
        synonyms = obj.synonyms.all()
        return ', '.join([synonym.name for synonym in synonyms])

    @admin.display(description="Ontology URI")
    def ontology_uri(self, obj):
        return obj.ontology_uri


class AnatomicalEntityMetaAdmin(admin.ModelAdmin):
    list_display = ("name", "ontology_uri")
    list_display_links = ("name", "ontology_uri")
    search_fields = ("name", "ontology_uri")

    def get_model_perms(self, request):
        return {}


class LayerAdminForm(forms.ModelForm):
    class Meta:
        model = Layer
        fields = '__all__'
        labels = {
            'ae_meta': 'layer',
        }


class RegionAdminForm(forms.ModelForm):
    class Meta:
        model = Region
        fields = '__all__'
        labels = {
            'ae_meta': 'region',
        }


class LayerAdmin(admin.ModelAdmin):
    form = LayerAdminForm
    list_display = ('layer_name', 'ontology_uri')
    list_display_links = ('layer_name', 'ontology_uri')
    search_fields = ('ae_meta__name', 'ae_meta__ontology_uri')
    autocomplete_fields = ('ae_meta',)

    @admin.display(description="Layer Name")
    def layer_name(self, obj):
        return obj.ae_meta.name

    @admin.display(description="Ontology URI")
    def ontology_uri(self, obj):
        return obj.ae_meta.ontology_uri


class RegionAdmin(admin.ModelAdmin):
    form = RegionAdminForm
    list_display = ('region_name', 'ontology_uri')
    list_display_links = ('region_name', 'ontology_uri')
    search_fields = ('ae_meta__name', 'ae_meta__ontology_uri')
    autocomplete_fields = ('ae_meta',)

    @admin.display(description="Region Name")
    def region_name(self, obj):
        return obj.ae_meta.name

    @admin.display(description="Ontology URI")
    def ontology_uri(self, obj):
        return obj.ae_meta.ontology_uri


class AnatomicalEntityIntersectionAdmin(nested_admin.NestedModelAdmin, admin.ModelAdmin):
    list_display = ('layer', 'region')
    raw_id_fields = ('layer', 'region')
    list_filter = ('layer', 'region')
    search_fields = (
        'layer__ae_meta__name', 'region__ae_meta__name',
        'layer__ae_meta__ontology_uri', 'region__ae_meta__ontology_uri'
    )

    def get_model_perms(self, request):
        return {}


class ViaInline(SortableStackedInline):
    model = Via
    extra = 0
    raw_id_fields = ("anatomical_entities", "from_entities")
    default_order_field = "order"


class DestinationInline(admin.TabularInline):
    model = Destination
    extra = 0
    raw_id_fields = ("anatomical_entities", "from_entities")


class ConnectivityStatementAdmin(
    SortableAdminBase, FSMTransitionMixin, admin.ModelAdmin
):
    list_per_page = 10
    # The name of one or more FSMFields on the model to transition
    fsm_field = ("state",)
    readonly_fields = ("state", "curie_id", "has_statement_been_exported", "compr_uri")
    exclude = ("journey_path", "statement_prefix", "statement_suffix", "population_index")
    autocomplete_fields = ("sentence", "origins")
    date_hierarchy = "modified_date"
    list_display = (
        "sentence",
        "pmid",
        "pmcid",
        "short_ks",
        "tag_list",
        "state",
        "has_notes",
        "owner",
        "reference_uri",
    )
    list_display_links = ("sentence", "pmid", "pmcid", "short_ks", "state")
    list_filter = ("state", "owner", "tags__tag")
    list_select_related = ("sentence", "origins", "destinations")
    search_fields = (
        "sentence__title",
        "sentence__text",
        "sentence__pmid",
        "sentence__pmcid",
        "knowledge_statement",
        "reference_uri",
    )

    fieldsets = ()

    inlines = (ProvenanceInline, NoteConnectivityStatementInline,
               ViaInline, DestinationInline, StatementAlertInline)

    def _filter_admin_transitions(self, transitions_generator):
        """
        Override to filter out specific transitions.
        """
        for transition in transitions_generator:
            # Filter out the 'deprecated' transition from available transitions
            if transition.name != CSState.DEPRECATED:
                yield transition

    def delete_model(self, request, obj):
        """Handles deletion from Django Admin."""
        try:
            obj.delete(user=request.user)
        except ValidationError as e:
            self.message_user(request, str(e), level="error")

    def delete_queryset(self, request, queryset):
        """Handles bulk deletion from Django Admin."""
        for obj in queryset:
            self.delete_model(request, obj)


    def compr_uri(self, obj):
        if obj.population and obj.population_index is not None:
            return compr_uri(obj.population.name, obj.population_index)
        return "Not available"


    @admin.display(description="Knowledge Statement")
    def short_ks(self, obj):
        return str(obj)

    @admin.display(description="PMID")
    def pmid(self, obj):
        return obj.sentence.pmid

    @admin.display(description="PMCID")
    def pmcid(self, obj):
        return obj.sentence.pmcid

    @admin.display(description="REFERENCE")
    def reference(self, obj):
        return str(obj)


class ExportBatchAdmin(admin.ModelAdmin):
    list_display = ("user", "created_at", "count_connectivity_statements",)
    list_display_links = ("user", "created_at",
                          "count_connectivity_statements",)
    list_filter = ("user",)
    date_hierarchy = "created_at"
    exclude = ("connectivity_statements",)
    readonly_fields = (
        "user", "created_at", "count_connectivity_statements", "sentences_created", "connectivity_statements_created",)
    list_per_page = 10
    change_form_template = "admin/export_metrics_change_form.html"

    def has_delete_permission(self, request, obj=None):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_add_permission(self, request):
        return False

    @admin.display(description="Connectivity statements")
    def count_connectivity_statements(self, obj: ExportBatch):
        return obj.get_count_connectivity_statements_in_this_export

    def get_form(self, request, obj=None, change=False, **kwargs):
        # add help text to the count_connectivity_statements computed field
        help_texts = {
            'count_connectivity_statements': 'Number of connectivity statements exported in this export batch'}
        kwargs.update({'help_texts': help_texts})
        return super().get_form(request, obj=obj, change=change, **kwargs)


class PopulationSetAdmin(admin.ModelAdmin):
    readonly_fields = ('last_used_index',)


# Re-register UserAdmin
admin.site.unregister(User)
admin.site.register(User, UserAdmin)

#
admin.site.register(AnatomicalEntityMeta, AnatomicalEntityMetaAdmin)
admin.site.register(Layer, LayerAdmin)
admin.site.register(Region, RegionAdmin)
admin.site.register(AnatomicalEntityIntersection,
                    AnatomicalEntityIntersectionAdmin)
admin.site.register(AnatomicalEntity, AnatomicalEntityAdmin)
admin.site.register(Phenotype)
admin.site.register(Sex)
admin.site.register(PopulationSet, PopulationSetAdmin)
admin.site.register(ConnectivityStatement, ConnectivityStatementAdmin)
admin.site.register(ExportBatch, ExportBatchAdmin)
admin.site.register(Sentence, SentenceAdmin)
admin.site.register(Specie)
admin.site.register(Tag)
admin.site.register(FunctionalCircuitRole)
admin.site.register(ProjectionPhenotype)
admin.site.register(AlertType, AlertTypeAdmin)
# admin.site.register(ExportMetrics)


#


def login(request, extra_context=None):
    return index(request)


admin.site.login = login
