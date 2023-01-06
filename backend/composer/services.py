from django.db import transaction

from .enums import CSState


class StateServiceMixin:
    def __init__(self, obj):
        self.obj = obj

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
            raise AttributeError("State transition {0} is not available.".format(transition))

        return self.obj


class ProvenanceStatementService(StateServiceMixin):

    @staticmethod
    @transaction.atomic
    def do_transition_compose_now(provenance):
        # when a Provenance record goes to compose_now state we need to set the state of all ConnectivityStatements to compose_now
        for cs in provenance.connectivitystatement_set.all():
            if cs.state == CSState.DRAFT:
                cs.compose_now()
                cs.save()


class ConnectivityStatementService(StateServiceMixin):
    ...
