import os

from django.utils import timezone
from django.http import HttpResponse, HttpResponseRedirect, Http404
from django.template import loader
from django.urls import reverse

from composer.services.workflows.export import run_export_workflow
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
    Initiates an Argo workflow to export all connectivity statements with state NPO_APPROVED + EXPORTED.
    The export will run asynchronously and notify the user by email upon completion.
    """
    if not request.user.is_staff:
        return HttpResponse('Unauthorized', status=401)

    run_export_workflow(username=request.user.username)
    
    return HttpResponse("Export started", status=202)