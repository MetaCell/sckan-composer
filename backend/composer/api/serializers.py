from django.contrib.auth.models import User
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from ..models import (
    AnatomicalEntity,
    AnsDivision,
    ConnectivityStatement,
    Doi,
    Note,
    Profile,
    Sentence,
    Specie,
    Tag,
    Via,
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


class AnatomicalEntitySerializer(serializers.ModelSerializer):
    """Anatomical Entity"""

    class Meta:
        model = AnatomicalEntity
        fields = (
            "id",
            "name",
            "ontology_uri",
        )


class AnsDivisionSerializer(serializers.ModelSerializer):
    """ANS Division"""

    class Meta:
        model = AnsDivision
        fields = ("id", "name")


class TagSerializer(serializers.ModelSerializer):
    """Note Tag"""

    class Meta:
        model = Tag
        fields = ("id", "tag")


class SpecieSerializer(serializers.ModelSerializer):
    """Specie"""

    class Meta:
        model = Specie
        fields = ("id", "name")


class ViaSerializer(serializers.ModelSerializer):
    """Via"""
    anatomical_entity = AnatomicalEntitySerializer(read_only=False)

    class Meta:
        model = Via
        fields = ("id", "display_order", "connectivity_statement_id", "anatomical_entity")


class DoitSerializer(serializers.ModelSerializer):
    """Doi"""

    class Meta:
        model = Doi
        fields = ("id", "doi", "connectivity_statement")


class SentenceSerializer(serializers.ModelSerializer):
    """Sentence"""

    tags = TagSerializer(many=True, read_only=False)
    owner = UserSerializer(read_only=True, required=False)

    available_transitions = serializers.SerializerMethodField()

    def get_available_transitions(self, instance) -> list[str]:
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
            "tags",
            "owner",
            "state",
            "modified_date",
            "available_transitions",
            "pmid_uri",
            "pmcid_uri",
            "doi_uri",
        )
        read_only_fields = (
            "state",
            "modified_date",
        )


class ConnectivityStatementSerializer(serializers.ModelSerializer):
    """Connectivity Statement"""

    sentence_id = serializers.IntegerField(
        label="Sentence ID",
    )
    tags = TagSerializer(many=True, read_only=False)
    owner = UserSerializer(read_only=True, required=False)
    origin = AnatomicalEntitySerializer(required=False)
    destination = AnatomicalEntitySerializer(required=False)
    ans_division = AnsDivisionSerializer(required=False)
    path = ViaSerializer(source="via_set",many=True, read_only=False)
    species = SpecieSerializer(many=True, read_only=False)
    sentence = SentenceSerializer(read_only=True, required=False)

    available_transitions = serializers.SerializerMethodField()

    def get_available_transitions(self, instance) -> list[str]:
        return [t.name for t in instance.get_available_state_transitions()]

    class Meta:
        model = ConnectivityStatement
        fields = (
            "id",
            "sentence",
            "knowledge_statement",
            "sentence_id",
            "tags",
            "owner",
            "state",
            "available_transitions",
            "origin",
            "destination",
            "ans_division",
            "destination_type",
            "path",
            "laterality",
            "circuit_type",
            "species",
            "biological_sex",
            "apinatomy_model",
            "modified_date",
        )
        # depth = 1
        read_only_fields = ("state",)


class SentenceWithDetailsSerializer(serializers.ModelSerializer):
    """Sentence with details"""

    has_notes = serializers.SerializerMethodField()
    owner = UserSerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)

    def get_has_notes(self, instance) -> bool:
        return instance.has_notes

    class Meta:
        model = Sentence
        fields = "__all__"
        read_only_fields = (
            "state",
            "modified_date",
        )


class ConnectivityStatementWithDetailsSerializer(serializers.ModelSerializer):
    """Connectivity Statement with details"""

    has_notes = serializers.SerializerMethodField()
    owner = UserSerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)

    def get_has_notes(self, instance) -> bool:
        return instance.has_notes

    class Meta:
        model = ConnectivityStatement
        exclude = ("path",)
        read_only_fields = ("state",)


class NoteSerializer(serializers.ModelSerializer):
    """Note"""

    user = UserSerializer(read_only=True, required=False)
    connectivity_statement_id = serializers.IntegerField(
        label="Statement ID", required=False
    )
    sentence_id = serializers.IntegerField(label="Sentence ID", required=False)

    class Meta:
        model = Note
        fields = ("note", "user", "created", "connectivity_statement_id", "sentence_id")
