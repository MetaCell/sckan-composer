from django.http import HttpResponse, HttpResponseRedirect
from django.template import loader
from django.urls import reverse


def index(request):
    if not hasattr(request, "user") or not request.user.is_authenticated:
        return HttpResponseRedirect(reverse('social:begin', kwargs={"backend":"orcid"}))

    template = loader.get_template('composer/index.html')
    context = {}
    return HttpResponse(template.render(context, request))
