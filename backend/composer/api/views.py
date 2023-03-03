import json
from django.http import HttpResponse
from django.db.models import Q
from rest_framework.renderers import INDENT_SEPARATORS
from rest_framework import mixins, permissions, viewsets
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from rest_framework.serializers import ValidationError

from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample
from drf_react_template.schema_form_encoder import SchemaProcessor, UiSchemaProcessor

from .filtersets import (
    SentenceFilter,
    ConnectivityStatementFilter,
    AnatomicalEntityFilter,
    NoteFilter,
    ViaFilter,
)
from ..models import (
    AnatomicalEntity,
    AnsDivision,
    ConnectivityStatement,
    Note,
    Profile,
    Sentence,
    Specie,
    Tag,
    Via,
)
from ..services import ConnectivityStatementService, SentenceService
from .serializers import (
    AnatomicalEntitySerializer,
    AnsDivisionSerializer,
    ConnectivityStatementSerializer,
    NoteSerializer,
    ProfileSerializer,
    SentenceSerializer,
    SpecieSerializer,
    TagSerializer,
    ViaSerializer,
)


# Mixins
class AssignOwnerMixin(viewsets.GenericViewSet):
    def retrieve(self, request, *args, **kwargs):
        self.get_object().assign_owner(request)
        return super().retrieve(request, *args, **kwargs)


class TagMixin(
    viewsets.GenericViewSet,
):
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


class AnsDivisionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    AnsDivision
    """

    queryset = AnsDivision.objects.all()
    serializer_class = AnsDivisionSerializer
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


class ConnectivityStatementViewSet(SpecieMixin, TagMixin, TransitionMixin, AssignOwnerMixin, viewsets.ModelViewSet):
    """
    ConnectivityStatement
    """

    queryset = ConnectivityStatement.objects.all()
    serializer_class = ConnectivityStatementSerializer
    permission_classes = [
        permissions.IsAuthenticatedOrReadOnly,
    ]
    filterset_class = ConnectivityStatementFilter
    service = ConnectivityStatementService

    def get_queryset(self):
        if self.action == "list" and "sentence_id" in self.request.query_params:
            return super().get_queryset()
        return ConnectivityStatement.objects.excluding_draft()


class TagViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Tag
    """

    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [
        permissions.IsAuthenticatedOrReadOnly,
    ]


class SentenceViewSet(TagMixin, TransitionMixin, AssignOwnerMixin, ModelNoDeleteViewSet):
    """
    Sentence
    """

    queryset = Sentence.objects.all()
    serializer_class = SentenceSerializer
    permission_classes = [
        permissions.IsAuthenticatedOrReadOnly,
    ]
    filterset_class = SentenceFilter
    service = SentenceService


class SpecieViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Specie
    """

    queryset = Specie.objects.all()
    serializer_class = SpecieSerializer
    permission_classes = [
        permissions.IsAuthenticatedOrReadOnly,
    ]


class ProfileViewSet(viewsets.GenericViewSet):
    """
    Profile
    """

    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer

    def get_queryset(self):
        return super().get_queryset().filter(user=self.request.user)

    @action(detail=False, methods=["get"])
    def my(self, request, *args, **kwargs):
        user = request.user
        if not user.is_authenticated:
            msg = "User not logged in."
            raise ValidationError(msg, code="authorization")

        profile, created = Profile.objects.get_or_create(user=self.request.user)
        return Response(self.get_serializer(profile).data)


class ViaViewSet(viewsets.ModelViewSet):
    """
    Via
    """

    queryset = Via.objects.all()
    serializer_class = ViaSerializer
    permission_classes = [
        permissions.IsAuthenticatedOrReadOnly,
    ]
    filterset_class = ViaFilter


@extend_schema(
    responses=OpenApiTypes.OBJECT,
)
@api_view(["GET"])
def jsonschemas(request):
    serializers = [
        ConnectivityStatementSerializer,
        SentenceSerializer,
        ViaSerializer,
        TagSerializer,
        SpecieSerializer,
        NoteSerializer,
    ]

    schema = {}
    for s in serializers:
        obj = s({})
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
