import django_filters

from composer.enums import SentenceState, CSState
from composer.models import (
    Sentence,
    ConnectivityStatement,
    AnatomicalEntity,
    Note,
    Tag,
    Via,
)


def field_has_content(queryset, name, value):
    lookup = "__".join([name, "isnull"])
    return queryset.filter(**{lookup: not value})


class SentenceFilter(django_filters.FilterSet):
    title = django_filters.CharFilter(field_name="title", lookup_expr="icontains")
    state = django_filters.MultipleChoiceFilter(
        field_name="state", choices=SentenceState.choices
    )
    tags = django_filters.ModelMultipleChoiceFilter(
        field_name="tags", queryset=Tag.objects.all()
    )
    notes = django_filters.BooleanFilter(
        field_name="notes", label="Checks if entity has notes", method=field_has_content
    )
    ordering = django_filters.OrderingFilter(
        fields=(
            ("pmid", "pmid"),
            ("modified_date", "last_edited"),
        ),
    )

    class Meta:
        model = Sentence
        fields = []


def ae_destination(request, *args, **kwargs):
    if request is None:
        return AnatomicalEntity.objects.none()
    
    destination = request.query_params.get("destination")
    if destination is None:
        return AnatomicalEntity.objects.none()
    ae = AnatomicalEntity.objects.get(id=destination)
    return AnatomicalEntity.objects.filter(ontology_uri=ae.ontology_uri)


def ae_destination(qs, field, anatomical_entity):
    return qs.filter(destination__ontology_uri=anatomical_entity.ontology_uri)


def ae_origin(qs, field, anatomical_entity):
    return qs.filter(origin__ontology_uri=anatomical_entity.ontology_uri)


class ConnectivityStatementFilter(django_filters.FilterSet):
    sentence_id = django_filters.ModelChoiceFilter(
        field_name="sentence_id", queryset=Sentence.objects.all()
    )
    knowledge_statement = django_filters.CharFilter(
        field_name="knowledge_statement", lookup_expr="icontains"
    )
    state = django_filters.MultipleChoiceFilter(
        field_name="state", choices=CSState.choices
    )
    tags = django_filters.ModelMultipleChoiceFilter(
        field_name="tags", queryset=Tag.objects.all()
    )
    origin = django_filters.ModelChoiceFilter(
        field_name="origin", queryset=AnatomicalEntity.objects.all(), method=ae_origin
    )
    destination = django_filters.ModelChoiceFilter(
        field_name="destination", queryset=AnatomicalEntity.objects.all(), method=ae_destination
    )
    notes = django_filters.BooleanFilter(
        field_name="notes", label="Checks if entity has notes", method=field_has_content
    )
    ordering = django_filters.OrderingFilter(
        fields=(
            ("sentence__pmid", "pmid"),
            ("modified_date", "last_edited"),
        ),
    )

    class Meta:
        model = ConnectivityStatement
        fields = []


class AnatomicalEntityFilter(django_filters.FilterSet):
    name = django_filters.CharFilter(field_name="name", lookup_expr="icontains")

    class Meta:
        model = AnatomicalEntity
        fields = []


class NoteFilter(django_filters.FilterSet):
    sentence_id = django_filters.ModelChoiceFilter(
        field_name="sentence_id", queryset=Sentence.objects.all()
    )
    connectivity_statement_id = django_filters.ModelChoiceFilter(
        field_name="connectivity_statement_id",
        queryset=ConnectivityStatement.objects.all(),
    )

    class Meta:
        model = Note
        fields = []


class ViaFilter(django_filters.FilterSet):
    connectivity_statement_id = django_filters.ModelChoiceFilter(
        field_name="connectivity_statement_id",
        queryset=ConnectivityStatement.objects.all(),
    )

    class Meta:
        model = Via
        fields = []
