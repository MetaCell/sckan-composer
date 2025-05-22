import os
import logging
import smtplib
import json
import sys
import requests
from email.message import EmailMessage

logging.basicConfig(level=logging.INFO, stream=sys.stdout)

# === Static config ===
CONFIG = {
    "smtp_host": "mail.metacell",
    "smtp_port": 587,
    "sender_email": "noreply@metacell.us",
    "subject_template": "Composer export completed with status: {status}",
    "message_success": "You can download the exported file here:\n{file_url}\n",
    "message_failure": (
        "You can retry the export from the dashboard. "
        "If the issue persists, please contact us through our support channels.\n"
    )
}

# === Read from environment ===
status = os.environ.get("workflow_result", "Unknown")
raw_payload = os.environ.get("payload", "{}")
print(f"[NOTIFY] Raw payload: {raw_payload}")

# === Parse payload ===
try:
    payload = json.loads(raw_payload)
except json.JSONDecodeError:
    logging.error(f"[NOTIFY] Invalid JSON payload: {raw_payload}")
    sys.exit(1)

recipient = payload.get("email", "").strip()
file_url = payload.get("file_url", "").strip()

if not recipient:
    logging.error("[NOTIFY] No valid recipient email provided in payload.")
    sys.exit(1)

# === Prepare message ===
sender = CONFIG["sender_email"]
subject = CONFIG["subject_template"].format(status=status)
include_file = status.lower() == "succeeded"

# === Validate file_url ===
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

# === Compose email body ===
body_lines = [
    "Dear user,\n",
    f"Your composer export finished with status: {status}.\n"
]
if include_file:
    body_lines.append(CONFIG["message_success"].format(file_url=file_url))
else:
    body_lines.append(CONFIG["message_failure"])

# === Send email ===
msg = EmailMessage()
msg["Subject"] = subject
msg["From"] = sender
msg["To"] = recipient
msg.set_content("\n".join(body_lines))

try:
    with smtplib.SMTP(CONFIG["smtp_host"], CONFIG["smtp_port"]) as smtp:
        smtp.send_message(msg)
    logging.info(f"[EMAIL] Sent notification to {recipient}")
except Exception as e:
    logging.exception(f"[EMAIL] Failed to send notification to {recipient}: {e}")
    sys.exit(1)
