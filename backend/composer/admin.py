import nested_admin
from adminsortable2.admin import SortableAdminBase, SortableStackedInline
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from fsm_admin.mixins import FSMTransitionMixin

from composer.models import (
    AnatomicalEntity,
    Phenotype,
    Sex,
    ConnectivityStatement,
    Provenance,
    ExportBatch,
    Note,
    Profile,
    Sentence,
    Specie,
    Tag,
    Via,
    FunctionalCircuitRole,
    ProjectionPhenotype, Destination
)


# Define Inlines

# Define an inline admin descriptor for Profile model
# which acts a bit like a singleton
class ProfileInline(admin.StackedInline):
    model = Profile
    can_delete = False
    verbose_name_plural = "profile"


class PathInline(SortableStackedInline):
    model = Via
    extra = 0
    autocomplete_fields = ("anatomical_entity",)
    default_order_field = "display_order"


class ProvenanceInline(admin.StackedInline):
    model = Provenance
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
    list_display = ("title", "pmid", "pmcid", "doi", "tag_list", "state", "owner")
    list_display_links = ("title", "pmid", "pmcid")
    list_filter = ("state", "owner", "tags__tag")
    search_fields = ("title", "text", "pmid", "pmcid", "doi")

    inlines = (
        ConnectivityStatementInline,
        NoteSentenceInline,
    )


class AnatomicalEntityAdmin(admin.ModelAdmin):
    list_display = ("name", "ontology_uri")
    list_display_links = ("name", "ontology_uri")
    search_fields = ("name",)  # or ("^name",) for search to start with


class DestinationInline(admin.TabularInline):
    model = Destination
    extra = 1
    autocomplete_fields = ['anatomical_entities']


class ConnectivityStatementAdmin(
    SortableAdminBase, FSMTransitionMixin, admin.ModelAdmin
):
    list_per_page = 10
    # The name of one or more FSMFields on the model to transition
    fsm_field = ("state",)
    readonly_fields = ("state",)
    autocomplete_fields = ("sentence", "origins")
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
        "origins__name",
        "destinations__anatomical_entities__name",
    )

    fieldsets = ()

    inlines = (ProvenanceInline, PathInline, NoteConnectivityStatementInline, DestinationInline)

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
    list_display_links = ("user", "created_at", "count_connectivity_statements",)
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


# Re-register UserAdmin
admin.site.unregister(User)
admin.site.register(User, UserAdmin)

#
admin.site.register(AnatomicalEntity, AnatomicalEntityAdmin)
admin.site.register(Phenotype)
admin.site.register(Sex)
admin.site.register(ConnectivityStatement, ConnectivityStatementAdmin)
admin.site.register(ExportBatch, ExportBatchAdmin)
admin.site.register(Sentence, SentenceAdmin)
admin.site.register(Specie)
admin.site.register(Tag)
admin.site.register(FunctionalCircuitRole)
admin.site.register(ProjectionPhenotype)
# admin.site.register(ExportMetrics)


#
from .views import index


def login(request, extra_context=None):
    return index(request)


admin.site.login = login
