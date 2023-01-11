from rest_framework import mixins, permissions, views, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.serializers import ValidationError

from ..models import (
    AnatomicalEntity,
    AnsDivision,
    ConnectivityStatement,
    Note,
    Profile,
    Provenance,
    Specie,
    Tag,
    Via,
)
from .serializers import (
    AnatomicalEntitySerializer,
    AnsDivisionSerializer,
    ConnectivityStatementSerializer,
    ConnectivityStatementViewSerializer,
    NoteSerializer,
    ProfileSerializer,
    ProvenanceSerializer,
    SpecieSerializer,
    TagSerializer,
    ViaSerializer,
)
from ..services import ConnectivityStatementService


class ModelCreateRetrieveViewSet(
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    # mixins.UpdateModelMixin,
    # mixins.DestroyModelMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet,
):
    ...


class ModelNoDeleteViewSet(
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    # mixins.DestroyModelMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet,
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


class ConnectivityStatementViewSet(viewsets.ModelViewSet):
    """
    ConnectivityStatement
    """

    queryset = ConnectivityStatement.objects.all()
    serializer_class = ConnectivityStatementSerializer
    serializer_class_get = ConnectivityStatementViewSerializer
    permission_classes = [
        permissions.IsAuthenticatedOrReadOnly,
    ]

    def get_serializer_class(self, *args, **kwargs):
        if self.action in ("list", "retrieve"):
            return self.serializer_class_get
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


class ProvenanceViewSet(ModelNoDeleteViewSet):
    """
    Provenance
    """

    queryset = Provenance.objects.all()
    serializer_class = ProvenanceSerializer
    permission_classes = [
        permissions.IsAuthenticatedOrReadOnly,
    ]

    def retrieve(self, request, *args, **kwargs):
        self.get_object().assign_owner(request)
        return super().retrieve(request, *args, **kwargs)


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

        # create a token if one does not exist for the user
        # the token is used to authenticate the user in the frontend
        # it will be serialized in the ProfileSerializer
        token, created = Token.objects.get_or_create(user=user)

        # get the user profile and if not exists create a profile
        profile, created = Profile.objects.get_or_create(user=user)
        return Response(self.get_serializer(profile).data)


class ViaViewSet(
    mixins.CreateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    """
    Via
    """

    queryset = Via.objects.all()
    serializer_class = ViaSerializer
    permission_classes = [
        permissions.IsAuthenticatedOrReadOnly,
    ]
