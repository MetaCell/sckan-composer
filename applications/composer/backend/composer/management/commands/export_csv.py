import os
from datetime import datetime
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User

from composer.enums import CSState
from composer.services.export.export_services import export_connectivity_statements
from composer.models import ConnectivityStatement


class Command(BaseCommand):
    help = "Export statements to CSV file"

    def add_arguments(self, parser):
        parser.add_argument('--user_id', type=str, required=True, help="The user to register this export batch to")
        parser.add_argument('--filepath', type=str, required=True, help="Path to write the csv file")

    def handle(self, *args, **options):
        user_id = options['user_id']
        file_path = options['filepath']
        
        os.makedirs(os.path.dirname(file_path), exist_ok=True)

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            self.stderr.write(self.style.ERROR(f"User with id '{user_id}' does not exist."))
            return

        # Return if user is not staff
        if not user.is_staff:   
            self.stderr.write(self.style.ERROR(f"User with id '{user_id}' is not a staff member."))
            return

        qs = ConnectivityStatement.objects.filter(state=CSState.NPO_APPROVED)
        file_path, _ = export_connectivity_statements(qs=qs, user=user, output_path=file_path)
        
        self.stdout.write(self.style.SUCCESS(f"Export CSV file created at: {file_path}"))
