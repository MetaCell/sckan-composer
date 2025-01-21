import os

from django.utils import timezone
from django.http import HttpResponse, HttpResponseRedirect, Http404
from django.template import loader
from django.urls import reverse

from composer.enums import CSState
from composer.models import ConnectivityStatement
from composer.services.export.export_services import export_connectivity_statements

from version import VERSION

def index(request):
    if not hasattr(request, "user") or not request.user.is_authenticated:
        return HttpResponseRedirect(
            reverse("social:begin", kwargs={"backend": "orcid"})
            + f"?next={request.path}"
        )
    return HttpResponseRedirect(reverse("admin:index"))


def logout_landing(request):
    if hasattr(request, "user") and request.user.is_authenticated:
        # user is still logged in, so we need to log them out
        return HttpResponseRedirect(reverse("rest_framework:logout"))

    template = loader.get_template("composer/logout_landing.html")
    context = {}
    return HttpResponse(template.render(context, request))


def admin_login(request):
    """
    Assuming the name of the external system's login url is "login"
    """
    return index(request)


def export(request):
    """
    Exporting all connectivity statements that have state NPO Approved
    """
    if request.user.is_staff:
        # only staff users can export connectivity statements
        qs = ConnectivityStatement.objects.filter(state=CSState.NPO_APPROVED)
        file_path, export_batch = export_connectivity_statements(qs=qs, user=request.user, folder_path=None)
        from django.contrib import messages
        messages.add_message(request, messages.INFO, f"Exported {export_batch.get_count_connectivity_statements_in_this_export} connectivity statements.")
        if os.path.exists(file_path):
            with open(file_path, 'rb') as fh:
                composer_version = f'# SCKAN Composer version: {VERSION}\n' 
                date_exported = f'# Export date: {timezone.now().strftime("%Y-%m-%d")}\n'
                content = composer_version + date_exported + fh.read().decode()
                response = HttpResponse(content.encode(), content_type="application/text")
                response['Content-Disposition'] = 'inline; filename=' + os.path.basename(file_path)
                return response
        raise Http404
    return HttpResponse('Unauthorized', status=401)
