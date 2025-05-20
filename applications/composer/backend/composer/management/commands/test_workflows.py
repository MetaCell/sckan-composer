import os
from datetime import datetime
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User


class Command(BaseCommand):
    help = "Test write permissions inside the workflow pod"

    def add_arguments(self, parser):
        parser.add_argument('--username', type=str, required=True, help="Username for file naming")
        parser.add_argument('--folder', type=str, required=True, help="Path to write the test file")

    def handle(self, *args, **options):
        username = options['username']
        folder = options['folder']

        timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        filename = f"workflow_test_{username}_{timestamp}.txt"
        file_path = os.path.join(folder, filename)

        message = f"This file was created by a test workflow for user '{username}' at {timestamp}.\n"
        with open(file_path, 'w') as f:
            f.write(message)

        self.stdout.write(self.style.SUCCESS(f"Test file created at: {file_path}"))
