from rest_framework import permissions
from composer.enums import CSState


# Permission Checks: Only staff users can update a Connectivity Statement when it is in state exported
class IsStaffUserIfExportedStateInConnectivityStatement(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if (request.method not in permissions.SAFE_METHODS) and (obj.state == CSState.EXPORTED):
            return request.user.is_staff
        return True


class IsOwnerOrAssignOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to allow only the owner to edit an object,
    but allow any authenticated user to assign themselves as owner,
    replacing the existing owner.
    """

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True

        # Allow 'assign_owner' action to any authenticated user
        if view.action == 'assign_owner':
            return request.user.is_authenticated

        # Write permissions are only allowed to the owner
        return obj.owner == request.user


class IsOwnerOfConnectivityStatementOrReadOnly(permissions.BasePermission):
    """
    Custom permission to allow only the owner of the related ConnectivityStatement to modify.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to the owner of the related ConnectivityStatement
        return obj.connectivity_statement.owner == request.user