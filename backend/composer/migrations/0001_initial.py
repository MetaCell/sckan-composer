import os

from django.db import migrations


class Migration(migrations.Migration):
    def generate_superuser(apps, schema_editor):
        from django.contrib.auth.models import User

        DJANGO_SU_NAME = os.environ.get("DJANGO_SU_NAME")
        DJANGO_SU_EMAIL = os.environ.get("DJANGO_SU_EMAIL")
        DJANGO_SU_PASSWORD = os.environ.get("DJANGO_SU_PASSWORD")

        superuser = User.objects.create_superuser(
            username="admin", email="admin@metacell.us", password="admin"
        )

        superuser.save()

    operations = [
        migrations.RunPython(generate_superuser),
    ]
