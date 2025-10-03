ARG CLOUDHARNESS_FRONTEND_BUILD
ARG CLOUDHARNESS_DJANGO

ARG PRODUCTION
ARG DEBUG
ARG SECRET_KEY
ARG ALLOWED_HOSTS
ARG CSRF_TRUSTED_ORIGINS
ARG SOCIAL_AUTH_ORCID_KEY
ARG SOCIAL_AUTH_ORCID_SECRET

####


FROM $CLOUDHARNESS_FRONTEND_BUILD AS frontend

ENV APP_DIR=/app

WORKDIR ${APP_DIR}
COPY frontend/package.json ${APP_DIR}
COPY frontend/package-lock.json ${APP_DIR}
RUN npm ci

COPY frontend ${APP_DIR}
RUN npm run build

####
FROM $CLOUDHARNESS_DJANGO

ENV PRODUCTION=false
ENV SOCIAL_AUTH_ORCID_SECRET=DUMMY_SECRET
ENV SOCIAL_AUTH_ORCID_KEY=DUMMY_KEY

ENV MODULE_NAME=backend \
    PORT=8000 \
    WORKERS=2 \
    APP_DIR=/usr/src/app

RUN apt-get update \
 && apt-get upgrade -y \
 && apt-get install -y --no-install-recommends \
       nginx supervisor git \
       zlib1g \
       imagemagick \
       libgnutls30 \
       bluez \
       libxml2 \
       libtiff5 \
       libxslt1.1 \
 && rm -rf /var/lib/apt/lists/*

WORKDIR ${APP_DIR}

RUN mkdir -p ${APP_DIR}/static/www /var/log/supervisor

RUN git clone -b neurons https://github.com/SciCrunch/NIF-Ontology.git

COPY backend/requirements.txt ${APP_DIR}
RUN pip3 install --no-cache-dir --upgrade -r requirements.txt
COPY backend/setup.py backend/version.py ${APP_DIR}/
RUN python3 -m pip install -e .
RUN ontutils set ontology-local-repo ./NIF-Ontology/
COPY backend ${APP_DIR}
RUN python3 manage.py collectstatic --noinput

COPY --from=frontend /app/build/static/ ${APP_DIR}/static/
COPY --from=frontend /app/build/index.html ${APP_DIR}/static/www/index.html

COPY nginx.conf           /etc/nginx/nginx.conf
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

COPY scripts/runserver.sh /usr/local/bin
RUN chmod 0755 /usr/local/bin/runserver.sh

EXPOSE 80 8000
CMD ["/usr/bin/supervisord", "-n"]
