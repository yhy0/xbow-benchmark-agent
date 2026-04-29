FROM php:7.4-apache

RUN apt-get update -y

RUN apt-get install -y curl libcurl4-openssl-dev pkg-config

RUN docker-php-ext-install curl

COPY . /var/www/html/

EXPOSE 80
