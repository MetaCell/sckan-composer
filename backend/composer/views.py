from django.http import HttpResponse, HttpResponseRedirect
from django.template import loader
from django.urls import reverse


def index(request):
    if not hasattr(request, "user") or not request.user.is_authenticated:
        return HttpResponseRedirect(
            reverse("social:begin", kwargs={"backend": "orcid"})
        )

    template = loader.get_template("composer/index.html")
    context = {}
    return HttpResponse(template.render(context, request))


def logout_landing(request):
    if hasattr(request, "user") and request.user.is_authenticated:
        # user is still logged in, so we need to log them out
        return HttpResponseRedirect(reverse("rest_framework:logout"))

    template = loader.get_template("composer/logout_landing.html")
    context = {}
    return HttpResponse(template.render(context, request))
