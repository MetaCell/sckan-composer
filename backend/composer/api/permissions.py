from rest_framework import permissions
from composer.enums import CSState

# Permission Checks: Only staff users can update a Connectivity Statement when it is in state exported
class IsStaffUserIfExportedStateInConnectivityStatement(permissions.BasePermission):
	def has_object_permission(self, request, view, obj):
		if request.method in permissions.SAFE_METHODS:
			return True
		else:
			if obj.state == CSState.EXPORTED:
				return request.user.is_staff
			else:
				return True