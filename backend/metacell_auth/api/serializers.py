from django.contrib.auth.models import User
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers


# serializers
class LoginSerializer(serializers.Serializer):
    status_code = serializers.IntegerField()
    message = serializers.CharField(required=False)
    redirect_url = serializers.CharField(required=False)


class LogoutSerializer(serializers.Serializer):
    status_code = serializers.IntegerField()
    message = serializers.CharField(required=False)
    redirect_url = serializers.CharField(required=False)
