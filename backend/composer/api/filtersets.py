import django_filters

from composer.enums import SentenceState, CSState
from composer.models import Sentence, ConnectivityStatement, AnatomicalEntity


def field_has_content(queryset, name, value):
    lookup = '__'.join([name, 'isnull'])
    return queryset.filter(**{lookup: not value})


class SentenceFilter(django_filters.FilterSet):
    title = django_filters.CharFilter(field_name='title', lookup_expr='icontains')
    state = django_filters.MultipleChoiceFilter(
        field_name='state',
        choices=SentenceState.choices
    )
    tags = django_filters.BaseCSVFilter(
        field_name='tags',
        lookup_expr='in',
    )
    notes = django_filters.BooleanFilter(field_name='notes', label='Checks if entity has notes',
                                         method=field_has_content)

    ordering = django_filters.OrderingFilter(
        fields=(
            ('pmid', 'pmid'),
            ('modified_date', 'last_edited'),
        ),
    )

    class Meta:
        model = Sentence
        fields = []


class ConnectivityStatementFilter(django_filters.FilterSet):
    knowledge_statement = django_filters.CharFilter(field_name='knowledge_statement', lookup_expr='icontains')
    state = django_filters.MultipleChoiceFilter(
        field_name='state',
        choices=CSState.choices
    )
    tags = django_filters.BaseCSVFilter(
        field_name='tags',
        lookup_expr='in',
    )
    origin = django_filters.CharFilter(field_name='origin_id', lookup_expr='exact')
    destination = django_filters.CharFilter(field_name='destination_id', lookup_expr='exact')
    notes = django_filters.BooleanFilter(field_name='notes', label='Checks if entity has notes',
                                         method=field_has_content)
    ordering = django_filters.OrderingFilter(
        fields=(
            ('sentence__pmid', 'pmid'),
            ('modified_date', 'last_edited'),
        ),
    )

    class Meta:
        model = ConnectivityStatement
        fields = []


class AnatomicalEntityFilter(django_filters.FilterSet):
    name = django_filters.CharFilter(field_name='name', lookup_expr='icontains')

    class Meta:
        model = AnatomicalEntity
        fields = []
