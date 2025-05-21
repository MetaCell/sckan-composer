import os
from datetime import datetime
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User


class Command(BaseCommand):
    help = "Test write permissions inside the workflow pod"

    def add_arguments(self, parser):
        parser.add_argument('--user_id', type=str, required=True, help="The user to register this export batch to")
        parser.add_argument('--filepath', type=str, required=True, help="Path to write the csv file")

    def handle(self, *args, **options):
        user_id = options['user_id']
        file_path = options['filepath']

        message = f"This file was created by a test workflow for user '{user_id}'.\n"
        with open(file_path, 'w') as f:
            f.write(message)

        self.stdout.write(self.style.SUCCESS(f"Test file created at: {file_path}"))
