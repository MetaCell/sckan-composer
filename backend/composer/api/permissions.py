from rest_framework import permissions
from composer.enums import CSState
from rest_framework.exceptions import PermissionDenied
from composer.models import ConnectivityStatement, Sentence



# Permission Checks: Only staff users can update a Connectivity Statement when it is in state exported
class IsStaffUserIfExportedStateInConnectivityStatement(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if (request.method not in permissions.SAFE_METHODS) and (obj.state == CSState.EXPORTED):
            return request.user.is_staff
        return True


class IsOwnerOrAssignOwnerOrCreateOrReadOnly(permissions.BasePermission):
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

    def has_permission(self, request, view):
        # Allow authenticated users to create new objects (POST requests)
        if request.method == 'POST':
            return request.user.is_authenticated

        # Allow access for non-object-specific safe methods (e.g., listing objects via GET)
        return request.method in permissions.SAFE_METHODS

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
    

class IsSentenceOrStatementOwnerOrSystemUserOrReadOnly(permissions.BasePermission):
    """
    Custom permission to allow:
    - System user to bypass all checks.
    - Only the owner of a sentence or connectivity statement can create a note.
    """

    def has_permission(self, request, view):
        # Allow system user to bypass all checks
        if request.user.username == 'system' and request.user.is_staff:
            return True

        # Allow read-only access (GET, HEAD, OPTIONS)
        if request.method in permissions.SAFE_METHODS:
            return True

        # For POST (create), PUT, PATCH (update), or DELETE, check ownership
        return self.check_ownership(request)

    def has_object_permission(self, request, view, obj):
        # Allow system user to bypass all checks
        if request.user.username == 'system' and request.user.is_staff:
            return True

        # Allow read-only access (GET, HEAD, OPTIONS)
        if request.method in permissions.SAFE_METHODS:
            return True

        # Check ownership for unsafe methods (PUT, PATCH, DELETE)
        return self.check_ownership(request)


    def check_ownership(self, request):
        """
        Helper method to check ownership of sentence or connectivity statement.
        Raises PermissionDenied if the user is not the owner.
        """
        sentence_id = request.data.get('sentence_id')
        connectivity_statement_id = request.data.get('connectivity_statement_id')

        # Check ownership for sentence_id
        if sentence_id:
            try:
                sentence = Sentence.objects.get(id=sentence_id)
            except Sentence.DoesNotExist:
                raise PermissionDenied("Invalid sentence_id.")
            if sentence.owner != request.user:
                raise PermissionDenied("You are not the owner of this sentence.")

        # Check ownership for connectivity_statement_id
        if connectivity_statement_id:
            try:
                connectivity_statement = ConnectivityStatement.objects.get(id=connectivity_statement_id)
            except ConnectivityStatement.DoesNotExist:
                raise PermissionDenied("Invalid connectivity_statement_id.")
            if connectivity_statement.owner != request.user:
                raise PermissionDenied("You are not the owner of this connectivity statement.")
        return True