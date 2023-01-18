from typing import List

import django_filters
from django.db.models import Q
from composer.models import Sentence, ConnectivityStatement


def iin(queryset, key: str, value: List):
    lookup = Q()
    for v in value:
        lookup |= Q(**{f"{key}__iexact": v})
    return queryset.filter(lookup)


class SentenceFilter(django_filters.FilterSet):
    title = django_filters.CharFilter(lookup_expr='icontains')
    state = django_filters.BaseCSVFilter(
        field_name='state',
        method=iin,
    )
    tags = django_filters.BaseCSVFilter(
        field_name='tags__tag',
        method=iin,
    )

    class Meta:
        model = Sentence
        fields = []


class ConnectivityStatementFilter(django_filters.FilterSet):
    knowledge_statement = django_filters.CharFilter(lookup_expr='icontains')
    state = django_filters.BaseCSVFilter(
        field_name='state',
        method=iin,
    )
    tags = django_filters.BaseCSVFilter(
        field_name='tags__tag',
        method=iin,
    )
    origin = django_filters.CharFilter(field_name='origin__name', lookup_expr='iexact')
    destination = django_filters.CharFilter(field_name='destination__name', lookup_expr='iexact')

    class Meta:
        model = ConnectivityStatement
        fields = []
