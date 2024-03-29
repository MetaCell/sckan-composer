from typing import List

from django.apps import apps
from django.db import transaction
from django.db.models import Q, Count

from composer.enums import CSState
from .graph_service import generate_paths, consolidate_paths
from ..enums import SentenceState


class BaseServiceMixin:
    def __init__(self, obj):
        self.obj = obj


class OwnerServiceMixin(BaseServiceMixin):
    def is_owner(self, owner):
        return self.obj.owner == owner

    def should_set_owner(self, request):
        if self.obj.owner:
            return False
        if request.user:
            return True


class StateServiceMixin(OwnerServiceMixin):
    def _is_transition_available(self, transition, user=None):
        """
        Checks if the requested transition is available
        """
        if not user:
            available_transitions = self.obj.get_available_state_transitions()
        else:
            available_transitions = self.obj.get_available_user_state_transitions(user)

        for available_transition in available_transitions:
            if transition == available_transition.name:
                return True
        return False

    def do_transition(self, transition, user=None, by_user=None, request=None):
        # Ensure the requested transition is available
        if not by_user:
            by_user = user
        available = self._is_transition_available(transition, user)
        trans_func = getattr(self.obj, transition, None)
        if available and trans_func:
            # Run the transition
            try:
                # Attempt to pass in the request and by argument if using django-fsm-log
                trans_func(request=request, by=by_user)
            except TypeError:
                try:
                    # Attempt to pass in the by argument if using django-fsm-log
                    trans_func(by=by_user)
                except TypeError:
                    # If the function does not have a by attribute, just call with no arguments
                    trans_func()
        else:
            # new state is not available raise exception
            raise AttributeError(
                "State transition {0} is not available.".format(transition)
            )

        return self.obj


class SentenceService(StateServiceMixin):
    @transaction.atomic
    def do_transition_compose_now(self, *args, **kwargs):
        sentence = self.obj
        # when a Sentence record goes to compose_now state we need to set the state of all ConnectivityStatements to
        # compose_now
        for cs in sentence.connectivitystatement_set.all():
            if cs.state == CSState.DRAFT:
                cs.compose_now(*args, **kwargs)
                cs.save()

    @staticmethod
    def can_be_reviewed(sentence):
        # return True if the sentence can go to state to_be_reviewed
        # it should have at least one provenance (pmid, pmcid, doi) and at least one connectivity statement
        return (
                sentence.pmid is not None
                or sentence.pmcid is not None
                or sentence.doi is not None
        ) and (sentence.connectivitystatement_set.count() > 0)

    @staticmethod
    def can_be_composed(sentence):
        # return True if the sentence can go to state compose_now
        # it should at least pass the can_be_reviewed test
        # all statements related to the sentence must have knowledge_statement text and at least one provenance
        return (
            SentenceService.can_be_reviewed(sentence)
        ) and (sentence.connectivitystatement_set.annotate(num_prov=Count('provenance')).filter(
            Q(knowledge_statement__isnull=True)
            | Q(knowledge_statement__exact="")
            | Q(num_prov__lte=0)).count() == 0)

    @staticmethod
    def has_permission_to_transition_to_compose_now(sentence, user):
        # only system users can transition from OPEN to COMPOSE_NOW for the statement ingestion process
        if sentence.state == SentenceState.OPEN:
            return user.username == 'system'
        return True


class ConnectivityStatementService(StateServiceMixin):
    @staticmethod
    def compile_journey(connectivity_statement) -> List[str]:
        """
       Generates a string of descriptions of journey paths for a given connectivity statement.

       Args:
           connectivity_statement: The connectivity statement containing origins, vias, and destinations.

       Returns:
           A string with each journey path description on a new line.
       """
        # Extract origins, vias, and destinations from the connectivity statement
        Via = apps.get_model('composer', 'Via')
        Destination = apps.get_model('composer', 'Destination')

        origins = list(connectivity_statement.origins.all())

        vias = list(Via.objects.filter(connectivity_statement=connectivity_statement))
        destinations = list(Destination.objects.filter(connectivity_statement=connectivity_statement))

        # Generate all paths and then consolidate them
        all_paths = generate_paths(origins, vias, destinations)
        journey_paths = consolidate_paths(all_paths)

        # Create sentences for each journey path
        journey_descriptions = []
        for path in journey_paths:
            origin_names = path[0][0]
            destination_names = path[-1][0]
            via_names = ' via '.join([node for node, layer in path if 0 < layer < len(vias) + 1])

            if via_names:
                sentence = f"from {origin_names} to {destination_names} via {via_names}"
            else:
                sentence = f"from {origin_names} to {destination_names}"

            journey_descriptions.append(sentence)

        return journey_descriptions

    @staticmethod
    def can_be_reviewed(connectivity_statement):
        # return True if the state,emt can go to state to_be_reviewed it should have at least one provenance,
        # origin, destination, phenotype, sex, path and species
        return (
                connectivity_statement.origins.exists()
                and connectivity_statement.destinations.exists()
                and connectivity_statement.phenotype is not None
                and connectivity_statement.sex is not None
                and connectivity_statement.species.count() > 0
                and connectivity_statement.provenance_set.count() > 0
        )

    @staticmethod
    def has_permission_to_transition_to_compose_now(connectivity_statement, user):
        # if state in NPO APPROVED or EXPORTED and use is a staff user then also allow transition to compose_now
        # other users should not be able to transition to compose_now from these 2 states
        return user and (connectivity_statement.state not in (CSState.NPO_APPROVED, CSState.EXPORTED) or user.is_staff)

    @staticmethod
    def has_permission_to_transition_to_exported(connectivity_statement, user):
        # only system users can transition to EXPORTED
        return user.username == 'system'

    @staticmethod
    def has_permission_to_transition_to_invalid(connectivity_statement, user):
        # only system users can transition to INVALID
        return user.username == 'system'

    @staticmethod
    def add_important_tag(connectivity_statement):
        # when a ConnectivityStatement record goes to compose_now state and the previous
        # state is in NPO Approved or Exported then flag the CS with Tag IMPORTANT
        # if connectivity_statement.state in (CSState.NPO_APPROVED, CSState.EXPORTED):
        from composer.models import Tag
        try:
            important_tag = Tag.objects.get(tag__iexact="important")
        except Tag.DoesNotExist:
            important_tag = Tag.objects.create(tag="important")
        connectivity_statement.tags.add(important_tag)
        return connectivity_statement

    @staticmethod
    def is_valid(connectivity_statement):
        return ConnectivityStatementService.is_forward_connection_valid(connectivity_statement)

    @staticmethod
    def is_forward_connection_valid(connectivity_statement):

        if not connectivity_statement.forward_connection.exists():
            return True

        AnatomicalEntity = apps.get_model('composer', 'AnatomicalEntity')

        # Get all anatomical_entities associated with the destinations of the connectivity statement
        destination_anatomical_entities = AnatomicalEntity.objects.filter(
            destination_connection_layers__in=connectivity_statement.destinations.all())

        for forward_connection in connectivity_statement.forward_connection.all():
            # Check if any anatomical_entity associated with the destination is in the origins of the forward_connection
            if any(entity in forward_connection.origins.all() for entity in destination_anatomical_entities):
                return True
        return False
