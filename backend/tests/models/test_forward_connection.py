import pytest

from composer.models import ConnectivityStatement, AnatomicalEntity, Sentence, Destination
from composer.services.state_services import ConnectivityStatementService

@pytest.mark.django_db
def test_forward_connection_service():
    sentence = Sentence.objects.create()

    # Create origin and destination entities
    origin_entity = AnatomicalEntity.objects.create(name="OriginEntity")
    destination_entity = AnatomicalEntity.objects.create(name="DestinationEntity")
    wrong_destination_entity = AnatomicalEntity.objects.create(name="WrongDestinationEntity")

    # Create a statement
    statement = ConnectivityStatement.objects.create(sentence=sentence)

    # Associate the origin entity with the statement
    statement.origins.add(origin_entity)

    # Create a Destination instance for the statement
    destination_instance = Destination.objects.create(connectivity_statement=statement)
    destination_instance.anatomical_entities.add(destination_entity)

    # Create a forward statement
    statement_forward = ConnectivityStatement.objects.create(sentence=sentence)

    # Associate the origin entity with the forward statement
    statement_forward.origins.add(origin_entity)

    # Create a Destination instance for the forward statement
    destination_instance_forward = Destination.objects.create(connectivity_statement=statement_forward)
    destination_instance_forward.anatomical_entities.add(wrong_destination_entity)

    # Add statement_forward as forward connection to statement
    statement.forward_connection.add(statement_forward)

    # Use the service to check for validity
    if ConnectivityStatementService.is_forward_connection_valid(statement):
        pytest.fail("The forward connection should not be valid!")
    else:
        assert True, "The forward connection was signaled as invalid as expected."
