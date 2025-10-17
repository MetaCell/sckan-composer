import json
from django.http import HttpResponse, Http404
from django.db.models import Q
from drf_react_template.schema_form_encoder import SchemaProcessor, UiSchemaProcessor
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.utils import PolymorphicProxySerializer
from rest_framework import mixins, permissions, viewsets, status
from rest_framework.decorators import action, api_view
from rest_framework.renderers import INDENT_SEPARATORS
from rest_framework.response import Response
from rest_framework.serializers import ValidationError
from rest_framework import generics
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Case, When, Value, IntegerField
from composer.services.export.helpers.predicate_mapping import PredicateToDBMapping
from composer.services.dynamic_schema_service import inject_dynamic_relationship_schema
from composer.services import bulk_service
from composer.enums import BulkActionType
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
    AssignPopulationSetSerializer,
    AssignTagsSerializer,
    AssignUserSerializer,
    BulkActionResponseSerializer,
    ChangeStatusSerializer,
    ConnectivityStatementTripleSerializer,
    PhenotypeSerializer,
    ProjectionPhenotypeSerializer,
    ConnectivityStatementSerializer,
    KnowledgeStatementSerializer,
    NoteSerializer,
    ProfileSerializer,
    RelationshipSerializer,
    SentenceSerializer,
    SpecieSerializer,
    StatementAlertSerializer,
    TagSerializer,
    ViaSerializer,
    ProvenanceSerializer,
    ProvenanceCreateSerializer,
    SexSerializer,
    PopulationSetSerializer,
    ConnectivityStatementUpdateSerializer,
    DestinationSerializer,
    BaseConnectivityStatementSerializer,
    MinimalUserSerializer,
    WriteNoteSerializer,
    PredicateMappingSerializer,
    PredicateMappingRequestSerializer,
)
from .permissions import (
    IsStaffUserIfExportedStateInConnectivityStatement,
    IsOwnerOrAssignOwnerOrCreateOrReadOnly,
    IsOwnerOfConnectivityStatementOrReadOnly,
)
from ..models import (
    AlertType,
    AnatomicalEntityMeta,
    AnatomicalEntity,
    Phenotype,
    ProjectionPhenotype,
    ConnectivityStatement,
    Note,
    Profile,
    Relationship,
    Sentence,
    Specie,
    StatementAlert,
    Tag,
    Via,
    Provenance,
    Sex,
    PopulationSet,
    Destination,
    ConnectivityStatementTriple,
)


# Mixins
class AssignOwnerMixin(viewsets.GenericViewSet):
    @action(
        detail=True, methods=["patch"], permission_classes=[permissions.IsAuthenticated]
    )
    def assign_owner(self, request, pk=None):
        instance = self.get_object()
        instance.assign_owner(request.user)
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
        request=ProvenanceCreateSerializer,
        responses={200: "ConnectivityStatement updated successfully"},
    )
    @action(detail=True, methods=["post"], url_path="add_provenance")
    def add_provenance(self, request, pk=None):
        serializer = ProvenanceCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        uri = serializer.validated_data['uri']
        provenance, created = Provenance.objects.get_or_create(
            connectivity_statement_id=pk,
            uri=uri,
        )
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


class BulkActionMixin:
    bulk_action_serializers = {
        BulkActionType.ASSIGN_USER.value: AssignUserSerializer,
        BulkActionType.ASSIGN_TAG.value: AssignTagsSerializer,
        BulkActionType.WRITE_NOTE.value: WriteNoteSerializer,
        BulkActionType.CHANGE_STATUS.value: ChangeStatusSerializer,
        BulkActionType.ASSIGN_POPULATION_SET.value: AssignPopulationSetSerializer,
    }
    # Expect that each view to set this attribute.:
    bulk_action_mapping = None  # a dict mapping action types to service functions

    def get_bulk_action_serializer_mapping(self):
        if self.bulk_action_serializers is None:
            raise NotImplementedError("bulk_action_serializers not set.")
        return self.bulk_action_serializers

    def get_bulk_action_mapping(self):
        if self.bulk_action_mapping is None:
            raise NotImplementedError("bulk_action_mapping not set.")
        return self.bulk_action_mapping

    def get_assignable_users_data(self):
        """
        Default implementation: returns minimal user data from all profiles.
        Views can override this if needed.
        """
        return MinimalUserSerializer(
            [p.user for p in bulk_service.get_assignable_users_data()], many=True
        ).data

    def get_common_transitions(self, queryset):
        """
        Default implementation: for each object in the queryset that has
        `get_available_state_transitions()`, extract the set of transition targets
        and then return the intersection (common transitions).
        """
        return bulk_service.get_common_transitions(queryset, user=self.request.user)

    def get_tags_partition(self, queryset):
        """
        Returns a dictionary with serialized tag data partitioned into:
        - used_by_all: Tags present on every object,
        - used_by_some: Tags present on some (but not all) objects,
        - unused: Tags absent from all objects.
        """
        # Get the partition data from the service layer.
        partition = bulk_service.get_tags_partition(queryset)
        # Define partial tags as those in the union that are not common.
        partial_ids = partition["union"] - partition["common"]

        tag_partitions_serialized = {
            "used_by_all": TagSerializer(
                Tag.objects.filter(id__in=partition["common"]), many=True
            ).data,
            "used_by_some": TagSerializer(
                Tag.objects.filter(id__in=partial_ids), many=True
            ).data,
            "unused": TagSerializer(
                Tag.objects.filter(id__in=partition["missing"]), many=True
            ).data,
        }
        return tag_partitions_serialized

    @extend_schema(filters=True)
    @action(detail=False, methods=["get"])
    def available_options(self, request):
        """
        Returns available users for assignment and possible state transitions
        for the selected items.
        """
        has_filters = any(
            param for param in request.query_params if param not in ["page", "ordering"]
        )
        if not has_filters:
            return Response({"assignable_users": [], "possible_transitions": []})

        qs = self.filter_queryset(self.get_queryset())
        assignable_users_data = self.get_assignable_users_data()
        common_transitions = self.get_common_transitions(qs)
        tags_partition = self.get_tags_partition(qs)

        return Response(
            {
                "assignable_users": assignable_users_data,
                "possible_transitions": common_transitions,
                "tags": tags_partition,
            }
        )

    @extend_schema(
        request=PolymorphicProxySerializer(
            component_name="BulkAction",
            serializers=bulk_action_serializers,
            resource_type_field_name="action",
        ),
        responses={200: BulkActionResponseSerializer},
        filters=True,
    )

    @action(detail=False, methods=["post"])
    def bulk_action(self, request):
        """
        Apply a bulk action to the selected items and return the number
        of items updated successfully.
        """
        action_type = request.data.get("action")
        serializer_mapping = self.get_bulk_action_serializer_mapping()
        if action_type not in serializer_mapping:
            return Response(
                {"error": "Invalid action type."}, status=status.HTTP_400_BAD_REQUEST
            )

        serializer_class = serializer_mapping[action_type]
        serializer = serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        qs = self.filter_queryset(self.get_queryset())
        if not qs.exists():
            return Response(
                {"error": "No items found."}, status=status.HTTP_400_BAD_REQUEST
            )

        mapping = self.get_bulk_action_mapping()
        if action_type not in mapping:
            return Response(
                {"error": "No service function mapped for this action."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # The service function should return an integer (the count of items updated).
        updated_count = mapping[action_type](qs, request, serializer.validated_data)
        return Response({"updated_count": updated_count}, status=status.HTTP_200_OK)


# Viewsets


class ModelRetrieveViewSet(
    # mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    # mixins.UpdateModelMixin,
    # mixins.DestroyModelMixin,
    # mixins.ListModelMixin,
    viewsets.GenericViewSet,
): ...


class ModelCreateRetrieveViewSet(
    ModelRetrieveViewSet,
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
): ...


class ModelNoDeleteViewSet(
    ModelCreateRetrieveViewSet,
    mixins.UpdateModelMixin,
): ...


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
    BulkActionMixin,
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

    bulk_action_mapping = {
        BulkActionType.ASSIGN_USER.value: lambda qs, req, data: bulk_service.assign_owner(
            qs, req.user, data.get("user_id")
        ),
        BulkActionType.ASSIGN_TAG.value: lambda qs, req, data: bulk_service.assign_tags(
            qs, data["add_tag_ids"], data["remove_tag_ids"]
        ),
        BulkActionType.WRITE_NOTE.value: lambda qs, req, data: bulk_service.write_note(
            qs, req.user, data["note_text"]
        ),
        BulkActionType.CHANGE_STATUS.value: lambda qs, req, data: bulk_service.change_status(
            qs, data["new_status"], req.user
        ),
        BulkActionType.ASSIGN_POPULATION_SET.value: lambda qs, req, data: bulk_service.assign_population_set(
            qs, data["population_set_id"]
        ),
    }

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

    def get_assignable_users_data(self):
        # Only include profiles where the user is a curator or reviewer.
        return MinimalUserSerializer(
            [
                p.user
                for p in bulk_service.get_assignable_users_data(
                    roles=["is_curator", "is_reviewer"]
                )
            ],
            many=True,
        ).data

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
    queryset = ConnectivityStatement.objects.public_export()
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
        response = super().list(request, *args, **kwargs)
        return response


@extend_schema(tags=["public"])
class PredicateMappingViewSet(APIView):
    """
    PredicateMapping: Returns labels for given URIs and predicates.
    Accepts POST requests with a dictionary of predicates and their URIs.
    Example request body:
    {
        "hasSomaLocatedIn": ["uri1", "uri2"],
        "hasAxonLocatedIn": ["uri3", "uri4"]
    }
    """
    serializer_class = PredicateMappingSerializer
    permission_classes = [permissions.AllowAny]
        
    def post(self, request):
        request_serializer = PredicateMappingRequestSerializer(data=request.data)
        request_serializer.is_valid(raise_exception=True)
        validated_data = request_serializer.validated_data

        response_data = {}
        for predicate_name, uris in validated_data.items():
            model = PredicateToDBMapping[predicate_name].value
            uri_to_labels = {}
            for uri in uris:
                if issubclass(model, AnatomicalEntity):
                    obj = AnatomicalEntity.objects.get_by_ontology_uri(uri)
                else:
                    obj = model.objects.filter(ontology_uri=uri).first()
                labels = [obj.name] if obj else []
                if isinstance(obj, AnatomicalEntity):
                    labels.extend([synonym.name for synonym in obj.synonyms.all()])
                uri_to_labels[uri] = labels
            response_data[predicate_name] = uri_to_labels
        serializer = PredicateMappingSerializer(response_data)
        return Response(serializer.data)


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
    TagMixin, TransitionMixin, AssignOwnerMixin, ModelNoDeleteViewSet, BulkActionMixin
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

    bulk_action_mapping = {
        BulkActionType.ASSIGN_USER.value: lambda qs, req, data: bulk_service.assign_owner(
            qs, req.user, data.get("user_id")
        ),
        BulkActionType.ASSIGN_TAG.value: lambda qs, req, data: bulk_service.assign_tags(
            qs, data["add_tag_ids"], data["remove_tag_ids"]
        ),
        BulkActionType.WRITE_NOTE.value: lambda qs, req, data: bulk_service.write_note(
            qs, req.user, data["note_text"]
        ),
        BulkActionType.CHANGE_STATUS.value: lambda qs, req, data: bulk_service.change_status(
            qs, data["new_status"], req.user
        ),
        BulkActionType.ASSIGN_POPULATION_SET.value: lambda qs, req, data: bulk_service.assign_population_set(
            qs, data["population_set_id"]
        ),
    }

    @action(detail=False, methods=["GET"])
    def batch_names(self, request):
        """
        Returns a list of all unique batch names in the database.
        """
        batch_names = (
            Sentence.objects.filter(~Q(batch_name__isnull=True) & ~Q(batch_name=""))
            .values_list("batch_name", flat=True)
            .distinct()
            .order_by("batch_name")
        )
        return Response(batch_names)

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

        profile, created = Profile.objects.get_or_create(user=self.request.user)
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



class RelationshipViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Relationship ViewSet with dynamic endpoints to:
    - List triples (options) for a given relationship.
    - Assign triple or free_text to a statement.
    """

    queryset = Relationship.objects.all()
    serializer_class = RelationshipSerializer


class ConnectivityStatementTripleViewSet(viewsets.ModelViewSet):
    """
    ConnectivityStatementTriple:
    """

    queryset = ConnectivityStatementTriple.objects.select_related("connectivity_statement", "relationship", "triple")
    serializer_class = ConnectivityStatementTripleSerializer
    permission_classes = [IsOwnerOfConnectivityStatementOrReadOnly]

    def get_queryset(self):
        qs = super().get_queryset()
        connectivity_statement_id = self.request.query_params.get("connectivity_statement_id")
        if connectivity_statement_id:
            qs = qs.filter(connectivity_statement_id=connectivity_statement_id)
        return qs


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

    inject_dynamic_relationship_schema(schema)

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
