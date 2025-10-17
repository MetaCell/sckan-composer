"""
Utility functions for ingestion workflow file management.
"""
import os
from datetime import datetime
from composer.constants import INGESTION_UPLOADS_DIR, INGESTION_TEMP_DIR


def get_ingestion_timestamp() -> str:
    """
    Generate a timestamp string for ingestion file naming.
    Format: YYYY-MM-DD_HH-MM-SS
    
    Returns:
        str: Timestamp string
    """
    return datetime.now().strftime("%Y-%m-%d_%H-%M-%S")


def get_timestamped_population_filename(original_filename: str, timestamp: str) -> str:
    """
    Generate a timestamped filename for a population file.
    
    Args:
        original_filename: The original uploaded filename (e.g., "populations.txt")
        timestamp: Timestamp string from get_ingestion_timestamp()
    
    Returns:
        str: Full path to the timestamped population file
        
    Example:
        get_timestamped_population_filename("pop.txt", "2025-01-15_10-30-45")
        -> "/path/to/media/ingestion_uploads/pop_2025-01-15_10-30-45.txt"
    """
    # Split filename into base and extension
    name_parts = os.path.splitext(original_filename)
    base_name = name_parts[0]
    extension = name_parts[1] if len(name_parts) > 1 else ''
    
    # Create timestamped filename
    timestamped_filename = f"{base_name}_{timestamp}{extension}"
    
    # Return full path (INGESTION_UPLOADS_DIR already contains full path)
    return os.path.join(INGESTION_UPLOADS_DIR, timestamped_filename)


def get_ingestion_temp_file_paths(timestamp: str) -> dict:
    """
    Generate all temporary file paths for an ingestion workflow.
    
    Args:
        timestamp: Timestamp string from get_ingestion_timestamp()
    
    Returns:
        dict: Dictionary containing paths for all temporary files
    """
    # INGESTION_TEMP_DIR already contains full path
    return {
        'composer_data': os.path.join(INGESTION_TEMP_DIR, f"composer_data_{timestamp}.json"),
        'intermediate': os.path.join(INGESTION_TEMP_DIR, f"statements_{timestamp}.json"),
        'anomalies_log': os.path.join(INGESTION_TEMP_DIR, f"anomalies_{timestamp}.json"),
    }
