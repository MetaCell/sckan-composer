from django.db import transaction
from django.db.models import Q

from .enums import CSState, SentenceState


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

    def do_transition(self, transition, user=None, request=None):
        # Ensure the requested transition is available
        available = self._is_transition_available(transition, user)
        trans_func = getattr(self.obj, transition, None)
        if available and trans_func:
            # Run the transition
            try:
                # Attempt to pass in the request and by argument if using django-fsm-log
                trans_func(request=request, by=user)
            except TypeError:
                try:
                    # Attempt to pass in the by argument if using django-fsm-log
                    trans_func(by=user)
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
    def do_transition_compose_now(self):
        sentence = self.obj
        # when a Sentence record goes to compose_now state we need to set the state of all ConnectivityStatements to compose_now
        for cs in sentence.connectivitystatement_set.all():
            if cs.state == CSState.DRAFT:
                cs.compose_now()
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
        return SentenceService.can_be_reviewed(sentence)


class ConnectivityStatementService(StateServiceMixin):
    @staticmethod
    def compile_journey(connectivity_statement):
        origin = connectivity_statement.origin
        destination = connectivity_statement.destination
        journey = f"{origin} to {destination}"
        journey += " via ".join(str(path) for path in connectivity_statement.path.all())
        return journey.lower().capitalize()

    @staticmethod
    def can_be_reviewed(connectivity_statement):
        # return True if the state,emt can go to state to_be_reviewed
        # it should have at least one provenance (doi), origin, destination, ans division, biological sex, path and species
        return (
            connectivity_statement.origin is not None
            and connectivity_statement.destination is not None
            and connectivity_statement.ans_division is not None
            and connectivity_statement.biological_sex is not None
            and connectivity_statement.path.count() > 0
            and connectivity_statement.species_set.count() > 0
            and connectivity_statement.doi_set.count() > 0
        )
