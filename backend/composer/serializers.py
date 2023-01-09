from django.contrib.auth.models import User

from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from .models import (
    AnatomicalEntity,
    AnsDivision,
    ConnectivityStatement,
    Doi,
    Note,
    Tag,
    Provenance,
    Specie,
    Profile,
    Via,
)


# serializers
class UserSerializer(serializers.ModelSerializer):
    """User"""

    class Meta:
        model = User
        fields = (
            "username",
            "email",
            "first_name",
            "last_name",
            "is_active",
            "is_staff",
            "is_superuser",
        )


class ProfileSerializer(serializers.ModelSerializer):
    """Profile"""

    user = UserSerializer(read_only=True)

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


class ProvenanceSerializer(serializers.ModelSerializer):
    """Provenance"""

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
        model = Provenance
        fields = "__all__"
        read_only_fields = (
            "state",
            "available_transitions",
            "pmid_uri",
            "pmcid_uri",
            "owner",
        )


class DoitSerializer(serializers.ModelSerializer):
    """Doi"""

    class Meta:
        model = Doi
        fields = "__all__"
        depth = 0


class ViaSerializer(serializers.ModelSerializer):
    """Via"""

    class Meta:
        model = Via
        fields = "__all__"


class ViaViewSerializer(serializers.ModelSerializer):
    """Via"""

    # anatomical_entity = AnatomicalEntitySerializer(read_only=False)

    class Meta:
        model = Via
        fields = ("id", "ordering", "anatomical_entity")
        depth = 1


class ConnectivityStatementSerializer(serializers.ModelSerializer):
    """Connectivity Statement"""

    available_transitions = serializers.SerializerMethodField()
    path = ViaViewSerializer(source="via_set", many=True, read_only=True)

    def get_available_transitions(self, instance) -> list[str]:
        return [t.name for t in instance.get_available_state_transitions()]

    class Meta:
        model = ConnectivityStatement
        fields = "__all__"
        depth = 0
        read_only_fields = ("state", "owner")


class ConnectivityStatementViewSerializer(ConnectivityStatementSerializer):
    """Connectivity Statement"""

    provenance = ProvenanceSerializer(read_only=True)

    class Meta(ConnectivityStatementSerializer.Meta):
        depth = 1
