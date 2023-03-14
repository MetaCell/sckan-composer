from django.contrib.auth.models import User
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers
from drf_writable_nested.serializers import WritableNestedModelSerializer
from drf_writable_nested.mixins import UniqueFieldsMixin, NestedUpdateMixin
from django.db.models import Q

from django_fsm import FSMField

from ..models import (
    AnatomicalEntity,
    AnsDivision,
    BiologicalSex,
    ConnectivityStatement,
    Doi,
    Note,
    Profile,
    Sentence,
    Specie,
    Tag,
    Via,
)
from ..enums import SentenceState, CSState


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


class AnsDivisionSerializer(UniqueFieldsMixin, serializers.ModelSerializer):
    """ANS Division"""

    class Meta:
        model = AnsDivision
        fields = ("id", "name")


class TagSerializer(UniqueFieldsMixin, serializers.ModelSerializer):
    """Note Tag"""

    class Meta:
        model = Tag
        fields = ("id", "tag")


class SpecieSerializer(UniqueFieldsMixin, serializers.ModelSerializer):
    """Specie"""

    class Meta:
        model = Specie
        fields = ("id", "name", "ontology_uri")


class BiologicalSexSerializer(serializers.ModelSerializer):
    """BiologicalSex"""

    class Meta:
        model = BiologicalSex
        fields = ("id", "name", "ontology_uri")


class ViaSerializer(serializers.ModelSerializer):
    """Via"""

    anatomical_entity = AnatomicalEntitySerializer(read_only=False)

    class Meta:
        model = Via
        fields = (
            "id",
            "display_order",
            "connectivity_statement_id",
            "anatomical_entity",
        )


class DoiSerializer(serializers.ModelSerializer):
    """Doi"""

    doi = serializers.CharField(required=True)
    connectivity_statement_id = serializers.IntegerField(required=True)

    class Meta:
        model = Doi
        fields = (
            "id",
            "doi",
            "connectivity_statement_id"
        )


class SentenceConnectivityStatement(serializers.ModelSerializer):
    """Connectivity Statement"""
    sentence_id = serializers.IntegerField()
    biological_sex_id = serializers.IntegerField()
    ans_division_id = serializers.IntegerField()
    dois = DoiSerializer(source="doi_set", many=True, read_only=False)
    biological_sex = BiologicalSexSerializer(required=False, read_only=True)
    species = SpecieSerializer(many=True, read_only=True)
    ans_division = AnsDivisionSerializer(required=False, read_only=True)

    class Meta:
        model = ConnectivityStatement
        fields = (
            "id",
            "sentence_id",
            "knowledge_statement",
            "dois",
            "ans_division_id",
            "ans_division",
            "laterality",
            "circuit_type",
            "species",
            "biological_sex_id",
            "biological_sex",
            "apinatomy_model",
        )
        read_only_fields = (
            "id",
            "sentence_id",
            "knowledge_statement",
            "dois",
            "ans_division_id",
            "ans_division",
            "laterality",
            "circuit_type",
            "species",
            "biological_sex_id",
            "biological_sex",
            "apinatomy_model",
        )


class SentenceSerializer(FixManyToManyMixin, FixedWritableNestedModelSerializer):
    """Sentence"""

    state = serializers.CharField(read_only=True)
    pmid = serializers.IntegerField(required=False, default=None, allow_null=True)
    pmcid = serializers.CharField(required=False, default=None, allow_null=True)
    doi = serializers.CharField(required=False, default=None, allow_null=True)
    tags = TagSerializer(many=True, read_only=True)
    connectivity_statements = SentenceConnectivityStatement(source="connectivitystatement_set", many=True,
                                                            read_only=True)
    owner = UserSerializer(required=False, read_only=True)
    owner_id = serializers.IntegerField(required=False, default=None, allow_null=True)
    available_transitions = serializers.SerializerMethodField(read_only=True)
    has_notes = serializers.SerializerMethodField(read_only=True)

    def get_has_notes(self, instance) -> bool:
        return instance.has_notes

    def get_available_transitions(self, instance) -> list[SentenceState]:
        return [t.name for t in instance.get_available_state_transitions()]

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

    sentence_id = serializers.IntegerField()
    owner_id = serializers.IntegerField(required=False, default=None, allow_null=True)
    origin_id = serializers.IntegerField(required=False)
    destination_id = serializers.IntegerField(required=False)
    ans_division_id = serializers.IntegerField(required=False)
    biological_sex_id = serializers.IntegerField(required=False)
    tags = TagSerializer(many=True, read_only=True)
    species = SpecieSerializer(many=True, read_only=False)
    dois = DoiSerializer(source="doi_set", many=True, read_only=False)
    path = ViaSerializer(source="via_set", many=True, read_only=True)
    owner = UserSerializer(required=False, read_only=True)
    origin = AnatomicalEntitySerializer(required=False, read_only=True)
    destination = AnatomicalEntitySerializer(required=False, read_only=True)
    ans_division = AnsDivisionSerializer(required=False, read_only=True)
    biological_sex = BiologicalSexSerializer(required=False, read_only=True)
    sentence = SentenceSerializer(required=False, read_only=True)
    available_transitions = serializers.SerializerMethodField()
    has_notes = serializers.SerializerMethodField()
    journey = serializers.CharField(read_only=True)

    def get_available_transitions(self, instance) -> list[CSState]:
        return [t.name for t in instance.get_available_state_transitions()]

    def get_has_notes(self, instance) -> bool:
        return instance.has_notes

    class Meta:
        model = ConnectivityStatement
        fields = (
            "id",
            "sentence_id",
            "sentence",
            "knowledge_statement",
            "tags",
            "dois",
            "owner",
            "owner_id",
            "state",
            "available_transitions",
            "origin_id",
            "origin",
            "destination_id",
            "destination",
            "ans_division_id",
            "ans_division",
            "destination_type",
            "path",
            "journey",
            "laterality",
            "circuit_type",
            "species",
            "biological_sex_id",
            "biological_sex",
            "apinatomy_model",
            "modified_date",
            "has_notes",
        )
        read_only_fields = ("state",)
