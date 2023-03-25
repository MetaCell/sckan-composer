import csv
import datetime
from django.core.management.base import BaseCommand

from composer.models import ConnectivityStatement
from composer.services.export_services import generate_csv_attributes_mapping, get_rows


class Command(BaseCommand):
    help = 'Export queryset to CSV file'

    def handle(self, *args, **options):
        qs = ConnectivityStatement.objects.all()
        now = datetime.datetime.now()
        filename = f'export_{now.strftime("%Y-%m-%d_%H-%M-%S")}.csv'
        csv_attributes_mapping = generate_csv_attributes_mapping()

        with open(filename, 'w', newline='') as csvfile:
            writer = csv.writer(csvfile)

            # Write header row
            headers = csv_attributes_mapping.keys()
            writer.writerow(headers)

            # Write data rows
            for obj in qs:
                rows = get_rows(obj)
                for row in rows:
                    row_content = []
                    for key in csv_attributes_mapping:
                        row_content.append(csv_attributes_mapping[key](obj, row))
                    writer.writerow(row_content)

