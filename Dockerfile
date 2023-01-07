ARG PARENT=python:3.9.15
ARG NODE_PARENT=node:15.5

####
# FROM ${NODE_PARENT} as frontend

# ENV APP_DIR=/app

# WORKDIR ${APP_DIR}
# COPY frontend/package.json ${APP_DIR}
# COPY frontend/package-lock.json ${APP_DIR}
# RUN npm ci

# COPY frontend ${APP_DIR}
# RUN npm run build

####
FROM ${PARENT}
ENV MODULE_NAME=backend
ENV PORT=8000
ENV WORKERS=2
ENV APP_DIR=/usr/src/app/

RUN apt update

WORKDIR ${APP_DIR}
RUN mkdir -p ${APP_DIR}static/www

COPY backend/requirements.txt ${APP_DIR}
RUN pip3 install --no-cache-dir --upgrade -r requirements.txt

COPY backend/requirements.txt backend/setup.py ${APP_DIR}
RUN python3 -m pip install -e .

COPY backend ${APP_DIR}
RUN python3 manage.py collectstatic --noinput

# COPY --from=frontend /app/dist ${APP_DIR}/static/www

EXPOSE ${PORT}
COPY scripts/runserver.sh /usr/local/bin
RUN chmod 0755 /usr/local/bin/runserver.sh
ENTRYPOINT /usr/local/bin/runserver.sh
