
from django.http import HttpResponse, HttpResponseRedirect
from django.template import loader
from django.urls import reverse
from composer.services.workflows.export import run_export_workflow
from django.contrib import messages

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
    Initiates an Argo workflow to export all connectivity statements.
    The export will run asynchronously and notify the user by email upon completion.
    """
    user = request.user

    if not user.is_staff:
        return HttpResponse("Unauthorized", status=401)

    if not user.email:
        messages.error(request, "Export failed: your account does not have an email address configured.")
        return HttpResponse("Missing user email", status=400)

    run_export_workflow(user=user, scheme=request.scheme)

    messages.success(request, "Export process started. You will receive an email when it is complete.")
    return HttpResponse("Export started", status=202)
