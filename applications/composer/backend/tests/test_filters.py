import pytest
from django.test import RequestFactory

from composer.api.filtersets import ConnectivityStatementFilter
from composer.models import Sentence, ConnectivityStatement

@pytest.mark.django_db
def test_sentence_id_filter():
    # Create some test data
    sentence1 = Sentence.objects.create(title="Sentence 1")
    sentence2 = Sentence.objects.create(title="Sentence 2")

    ConnectivityStatement.objects.create(sentence=sentence1)
    ConnectivityStatement.objects.create(sentence=sentence2)

    factory = RequestFactory()

    # Test filtering for ConnectivityStatement with sentence1's id
    request = factory.get("/", {"sentence_id": sentence1.id})
    qs = ConnectivityStatement.objects.all()
    filtered = ConnectivityStatementFilter(request.GET, queryset=qs).qs
    assert len(filtered) == 1
    assert filtered.first().sentence == sentence1

    # Test filtering for ConnectivityStatement NOT with sentence1's id
    request = factory.get("/", {"exclude_sentence_id": sentence1.id})
    qs = ConnectivityStatement.objects.all()
    filtered = ConnectivityStatementFilter(request.GET, queryset=qs).qs
    assert len(filtered) == 1
    assert filtered.first().sentence == sentence2
