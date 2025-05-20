import os
import sys
import logging
import time

logging.basicConfig(level=logging.INFO, stream=sys.stdout)

status = sys.argv[1]
payload = sys.argv[2]

logging.info(f"[WORKFLOW NOTIFY] user={payload}, status={status}")

time.sleep(120)