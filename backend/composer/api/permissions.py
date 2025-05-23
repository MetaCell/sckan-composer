from rest_framework import permissions
from composer.enums import CSState
from rest_framework.exceptions import PermissionDenied
from composer.models import ConnectivityStatement, Sentence


# Permission Checks: Only staff users can update a Connectivity Statement when it is in state exported
class IsStaffUserIfExportedStateInConnectivityStatement(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if (request.method not in permissions.SAFE_METHODS) and (
            obj.state == CSState.EXPORTED
        ):
            return request.user.is_staff
        return True


class IsOwnerOrAssignOwnerOrCreateOrReadOnly(permissions.BasePermission):
    """
    Custom permission to allow only the owner to edit an object,
    but allow any authenticated user to assign themselves as owner,
    replacing the existing owner.
    """

    def has_permission(self, request, view):
        # Allow safe methods (GET, HEAD, OPTIONS) for all users
        if request.method in permissions.SAFE_METHODS:
            return True

        # If creating a new instance, ensure related entity ownership
        if request.method == "POST" and view.action == "create":
            return check_related_entity_ownership(request)

        # For unsafe methods (PATCH, PUT, DELETE), allow only authenticated users
        # Object-level permissions (e.g., ownership) are handled by has_object_permission
        return request.user.is_authenticated

    def has_object_permission(self, request, view, obj):

        # Allow read permissions (GET, HEAD, OPTIONS) to any user
        if request.method in permissions.SAFE_METHODS:
            return True

        # Allow 'assign_owner' action to any authenticated user
        if view.action == "assign_owner":
            return request.user.is_authenticated

        # Write and delete permissions (PATCH, PUT, DELETE) are only allowed to the owner
        return obj.owner == request.user


class IsOwnerOfConnectivityStatementOrReadOnly(permissions.BasePermission):
    """
    Custom permission to allow only the owner of the related ConnectivityStatement to modify.
    """

    def has_permission(self, request, view):
        # Allow safe methods (GET, HEAD, OPTIONS) for all users
        if request.method in permissions.SAFE_METHODS:
            return True

        # If creating a new instance, ensure related entity ownership
        if request.method == "POST" and view.action == "create":
            return check_related_entity_ownership(request)

        # For unsafe methods (PATCH, PUT, DELETE), allow only authenticated users
        # Object-level permissions (e.g., ownership) are handled by has_object_permission
        return request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to the owner of the related ConnectivityStatement
        return obj.connectivity_statement.owner == request.user


def check_related_entity_ownership(request):
    """
    Helper method to check ownership of sentence or connectivity statement.
    Raises PermissionDenied if the user is not the owner.
    """
    sentence_id = request.data.get("sentence_id")
    connectivity_statement_id = request.data.get("connectivity_statement_id")

    # Check ownership for sentence_id
    if sentence_id:
        try:
            sentence = Sentence.objects.get(id=sentence_id)
        except Sentence.DoesNotExist:
            raise PermissionDenied()
        if sentence.owner != request.user:
            raise PermissionDenied()

    # Check ownership for connectivity_statement_id
    if connectivity_statement_id:
        try:
            connectivity_statement = ConnectivityStatement.objects.get(
                id=connectivity_statement_id
            )
        except ConnectivityStatement.DoesNotExist:
            raise PermissionDenied()
        if connectivity_statement.owner != request.user:
            raise PermissionDenied()

    return True
