from django.conf import settings
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from rest_framework.authtoken.models import Token


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_auth_token(sender, instance=None, created=False, **kwargs):
    if not created:
        # delete the token on user update
        try:
            Token.objects.filter(user=instance).delete()
        except Token.DoesNotExist:
            # token doesn't exist (may be already deleted)
            pass
    # create a token if one does not exist for the user
    # the token is used to authenticate the user in the frontend
    # it will be serialized in the ProfileSerializer
    try:
        Token.objects.get(user=instance)
    except Token.DoesNotExist:
        Token.objects.create(user=instance)


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def set_at_least_one_superuser(sender, instance=None, created=False, **kwargs):
    if not instance.is_superuser:
        # if the user is not a superuser, check if there is at least one superuser that is not the admin
        num_super_users = User.objects.filter(is_superuser=True).exclude(username="admin").count()
        if num_super_users < 1:
            instance.is_superuser = True
            instance.is_staff = True
            instance.save()
