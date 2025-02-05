from django.apps import apps
from django.contrib.auth.models import User
from django.db import transaction
from django.db.models import Q, Count

from composer.enums import CSState
from ..enums import SentenceState


class BaseServiceMixin:
    def __init__(self, obj):
        self.obj = obj


class OwnerServiceMixin(BaseServiceMixin):
    def is_owner(self, owner):
        return self.obj.owner == owner

    def can_assign_owner(self, request):
        return bool(request.user)

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


class SentenceStateService(StateServiceMixin):
    @transaction.atomic
    def do_transition_compose_now(self, *args, **kwargs):
        sentence = self.obj
        # when a Sentence record goes to compose_now state we need to set the state of all ConnectivityStatements to
        # compose_now
        for cs in sentence.connectivitystatement_set.all():
            if cs.state == CSState.DRAFT:
                cs.compose_now(*args, **kwargs)
                cs.owner = None
                cs.save(update_fields=["state", "owner"])

    @staticmethod
    def can_be_reviewed(sentence):
        # return True if the sentence can go to state needs_further_review
        # it should have at least one provenance (pmid, pmcid, doi) and at least one connectivity statement
        return (
                sentence.pmid is not None
                or sentence.pmcid is not None
                or sentence.doi is not None
        ) and (sentence.connectivitystatement_set.count() > 0)

    @staticmethod
    def has_permission_to_transition_to_needs_further_review(instance, user) -> bool:
        profile = get_user_profile(user=user)
        return (profile.is_triage_operator
                or profile.is_reviewer and instance.state == SentenceState.READY_TO_COMPOSE) or user.is_staff

    @staticmethod
    def has_permission_to_transition_to_compose_later(instance, user) -> bool:
        profile = get_user_profile(user=user)
        return (profile.is_triage_operator or
                profile.is_reviewer and instance.state == SentenceState.NEEDS_FURTHER_REVIEW) or user.is_staff


    @staticmethod
    def has_permission_to_transition_to_ready_to_compose(instance, user) -> bool:
        profile = get_user_profile(user=user)
        if profile.is_triage_operator and instance.state == SentenceState.COMPOSE_LATER:
            return True

        if profile.is_reviewer and instance.state in [SentenceState.OPEN, SentenceState.NEEDS_FURTHER_REVIEW]:
            return True

        return user.is_staff


    @staticmethod
    def can_be_composed(sentence) -> bool:
        # return True if the sentence can go to state compose_now
        # it should at least pass the can_be_reviewed test
        # all statements related to the sentence must have knowledge_statement text and at least one provenance
        return (
            SentenceStateService.can_be_reviewed(sentence)
        ) and (sentence.connectivitystatement_set.annotate(num_prov=Count('provenance')).filter(
            Q(knowledge_statement__isnull=True)
            | Q(knowledge_statement__exact="")
            | Q(num_prov__lte=0)).count() == 0)

    @staticmethod
    def has_permission_to_transition_to_compose_now(sentence, user) -> bool:
        profile = get_user_profile(user=user)
        return profile.is_reviewer or profile.is_triage_operator or user.is_staff

    @staticmethod
    def has_permission_to_transition_to_completed(sentence, user) -> bool:
        profile = get_user_profile(user=user)
        return profile.is_reviewer or profile.is_triage_operator or user.is_staff

    @staticmethod
    def has_permission_to_transition_to_excluded(sentence, user) -> bool:
        profile = get_user_profile(user=user)
        return profile.is_reviewer or profile.is_triage_operator or user.is_staff


class ConnectivityStatementStateService(StateServiceMixin):

    @staticmethod
    def has_permission_to_transition_to_compose_now(connectivity_statement, user) -> bool:
        if is_system_user(user) and connectivity_statement.state == CSState.DRAFT:
            return True

        profile = get_user_profile(user=user)
        if profile.is_curator and connectivity_statement.state in [CSState.INVALID, CSState.IN_PROGRESS]:
            return True

        return user.is_staff

    @staticmethod
    def has_permission_to_transition_to_in_progress(connectivity_statement, user) -> bool:
        if is_system_user(user):
            return False

        profile = get_user_profile(user=user)
        if profile.is_curator and connectivity_statement.state in [CSState.COMPOSE_NOW, CSState.REVISE]:
            return True

        if profile.is_reviewer and connectivity_statement.state == CSState.TO_BE_REVIEWED:
            return True

        return user.is_staff

    @staticmethod
    def can_be_reviewed(connectivity_statement):
        # return True if the statememt can go to state to_be_reviewed it should have at least one provenance,
        # origin, destination, phenotype, sex, path and species
        return (
                connectivity_statement.origins.exists()
                and connectivity_statement.destinations.exists()
                and connectivity_statement.provenance_set.count() > 0
        )

    @staticmethod
    def has_permission_to_transition_to_to_be_reviewed(connectivity_statement, user) -> bool:

        if is_system_user(user):
            return False

        profile = get_user_profile(user=user)
        if profile.is_curator and connectivity_statement.state == CSState.IN_PROGRESS:
            return True

        if profile.is_reviewer and connectivity_statement.state == CSState.REJECTED:
            return True

        return user.is_staff

    @staticmethod
    def has_permission_to_transition_to_rejected(connectivity_statement, user) -> bool:
        if is_system_user(user):
            return False

        profile = get_user_profile(user=user)
        return profile.is_reviewer or user.is_staff

    @staticmethod
    def has_permission_to_transition_to_revise(connectivity_statement, user) -> bool:
        if is_system_user(user):
            return False

        profile = get_user_profile(user=user)
        return profile.is_reviewer or user.is_staff

    @staticmethod
    def has_permission_to_transition_to_npo_approval(connectivity_statement, user) -> bool:
        if is_system_user(user):
            return False
        profile = get_user_profile(user=user)
        return profile.is_reviewer or user.is_staff

    @staticmethod
    def has_permission_to_transition_to_exported(connectivity_statement, user) -> bool:
        return is_system_user(user)

    @staticmethod
    def has_permission_to_transition_to_invalid(connectivity_statement, user) -> bool:
        return is_system_user(user)

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
        return ConnectivityStatementStateService.is_forward_connection_valid(connectivity_statement)

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

    @staticmethod
    def has_populationset(connectivity_statement) -> bool:
        return connectivity_statement.population is not None


def is_system_user(user: User) -> bool:
    return user.username == 'system'


def get_user_profile(user):
    from composer.models import Profile
    return Profile.objects.get(user=user)
