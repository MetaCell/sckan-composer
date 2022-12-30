from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User

from adminsortable2.admin import SortableAdminBase, SortableStackedInline
from fsm_admin.mixins import FSMTransitionMixin

from composer.models import AnatomicalEntity, AnsDivision, ConnectivityStatement, Profile, Provenance, Specie, Via


# Define an inline admin descriptor for Profile model
# which acts a bit like a singleton
class ProfileInline(admin.StackedInline):
    model = Profile
    can_delete = False
    verbose_name_plural = 'profile'


# Define a new User admin
class UserAdmin(BaseUserAdmin):
    inlines = (ProfileInline,)


class ProvenanceAdmin(admin.ModelAdmin):
    list_display = ("title", "pmid", "pmcid", "uri")
    list_display_links = ("title", "pmid", "pmcid", "uri")
    search_fields = ("title", "description", "pmid", "pmcid", "uri")


class PathInline(SortableStackedInline):
    model = Via
    extra = 0


class ConnectivityStatementAdmin(SortableAdminBase, FSMTransitionMixin, admin.ModelAdmin):
    # The name of one or more FSMFields on the model to transition
    fsm_field = ("state",)
    readonly_fields = ("state",)
    list_display = ("provenance", "short_ks", "origin", "destination", "state")
    list_display_links = ("provenance", "short_ks", "state")
    list_select_related = ("provenance", "origin", "destination")
    search_fields = ("provenance__title", "provenance__description", "knowledge_statement", "origin__name", "destination__name")
    inlines = (PathInline,)

    @admin.display(description='Knowledge Statement')    
    def short_ks(self, obj):
        return str(obj)

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "curator":
            kwargs["queryset"] = User.objects.filter(profile__is_curator=True)
        return super(ConnectivityStatementAdmin, self).formfield_for_foreignkey(db_field, request, **kwargs)


# Re-register UserAdmin
admin.site.unregister(User)
admin.site.register(User, UserAdmin)

admin.site.register(AnatomicalEntity)
admin.site.register(AnsDivision)
admin.site.register(ConnectivityStatement, ConnectivityStatementAdmin)
admin.site.register(Provenance)
admin.site.register(Specie)
