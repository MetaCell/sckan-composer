"""
Configuration constants for the composer application.
"""
import os
from django.conf import settings


def _get_media_path(*paths):
    """Helper to construct paths relative to MEDIA_ROOT"""
    return os.path.join(settings.MEDIA_ROOT, *paths)


# Directory paths for file uploads (full paths in MEDIA_ROOT)
INGESTION_UPLOADS_DIR = _get_media_path("ingestion_uploads")
INGESTION_TEMP_DIR = _get_media_path("ingestion_temp")

# Log file paths for ingestion (full paths in MEDIA_ROOT)
INGESTION_ANOMALIES_LOG_PATH = _get_media_path("ingestion_anomalies_log.csv")
INGESTION_INGESTED_LOG_PATH = _get_media_path("ingested_log.csv")

# Cleanup settings
DEFAULT_CLEANUP_DAYS = 30
