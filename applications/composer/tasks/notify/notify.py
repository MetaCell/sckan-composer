import os
import logging
import smtplib
import json
import sys
import time
import requests
from email.message import EmailMessage

logging.basicConfig(level=logging.DEBUG, stream=sys.stdout,
                    format='[NOTIFY] %(asctime)s %(levelname)s %(message)s')
logging.debug("Starting notify service")

# === Static config ===
CONFIG = {
    "smtp_host": "mail.metacell",
    "smtp_port": 587,
    "export": {
        "subject_template": "Composer export completed with status: {status}",
        "message_success": "You can download the exported file here:\n{file_url}\n",
        "message_failure": (
            "You can retry the export from the dashboard. "
            "If the issue persists, please contact us through our support channels.\n"
        )
    },
    "ingestion": {
        "subject_template": "Composer connectivity statements ingestion completed with status: {status}",
        "message_success": "The connectivity statements have been successfully ingested into the database.\n",
        "message_failure": (
            "You can retry the ingestion from the dashboard. "
            "If the issue persists, please contact us through our support channels.\n"
        )
    }
}

# === Read from environment ===
status = os.environ.get("workflow_result", "Unknown")
raw_payload = os.environ.get("payload", "{}")
logging.debug(f"Raw payload env value: {raw_payload}")

# === Parse payload ===
try:
    payload = json.loads(raw_payload)
    logging.debug(f"Parsed payload: {payload}")
except json.JSONDecodeError:
    logging.error(f"[NOTIFY] Invalid JSON payload: {raw_payload}")
    sys.exit(1)

recipient = payload.get("to_email", "").strip()
workflow_type = payload.get("type", "export").strip()  # 'export' or 'ingestion'
file_url = payload.get("file_url", "").strip()
sender_email = payload.get("from_email", "").strip()
logging.debug(f"recipient={recipient} workflow_type={workflow_type} file_url={file_url} sender_email={sender_email}")

if not recipient:
    logging.error("No valid recipient email provided in payload.")
    sys.exit(1)

if not sender_email:
    logging.error("No valid sender email provided in payload.")
    sys.exit(1)

if workflow_type not in CONFIG:
    logging.error(f"Unknown workflow type: {workflow_type}")
    sys.exit(1)
logging.debug("Basic payload validation passed")

# === Get configuration for workflow type ===
workflow_config = CONFIG[workflow_type]
logging.debug(f"Loaded workflow_config keys: {list(workflow_config.keys())}")

# === Prepare message ===
sender = sender_email
subject = workflow_config["subject_template"].format(status=status)
include_file = status.lower() == "succeeded" and file_url
logging.debug(f"Computed subject='{subject}' include_file={include_file}")

# === Validate file_url if needed ===
if include_file:
    try:
        logging.debug(f"Validating file_url via HEAD {file_url}")
        response = requests.head(file_url, allow_redirects=True, timeout=5)
        logging.debug(f"HEAD status={response.status_code} headers={dict(response.headers)}")
        if response.status_code >= 400:
            logging.error(f"file_url responded with status code: {response.status_code}")
            sys.exit(1)
    except Exception as e:
        logging.exception(f"Error reaching file_url: {file_url}")
        sys.exit(1)

# === Compose email body ===
body_lines = [
    "Dear user,\n",
    f"Your composer {workflow_type} finished with status: {status}.\n"
]
if status.lower() == "succeeded":
    if include_file:
        body_lines.append(workflow_config["message_success"].format(file_url=file_url))
    else:
        body_lines.append(workflow_config["message_success"])
else:
    body_lines.append(workflow_config["message_failure"])

# === Send email ===
msg = EmailMessage()
msg["Subject"] = subject
msg["From"] = sender
msg["To"] = recipient
msg.set_content("\n".join(body_lines))
logging.debug(f"Email composed. Subject='{subject}' From='{sender}' To='{recipient}' Body length={len(msg.get_content())}")

try:
    logging.debug(f"Connecting to SMTP {CONFIG['smtp_host']}:{CONFIG['smtp_port']}")
    with smtplib.SMTP(CONFIG["smtp_host"], CONFIG["smtp_port"]) as smtp:
        logging.debug("SMTP connection established, sending message")
        smtp.send_message(msg)
        logging.debug("SMTP send_message completed")
    logging.info(f"Sent notification to {recipient}")
except Exception as e:
    logging.exception(f"Failed to send notification to {recipient}: {e}")
    sys.exit(1)

# === Keep pod alive for 30 minutes with periodic debug output ===
keep_minutes = 30
logging.info(f"Entering post-send keepalive loop for {keep_minutes} minutes")
end_time = time.time() + keep_minutes * 60
iteration = 0
while time.time() < end_time:
    iteration += 1
    remaining = int(end_time - time.time())
    logging.debug(f"Keepalive iteration={iteration} remaining_seconds={remaining}")
    time.sleep(30)  # sleep in 30-second increments to allow quick pod termination if needed
logging.info("Keepalive loop finished; exiting container")
