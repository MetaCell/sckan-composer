from django.contrib.auth.models import User
from django.db import transaction

from rest_framework import serializers
from drf_writable_nested import UniqueFieldsMixin
from drf_writable_nested.serializers import WritableNestedModelSerializer

from .models import (
    AnatomicalEntity,
    AnsDivision,
    ConnectivityStatement,
    Doi,
    Note,
    NoteTag,
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


class AnatomicalEntitySerializer(UniqueFieldsMixin, serializers.ModelSerializer):
    """Anatomical Entity"""

    class Meta:
        model = AnatomicalEntity
        fields = "__all__"


class AnsDivisionSerializer(serializers.ModelSerializer):
    """ANS Division"""

    class Meta:
        model = AnsDivision
        fields = "__all__"


class NoteTagSerializer(serializers.ModelSerializer):
    """Note Tag"""

    class Meta:
        model = NoteTag
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

    def get_available_transitions(self, instance):
        return [t.name for t in instance.get_available_state_transitions()]

    def get_pmid_uri(self, instance):
        return instance.pmid_uri

    def get_pmcid_uri(self, instance):
        return instance.pmcid_uri

    class Meta:
        model = Provenance
        fields = "__all__"
        read_only_fields = (
            "state",
            "available_transitions",
            "pmid_uri",
            "pmcid_uri",
        )


class ViaFromConnectivityStatementSerializer(serializers.ModelSerializer):
    """Via"""

    class Meta:
        model = Via
        fields = "__all__"
        depth = 0


class DoitSerializer(serializers.ModelSerializer):
    """Doi"""

    class Meta:
        model = Doi
        fields = "__all__"
        depth = 0


class ConnectivityStatementSerializer(serializers.ModelSerializer):
    """Connectivity Statement"""

    available_transitions = serializers.SerializerMethodField()

    def get_available_transitions(self, instance):
        return [t.name for t in instance.get_available_state_transitions()]

    class Meta:
        model = ConnectivityStatement
        fields = "__all__"
        depth = 0
        read_only_fields = ("state", "curator")


class ConnectivityStatementViewSerializer(ConnectivityStatementSerializer):
    """Connectivity Statement"""

    class Meta(ConnectivityStatementSerializer.Meta):
        depth = 2


class ViaSerializer(serializers.ModelSerializer):
    """Via"""

    class Meta:
        model = Via
        fields = "__all__"
        depth = 1
