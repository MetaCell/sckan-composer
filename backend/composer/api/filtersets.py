from typing import List
from django.db.models import Q
import django_filters
from django_filters import BaseInFilter, NumberFilter

from composer.enums import SentenceState, CSState
from composer.models import (
    Sentence,
    ConnectivityStatement,
    AnatomicalEntity,
    Note,
    Tag,
    Via,
    Specie, Destination,
)


def field_has_content(queryset, name, value):
    lookup = "__".join([name, "isnull"])
    return queryset.filter(**{lookup: not value})


def filter_by_title_or_text(queryset, name, value):
    return queryset.filter(Q(title__icontains=value) | Q(text__icontains=value))


def exclude_ids(queryset, name, value: List[int]):
    return queryset.exclude(id__in=value)

class NumberInFilter(BaseInFilter, NumberFilter):
    pass

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


class ConnectivityStatementFilter(django_filters.FilterSet):
    exclude_ids = NumberInFilter(field_name='id', exclude=True)

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
        conjoined=False
    )
    destinations = django_filters.ModelMultipleChoiceFilter(
        field_name="destinations",
        queryset=Destination.objects.all(),
        conjoined=False
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
    exclude_ids = NumberInFilter(field_name='id', exclude=True)

    class Meta:
        model = AnatomicalEntity
        fields = []

    @staticmethod
    def filter_name(queryset, name, value):
        if not value:
            return queryset
        
        qs_name = queryset.filter(simple_entity__name__icontains=value) \
            .union(queryset.filter(region_layer__layer__name__icontains=value)) \
            .union(queryset.filter(region_layer__region__name__icontains=value))
        
        qs_uri = queryset.filter(simple_entity__ontology_uri__icontains=value) \
            .union(queryset.filter(region_layer__layer__ontology_uri__icontains=value)) \
            .union(queryset.filter(region_layer__region__ontology_uri__icontains=value))
        
        qs_synonyms = queryset.filter(synonyms__name__icontains=value)

        merged_queryset = qs_name.union(qs_uri).union(qs_synonyms)

        ids = merged_queryset.values_list('id', flat=True)
        return queryset.filter(id__in=ids)



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


class DestinationFilter(django_filters.FilterSet):
    connectivity_statement_id = django_filters.ModelChoiceFilter(
        field_name="connectivity_statement_id",
        queryset=ConnectivityStatement.objects.all(),
    )

    class Meta:
        model = Destination
        fields = []
