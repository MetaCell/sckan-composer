ARG TAG=latest
FROM composer:${TAG} as composer

FROM nginx:1.19.8-alpine

COPY ./nginx/default.conf  /etc/nginx/conf.d/default.conf
COPY --from=composer /usr/src/app/static /usr/share/nginx/html/static
