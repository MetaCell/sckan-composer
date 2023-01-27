# Generated by Django 4.1.4 on 2023-01-11 16:59
import os

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("composer", "0001_initial"),
    ]

    def generate_superuser(apps, schema_editor):
        from django.contrib.auth.models import User

        DJANGO_SU_NAME = os.environ.get("DJANGO_SU_NAME")
        DJANGO_SU_EMAIL = os.environ.get("DJANGO_SU_EMAIL")
        DJANGO_SU_PASSWORD = os.environ.get("DJANGO_SU_PASSWORD")

        superuser = User.objects.create_superuser(
            username="admin",
            email="admin@metacell.us",
            password="admin",
            first_name="Admin",
            last_name="Admin",
        )

        superuser.save()

    operations = [
        migrations.RunPython(generate_superuser),
    ]
