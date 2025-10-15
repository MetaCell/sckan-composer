import os
import time
from datetime import datetime, timedelta
from django.core.management.base import BaseCommand
from django.conf import settings
from composer.constants import INGESTION_UPLOADS_DIR, INGESTION_TEMP_DIR, DEFAULT_CLEANUP_DAYS


class Command(BaseCommand):
    help = "Cleans up old uploaded files and temporary ingestion files"

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=DEFAULT_CLEANUP_DAYS,
            help=f'Delete files older than this many days (default: {DEFAULT_CLEANUP_DAYS})',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deleted without actually deleting',
        )

    def handle(self, *args, **options):
        days = options['days']
        dry_run = options['dry_run']
        
        if dry_run:
            self.stdout.write(self.style.WARNING(f"DRY RUN MODE: No files will be deleted"))
        
        self.stdout.write(f"Cleaning up files older than {days} days...")
        
        # Calculate cutoff time
        cutoff_time = time.time() - (days * 24 * 60 * 60)
        cutoff_date = datetime.fromtimestamp(cutoff_time).strftime('%Y-%m-%d %H:%M:%S')
        self.stdout.write(f"Cutoff date: {cutoff_date}")
        
        # Directories to clean
        directories = [
            os.path.join(settings.MEDIA_ROOT, INGESTION_UPLOADS_DIR),
            os.path.join(settings.MEDIA_ROOT, INGESTION_TEMP_DIR),
        ]
        
        total_deleted = 0
        total_size = 0
        
        for directory in directories:
            if not os.path.exists(directory):
                self.stdout.write(f"Directory does not exist: {directory}")
                continue
            
            self.stdout.write(f"\nScanning directory: {directory}")
            deleted_count, deleted_size = self._clean_directory(directory, cutoff_time, dry_run)
            total_deleted += deleted_count
            total_size += deleted_size
        
        size_mb = total_size / (1024 * 1024)
        
        if dry_run:
            self.stdout.write(self.style.SUCCESS(
                f"\nDRY RUN: Would delete {total_deleted} file(s), freeing {size_mb:.2f} MB"
            ))
        else:
            self.stdout.write(self.style.SUCCESS(
                f"\nDeleted {total_deleted} file(s), freed {size_mb:.2f} MB"
            ))

    def _clean_directory(self, directory, cutoff_time, dry_run):
        """Clean files in a directory that are older than cutoff_time"""
        deleted_count = 0
        deleted_size = 0
        
        try:
            for filename in os.listdir(directory):
                filepath = os.path.join(directory, filename)
                
                # Skip if not a file
                if not os.path.isfile(filepath):
                    continue
                
                # Check file age
                file_mtime = os.path.getmtime(filepath)
                if file_mtime < cutoff_time:
                    file_size = os.path.getsize(filepath)
                    file_date = datetime.fromtimestamp(file_mtime).strftime('%Y-%m-%d %H:%M:%S')
                    
                    if dry_run:
                        self.stdout.write(f"  Would delete: {filename} ({file_date}, {file_size} bytes)")
                    else:
                        try:
                            os.remove(filepath)
                            self.stdout.write(f"  Deleted: {filename} ({file_date}, {file_size} bytes)")
                        except Exception as e:
                            self.stderr.write(f"  Error deleting {filename}: {e}")
                            continue
                    
                    deleted_count += 1
                    deleted_size += file_size
        
        except Exception as e:
            self.stderr.write(f"Error scanning directory {directory}: {e}")
        
        return deleted_count, deleted_size
