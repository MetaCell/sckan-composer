"""AUTH URL Configuration"""
from django.urls import include, path

urlpatterns = [
    # API
    path("api/metacell_auth/", include("metacell_auth.api.urls")),
]
