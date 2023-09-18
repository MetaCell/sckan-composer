import pytest
from django.core.exceptions import ValidationError

from composer.models import AnatomicalEntity, ConnectivityStatement


@pytest.mark.django_db
def test_forward_connection_constraint():
    origin_entity = AnatomicalEntity.objects.create(name="OriginEntity")
    destination_entity = AnatomicalEntity.objects.create(name="DestinationEntity")
    wrong_destination_entity = AnatomicalEntity.objects.create(
        name="WrongDestinationEntity"
    )

    statement = ConnectivityStatement.objects.create(
        sentence_id=1,
        origin=origin_entity,
        destination=destination_entity,
    )

    wrong_statement = ConnectivityStatement.objects.create(
        sentence_id=1,
        origin=origin_entity,
        destination=wrong_destination_entity,
    )

    with pytest.raises(ValidationError):
        statement.forward_connection.add(wrong_statement)
