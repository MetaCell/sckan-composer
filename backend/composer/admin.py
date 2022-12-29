from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User

from fsm_admin.mixins import FSMTransitionMixin

from composer.models import AnsDivision, ConnectivityStatement, Profile, Provenance, Specie


# Define an inline admin descriptor for Profile model
# which acts a bit like a singleton
class ProfileInline(admin.StackedInline):
    model = Profile
    can_delete = False
    verbose_name_plural = 'profile'


# Define a new User admin
class UserAdmin(BaseUserAdmin):
    inlines = (ProfileInline,)


class ConnectivityStatementAdmin(FSMTransitionMixin, admin.ModelAdmin):
    # The name of one or more FSMFields on the model to transition
    fsm_field = ["state",]
    readonly_fields = ["state",]
    list_display = ["provenance", "knowledge_statement", "state"]


# Re-register UserAdmin
admin.site.unregister(User)
admin.site.register(User, UserAdmin)

admin.site.register(AnsDivision)
admin.site.register(ConnectivityStatement, ConnectivityStatementAdmin)
admin.site.register(Provenance)
admin.site.register(Specie)
