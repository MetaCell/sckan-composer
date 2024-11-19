from typing import List
from django.db.models import Q, Case, When, Value, IntegerField
from django.db.models.functions import Coalesce
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
from django_filters import rest_framework
from django_filters import CharFilter, BaseInFilter


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
            ("owner", "owner"),
        ),
        method='order_by_current_user'
    )
    exclude = django_filters.BaseInFilter(method=exclude_ids)

    def order_by_current_user(self, queryset, name, value):
        current_user = self.request.user
        if 'owner' in value or '-owner' in value:
            order_direction = '-' if '-owner' in value else ''
            reverse__order_direction = '' if '-owner' in value else '-'
            queryset = queryset.annotate(
                owner_full_name=Coalesce(
                    'owner__first_name', Value(' '), 'owner__last_name'),
                owner_null=Case(
                    When(owner=None, then=Value(1)),
                    default=Value(0),
                    output_field=IntegerField()
                ),
                is_current_user=Case(
                    When(owner=current_user, then=Value(1)),
                    default=Value(0),
                    output_field=IntegerField()
                )
            ).order_by('owner_null', f'{reverse__order_direction}is_current_user', f'{order_direction}owner_full_name')
        if 'last_edited' in value or '-last_edited' in value:
            order_direction = '-' if '-last_edited' in value else ''

            queryset = queryset.order_by(f'{order_direction}modified_date')

        other_ordering = [v for v in value if v not in [
            'owner', '-owner', 'last_edited', '-last_edited']]
        return queryset if not other_ordering else queryset.order_by(*other_ordering)

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


class ListCharFilter(BaseInFilter, CharFilter):
    pass


class KnowledgeStatementFilterSet(rest_framework.FilterSet):
    via_uris = ListCharFilter(method='filter_via_uris', label='Via URI')
    destination_uris = ListCharFilter(method='filter_destination_uris', label='Destination URI')
    origin_uris = ListCharFilter(method='filter_origin_uris', label='Origin URI')
    population_uris = ListCharFilter(method='filter_population_uris', label='Reference URI')

    class Meta:
        model = ConnectivityStatement
        fields = ['via_uris', 'destination_uris', 'origin_uris', 'population_uris']
        distinct = True
        
    @property
    def qs(self):
        return super().qs.distinct()
    
    def filter_population_uris(self, queryset, name, value):
        return queryset.filter(reference_uri__in=value)

    def filter_via_uris(self, queryset, name, value):
        via_uris = value
        via_ids = Via.objects.none()
        for uri in via_uris:
            via_ids = via_ids.union(
                Via.objects.filter(anatomical_entities__simple_entity__ontology_uri=uri).prefetch_related('anatomical_entities__simple_entity')
                .union(Via.objects.filter(anatomical_entities__region_layer__layer__ontology_uri=uri).prefetch_related('anatomical_entities__region_layer__layer'))
                .union(Via.objects.filter(anatomical_entities__region_layer__region__ontology_uri=uri).prefetch_related('anatomical_entities__region_layer__region'))
                .values_list("id", flat=True)
            )
        return queryset.filter(via__in=via_ids)
    
    def filter_destination_uris(self, queryset, name, value):
        destination_uris = value
        destination_ids = Destination.objects.none()
        for uri in destination_uris:
            destination_ids = destination_ids.union(
                Destination.objects.filter(anatomical_entities__simple_entity__ontology_uri=uri).prefetch_related('anatomical_entities__simple_entity')
                .union(Destination.objects.filter(anatomical_entities__region_layer__layer__ontology_uri=uri).prefetch_related('anatomical_entities__region_layer__layer'))
                .union(Destination.objects.filter(anatomical_entities__region_layer__region__ontology_uri=uri).prefetch_related('anatomical_entities__region_layer__region'))
                .values_list("id", flat=True)
            )
        return queryset.filter(destinations__in=destination_ids)
    
    def filter_origin_uris(self, queryset, name, value):
        origin_uris = value
        origin_ids = AnatomicalEntity.objects.none()
        for uri in origin_uris:
            origin_ids = origin_ids.union(
                AnatomicalEntity.objects.filter(simple_entity__ontology_uri=uri).prefetch_related('simple_entity')
                .union(AnatomicalEntity.objects.filter(region_layer__layer__ontology_uri=uri).prefetch_related('region_layer__layer'))
                .union(AnatomicalEntity.objects.filter(region_layer__region__ontology_uri=uri).prefetch_related('region_layer__region'))
                .values_list("id", flat=True)
            )
        return queryset.filter(origins__in=origin_ids)



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
