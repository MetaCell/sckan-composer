from django.conf import settings
from django.contrib.auth import logout
from django.urls import reverse

from rest_framework.decorators import api_view
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema

from .serializers import LoginSerializer, LogoutSerializer


def _get_login_url():
    return reverse('social:begin', kwargs={"backend":"orcid"})


@extend_schema(responses=LoginSerializer,)
@api_view(["GET"])
def user_login(request):
    if request.user.is_authenticated:
        resp = {"status_code": 200, "message": "User is already logged in"}
    else:
        # Redirect to login page. (configurable in settings.py)
        resp = {"status_code": 302, "redirect_url": _get_login_url()}
    return Response(LoginSerializer(resp).data)


@extend_schema(responses=LogoutSerializer,)
@api_view(["GET"])
def user_logout(request):
    user = request.user
    if user.is_authenticated:
        if hasattr(user, "auth_token"):
            user.auth_token.delete()
        logout(request)
        # Redirect to logout redirect page. (configurable in settings.py)
        resp = {"status_code": 302, "message": "User is logged out", "redirect_url": settings.LOGOUT_REDIRECT_URL}
    else:
        resp = {"status_code": 302, "message": "User is not logged in", "redirect_url": _get_login_url()}
    return Response(LogoutSerializer(resp).data)
