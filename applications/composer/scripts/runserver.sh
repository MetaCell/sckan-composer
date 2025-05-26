#!/bin/bash

set -e

# Normalize booleans to lowercase
DEBUG="${DEBUG,,}"
PRODUCTION="${PRODUCTION,,}"
HTTPS="${HTTPS,,}"

# Development mode setup
if [ "$PRODUCTION" != "true" ]; then
    echo "Running in development mode setup"
    touch persistent/db.sqlite3
    chmod go+w persistent/db.sqlite3
fi

# Django setup
python3 manage.py collectstatic --noinput
python3 manage.py migrate

# Determine server to run
if [ "$DEBUG" = "true" ]; then
    echo "DEBUG mode enabled: running Django dev server"
    if [ "$HTTPS" = "true" ]; then
        python3 manage.py runsslserver 0.0.0.0:${PORT}
    else
        python3 manage.py runserver 0.0.0.0:${PORT}
    fi
elif [ "$PRODUCTION" = "true" ]; then
    echo "PRODUCTION mode: running Uvicorn"
    python3 -m uvicorn --workers ${WORKERS} --host 0.0.0.0 --port ${PORT} ${MODULE_NAME}.asgi:application
else
    echo "Falling back to dev server (PRODUCTION != true)"
    if [ "$HTTPS" = "true" ]; then
        python3 manage.py runsslserver 0.0.0.0:${PORT}
    else
        python3 manage.py runserver 0.0.0.0:${PORT}
    fi
fi
