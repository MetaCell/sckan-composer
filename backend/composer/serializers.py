from django.contrib.auth.models import User

from rest_framework import serializers
from drf_writable_nested import UniqueFieldsMixin
from drf_writable_nested.serializers import WritableNestedModelSerializer

from .models import AnatomicalEntity, AnsDivision, ConnectivityStatement, Note, NoteTag, Provenance, Specie, Profile, Via

# serializers
class UserSerializer(serializers.ModelSerializer):
    """User"""
    class Meta:
        model = User
        fields = ('username', 'email', 'first_name', 'last_name', 'is_active', 'is_staff', 'is_superuser',)

class ProfileSerializer(serializers.ModelSerializer):
    """Profile"""
    user = UserSerializer(read_only=True)
    class Meta:
        model = Profile
        fields = '__all__'
        dept = 2


class AnatomicalEntitySerializer(UniqueFieldsMixin, serializers.ModelSerializer):
    """Anatomical Entity"""
    class Meta:
        model = AnatomicalEntity
        fields = '__all__'


class AnsDivisionSerializer(serializers.ModelSerializer):
    """ANS Division"""
    class Meta:
        model = AnsDivision
        fields = '__all__'


class NoteTagSerializer(serializers.ModelSerializer):
    """Note Tag"""
    class Meta:
        model = NoteTag
        fields = '__all__'


class NoteSerializer(serializers.ModelSerializer):
    """Note"""
    class Meta:
        model = Note
        fields = '__all__'


class SpecieSerializer(serializers.ModelSerializer):
    """Specie"""
    class Meta:
        model = Specie
        fields = '__all__'


class ProvenanceSerializer(serializers.ModelSerializer):
    """Provenance"""
    notes = NoteSerializer(many=True, read_only=True)
    class Meta:
        model = Provenance
        fields = '__all__'


class ViaFromConnectivityStatementSerializer(serializers.ModelSerializer):
    """Via"""
    class Meta:
        model = Via
        fields = '__all__'
        depth = 0


class ConnectivityStatementSerializer(WritableNestedModelSerializer):
    """Connectivity Statement"""
    notes = NoteSerializer(many=True, read_only=False)
    via = ViaFromConnectivityStatementSerializer(source='path_set', many=True, read_only=False)
    ans_division = AnsDivisionSerializer(many=False, read_only=True)
    species = SpecieSerializer(many=True, read_only=True)
    available_transitions = serializers.SerializerMethodField()

    def get_available_transitions(self, instance):
        transitions = []
        for transition in instance.get_available_state_transitions():
            transitions.append(transition.name)
        return transitions

    class Meta:
        model = ConnectivityStatement
        fields = ('id', 'knowledge_statement', 'uri', 'state', 'origin', 'destination', 'destination_type', 'path', 'via', 'notes', 'provenance', 'curator', 'ans_division', 'species', 'biological_sex', 'apinatomy_model', 'laterality', 'circuit_type', 'available_transitions')
        #   fields = '__all__'
        depth = 2
        read_only_fields = ('state', 'provenance', 'available_transitions')


class ViaSerializer(serializers.ModelSerializer):
    """Via"""
    class Meta:
        model = Via
        fields = '__all__'
        depth = 1
