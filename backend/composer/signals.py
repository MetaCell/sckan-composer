from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_profile(sender, instance=None, created=False, **kwargs):
    if created:
        # Create a profile for the user is the user was created
        from .models import Profile
        Profile.objects.get_or_create(user=instance)
