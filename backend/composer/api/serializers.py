from typing import List

from django.contrib.auth.models import User
from django.db.models import Q
from django_fsm import FSMField
from drf_writable_nested.mixins import UniqueFieldsMixin
from drf_writable_nested.serializers import WritableNestedModelSerializer
from rest_framework import serializers

from ..enums import SentenceState, CSState
from ..models import (
    AnatomicalEntity,
    Phenotype,
    Sex,
    ConnectivityStatement,
    Provenance,
    Note,
    Profile,
    Sentence,
    Specie,
    Tag,
    Via, Destination,
)
from ..services.errors_service import get_connectivity_errors
from ..utils import join_entities


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
        fields = ("id", "username", "first_name", "last_name", "email")


class ProfileSerializer(serializers.ModelSerializer):
    """Profile"""

    user = UserSerializer(read_only=True, required=False)

    class Meta:
        model = Profile
        fields = ("id", "user", "is_triage_operator", "is_curator", "is_reviewer")
        dept = 2


class AnatomicalEntitySerializer(UniqueFieldsMixin, serializers.ModelSerializer):
    """Anatomical Entity"""

    class Meta:
        model = AnatomicalEntity
        fields = (
            "id",
            "name",
            "ontology_uri",
        )
        read_only_fields = ("ontology_uri",)


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


class ViaSerializerDetails(serializers.ModelSerializer):
    """Via Serializer with Custom Logic for from_entities"""

    anatomical_entities = AnatomicalEntitySerializer(
        many=True,
    )

    from_entities = AnatomicalEntitySerializer(
        many=True,
    )

    class Meta:
        model = Via
        fields = (
            "id",
            "order",
            "connectivity_statement_id",
            "type",
            "anatomical_entities",
            "from_entities"
        )

    def to_representation(self, instance):
        """
        Custom representation for Via.
        """
        representation = super().to_representation(instance)

        # Check if from_entities is empty
        if not instance.from_entities.exists():
            # Get the order of the current via
            current_order = instance.order

            if current_order == 0:
                # Use the origins of the ConnectivityStatement if order is 0
                origins = instance.connectivity_statement.origins.all()
                representation['from_entities'] = AnatomicalEntitySerializer(origins, many=True).data
            else:
                # Fetch the Via with order - 1
                previous_via = Via.objects.filter(
                    connectivity_statement=instance.connectivity_statement,
                    order=current_order - 1
                ).first()

                if previous_via:
                    # Serialize anatomical_entities from previous via
                    previous_entities = AnatomicalEntitySerializer(
                        previous_via.anatomical_entities.all(),
                        many=True
                    ).data
                    representation['from_entities'] = previous_entities

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

    class Meta:
        model = Destination
        fields = (
            "id",
            "connectivity_statement_id",
            "type",
            "anatomical_entities",
            "from_entities"
        )

    def to_representation(self, instance):
        """
        Custom representation for Destination.
        """
        representation = super().to_representation(instance)

        # Check if from_entities is empty
        if not instance.from_entities.exists():
            # Get the Via with the highest order in the same ConnectivityStatement
            highest_order_via = Via.objects.filter(
                connectivity_statement=instance.connectivity_statement
            ).order_by('-order').first()

            if highest_order_via:
                # Serialize anatomical_entities from highest order via
                highest_entities = AnatomicalEntitySerializer(
                    highest_order_via.anatomical_entities.all(),
                    many=True
                ).data
                representation['from_entities'] = highest_entities
            else:
                # Use the origins of the ConnectivityStatement if no vias exist
                origins = instance.connectivity_statement.origins.all()
                representation['from_entities'] = AnatomicalEntitySerializer(origins, many=True).data

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
    phenotype_id = serializers.IntegerField(
        required=False, default=None, allow_null=True
    )
    provenances = ProvenanceSerializer(
        source="provenance_set", many=True, read_only=False
    )
    sex = SexSerializer(required=False, read_only=True)
    species = SpecieSerializer(many=True, read_only=True)
    owner = UserSerializer(required=False, read_only=True)
    phenotype = PhenotypeSerializer(required=False, read_only=True)

    class Meta:
        model = ConnectivityStatement
        fields = (
            "id",
            "sentence_id",
            "knowledge_statement",
            "provenances",
            "phenotype_id",
            "phenotype",
            "laterality",
            "projection",
            "circuit_type",
            "species",
            "sex_id",
            "sex",
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
            "laterality",
            "projection",
            "circuit_type",
            "species",
            "sex_id",
            "sex",
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


class ConnectivityStatementSerializer(
    FixManyToManyMixin, FixedWritableNestedModelSerializer
):
    """Connectivity Statement"""

    id = serializers.IntegerField(
        required=False, default=None, allow_null=True, read_only=True
    )
    sentence_id = serializers.IntegerField(required=False)
    knowledge_statement = serializers.CharField(allow_blank=True, required=False)
    owner_id = serializers.IntegerField(required=False, default=None, allow_null=True)
    phenotype_id = serializers.IntegerField(required=False, allow_null=True)
    sex_id = serializers.IntegerField(required=False, allow_null=True)
    tags = TagSerializer(many=True, read_only=True, required=False)
    species = SpecieSerializer(many=True, read_only=False, required=False)
    provenances = ProvenanceSerializer(source="provenance_set", many=True, read_only=False, required=False)
    origins = AnatomicalEntitySerializer(many=True, required=False)
    vias = ViaSerializerDetails(source="via_set", many=True, read_only=False, required=False)
    destinations = DestinationSerializerDetails(many=True, required=False)
    owner = UserSerializer(required=False, read_only=True)
    phenotype = PhenotypeSerializer(required=False, read_only=True)
    sex = SexSerializer(required=False, read_only=True)
    sentence = SentenceSerializer(required=False, read_only=True)
    forward_connection = serializers.PrimaryKeyRelatedField(
        many=True, queryset=ConnectivityStatement.objects.all(), required=False
    )
    available_transitions = serializers.SerializerMethodField()
    has_notes = serializers.SerializerMethodField()
    journey = serializers.ListField(child=serializers.CharField(), read_only=True)
    statement_preview = serializers.SerializerMethodField()
    errors = serializers.SerializerMethodField()

    def get_available_transitions(self, instance) -> list[CSState]:
        request = self.context.get("request", None)
        user = request.user if request else None
        return [t.name for t in instance.get_available_user_state_transitions(user)]

    def get_has_notes(self, instance) -> bool:
        return instance.has_notes

    def get_statement_preview(self, instance) -> str:
        sex = instance.sex.name if instance.sex else "{sex}"
        species_list = [specie.name for specie in instance.species.all()]
        species = join_entities(species_list)
        if not species:
            species = "{species}"

        phenotype = instance.phenotype.name.lower() if instance.phenotype else "{phenotype}"
        origin_names = [origin.name for origin in instance.origins.all()]
        origins = join_entities(origin_names)
        if not origins:
            origins = "{species}"

        circuit_type = instance.get_circuit_type_display().lower() if instance.circuit_type else "{circuit_type}"
        projection = instance.get_projection_display().lower() if instance.projection else "{projection}"

        laterality_description = instance.get_laterality_description()
        if not laterality_description:
            laterality_description = "{laterality_description}"

        forward_connection = (
            join_entities(instance.forward_connection.all().values_list('id', flat=True))
            if instance.forward_connection
            else "{forward_connection}"
        )
        apinatomy = instance.apinatomy_model if instance.apinatomy_model else "{apinatomy}"
        journey = '\n'.join(instance.journey)

        # Creating the statement
        statement = f"In a {sex} {species}, a {phenotype} connection goes: \n{journey}\n"
        statement += f"This {projection} {circuit_type} connection projects from the {origins} and is found {laterality_description}."

        if forward_connection:
            statement += f" This neuron population connects to connectivity statements with id {forward_connection}."

        if apinatomy:
            statement += f" It is described in {apinatomy} model."

        return statement.strip()

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
        return representation

    def update(self, instance, validated_data):
        # Remove 'vias' and 'destinations' from validated_data if they exist
        validated_data.pop('via_set', None)
        validated_data.pop('destinations', None)

        # Call the super class's update method with the modified validated_data
        return super(ConnectivityStatementSerializer, self).update(instance, validated_data)

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
            "journey",
            "laterality",
            "projection",
            "circuit_type",
            "species",
            "sex_id",
            "sex",
            "forward_connection",
            "apinatomy_model",
            "additional_information",
            "modified_date",
            "has_notes",
            "statement_preview",
            "errors"
        )
        read_only_fields = ("state",)


class ConnectivityStatementUpdateSerializer(ConnectivityStatementSerializer):
    origins = serializers.PrimaryKeyRelatedField(
        many=True, queryset=AnatomicalEntity.objects.all()
    )

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
            "journey",
            "laterality",
            "projection",
            "circuit_type",
            "species",
            "sex_id",
            "sex",
            "forward_connection",
            "apinatomy_model",
            "additional_information",
            "modified_date",
            "has_notes",
            "statement_preview",
            "errors"
        )
