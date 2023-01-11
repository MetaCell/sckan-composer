from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AnatomicalEntityViewSet,
    AnsDivisionViewSet,
    ConnectivityStatementViewSet,
    NoteViewSet,
    ProfileViewSet,
    ProvenanceViewSet,
    SpecieViewSet,
    TagViewSet,
    ViaViewSet,
)

# Create a router and register our viewsets with it.
router = DefaultRouter()
router.register(
    r"anatomical-entity", AnatomicalEntityViewSet, basename="anatomical-entity"
)
router.register(r"ans-division", AnsDivisionViewSet, basename="ans-division")
router.register(
    r"connectivity-statement",
    ConnectivityStatementViewSet,
    basename="connectivity-statement",
)
router.register(r"note", NoteViewSet, basename="note")
router.register(r"note-tag", TagViewSet, basename="note-tag")
router.register(r"provenance", ProvenanceViewSet, basename="provenance")
router.register(r"specie", SpecieViewSet, basename="specie")
router.register(r"profile", ProfileViewSet, basename="profile")
router.register(r"tag", TagViewSet, basename="tag")
router.register(r"via", ViaViewSet, basename="via")

# The API URLs are now determined automatically by the router.
app_name = "composer-api"
urlpatterns = [
    path("", include(router.urls)),
]
