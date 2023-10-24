from typing import List
from django.db.models import Q
import django_filters

from composer.enums import SentenceState, CSState
from composer.models import (
    Sentence,
    ConnectivityStatement,
    AnatomicalEntity,
    Note,
    Tag,
    Via,
    Specie,
)


def field_has_content(queryset, name, value):
    lookup = "__".join([name, "isnull"])
    return queryset.filter(**{lookup: not value})


def filter_by_title_or_text(queryset, name, value):
    return queryset.filter(Q(title__icontains=value) | Q(text__icontains=value))


def exclude_ids(queryset, name, value: List[int]):
    return queryset.exclude(id__in=value)


class SentenceFilter(django_filters.FilterSet):
    title = django_filters.CharFilter(method=filter_by_title_or_text)

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
            ("id", "id"),
            ("modified_date", "last_edited"),
        ),
    )
    exclude = django_filters.BaseInFilter(method=exclude_ids)

    class Meta:
        model = Sentence
        fields = []


def filter_by_ontology_uri(qs, field, anatomical_entity):
    return qs.filter(Q(**{f"{field}__ontology_uri": anatomical_entity.ontology_uri}))


def filter_by_ontology_uri_many(qs, field, anatomical_entities):
    # If the anatomical_entities queryset is empty, return the original queryset
    if not anatomical_entities.exists():
        return qs

    ontology_uris = [entity.ontology_uri for entity in anatomical_entities]

    # Filter the main queryset based on those ontology_uris
    return qs.filter(Q(**{f"{field}__ontology_uri__in": ontology_uris}))


class ConnectivityStatementFilter(django_filters.FilterSet):
    sentence_id = django_filters.NumberFilter(field_name="sentence__id")
    exclude_sentence_id = django_filters.NumberFilter(field_name="sentence__id", exclude=True)

    knowledge_statement = django_filters.CharFilter(
        field_name="knowledge_statement", lookup_expr="icontains"
    )
    state = django_filters.MultipleChoiceFilter(
        field_name="state", choices=CSState.choices
    )
    tags = django_filters.ModelMultipleChoiceFilter(
        field_name="tags", queryset=Tag.objects.all()
    )
    origins = django_filters.ModelMultipleChoiceFilter(
        field_name="origins",
        queryset=AnatomicalEntity.objects.all(),
        method=filter_by_ontology_uri_many,
    )
    destinations = django_filters.ModelMultipleChoiceFilter(
        field_name="destinations__anatomical_entities",
        queryset=AnatomicalEntity.objects.all(),
        method=filter_by_ontology_uri_many,
    )
    notes = django_filters.BooleanFilter(
        field_name="notes", label="Checks if entity has notes", method=field_has_content
    )
    ordering = django_filters.OrderingFilter(
        fields=(
            ("id", "id"),
            ("modified_date", "last_edited"),
        ),
    )

    class Meta:
        model = ConnectivityStatement
        fields = []


class AnatomicalEntityFilter(django_filters.FilterSet):
    name = django_filters.CharFilter(method="filter_name")

    class Meta:
        model = AnatomicalEntity
        fields = []

    @staticmethod
    def filter_name(queryset, name, value):
        words = value.split()

        if not words:
            return queryset

        queries = [Q(name__icontains=word) for word in words]

        query = queries.pop()
        for item in queries:
            query &= item

        return queryset.filter(query)


class SpecieFilter(django_filters.FilterSet):
    name = django_filters.CharFilter(field_name="name", lookup_expr="icontains")

    class Meta:
        model = Specie
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
