import os
import logging
import smtplib
import json
import sys
import requests
from email.message import EmailMessage

logging.basicConfig(level=logging.INFO, stream=sys.stdout)

# Read from environment
status = os.environ.get("workflow_result", "Unknown")
raw_payload = os.environ.get("payload", "{}")

print(f"[NOTIFY] Raw payload: {raw_payload}")

# Parse JSON payload
try:
    payload = json.loads(raw_payload)
except json.JSONDecodeError:
    logging.error(f"[NOTIFY] Invalid JSON payload: {raw_payload}")
    sys.exit(1)

recipient = payload.get("email", "").strip()
file_url = payload.get("file_url", "").strip()

# Validate recipient
if not recipient:
    logging.error("[NOTIFY] No valid recipient email provided in payload.")
    sys.exit(1)

# Compose base message
sender = "noreply@metacell.us"
subject = f"Composer export completed with status: {status}"

# If successful, validate file_url and include link
include_file = status.lower() == "succeeded"

if include_file:
    if not file_url:
        logging.error("[NOTIFY] file_url is required for successful workflows.")
        sys.exit(1)
    try:
        response = requests.head(file_url, allow_redirects=True, timeout=5)
        if response.status_code >= 400:
            logging.error(f"[NOTIFY] file_url responded with status code: {response.status_code}")
            sys.exit(1)
    except Exception as e:
        logging.exception(f"[NOTIFY] Error reaching file_url: {file_url}")
        sys.exit(1)

# Build the email body
body_lines = [
    f"Dear user,\n",
    f"Your composer export finished with status: {status}.\n"
]
if include_file:
    body_lines.append(f"You can download the exported file here:\n{file_url}\n")
else:
    body_lines.append("You can retry the export from the dashboard. If the issue persists, please contact us through our support channels.\n")

# Compose and send email
msg = EmailMessage()
msg["Subject"] = subject
msg["From"] = sender
msg["To"] = recipient
msg.set_content("\n".join(body_lines))

try:
    with smtplib.SMTP("mail.metacell", 587) as smtp:
        smtp.send_message(msg)
    logging.info(f"[EMAIL] Sent notification to {recipient}")
except Exception as e:
    logging.exception(f"[EMAIL] Failed to send notification to {recipient}: {e}")
    sys.exit(1)
