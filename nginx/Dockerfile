ARG COMPOSER=composer:latest
FROM ${COMPOSER} as composer

FROM nginx:1.19.8-alpine

RUN cat /etc/nginx/conf.d/default.conf

COPY ./nginx/default.conf  /etc/nginx/conf.d/default.conf
COPY --from=composer /usr/src/app/static /usr/share/nginx/html/static
RUN cp /usr/share/nginx/html/static/index.html /usr/share/nginx/html/index.html
