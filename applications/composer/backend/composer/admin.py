import os
import subprocess
import nested_admin
from django.utils.safestring import mark_safe
from django.shortcuts import render, redirect
from django.conf import settings
from django.urls import path, reverse

from composer.enums import RelationshipType
from .views import index
from typing import Any
from django.db.models.query import QuerySet
from django.http import HttpRequest
from adminsortable2.admin import SortableAdminBase, SortableStackedInline
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from fsm_admin.mixins import FSMTransitionMixin
from django import forms
from django.core.exceptions import ValidationError
from composer.models import (
    AlertType,
    ConnectivityStatementTriple,
    ConnectivityStatementText,
    ConnectivityStatementAnatomicalEntity,
    Phenotype,
    Relationship,
    Sex,
    PopulationSet,
    ConnectivityStatement,
    Provenance,
    ExpertConsultant,
    ExportBatch,
    Note,
    Profile,
    Sentence,
    Specie,
    StatementAlert,
    Tag,
    Triple,
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
    CSState,
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


class ExpertConsultantInline(admin.StackedInline):
    model = ExpertConsultant
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


class RelationshipAdmin(admin.ModelAdmin):
    list_display = ("title", "predicate_name", "predicate_uri", "type", "order", "has_custom_code")
    ordering = ("order",)
    search_fields = ("title", "predicate_name", "predicate_uri")
    fieldsets = (
        (None, {
            'fields': ('title', 'predicate_name', 'predicate_uri', 'type', 'order')
        }),
        ('Custom Ingestion Code', {
            'classes': ('collapse',),
            'fields': ('custom_ingestion_code',),
            'description': (
                'Add custom Python code to extract data from NeuroDM during ingestion. '
            ),
        }),
    )
    
    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        if 'custom_ingestion_code' in form.base_fields:
            form.base_fields['custom_ingestion_code'].widget = forms.Textarea(attrs={
                'rows': 15,
                'cols': 100,
                'style': 'font-family: monospace; font-size: 12px;'
            })
            form.base_fields['custom_ingestion_code'].help_text = mark_safe(
                "Optional Python code to extract data from NeuroDM for this relationship during ingestion.<br>"
                "The code has access to:<br>"
                "• <code>fc</code>: dict with neuron properties (id, label, species, phenotype, etc.)<br>"
                "• <code>fc[\"_neuron\"]</code>: the NeuroDM neuron object<br><br>"
                "The code must define a <code>result</code> variable with the output:<br>"
                "• For TRIPLE relationships: list of dicts [{'name': str, 'uri': str}, ...]<br>"
                "• For TEXT relationships: list of strings or single string<br>"
                "• For ANATOMICAL_ENTITY relationships:<br>"
                "&nbsp;&nbsp;- Simple entities: list of URI strings ['http://purl.obolibrary.org/obo/UBERON_0001234', ...]<br>"
                "&nbsp;&nbsp;- Region-layer pairs: list of dicts [{'region': 'region_uri', 'layer': 'layer_uri'}, ...]<br>"
                "&nbsp;&nbsp;- Mixed: list combining both formats<br>"
                "&nbsp;&nbsp;- Note: Region-layer pairs respect the 'update_anatomical_entities' flag<br><br>"
                "Errors are logged to the ingestion anomalies file and the relationship will be skipped."
            )
        return form
    
    @admin.display(description="Has Custom Code", boolean=True)
    def has_custom_code(self, obj):
        return bool(obj.custom_ingestion_code and obj.custom_ingestion_code.strip())

class TripleAdmin(admin.ModelAdmin):
    list_display = ("name", "uri", "relationship")
    list_filter = ("relationship",)
    search_fields = ("name", "uri")
    autocomplete_fields = ("relationship",)

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        if "relationship" in form.base_fields:
            form.base_fields["relationship"].queryset = Relationship.objects.exclude(
                type__in=[RelationshipType.TEXT, RelationshipType.ANATOMICAL_MULTI]
            )
        return form

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


class ConnectivityStatementTripleInline(admin.TabularInline):
    model = ConnectivityStatementTriple
    extra = 1
    autocomplete_fields = ("relationship",)
    raw_id_fields = ("triples",)
    fields = ("relationship", "triples")

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        if "relationship" in form.base_fields:
            # Only show triple relationship types
            form.base_fields["relationship"].queryset = Relationship.objects.filter(
                type__in=[RelationshipType.TRIPLE_SINGLE, RelationshipType.TRIPLE_MULTI]
            )
        return form


class ConnectivityStatementTextInline(admin.TabularInline):
    model = ConnectivityStatementText
    extra = 1
    autocomplete_fields = ("relationship",)
    fields = ("relationship", "text")

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        if "relationship" in form.base_fields:
            # Only show text relationship types
            form.base_fields["relationship"].queryset = Relationship.objects.filter(
                type=RelationshipType.TEXT
            )
        return form


class ConnectivityStatementAnatomicalEntityInline(admin.TabularInline):
    model = ConnectivityStatementAnatomicalEntity
    extra = 1
    autocomplete_fields = ("relationship",)
    raw_id_fields = ("anatomical_entities",)
    fields = ("relationship", "anatomical_entities")

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        if "relationship" in form.base_fields:
            # Only show anatomical entity relationship types
            form.base_fields["relationship"].queryset = Relationship.objects.filter(
                type__in=[RelationshipType.ANATOMICAL_MULTI]
            )
        return form


class ConnectivityStatementAdmin(
    SortableAdminBase, FSMTransitionMixin, admin.ModelAdmin
):
    list_per_page = 10
    # The name of one or more FSMFields on the model to transition
    fsm_field = ("state",)
    readonly_fields = (
        "state",
        "curie_id",
        "has_statement_been_exported",
        "reference_uri",
    )
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

    inlines = (ProvenanceInline, ExpertConsultantInline, NoteConnectivityStatementInline,
               ViaInline, DestinationInline, StatementAlertInline, ConnectivityStatementTripleInline,
               ConnectivityStatementTextInline, ConnectivityStatementAnatomicalEntityInline)

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


class IngestSentenceForm(forms.Form):
    file = forms.FileField(label="CSV file")


class IngestStatementsForm(forms.Form):
    """Form for configuring connectivity statement ingestion parameters"""
    update_upstream = forms.BooleanField(
        required=False,
        initial=False,
        label="Update upstream statements",
        help_text="Set this flag to update upstream statements."
    )
    update_anatomical_entities = forms.BooleanField(
        required=False,
        initial=False,
        label="Update anatomical entities",
        help_text="Set this flag to try move anatomical entities to specific layer, region."
    )
    disable_overwrite = forms.BooleanField(
        required=False,
        initial=False,
        label="Disable overwrite",
        help_text="Set this flag to prevent overwriting existing statements."
    )
    full_imports = forms.CharField(
        required=False,
        widget=forms.Textarea(attrs={'rows': 3, 'placeholder': 'Enter URIs separated by commas or new lines'}),
        label="Full imports",
        help_text="List of full imports to include in the ingestion (comma or newline separated)."
    )
    label_imports = forms.CharField(
        required=False,
        widget=forms.Textarea(attrs={'rows': 3, 'placeholder': 'Enter labels separated by commas or new lines'}),
        label="Label imports",
        help_text="List of label imports to include in the ingestion (comma or newline separated)."
    )
    population_file = forms.FileField(
        required=False,
        label="Population file",
        help_text="Text file containing population URIs (one per line). Only statements matching these URIs will be processed."
    )


# Custom view for ingesting sentences from a CSV file
def ingest_sentences_view(request):
    output = None
    success = None
    if request.method == "POST":
        form = IngestSentenceForm(request.POST, request.FILES)
        if form.is_valid():
            uploaded_file = form.cleaned_data['file']
            upload_dir = os.path.join(settings.MEDIA_ROOT, "nlp_uploads")
            os.makedirs(upload_dir, exist_ok=True)
            file_path = os.path.join(upload_dir, uploaded_file.name)
            with open(file_path, 'wb+') as destination:
                for chunk in uploaded_file.chunks():
                    destination.write(chunk)
            # Run the ingest command and capture output
            result = subprocess.run(
                ['python', 'manage.py', 'ingest_nlp_sentence', file_path],
                capture_output=True, text=True
            )
            output = result.stdout + "\n" + result.stderr
            success = result.returncode == 0
    else:
        form = IngestSentenceForm()
    context = admin.site.each_context(request)  # Get full admin context
    context.update({
        "form": form,
        "output": output,
        "success": success,
    })
    return render(request, "admin/ingest_sentences.html", context)


# Custom view for downloading ingestion log files
def download_logs_view(request):
    """
    Admin page with links to download ingestion log files.
    """
    context = admin.site.each_context(request)
    context.update({
        "title": "Download Ingestion Logs",
        "anomalies_url": reverse('composer-api:ingestion-logs') + '?log_type=anomalies',
        "ingested_url": reverse('composer-api:ingestion-logs') + '?log_type=ingested',
    })
    return render(request, "admin/download_logs.html", context)


# Custom view for ingesting connectivity statements
def ingest_statements_view(request):
    """
    Admin page for configuring and triggering connectivity statement ingestion.
    """
    context = admin.site.each_context(request)
    if request.method == "POST":
        form = IngestStatementsForm(request.POST, request.FILES)
        if form.is_valid():
            context.update({
                "form": form,
                "title": "Ingest Connectivity Statements",
            })
            return render(request, "admin/ingest_statements.html", context)
    else:
        form = IngestStatementsForm()
    
    context.update({
        "form": form,
        "title": "Ingest Connectivity Statements",
    })
    return render(request, "admin/ingest_statements.html", context)


def custom_admin_urls(original_get_urls):
    def get_urls():
        urls = original_get_urls()
        custom_urls = [
            path('ingest-sentences/', admin.site.admin_view(ingest_sentences_view), name='ingest-sentences'),
            path('ingest-statements/', admin.site.admin_view(ingest_statements_view), name='ingest-statements'),
            path('download-logs/', admin.site.admin_view(download_logs_view), name='download-logs'),
        ]
        return custom_urls + urls
    return get_urls

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
admin.site.register(Relationship, RelationshipAdmin)
admin.site.register(Triple, TripleAdmin)
admin.site.register(ConnectivityStatement, ConnectivityStatementAdmin)
admin.site.register(ExportBatch, ExportBatchAdmin)
admin.site.register(Sentence, SentenceAdmin)
admin.site.register(Specie)
admin.site.register(Tag)
admin.site.register(FunctionalCircuitRole)
admin.site.register(ProjectionPhenotype)
admin.site.register(AlertType, AlertTypeAdmin)
# admin.site.register(ExportMetrics)

# Register the custom view URL
admin.site.get_urls = custom_admin_urls(admin.site.get_urls)


def login(request, extra_context=None):
    return index(request)


admin.site.login = login
