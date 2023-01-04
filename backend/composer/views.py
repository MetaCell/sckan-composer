from rest_framework import viewsets, mixins
from rest_framework import permissions
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import AnatomicalEntity, AnsDivision, ConnectivityStatement, NoteTag, Provenance, Specie, Profile
from .serializers import AnatomicalEntitySerializer, AnsDivisionSerializer, ConnectivityStatementSerializer, NoteTagSerializer, ProvenanceSerializer, SpecieSerializer, ProfileSerializer
from .services import ConnectivityStatementService

class ModelCreateRetrieveViewSet(mixins.CreateModelMixin, 
                                 mixins.RetrieveModelMixin, 
                                 # mixins.UpdateModelMixin,
                                 # mixins.DestroyModelMixin,
                                 mixins.ListModelMixin,
                                 viewsets.GenericViewSet):
    ...


class ModelNoDeleteViewSet(mixins.CreateModelMixin, 
                           mixins.RetrieveModelMixin, 
                           mixins.UpdateModelMixin,
                           # mixins.DestroyModelMixin,
                           mixins.ListModelMixin,
                           viewsets.GenericViewSet):
    ...


class AnatomicalEntityViewSet(viewsets.ReadOnlyModelViewSet):
    """
    AnatomicalEntity
    """
    queryset = AnatomicalEntity.objects.all()
    serializer_class = AnatomicalEntitySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly,]


class AnsDivisionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    AnsDivision
    """
    queryset = AnsDivision.objects.all()
    serializer_class = AnsDivisionSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly,]


class ConnectivityStatementViewSet(ModelNoDeleteViewSet):
    """
    ConnectivityStatement
    """
    queryset = ConnectivityStatement.objects.all()
    serializer_class = ConnectivityStatementSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly,]

    @action(detail=True, methods=['post'],  url_path='do_transition/(?P<transition>\w+)')
    def transition(self, request, pk=None, transition=None):
        cs = ConnectivityStatementService(self.get_object()).do_transition(transition, request.user)
        cs.save()
        return Response(self.get_serializer(cs).data)


class NoteTagViewSet(ModelCreateRetrieveViewSet):
    """
    NoteTag
    """
    queryset = NoteTag.objects.all()
    serializer_class = NoteTagSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly,]
   
    
class ProvenanceViewSet(ModelNoDeleteViewSet):
    """
    Provenance
    """
    queryset = Provenance.objects.all()
    serializer_class = ProvenanceSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly,]
    

class SpecieViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Specie
    """
    queryset = Specie.objects.all()
    serializer_class = SpecieSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly,]
    
    
class ProfileViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Profile
    """
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly,]
    
    def get_queryset(self):
        return super().get_queryset().filter(user=self.request.user)
