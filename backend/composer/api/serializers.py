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
        fields = "__all__"


class ProfileSerializer(serializers.ModelSerializer):
    """Profile"""

    user = UserSerializer(read_only=True, required=False)
    token = serializers.SerializerMethodField(required=False, read_only=True)

    def get_token(self, obj) -> str:
        return obj.user.auth_token.key

    class Meta:
        model = Profile
        fields = "__all__"
        dept = 2


class AnatomicalEntitySerializer(serializers.ModelSerializer):
    """Anatomical Entity"""

    class Meta:
        model = AnatomicalEntity
        fields = "__all__"


class AnsDivisionSerializer(serializers.ModelSerializer):
    """ANS Division"""

    class Meta:
        model = AnsDivision
        fields = "__all__"


class TagSerializer(serializers.ModelSerializer):
    """Note Tag"""

    class Meta:
        model = Tag
        fields = "__all__"


class NoteSerializer(serializers.ModelSerializer):
    """Note"""

    class Meta:
        model = Note
        fields = "__all__"


class SpecieSerializer(serializers.ModelSerializer):
    """Specie"""

    class Meta:
        model = Specie
        fields = "__all__"


class ViaSerializer(serializers.ModelSerializer):
    """Via"""

    class Meta:
        model = Via
        fields = "__all__"


class ViaWithDetailsSerializer(serializers.ModelSerializer):
    """Via"""

    anatomical_entity = AnatomicalEntitySerializer(read_only=True)

    class Meta:
        model = Via
        fields = ("id", "ordering", "anatomical_entity")


class DoitSerializer(serializers.ModelSerializer):
    """Doi"""

    class Meta:
        model = Doi
        fields = "__all__"
        depth = 0


class SentenceSerializer(serializers.ModelSerializer):
    """Sentence"""

    # notes = NoteSerializer(many=True, read_only=True)
    available_transitions = serializers.SerializerMethodField()
    pmid_uri = serializers.SerializerMethodField()
    pmcid_uri = serializers.SerializerMethodField()

    def get_available_transitions(self, instance) -> list[str]:
        return [t.name for t in instance.get_available_state_transitions()]

    def get_pmid_uri(self, instance) -> str:
        return instance.pmid_uri

    def get_pmcid_uri(self, instance) -> str:
        return instance.pmcid_uri

    class Meta:
        model = Sentence
        fields = "__all__"
        read_only_fields = (
            "state",
            "modified_date",
        )


class ConnectivityStatementSerializer(serializers.ModelSerializer):
    """Connectivity Statement"""

    available_transitions = serializers.SerializerMethodField()

    def get_available_transitions(self, instance) -> list[str]:
        return [t.name for t in instance.get_available_state_transitions()]

    class Meta:
        model = ConnectivityStatement
        fields = "__all__"
        depth = 0
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
        # fields = "__all__"
        # depth = 1
        exclude = ("path",)
        read_only_fields = ("state",)
