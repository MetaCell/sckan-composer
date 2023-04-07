from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import ExportBatch
from .services.export_services import compute_metrics


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_profile(sender, instance=None, created=False, **kwargs):
    if created:
        # Create a profile for the user is the user was created
        from .models import Profile

        Profile.objects.get_or_create(user=instance)


@receiver(post_save, sender=ExportBatch)
def export_batch_post_save(sender, instance=None, created=False, **kwargs):
    if created and instance:
        # Compute the statistics for the export batch
        compute_metrics(instance)
