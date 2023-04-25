from django.db import transaction

from composer.enums import CSState


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
        return SentenceService.can_be_reviewed(sentence)


class ConnectivityStatementService(StateServiceMixin):
    @staticmethod
    def compile_journey(connectivity_statement):
        origin = connectivity_statement.origin
        destination = connectivity_statement.destination
        journey = f"{origin} to {destination} via "
        journey += " via ".join(str(path) for path in connectivity_statement.path.order_by('via'))
        return journey

    @staticmethod
    def can_be_reviewed(connectivity_statement):
        # return True if the state,emt can go to state to_be_reviewed it should have at least one provenance,
        # origin, destination, phenotype, sex, path and species
        return (
            connectivity_statement.origin is not None
            and connectivity_statement.destination is not None
            and connectivity_statement.phenotype is not None
            and connectivity_statement.sex is not None
            and connectivity_statement.path.count() > 0
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
