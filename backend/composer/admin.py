import nested_admin
from adminsortable2.admin import SortableAdminBase, SortableStackedInline
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from fsm_admin.mixins import FSMTransitionMixin

from composer.models import (AnatomicalEntity, AnsDivision,
                             ConnectivityStatement, Doi, Note, Profile,
                             Sentence, Specie, Tag, Via)

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


class DoiNestedInline(nested_admin.NestedStackedInline):
    model = Doi
    extra = 1


class NoteSentenceInline(admin.StackedInline):
    model = Note
    exclude = ("connectivity_statement",)
    extra = 0
    sortable_options = "disabled"


class NoteConnectivityStatementInline(admin.StackedInline):
    model = Note
    exclude = ("sentence",)
    extra = 0


class ConnectivityStatementInline(nested_admin.NestedStackedInline):
    model = ConnectivityStatement
    extra = 1
    fields = ("sentence", "knowledge_statement")
    inlines = (DoiNestedInline,)


# Define a new User admin
class UserAdmin(BaseUserAdmin):
    inlines = (ProfileInline,)


class SentenceAdmin(
    FSMTransitionMixin, nested_admin.NestedModelAdmin, admin.ModelAdmin
):
    # The name of one or more FSMFields on the model to transition
    fsm_field = ("state",)
    readonly_fields = ("state",)
    list_display = ("title", "pmid", "pmcid", "tag_list", "owner")
    list_display_links = ("title", "pmid", "pmcid")
    search_fields = ("title", "text", "pmid", "pmcid", "doi")

    @admin.display(description="tags")
    def tag_list(self, obj):
        tags = ", ".join(obj.tags.all().values_list("tag", flat=True))
        return tags

    inlines = (
        ConnectivityStatementInline,
        NoteSentenceInline,
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
    autocomplete_fields = ("sentence", "origin", "destination")
    list_display = (
        "sentence",
        "pmid",
        "pmcid",
        "short_ks",
        "origin",
        "destination",
        "tag_list",
        "state",
        "owner",
    )
    list_display_links = ("sentence", "pmid", "pmcid", "short_ks", "state")
    list_select_related = ("sentence", "origin", "destination")
    search_fields = (
        "sentence__title",
        "sentence__text",
        "sentence__pmid",
        "sentence__pmcid",
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
        return obj.sentence.pmid

    @admin.display(description="PMCID")
    def pmcid(self, obj):
        return obj.sentence.pmcid

    @admin.display(description="tags")
    def tag_list(self, obj):
        tags = ", ".join(obj.tags.all().values_list("tag", flat=True))
        return tags


# Re-register UserAdmin
admin.site.unregister(User)
admin.site.register(User, UserAdmin)

admin.site.register(AnatomicalEntity, AnatomicalEntityAdmin)
admin.site.register(AnsDivision)
admin.site.register(ConnectivityStatement, ConnectivityStatementAdmin)
admin.site.register(Tag)
admin.site.register(Sentence, SentenceAdmin)
admin.site.register(Specie)
