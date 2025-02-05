import json

from django.http import HttpResponse, Http404
from drf_react_template.schema_form_encoder import SchemaProcessor, UiSchemaProcessor
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema, OpenApiParameter
from rest_framework import mixins, permissions, viewsets, status
from rest_framework.decorators import action, api_view
from rest_framework.renderers import INDENT_SEPARATORS
from rest_framework.response import Response
from rest_framework.serializers import ValidationError
from rest_framework import generics
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Case, When, Value, IntegerField

from composer.services.state_services import (
    ConnectivityStatementStateService,
    SentenceStateService,
)
from .filtersets import (
    SentenceFilter,
    ConnectivityStatementFilter,
    KnowledgeStatementFilterSet,
    AnatomicalEntityFilter,
    NoteFilter,
    ViaFilter,
    SpecieFilter,
    DestinationFilter,
)
from .serializers import (
    AlertTypeSerializer,
    AnatomicalEntitySerializer,
    PhenotypeSerializer,
    ProjectionPhenotypeSerializer,
    ConnectivityStatementSerializer,
    KnowledgeStatementSerializer,
    NoteSerializer,
    ProfileSerializer,
    SentenceSerializer,
    SpecieSerializer,
    StatementAlertSerializer,
    TagSerializer,
    ViaSerializer,
    ProvenanceSerializer,
    SexSerializer,
    PopulationSetSerializer,
    ConnectivityStatementUpdateSerializer,
    DestinationSerializer,
    BaseConnectivityStatementSerializer,
)
from .permissions import (
    IsStaffUserIfExportedStateInConnectivityStatement,
    IsOwnerOrAssignOwnerOrCreateOrReadOnly,
    IsOwnerOfConnectivityStatementOrReadOnly,
)
from ..models import (
    AlertType,
    AnatomicalEntity,
    Phenotype,
    ProjectionPhenotype,
    ConnectivityStatement,
    Note,
    Profile,
    Sentence,
    Specie,
    StatementAlert,
    Tag,
    Via,
    Provenance,
    Sex,
    PopulationSet,
    Destination,
    GraphRenderingState,
)


# Mixins
class AssignOwnerMixin(viewsets.GenericViewSet):
    @action(
        detail=True, methods=["patch"], permission_classes=[permissions.IsAuthenticated]
    )
    def assign_owner(self, request, pk=None):
        instance = self.get_object()
        instance.assign_owner(request)
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        self.get_object().auto_assign_owner(request)
        return super().retrieve(request, *args, **kwargs)


class TagMixin(viewsets.GenericViewSet):
    @extend_schema(
        parameters=[
            OpenApiParameter(
                "tag_id",
                OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
                required=True,
            )
        ],
        request=None,
    )
    @action(detail=True, methods=["post"], url_path="add_tag/(?P<tag_id>\w+)")
    def add_tag(self, request, pk=None, tag_id=None):
        instance = self.get_object()
        tag_instance = Tag.objects.get(id=tag_id)
        instance.tags.add(tag_instance)
        return Response(self.get_serializer(instance).data)

    @extend_schema(
        parameters=[
            OpenApiParameter(
                "tag_id",
                OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
                required=True,
            )
        ],
        request=None,
    )
    @action(detail=True, methods=["post"], url_path="del_tag/(?P<tag_id>\w+)")
    def del_tag(self, request, pk=None, tag_id=None):
        instance = self.get_object()
        tag_instance = Tag.objects.get(id=tag_id)
        instance.tags.remove(tag_instance)
        return Response(self.get_serializer(instance).data)


class ProvenanceMixin(
    viewsets.GenericViewSet,
):
    @extend_schema(
        parameters=[
            OpenApiParameter(
                "uri",
                OpenApiTypes.STR,
                location=OpenApiParameter.PATH,
                required=True,
            )
        ],
        request=None,
    )
    @action(detail=True, methods=["post"], url_path="add_provenance/(?P<uri>.*)")
    def add_provenance(self, request, pk=None, uri=None):
        procenance, created = Provenance.objects.get_or_create(
            connectivity_statement_id=pk,
            uri=uri,
        )
        procenance.save()
        instance = self.get_object()
        return Response(self.get_serializer(instance).data)

    @extend_schema(
        parameters=[
            OpenApiParameter(
                "provenance_id",
                OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
                required=True,
            )
        ],
        request=None,
    )
    @action(
        detail=True,
        methods=["delete"],
        url_path="del_provenance/(?P<provenance_id>\d+)",
    )
    def del_provenance(self, request, pk=None, provenance_id=None):
        count, deleted = Provenance.objects.filter(
            id=provenance_id, connectivity_statement_id=pk
        ).delete()
        if count == 0:
            raise Http404
        instance = self.get_object()
        return Response(self.get_serializer(instance).data)


class SpecieMixin(
    viewsets.GenericViewSet,
):
    @extend_schema(
        parameters=[
            OpenApiParameter(
                "specie_id",
                OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
                required=True,
            )
        ],
        request=None,
    )
    @action(detail=True, methods=["post"], url_path="add_specie/(?P<specie_id>\w+)")
    def add_specie(self, request, pk=None, specie_id=None):
        instance = self.get_object()
        specie_instance = Specie.objects.get(id=specie_id)
        instance.species.add(specie_instance)
        return Response(self.get_serializer(instance).data)

    @extend_schema(
        parameters=[
            OpenApiParameter(
                "specie_id",
                OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
                required=True,
            )
        ],
        request=None,
    )
    @action(detail=True, methods=["post"], url_path="del_specie/(?P<specie_id>\w+)")
    def del_specie(self, request, pk=None, specie_id=None):
        instance = self.get_object()
        specie_instance = Specie.objects.get(id=specie_id)
        instance.species.remove(specie_instance)
        return Response(self.get_serializer(instance).data)


class TransitionMixin(viewsets.GenericViewSet):
    @action(detail=True, methods=["post"], url_path="do_transition/(?P<transition>\w+)")
    def transition(self, request, pk=None, transition=None):
        instance = self.service(self.get_object()).do_transition(
            transition, user=request.user, request=request
        )
        instance.save()
        return Response(self.get_serializer(instance).data)


class CSCloningMixin(viewsets.GenericViewSet):
    @action(detail=True, methods=["get"], url_path="clone_statement")
    def clone_statement(self, request, pk=None, statement_id=None):
        instance = self.get_object()
        instance.pk = None
        instance.origins = None
        instance.save()
        instance.species.add(*self.get_object().species.all())
        provenances = (
            Provenance(connectivity_statement=instance, uri=provenance.uri)
            for provenance in self.get_object().provenance_set.all()
        )
        Provenance.objects.bulk_create(provenances)
        return Response(self.get_serializer(instance).data)


# Viewsets


class ModelRetrieveViewSet(
    # mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    # mixins.UpdateModelMixin,
    # mixins.DestroyModelMixin,
    # mixins.ListModelMixin,
    viewsets.GenericViewSet,
):
    ...


class ModelCreateRetrieveViewSet(
    ModelRetrieveViewSet,
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
):
    ...


class ModelNoDeleteViewSet(
    ModelCreateRetrieveViewSet,
    mixins.UpdateModelMixin,
):
    ...


class AnatomicalEntityViewSet(viewsets.ReadOnlyModelViewSet):
    """
    AnatomicalEntity
    """

    queryset = AnatomicalEntity.objects.all()
    serializer_class = AnatomicalEntitySerializer
    permission_classes = [
        permissions.IsAuthenticatedOrReadOnly,
    ]
    filterset_class = AnatomicalEntityFilter


class PhenotypeViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Phenotype
    """

    queryset = Phenotype.objects.all()
    serializer_class = PhenotypeSerializer
    permission_classes = [
        permissions.IsAuthenticatedOrReadOnly,
    ]


class ProjectionPhenotypeViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Projection Phenotype
    """

    queryset = ProjectionPhenotype.objects.all()
    serializer_class = ProjectionPhenotypeSerializer
    permission_classes = [
        permissions.IsAuthenticatedOrReadOnly,
    ]


class SexViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Sex
    """

    queryset = Sex.objects.all()
    serializer_class = SexSerializer
    permission_classes = [
        permissions.IsAuthenticatedOrReadOnly,
    ]


class PopulationSetViewset(viewsets.ReadOnlyModelViewSet):
    """PopulationSet"""

    queryset = PopulationSet.objects.all()
    serializer_class = PopulationSetSerializer
    permission_classes = [
        permissions.IsAuthenticatedOrReadOnly,
    ]


class NoteViewSet(viewsets.ModelViewSet):
    """
    Note
    """

    queryset = Note.objects.all()
    serializer_class = NoteSerializer
    permission_classes = [
        permissions.IsAuthenticatedOrReadOnly,
    ]
    filterset_class = NoteFilter


class AlertTypeViewSet(viewsets.ReadOnlyModelViewSet):
    """
    A viewset for viewing the list of alert types.
    """

    queryset = AlertType.objects.all()
    serializer_class = AlertTypeSerializer


class ConnectivityStatementViewSet(
    ProvenanceMixin,
    SpecieMixin,
    TagMixin,
    TransitionMixin,
    AssignOwnerMixin,
    CSCloningMixin,
    viewsets.ModelViewSet,
):
    """
    ConnectivityStatement
    """

    queryset = ConnectivityStatement.objects.all()
    serializer_class = ConnectivityStatementSerializer
    permission_classes = [
        IsStaffUserIfExportedStateInConnectivityStatement,
        IsOwnerOrAssignOwnerOrCreateOrReadOnly,
    ]
    filterset_class = ConnectivityStatementFilter
    service = ConnectivityStatementStateService

    def get_serializer_class(self):
        if self.action in ["update", "partial_update"]:
            return ConnectivityStatementUpdateSerializer
        if self.action == "list":
            return BaseConnectivityStatementSerializer
        return ConnectivityStatementSerializer

    def get_queryset(self):
        if self.action == "list" and "sentence_id" not in self.request.query_params:
            return ConnectivityStatement.objects.excluding_draft()
        return super().get_queryset()

    """
    Override the update method to apply the extend_schema decorator.
    The actual update logic is handled by the serializer.
    """

    @extend_schema(
        methods=["PUT"],
        request=ConnectivityStatementUpdateSerializer,
        responses={200: ConnectivityStatementSerializer},
    )
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    """
    Override the partial_update method to apply the extend_schema decorator.
    The actual update logic is handled by the serializer.
    """

    @extend_schema(
        methods=["PATCH"],
        request=ConnectivityStatementUpdateSerializer,
        responses={200: ConnectivityStatementSerializer},
    )
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)


@extend_schema(tags=["public"])
class KnowledgeStatementViewSet(
    generics.ListAPIView,
):
    """
    KnowledgeStatement that only allows GET to get the list of ConnectivityStatements
    """

    model = ConnectivityStatement
    queryset = ConnectivityStatement.objects.exported()
    serializer_class = KnowledgeStatementSerializer
    permission_classes = [
        permissions.AllowAny,
    ]
    filter_backends = [DjangoFilterBackend]
    filterset_class = KnowledgeStatementFilterSet

    @property
    def allowed_methods(self):
        return ["GET"]

    def get_serializer_class(self):
        return KnowledgeStatementSerializer

    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)


class TagViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Tag
    """

    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [
        permissions.IsAuthenticatedOrReadOnly,
    ]


class SentenceViewSet(
    TagMixin, TransitionMixin, AssignOwnerMixin, ModelNoDeleteViewSet
):
    """
    Sentence
    """

    queryset = Sentence.objects.all()
    serializer_class = SentenceSerializer
    permission_classes = [
        IsOwnerOrAssignOwnerOrCreateOrReadOnly,
    ]
    filterset_class = SentenceFilter
    service = SentenceStateService

    def get_queryset(self):
        if "ordering" not in self.request.query_params:
            return (
                super()
                .get_queryset()
                .annotate(
                    is_current_user=Case(
                        When(owner=self.request.user, then=Value(1)),
                        default=Value(0),
                        output_field=IntegerField(),
                    )
                )
                .order_by("-is_current_user", "-modified_date")
            )
        return super().get_queryset()


class SpecieViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Specie
    """

    queryset = Specie.objects.all()
    serializer_class = SpecieSerializer
    permission_classes = [
        permissions.IsAuthenticatedOrReadOnly,
    ]
    filterset_class = SpecieFilter


class ProfileViewSet(viewsets.GenericViewSet):
    """
    Profile
    """

    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_anonymous:
            return super().get_queryset().none()
        return super().get_queryset().filter(user=self.request.user)

    @action(detail=False, methods=["get"])
    def my(self, request, *args, **kwargs):
        user = request.user
        if not user.is_authenticated:
            msg = "User not logged in."
            raise ValidationError(msg, code="authorization")

        profile, created = Profile.objects.get_or_create(
            user=self.request.user)
        return Response(self.get_serializer(profile).data)


class IsOwnerOfConnectivityStatement:
    pass


class ViaViewSet(viewsets.ModelViewSet):
    """
    Via
    """

    queryset = Via.objects.all()
    serializer_class = ViaSerializer
    permission_classes = [
        IsOwnerOfConnectivityStatementOrReadOnly,
    ]
    filterset_class = ViaFilter


class DestinationViewSet(viewsets.ModelViewSet):
    """
    Destination
    """

    queryset = Destination.objects.all()
    serializer_class = DestinationSerializer
    permission_classes = [IsOwnerOfConnectivityStatementOrReadOnly]
    filterset_class = DestinationFilter


class StatementAlertViewSet(viewsets.ModelViewSet):
    """
    StatementAlert
    """

    queryset = StatementAlert.objects.all()
    serializer_class = StatementAlertSerializer
    permission_classes = [IsOwnerOfConnectivityStatementOrReadOnly]


@extend_schema(
    responses=OpenApiTypes.OBJECT,
)
@api_view(["GET"])
def jsonschemas(request):
    serializers = [
        ConnectivityStatementSerializer,
        SentenceSerializer,
        ViaSerializer,
        DestinationSerializer,
        TagSerializer,
        ProvenanceSerializer,
        SpecieSerializer,
        NoteSerializer,
        StatementAlertSerializer,
    ]

    schema = {}
    for s in serializers:
        obj = s(**{})
        schema[s.Meta.model.__name__] = {
            "schema": SchemaProcessor(obj, {}).get_schema(),
            "uiSchema": UiSchemaProcessor(obj, {}).get_ui_schema(),
        }

    ret = json.dumps(
        schema,
        indent=2,
        ensure_ascii=True,
        allow_nan=True,
        separators=INDENT_SEPARATORS,
    )
    ret = ret.replace("\u2028", "\\u2028").replace("\u2029", "\\u2029")
    data = bytes(ret.encode("utf-8"))
    return HttpResponse(data)
