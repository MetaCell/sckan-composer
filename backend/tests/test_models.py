import pytest

from composer.models import ConnectivityStatement, AnatomicalEntity, Sentence
from composer.services.state_services import ConnectivityStatementService


@pytest.mark.django_db
def test_forward_connection_service():
    sentence = Sentence.objects.create()
    origin_entity = AnatomicalEntity.objects.create(name="OriginEntity")
    destination_entity = AnatomicalEntity.objects.create(name="DestinationEntity")
    wrong_destination_entity = AnatomicalEntity.objects.create(
        name="WrongDestinationEntity"
    )

    statement = ConnectivityStatement.objects.create(
        sentence=sentence,
        origin=origin_entity,
        destination=destination_entity,
    )

    statement_forward = ConnectivityStatement.objects.create(
        sentence=sentence,
        origin=origin_entity,
        destination=wrong_destination_entity,
    )

    # Add statement_forward as forward connection to statement
    statement.forward_connection.add(statement_forward)

    # Use the service to check for validity
    if ConnectivityStatementService.is_forward_connection_valid(statement):
        pytest.fail("The forward connection should not be valid!")
    else:
        assert True, "The forward connection was signaled as invalid as expected."
