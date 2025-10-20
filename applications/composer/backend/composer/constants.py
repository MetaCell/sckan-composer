"""
Configuration constants for the composer application.
"""
import os
from django.conf import settings


def _get_media_path(*paths):
    """Helper to construct paths relative to MEDIA_ROOT"""
    return os.path.join(settings.MEDIA_ROOT, *paths)


# Base directory for all ingestion-related files
INGESTION_BASE_DIR = _get_media_path("ingestion")

# Directory for temporary files (cleaned up periodically by cleanup_old_files command)
INGESTION_TEMP_DIR = os.path.join(INGESTION_BASE_DIR, "ingestion_temp")

# Log file paths for ingestion (persistent files available via IngestionLogFileView)
INGESTION_ANOMALIES_LOG_PATH = os.path.join(INGESTION_BASE_DIR, "ingestion_anomalies_log.csv")
INGESTION_INGESTED_LOG_PATH = os.path.join(INGESTION_BASE_DIR, "ingested_log.csv")

# Cleanup settings
DEFAULT_CLEANUP_DAYS = 30
