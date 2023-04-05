from django.urls import include, path, re_path

from . import views

urlpatterns = [
    path("api/composer/", include("composer.api.urls")),
    path("export", views.export, name="export"),
    path("login", views.index, name="index"),
    path("logged-out/", views.logout_landing, name="logged-out"),
]
