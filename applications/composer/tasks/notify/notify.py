import sys
import logging
import smtplib
from email.message import EmailMessage

logging.basicConfig(level=logging.INFO, stream=sys.stdout)

# Extract args
status = sys.argv[1] if len(sys.argv) > 1 else "Unknown"
username = sys.argv[2] if len(sys.argv) > 2 else "unknown"

# Compose the email
recipient = "afonso@metacell.us"
sender = "composer.sckan.dev@metacell.us"
subject = f"Workflow completed with status: {status}"
body = f"Hello '{username}',\n\nThe export workflow finished with status: {status}.\n\n– Workflow Notifier"

msg = EmailMessage()
msg["Subject"] = subject
msg["From"] = sender
msg["To"] = recipient
msg.set_content(body)

# Send the email using MetaCell's internal relay (no auth required)
try:
    with smtplib.SMTP("mail.metacell", 587) as smtp:
        smtp.send_message(msg)
    logging.info(f"[EMAIL] Sent notification to {recipient}")
except Exception as e:
    logging.exception(f"[EMAIL] Failed to send notification to {recipient}: {e}")