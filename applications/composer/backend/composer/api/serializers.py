from typing import List
from django.contrib.auth.models import User
from django.db.models import Q
from django.forms import ValidationError
from django_fsm import FSMField
from drf_writable_nested.mixins import UniqueFieldsMixin
from drf_writable_nested.serializers import WritableNestedModelSerializer
from rest_framework import serializers

from ..enums import BulkActionType, SentenceState, CSState
from ..models import (
    AlertType,
    AnatomicalEntity,
    Phenotype,
    ProjectionPhenotype,
    Sex,
    ConnectivityStatement,
    Provenance,
    Note,
    Profile,
    Sentence,
    Specie,
    PopulationSet,
    StatementAlert,
    Tag,
    Via,
    Destination,
    AnatomicalEntityIntersection,
    AnatomicalEntityMeta,
    GraphRenderingState,
)
from ..services.connections_service import get_complete_from_entities_for_destination, \
    get_complete_from_entities_for_via
from ..services.statement_service import get_statement_preview as get_statement_preview_aux
from ..services.errors_service import get_connectivity_errors


# MixIns
class FixManyToManyMixin:
    # custom many-to-many get pk from data
    # first try to get pk from data
    # if not found try to get pk from db
    # this solves the problem of adding new objects without a pk
    def _get_related_pk(self, data, model):
        pk = super()._get_related_pk(data, model)
        if not pk:
            # if pk not found try to find by other fields and return the pk
            and_condition = Q()
            for key, value in data.items():
                and_condition.add(Q(**{key: value}), Q.AND)
            qs = model.objects.filter(and_condition)
            if len(qs) > 0:
                pk = str(qs.first().pk)
        return pk


class FixedWritableNestedModelSerializer(WritableNestedModelSerializer):
    def update(self, instance, validated_data):
        # remove the protected FSMFields from instance dict so it will become part of the "non_loaded_fields"
        # those fields may not be updated during the refresh_from_db (they are protected for update)
        # refresh_from_db() can be found in django.models.base.py and is called by NestedUpdateMixin.update()
        for f in instance._meta.concrete_fields:
            if isinstance(f, FSMField) and f.protected:
                del instance.__dict__[f.attname]
        return super(FixedWritableNestedModelSerializer, self).update(
            instance,
            validated_data,
        )


# serializers
class UserSerializer(serializers.ModelSerializer):
    """User"""

    class Meta:
        model = User
        fields = ("id", "username", "first_name", "last_name", "email", "is_staff")


class MinimalUserSerializer(serializers.ModelSerializer):
    """Minimal User Serializer (for Profile List View)"""

    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ("id", "full_name")  # Only expose minimal user details

    def get_full_name(self, obj):
        return obj.get_full_name()

class ProfileSerializer(serializers.ModelSerializer):
    """Profile"""

    user = UserSerializer(read_only=True, required=False)

    class Meta:
        model = Profile
        fields = ("id", "user", "is_triage_operator", "is_curator", "is_reviewer")
        dept = 2


class AnatomicalEntityMetaSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnatomicalEntityMeta
        fields = (
            "id",
            "name",
            "ontology_uri",
        )


class AnatomicalEntityIntersectionSerializer(serializers.ModelSerializer):
    layer = AnatomicalEntityMetaSerializer(read_only=True)
    region = AnatomicalEntityMetaSerializer(read_only=True)

    class Meta:
        model = AnatomicalEntityIntersection
        fields = (
            "id",
            "layer",
            "region",
        )


class AnatomicalEntitySerializer(serializers.ModelSerializer):
    simple_entity = AnatomicalEntityMetaSerializer(read_only=True)
    region_layer = AnatomicalEntityIntersectionSerializer(read_only=True)
    synonyms = serializers.SerializerMethodField(read_only=True)

    @staticmethod
    def get_synonyms(obj):
        return ", ".join(synonym.name for synonym in obj.synonyms.all())

    class Meta:
        model = AnatomicalEntity
        fields = (
            "id",
            "simple_entity",
            "region_layer",
            "synonyms"
        )


class NoteSerializer(serializers.ModelSerializer):
    """Note"""

    user = serializers.CharField(read_only=True, required=False, allow_null=True)
    connectivity_statement_id = serializers.IntegerField(required=False)
    sentence_id = serializers.IntegerField(required=False)
    created_at = serializers.DateTimeField(read_only=True, required=False)

    def create(self, validated_data):
        request = self.context.get("request", None)
        if request:
            # link the note to the user
            validated_data.update({"user": request.user})
        return super().create(validated_data)

    class Meta:
        model = Note
        fields = (
            "note",
            "user",
            "created_at",
            "connectivity_statement_id",
            "sentence_id",
        )


class PhenotypeSerializer(UniqueFieldsMixin, serializers.ModelSerializer):
    """Phenotype"""

    class Meta:
        model = Phenotype
        fields = ("id", "name")


class ProjectionPhenotypeSerializer(UniqueFieldsMixin, serializers.ModelSerializer):
    """Phenotype"""

    class Meta:
        model = ProjectionPhenotype
        fields = ("id", "name")


class TagSerializer(UniqueFieldsMixin, serializers.ModelSerializer):
    """Note Tag"""

    class Meta:
        model = Tag
        fields = ("id", "tag")


class SpecieSerializer(UniqueFieldsMixin, serializers.ModelSerializer):
    """Specie"""

    ontology_uri = serializers.CharField(required=False, allow_null=True)

    class Meta:
        model = Specie
        fields = (
            "id",
            "name",
            "ontology_uri",
        )


class SexSerializer(serializers.ModelSerializer):
    """Sex"""

    class Meta:
        model = Sex
        fields = ("id", "name", "ontology_uri")


class PopulationSetSerializer(serializers.ModelSerializer):
    """Population Set"""

    class Meta:
        model = PopulationSet
        fields = ("id", "name", "description")


class ViaSerializerDetails(serializers.ModelSerializer):
    """Via Serializer with Custom Logic for from_entities"""

    anatomical_entities = AnatomicalEntitySerializer(
        many=True,
    )

    from_entities = AnatomicalEntitySerializer(
        many=True,
    )

    are_connections_explicit = serializers.SerializerMethodField()

    class Meta:
        model = Via
        fields = (
            "id",
            "order",
            "connectivity_statement_id",
            "type",
            "anatomical_entities",
            "from_entities",
            "are_connections_explicit",
        )

    def get_are_connections_explicit(self, instance):
        """
        Determine if 'from_entities' are explicitly set for the Via instance.
        """
        return instance.from_entities.exists()

    def to_representation(self, instance):
        """
        Custom representation for Via.
        """
        representation = super().to_representation(instance)

        # Check if from_entities is empty
        if not instance.from_entities.exists():
            appropriate_entities = get_complete_from_entities_for_via(instance)
            representation['from_entities'] = AnatomicalEntitySerializer(appropriate_entities, many=True).data

        return representation


class ViaSerializer(serializers.ModelSerializer):
    """Via"""
    anatomical_entities = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=AnatomicalEntity.objects.all(),
        required=False
    )
    from_entities = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=AnatomicalEntity.objects.all(),
        required=False
    )
    connectivity_statement = serializers.PrimaryKeyRelatedField(
        required=False,
        queryset=ConnectivityStatement.objects.all()
    )

    class Meta:
        model = Via
        fields = (
            "id",
            "order",
            "connectivity_statement",
            "type",
            "anatomical_entities",
            "from_entities"
        )


class DestinationSerializer(serializers.ModelSerializer):
    """Destination"""
    anatomical_entities = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=AnatomicalEntity.objects.all(),
        required=False
    )
    from_entities = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=AnatomicalEntity.objects.all(),
        required=False
    )
    connectivity_statement = serializers.PrimaryKeyRelatedField(
        queryset=ConnectivityStatement.objects.all()
    )

    class Meta:
        model = Destination
        fields = ('id', "connectivity_statement", 'type', 'anatomical_entities', 'from_entities')


class DestinationSerializerDetails(serializers.ModelSerializer):
    """Destination with Custom Logic for from_entities"""

    anatomical_entities = AnatomicalEntitySerializer(
        many=True,
    )

    from_entities = AnatomicalEntitySerializer(
        many=True,
    )

    are_connections_explicit = serializers.SerializerMethodField()

    class Meta:
        model = Destination
        fields = (
            "id",
            "connectivity_statement_id",
            "type",
            "anatomical_entities",
            "from_entities",
            "are_connections_explicit",
        )

    def get_are_connections_explicit(self, instance):
        """
        Determine if 'from_entities' are explicitly set for the Via instance.
        """
        return instance.from_entities.exists()

    def to_representation(self, instance):
        """
        Custom representation for Destination.
        """
        representation = super().to_representation(instance)

        # Check if from_entities is empty
        if not instance.from_entities.exists():
            appropriate_entities = get_complete_from_entities_for_destination(instance)
            representation['from_entities'] = AnatomicalEntitySerializer(appropriate_entities, many=True).data

        return representation


class ProvenanceSerializer(serializers.ModelSerializer):
    """Provenance"""

    uri = serializers.CharField()
    connectivity_statement_id = serializers.IntegerField(required=True)

    class Meta:
        model = Provenance
        fields = ("id", "uri", "connectivity_statement_id")


class SentenceConnectivityStatement(serializers.ModelSerializer):
    """Connectivity Statement"""

    sentence_id = serializers.IntegerField()
    owner_id = serializers.IntegerField(required=False, default=None, allow_null=True)
    sex_id = serializers.IntegerField(required=False, default=None, allow_null=True)
    population_id = serializers.IntegerField(
        required=False, default=None, allow_null=True
    )
    phenotype_id = serializers.IntegerField(
        required=False, default=None, allow_null=True
    )
    projection_phenotype_id = serializers.IntegerField(
        required=False, default=None, allow_null=True
    )
    provenances = ProvenanceSerializer(
        source="provenance_set", many=True, read_only=False
    )
    sex = SexSerializer(required=False, read_only=True)
    species = SpecieSerializer(many=True, read_only=True)
    owner = UserSerializer(required=False, read_only=True)
    phenotype = PhenotypeSerializer(required=False, read_only=True)
    projection_phenotype = ProjectionPhenotypeSerializer(required=False, read_only=True)
    population = PopulationSetSerializer(required=False, read_only=True)
    has_statement_been_exported = serializers.BooleanField(
        required=False, read_only=True
    )

    class Meta:
        model = ConnectivityStatement
        fields = (
            "id",
            "sentence_id",
            "knowledge_statement",
            "provenances",
            "phenotype_id",
            "phenotype",
            "projection_phenotype",
            "projection_phenotype_id",
            "laterality",
            "projection",
            "circuit_type",
            "species",
            "sex_id",
            "sex",
            "population_id",
            "population",
            "has_statement_been_exported",
            "apinatomy_model",
            "additional_information",
            "owner_id",
            "owner",
        )
        read_only_fields = (
            "id",
            "sentence_id",
            "knowledge_statement",
            "provenances",
            "phenotype_id",
            "phenotype",
            "projection_phenotype",
            "projection_phenotype_id",
            "laterality",
            "projection",
            "circuit_type",
            "species",
            "sex_id",
            "sex",
            "population",
            "population_id",
            "has_statement_been_exported",
            "apinatomy_model",
            "additional_information",
            "owner_id",
            "owner",
        )


class SentenceSerializer(FixManyToManyMixin, FixedWritableNestedModelSerializer):
    """Sentence"""

    state = serializers.CharField(read_only=True)
    pmid = serializers.IntegerField(required=False, default=None, allow_null=True)
    pmcid = serializers.CharField(required=False, default=None, allow_null=True)
    doi = serializers.CharField(required=False, default=None, allow_null=True)
    tags = TagSerializer(many=True, read_only=True)
    connectivity_statements = SentenceConnectivityStatement(
        source="connectivitystatement_set", many=True, read_only=True
    )
    owner = UserSerializer(required=False, read_only=True)
    owner_id = serializers.IntegerField(required=False, default=None, allow_null=True)
    available_transitions = serializers.SerializerMethodField(read_only=True)
    has_notes = serializers.SerializerMethodField(read_only=True)

    def get_has_notes(self, instance) -> bool:
        return instance.has_notes

    def get_available_transitions(self, instance) -> list[SentenceState]:
        request = self.context.get("request", None)
        user = request.user if request else None
        return [t.name for t in instance.get_available_user_state_transitions(user)]

    class Meta:
        model = Sentence
        fields = (
            "id",
            "title",
            "text",
            "pmid",
            "pmcid",
            "doi",
            "batch_name",
            "external_ref",
            "tags",
            "owner",
            "owner_id",
            "state",
            "modified_date",
            "available_transitions",
            "connectivity_statements",
            "has_notes",
            "pmid_uri",
            "pmcid_uri",
            "doi_uri",
        )
        read_only_fields = (
            "state",
            "modified_date",
            "pmcid_uri",
            "pmid_uri",
            "doi_uri",
            "available_transitions",
        )


class BaseConnectivityStatementSerializer(FixManyToManyMixin, FixedWritableNestedModelSerializer):
    id = serializers.IntegerField(
        required=False, default=None, allow_null=True, read_only=True
    )
    knowledge_statement = serializers.CharField(allow_blank=True, required=False)
    tags = TagSerializer(many=True, read_only=True, required=False)
    owner = UserSerializer(required=False, read_only=True)
    owner_id = serializers.IntegerField(required=False, default=None, allow_null=True)
    has_notes = serializers.SerializerMethodField()

    def get_has_notes(self, instance) -> bool:
        return instance.has_notes

    class Meta:
        model = ConnectivityStatement
        fields = (
            "id",
            "knowledge_statement",
            "tags",
            "owner",
            "owner_id",
            "state",
            "modified_date",
            "has_notes",
        )
        read_only_fields = ("state",)


class GraphStateSerializer(serializers.ModelSerializer):
    class Meta:
        model = GraphRenderingState
        fields = ['serialized_graph']

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        return {
            'serialized_graph': representation['serialized_graph'],
        }


class AlertTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = AlertType
        fields = ('id', 'name', 'uri')


class StatementAlertSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)

    connectivity_statement_id = serializers.PrimaryKeyRelatedField(
        queryset=ConnectivityStatement.objects.all(), required=True
    )
    alert_type = serializers.PrimaryKeyRelatedField(
        queryset=AlertType.objects.all(), required=True
    )

    class Meta:
        model = StatementAlert
        fields = (
            "id",
            "alert_type",
            "text",
            "saved_by",
            "created_at",
            "updated_at",
            "connectivity_statement_id",
        )
        read_only_fields = ("created_at", "updated_at", "saved_by")
        validators = []

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # If 'connectivity_statement' is provided in context, make it not required
        if 'connectivity_statement_id' in self.context:
            self.fields['connectivity_statement_id'].required = False

        # If updating an instance, set 'alert_type' and 'connectivity_statement' as read-only
        if self.instance:
            self.fields['alert_type'].read_only = True
            self.fields['connectivity_statement_id'].read_only = True

    def validate(self, data):
        # Resolve 'connectivity_statement_id' from context, data, or instance
        connectivity_statement_id = self.context.get('connectivity_statement_id') or \
                                    (data.get('connectivity_statement_id').id if data.get('connectivity_statement_id') else None) or \
                                    (self.instance.connectivity_statement.id if self.instance else None)

        if not connectivity_statement_id:
            raise serializers.ValidationError({
                'connectivity_statement_id': 'This field is required.'
            })

        data['connectivity_statement_id'] = connectivity_statement_id


        # Get 'alert_type' from data or instance
        alert_type = data.get('alert_type') or getattr(self.instance, 'alert_type', None)
        if not alert_type:
            raise serializers.ValidationError({
                'alert_type': 'This field is required.'
            })
        data['alert_type'] = alert_type

        alert_id = data.get('id', getattr(self.instance, 'id', None))

        # Perform uniqueness check
        existing_qs = StatementAlert.objects.filter(
            connectivity_statement=connectivity_statement_id,
            alert_type=alert_type
        )
        if alert_id:
            existing_qs = existing_qs.exclude(id=alert_id)
        if existing_qs.exists():
            raise serializers.ValidationError({
                "non_field_errors": "The fields connectivity_statement and alert_type must make a unique set."
            })

        return data
    
    def create(self, validated_data):
        request = self.context.get("request")
        user = request.user if request else None
        validated_data["saved_by"] = user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        request = self.context.get("request")
        user = request.user if request else None
        validated_data["saved_by"] = user
        return super().update(instance, validated_data)


class ConnectivityStatementSerializer(BaseConnectivityStatementSerializer):
    """Connectivity Statement"""

    sentence_id = serializers.IntegerField(required=False)
    phenotype_id = serializers.IntegerField(required=False, allow_null=True)
    projection_phenotype_id = serializers.IntegerField(required=False, allow_null=True)
    sex_id = serializers.IntegerField(required=False, allow_null=True)
    population_id = serializers.IntegerField(required=False, allow_null=True)
    species = SpecieSerializer(many=True, read_only=False, required=False)
    provenances = ProvenanceSerializer(source="provenance_set", many=True, read_only=False, required=False)
    origins = AnatomicalEntitySerializer(many=True, required=False)
    vias = ViaSerializerDetails(source="via_set", many=True, read_only=False, required=False)
    destinations = DestinationSerializerDetails(many=True, required=False)
    phenotype = PhenotypeSerializer(required=False, read_only=True)
    projection_phenotype = ProjectionPhenotypeSerializer(required=False, read_only=True)
    sex = SexSerializer(required=False, read_only=True)
    population = PopulationSetSerializer(required=False, read_only=True)
    sentence = SentenceSerializer(required=False, read_only=True)
    forward_connection = serializers.PrimaryKeyRelatedField(
        many=True, queryset=ConnectivityStatement.objects.all(), required=False
    )
    available_transitions = serializers.SerializerMethodField()
    journey = serializers.SerializerMethodField()
    entities_journey = serializers.SerializerMethodField()
    statement_preview = serializers.SerializerMethodField()
    errors = serializers.SerializerMethodField()
    graph_rendering_state = GraphStateSerializer(required=False, allow_null=True)
    statement_alerts = StatementAlertSerializer(
        many=True, read_only=False, required=False
    )
    has_statement_been_exported = serializers.BooleanField(
        required=False, read_only=True
    )

    def get_available_transitions(self, instance) -> list[CSState]:
        request = self.context.get("request", None)
        user = request.user if request else None
        return [t.name for t in instance.get_available_user_state_transitions(user) if t.name != CSState.DEPRECATED]

    def get_journey(self, instance):
        if 'journey' not in self.context:
            self.context['journey'] = instance.get_journey()
        return self.context['journey']

    def get_entities_journey(self, instance):
        self.context['entities_journey'] = instance.get_entities_journey()
        return self.context['entities_journey']

    def get_statement_preview(self, instance):
        if 'journey' not in self.context:
            self.context['journey'] = instance.get_journey()
        return get_statement_preview_aux(instance, self.context['journey'])

    def get_errors(self, instance) -> List:
        return get_connectivity_errors(instance)

    def to_representation(self, instance):
        """
        Convert the model instance `forward_connection` field to serialized data.
        """
        representation = super().to_representation(instance)
        depth = self.context.get('depth', 0)

        if depth < 1:
            representation["forward_connection"] = ConnectivityStatementSerializer(
                instance.forward_connection.all(),
                many=True,
                context={**self.context, 'depth': depth + 1}
            ).data

        if 'journey' in self.context:
            del self.context['journey']

        return representation

    def update(self, instance, validated_data):
        # Remove 'via_set' and 'destinations' from validated_data if they exist
        validated_data.pop('via_set', None)
        validated_data.pop('destinations', None)
        return super().update(instance, validated_data)

    class Meta(BaseConnectivityStatementSerializer.Meta):
        fields = (
            "id",
            "sentence_id",
            "sentence",
            "knowledge_statement",
            "tags",
            "provenances",
            "owner",
            "owner_id",
            "state",
            "available_transitions",
            "origins",
            "vias",
            "destinations",
            "phenotype_id",
            "phenotype",
            "projection_phenotype",
            "projection_phenotype_id",
            "journey",
            "entities_journey",
            "laterality",
            "projection",
            "circuit_type",
            "species",
            "sex_id",
            "sex",
            "population_id",
            "population",
            "has_statement_been_exported",
            "forward_connection",
            "curie_id",
            "apinatomy_model",
            "additional_information",
            "modified_date",
            "has_notes",
            "statement_preview",
            "errors",
            "graph_rendering_state",
            "statement_alerts",
        )


class ConnectivityStatementUpdateSerializer(ConnectivityStatementSerializer):
    origins = serializers.PrimaryKeyRelatedField(
        many=True, queryset=AnatomicalEntity.objects.all()
    )
    statement_alerts = StatementAlertSerializer(many=True, required=False)

    class Meta:
        model = ConnectivityStatement
        fields = (
            "id",
            "sentence_id",
            "sentence",
            "knowledge_statement",
            "tags",
            "provenances",
            "owner",
            "owner_id",
            "state",
            "available_transitions",
            "origins",
            "vias",
            "destinations",
            "phenotype_id",
            "phenotype",
            "projection_phenotype",
            "projection_phenotype_id",
            "journey",
            "laterality",
            "projection",
            "circuit_type",
            "species",
            "sex_id",
            "sex",
            "population_id",
            "population",
            "has_statement_been_exported",
            "forward_connection",
            "apinatomy_model",
            "additional_information",
            "modified_date",
            "has_notes",
            "statement_preview",
            "errors",
            "graph_rendering_state",
            "statement_alerts",
        )
        read_only_fields = ("state", "owner", "owner_id")

    def update(self, instance, validated_data):
        validated_data.pop("owner", None)
        validated_data.pop("owner_id", None)

        # Handle graph_rendering_state
        graph_rendering_state_data = validated_data.pop("graph_rendering_state", None)
        if graph_rendering_state_data is not None:
            graph_state, _ = GraphRenderingState.objects.get_or_create(
                connectivity_statement=instance, defaults={"serialized_graph": {}}
            )

            # Update the serialized_graph with incoming data
            graph_state.serialized_graph = graph_rendering_state_data.get(
                "serialized_graph", graph_state.serialized_graph
            )
            graph_state.saved_by = self.context["request"].user
            graph_state.save()

        # Handle origins
        origins = validated_data.pop("origins", None)
        if origins is not None:
            instance.origins.set(origins)

        # Handle statement alerts
        alerts_data = validated_data.pop("statement_alerts", [])
        self._update_statement_alerts(instance, alerts_data)

        return super().update(instance, validated_data)

    def to_representation(self, instance):
        """
        After updating, use the main serializer to represent the instance,
        ensuring that 'origins' are serialized as full objects.
        """
        return ConnectivityStatementSerializer(instance, context=self.context).data

    def _update_statement_alerts(self, instance, alerts_data):
        existing_alerts = {alert.id: alert for alert in instance.statement_alerts.all()}

        for alert_data in alerts_data:
            alert_id = alert_data.get("id")
            if alert_id and alert_id in existing_alerts:
                # Update existing alert
                alert_instance = existing_alerts[alert_id]
                # Remove 'alert_type' and 'connectivity_statement' from alert_data
                alert_data.pop('alert_type', None)
                alert_data.pop('connectivity_statement_id', None)
                serializer = StatementAlertSerializer(
                    alert_instance,
                    data=alert_data,
                    context={
                        "request": self.context.get("request"),
                        "connectivity_statement_id": instance.id,  # Pass the parent instance
                    },
                )
                serializer.is_valid(raise_exception=True)
                serializer.save()
            else:
                # Create new alert
                serializer = StatementAlertSerializer(
                    data=alert_data,
                    context={
                        "request": self.context.get("request"),
                        "connectivity_statement_id": instance.id,  # Pass the parent instance
                    },
                )
                serializer.is_valid(raise_exception=True)
                serializer.save()


class KnowledgeStatementSerializer(ConnectivityStatementSerializer):
    """Knowledge Statement"""

    def to_representation(self, instance):
        representation = super(ConnectivityStatementSerializer, self).to_representation(instance)
        depth = self.context.get('depth', 0)

        if depth < 1:
            representation["forward_connection"] = KnowledgeStatementSerializer(
                instance.forward_connection.all(),
                many=True,
                context={**self.context, 'depth': depth + 1}
            ).data

        if 'journey' in self.context:
            del self.context['journey']

        return representation

    class Meta(ConnectivityStatementSerializer.Meta):
        fields = (
            "id",
            "sentence_id",
            "species",
            "origins",
            "vias",
            "destinations",
            "apinatomy_model",
            "phenotype_id",
            "phenotype",
            "reference_uri",
            "provenances",
            "knowledge_statement",
            "journey",
            "entities_journey",
            "laterality",
            "projection",
            "circuit_type",
            "sex",
            "apinatomy_model",
            "statement_preview",
        )

class BulkActionSerializer(serializers.Serializer):
    action = serializers.ChoiceField(
        choices=[(action.value, action.value) for action in BulkActionType],
        help_text="The bulk action to perform."
    )

class AssignUserSerializer(BulkActionSerializer):
    user_id = serializers.IntegerField(required=True, help_text="ID of the user to assign.")

    def validate(self, data):
        if data.get("action") != BulkActionType.ASSIGN_USER.value:
            raise serializers.ValidationError({
                "action": f"For this serializer, action must be '{BulkActionType.ASSIGN_USER.value}'."
            })
        return data

class AssignTagsSerializer(BulkActionSerializer):
    add_tag_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=True,
        help_text="List of tag IDs to add."
    )
    remove_tag_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=True,
        help_text="List of tag IDs to remove."
    )

    def validate(self, data):
        if data.get("action") != BulkActionType.ASSIGN_TAG.value:
            raise serializers.ValidationError({
                "action": f"For this serializer, action must be '{BulkActionType.ASSIGN_TAG.value}'."
            })
        return data


class WriteNoteSerializer(BulkActionSerializer):
    note_text = serializers.CharField(required=True, help_text="The note text.")

    def validate(self, data):
        if data.get("action") != BulkActionType.WRITE_NOTE.value:
            raise serializers.ValidationError({
                "action": f"For this serializer, action must be '{BulkActionType.WRITE_NOTE.value}'."
            })
        return data

class ChangeStatusSerializer(BulkActionSerializer):
    new_status = serializers.CharField(required=True, help_text="The new status.")

    def validate(self, data):
        if data.get("action") != BulkActionType.CHANGE_STATUS.value:
            raise serializers.ValidationError({
                "action": f"For this serializer, action must be '{BulkActionType.CHANGE_STATUS.value}'."
            })
        return data

class AssignPopulationSetSerializer(BulkActionSerializer):
    population_set_id = serializers.IntegerField(required=True, help_text="ID of the population set.")

    def validate(self, data):
        if data.get("action") != BulkActionType.ASSIGN_POPULATION_SET.value:
            raise serializers.ValidationError({
                "action": f"For this serializer, action must be '{BulkActionType.ASSIGN_POPULATION_SET.value}'."
            })
        return data

class BulkActionResponseSerializer(serializers.Serializer):
    updated_count = serializers.IntegerField()
