import csv
import datetime
import logging
import os

from django.core.management.base import BaseCommand

from backend.settings import EXPORT_FOLDER
from composer.exceptions import UnexportableConnectivityStatement
from composer.services.export_services import (
    generate_csv_attributes_mapping,
    get_rows,
    get_connectivity_statements_to_export,
)
from composer.services.filesystem_service import create_dir_if_not_exists


class Command(BaseCommand):
    help = "Export queryset to CSV file"

    def add_arguments(self, parser):
        parser.add_argument(
            "--folder", type=str, help="Folder to store CSV file", default=EXPORT_FOLDER
        )

    def handle(self, *args, **options):
        qs = get_connectivity_statements_to_export()

        now = datetime.datetime.now()
        filename = f'export_{now.strftime("%Y-%m-%d_%H-%M-%S")}.csv'
        folder = options.get("folder")
        filepath = os.path.join(folder, filename)
        create_dir_if_not_exists(folder)

        csv_attributes_mapping = generate_csv_attributes_mapping()

        with open(filepath, "w", newline="") as csvfile:
            writer = csv.writer(csvfile)

            # Write header row
            headers = csv_attributes_mapping.keys()
            writer.writerow(headers)

            # Write data rows
            for obj in qs:
                try:
                    rows = get_rows(obj)
                except UnexportableConnectivityStatement as e:
                    logging.warning(
                        f"Connectivity Statement with id {obj.id} skipped due to {e}"
                    )
                    continue
                for row in rows:
                    row_content = []
                    for key in csv_attributes_mapping:
                        row_content.append(csv_attributes_mapping[key](obj, row))
                    writer.writerow(row_content)
