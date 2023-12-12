#!/bin/bash

set -e

if [ -z "${PRODUCTION}" ]; then
    # when running in "dev" mode touch the db file so that it exists
    touch persistent/db.sqlite3
    # and make it writable for others and the group so that it can 
    # also be used while running on the local host
    chmod go+w persistent/db.sqlite3
fi

python3 manage.py collectstatic --noinput
python3 manage.py migrate

if [ "${DEBUG}" -eq "True" ]; then
    # start the Django dev server
    echo running dev server
    if [ -z "${HTTPS}" ]; then
        python3 manage.py runserver 0.0.0.0:${PORT}
    else
        python3 manage.py runsslserver 0.0.0.0:${PORT}
    fi
else
    if [ -z "${PRODUCTION}" ]; then
        # start the Django dev server
        echo running dev server
        if [ -z "${HTTPS}" ]; then
            python3 manage.py runserver 0.0.0.0:${PORT}
        else
            python3 manage.py runsslserver 0.0.0.0:${PORT}
        fi
    else
        python3 -m uvicorn --workers ${WORKERS} --host 0.0.0.0 --port ${PORT} ${MODULE_NAME}.asgi:application
    fi
fi