#!/bin/bash
# Script to set up a daily cron job for cleaning up old ingestion files
# This script is idempotent - it only adds the cron job if it doesn't exist

set -e

# Configuration
CRON_COMMAND="cd /app && python manage.py cleanup_old_files --days 30"
CRON_SCHEDULE="0 2 * * *"  # Run at 2 AM every day
CRON_JOB="$CRON_SCHEDULE $CRON_COMMAND"

echo "Setting up daily cleanup cron job..."

# Check if cron is installed
if ! command -v crontab &> /dev/null; then
    echo "ERROR: crontab command not found. Please install cron."
    exit 1
fi

# Get current crontab
CURRENT_CRONTAB=$(crontab -l 2>/dev/null || echo "")

# Check if the job already exists
if echo "$CURRENT_CRONTAB" | grep -F "cleanup_old_files" > /dev/null; then
    echo "Cleanup cron job already exists. Skipping..."
    echo "Current entry:"
    echo "$CURRENT_CRONTAB" | grep -F "cleanup_old_files"
else
    # Add the new cron job
    (echo "$CURRENT_CRONTAB"; echo "$CRON_JOB") | crontab -
    echo "Successfully added cleanup cron job:"
    echo "$CRON_JOB"
fi

echo ""
echo "Current crontab:"
crontab -l

echo ""
echo "Setup complete!"
