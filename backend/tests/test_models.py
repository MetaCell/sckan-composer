import pytest

from composer.models import ConnectivityStatement, AnatomicalEntity, Sentence
from composer.services.state_services import ConnectivityStatementService


@pytest.mark.django_db
def test_forward_connection_service():
    sentence = Sentence.objects.create()

    # Create origin and destination entities
    origin_entity = AnatomicalEntity.objects.create(name="OriginEntity")
    destination_entity = AnatomicalEntity.objects.create(name="DestinationEntity")
    wrong_destination_entity = AnatomicalEntity.objects.create(name="WrongDestinationEntity")

    # Create a statement and associate the origin and destination entities
    statement = ConnectivityStatement.objects.create(sentence=sentence, destination=destination_entity)
    statement.origins.add(origin_entity)

    # Create a forward statement
    statement_forward = ConnectivityStatement.objects.create(sentence=sentence, destination=wrong_destination_entity)
    statement_forward.origins.add(origin_entity)

    # Add statement_forward as forward connection to statement
    statement.forward_connection.add(statement_forward)

    # Use the service to check for validity
    if ConnectivityStatementService.is_forward_connection_valid(statement):
        pytest.fail("The forward connection should not be valid!")
    else:
        assert True, "The forward connection was signaled as invalid as expected."
