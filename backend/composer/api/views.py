import json
from django.http import HttpResponse
from rest_framework.renderers import INDENT_SEPARATORS
from rest_framework import mixins, permissions, viewsets
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from rest_framework.serializers import ValidationError

from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema
from drf_react_template.schema_form_encoder import SerializerEncoder

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
    ConnectivityStatementWithDetailsSerializer,
    NoteSerializer,
    ProfileSerializer,
    SentenceSerializer,
    SentenceWithDetailsSerializer,
    SpecieSerializer,
    TagSerializer,
    ViaSerializer,
)


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


class ConnectivityStatementViewSet(viewsets.ModelViewSet):
    """
    ConnectivityStatement
    """

    queryset = ConnectivityStatement.objects.all()
    serializer_class = ConnectivityStatementSerializer
    serializer_class_with_details = ConnectivityStatementWithDetailsSerializer
    permission_classes = [
        permissions.IsAuthenticatedOrReadOnly,
    ]
    filterset_class = ConnectivityStatementFilter

    def get_serializer_class(self, *args, **kwargs):
        if self.action in ("list",):
            return self.serializer_class_with_details
        return self.serializer_class

    def retrieve(self, request, *args, **kwargs):
        self.get_object().assign_owner(request)
        return super().retrieve(request, *args, **kwargs)

    @action(detail=True, methods=["post"], url_path="do_transition/(?P<transition>\w+)")
    def transition(self, request, pk=None, transition=None):
        cs = ConnectivityStatementService(self.get_object()).do_transition(
            transition, user=request.user, request=request
        )
        cs.save()
        return Response(self.get_serializer(cs).data)


class TagViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Tag
    """

    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [
        permissions.IsAuthenticatedOrReadOnly,
    ]


class SentenceViewSet(ModelNoDeleteViewSet):
    """
    Sentence
    """

    queryset = Sentence.objects.all()
    serializer_class = SentenceSerializer
    serializer_class_with_details = SentenceWithDetailsSerializer
    permission_classes = [
        permissions.IsAuthenticatedOrReadOnly,
    ]
    filterset_class = SentenceFilter

    def get_serializer_class(self, *args, **kwargs):
        if self.action in ("list",):
            return self.serializer_class_with_details
        return self.serializer_class

    def retrieve(self, request, *args, **kwargs):
        self.get_object().assign_owner(request)
        return super().retrieve(request, *args, **kwargs)

    @action(detail=True, methods=["post"], url_path="do_transition/(?P<transition>\w+)")
    def transition(self, request, pk=None, transition=None):
        cs = SentenceService(self.get_object()).do_transition(
            transition, user=request.user, request=request
        )
        cs.save()
        return Response(self.get_serializer(cs).data)


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
    serializers = [ConnectivityStatementSerializer, SentenceSerializer, ViaSerializer, NoteSerializer]
    class View(object):
        # fake view class
        def __init__(self):
            self.action = "schemas"
    context = {
        "request": request,
        "format": None,
        "view": View(),
        "response": Response({}),
    }

    ret = json.dumps(
        obj=({s.Meta.model.__name__: s(context) for s in serializers}),
        cls=SerializerEncoder,
        indent=2,
        ensure_ascii=True,
        allow_nan=True,
        separators=INDENT_SEPARATORS,
        renderer_context=context,
    )
    ret = ret.replace("\u2028", "\\u2028").replace("\u2029", "\\u2029")
    data = bytes(ret.encode("utf-8"))
    return HttpResponse(data)
