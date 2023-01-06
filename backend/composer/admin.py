import nested_admin
import nested_admin

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from django.utils.html import format_html

from adminsortable2.admin import SortableAdminBase, SortableStackedInline
from fsm_admin.mixins import FSMTransitionMixin

from composer.models import (
    AnatomicalEntity,
    AnsDivision,
    ConnectivityStatement,
    Doi,
    Note,
    NoteTag,
    Profile,
    Provenance,
    Specie,
    Via,
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


class DoiInline(admin.StackedInline):
    model = Doi
    extra = 1


class DoiiNestedInline(nested_admin.NestedStackedInline):
    model = Doi
    extra = 1


class NoteProvenanceInline(admin.StackedInline):
    model = Note
    exclude = ("connectivity_statement",)
    extra = 0
    sortable_options = "disabled"


class NoteConnectivityStatementInline(admin.StackedInline):
    model = Note
    exclude = ("provenance",)
    extra = 0


class ConnectivityStatementInline(nested_admin.NestedStackedInline):
    model = ConnectivityStatement
    extra = 1
    fields = ("provenance", "knowledge_statement")
    inlines = (DoiiNestedInline,)


# Define a new User admin
class UserAdmin(BaseUserAdmin):
    inlines = (ProfileInline,)


class ProvenanceAdmin(
    FSMTransitionMixin, nested_admin.NestedModelAdmin, admin.ModelAdmin
):
    # The name of one or more FSMFields on the model to transition
    fsm_field = ("state",)
    readonly_fields = ("pmid_uri", "pmcid_uri", "state")
    list_display = ("title", "pmid", "pmcid")
    list_display_links = ("title", "pmid", "pmcid")
    search_fields = ("title", "description", "pmid", "pmcid")

    @admin.display(description="PMID")
    def pmid_uri(self, obj):
        return (
            format_html("<a href='{url}' target='blank'>{url}</a>", url=obj.pmid_uri)
            if obj.pmid_uri
            else ""
        )

    @admin.display(description="PMCID")
    def pmcid_uri(self, obj):
        return (
            format_html("<a href='{url}' target='blank'>{url}</a>", url=obj.pmcid_uri)
            if obj.pmcid_uri
            else ""
        )

    inlines = (
        ConnectivityStatementInline,
        NoteProvenanceInline,
    )


class AnatomicalEntityAdmin(admin.ModelAdmin):
    list_display = ("name", "ontology_uri")
    list_display_links = ("name", "ontology_uri")
    search_fields = ("name",)  # or ("^name",) for search to start with


class ConnectivityStatementAdmin(
    SortableAdminBase, FSMTransitionMixin, admin.ModelAdmin
):
    # The name of one or more FSMFields on the model to transition
    fsm_field = ("state",)
    readonly_fields = ("state",)
    autocomplete_fields = ("provenance", "origin", "destination")
    list_display = (
        "provenance",
        "pmid",
        "pmcid",
        "short_ks",
        "origin",
        "destination",
        "state",
        "curator",
    )
    list_display_links = ("provenance", "pmid", "pmcid", "short_ks", "state")
    list_select_related = ("provenance", "origin", "destination")
    search_fields = (
        "provenance__title",
        "provenance__description",
        "provenance__pmid",
        "provenance__pmcid",
        "knowledge_statement",
        "origin__name",
        "destination__name",
    )

    fieldsets = ()

    inlines = (DoiInline, PathInline, NoteConnectivityStatementInline)

    @admin.display(description="Knowledge Statement")
    def short_ks(self, obj):
        return str(obj)

    @admin.display(description="PMID")
    def pmid(self, obj):
        return obj.provenance.pmid

    @admin.display(description="PMCID")
    def pmcid(self, obj):
        return obj.provenance.pmcid

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "curator":
            kwargs["queryset"] = User.objects.filter(profile__is_curator=True)
        return super(ConnectivityStatementAdmin, self).formfield_for_foreignkey(
            db_field, request, **kwargs
        )


# Re-register UserAdmin
admin.site.unregister(User)
admin.site.register(User, UserAdmin)

admin.site.register(AnatomicalEntity, AnatomicalEntityAdmin)
admin.site.register(AnsDivision)
admin.site.register(ConnectivityStatement, ConnectivityStatementAdmin)
admin.site.register(NoteTag)
admin.site.register(Provenance, ProvenanceAdmin)
admin.site.register(Specie)
