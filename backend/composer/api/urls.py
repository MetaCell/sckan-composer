from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AnatomicalEntityViewSet,
    PhenotypeViewSet,
    ConnectivityStatementViewSet,
    jsonschemas,
    NoteViewSet,
    ProfileViewSet,
    SentenceViewSet,
    SpecieViewSet,
    TagViewSet,
    ViaViewSet,
    SexViewSet, DestinationViewSet,
)

# Create a router and register our viewsets with it.
router = DefaultRouter()
router.register(
    r"anatomical-entity", AnatomicalEntityViewSet, basename="anatomical-entity"
)
router.register(r"phenotype", PhenotypeViewSet, basename="phenotype")
router.register(r"sex", SexViewSet, basename="sex")
router.register(
    r"connectivity-statement",
    ConnectivityStatementViewSet,
    basename="connectivity-statement",
)
router.register(r"note", NoteViewSet, basename="note")
router.register(r"note-tag", TagViewSet, basename="note-tag")
router.register(r"sentence", SentenceViewSet, basename="sentence")
router.register(r"specie", SpecieViewSet, basename="specie")
router.register(r"profile", ProfileViewSet, basename="profile")
router.register(r"tag", TagViewSet, basename="tag")
router.register(r"via", ViaViewSet, basename="via")
router.register(r"destination", DestinationViewSet, basename="via")
# router.register(r"json", JsonViewSet, basename="json")

# The API URLs are now determined automatically by the router.
app_name = "composer-api"
urlpatterns = [
    path("", include(router.urls)),
    path("jsonschemas/", jsonschemas, name="jsonschemas"),
]
