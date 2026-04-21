# Stage 1: Build React frontend
FROM node:20-alpine AS frontend-build

WORKDIR /build

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ .

ENV VITE_API_URL=/api/v1
RUN npm run build

# Stage 2: Laravel backend + frontend assets
FROM php:8.3-cli

RUN apt-get update && apt-get install -y \
    libpq-dev libzip-dev unzip \
    && docker-php-ext-install pdo pdo_pgsql zip bcmath opcache \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app

COPY backend/ .

RUN composer install --no-dev --optimize-autoloader --no-interaction

# Copy frontend build into Laravel public directory
COPY --from=frontend-build /build/dist/assets/ public/assets/
COPY --from=frontend-build /build/dist/favicon.svg public/favicon.svg
COPY --from=frontend-build /build/dist/favicon.png public/favicon.png
COPY --from=frontend-build /build/dist/logo.png public/logo.png
COPY --from=frontend-build /build/dist/logo-full.png public/logo-full.png

# Copy index.html as a Blade template for SPA serving
COPY --from=frontend-build /build/dist/index.html resources/views/spa.blade.php

RUN mkdir -p storage/framework/{sessions,views,cache} \
    && chmod -R 775 storage bootstrap/cache

EXPOSE 8080

CMD php artisan migrate --force \
    && php artisan config:cache \
    && php artisan route:cache \
    && php artisan serve --host=0.0.0.0 --port=8080
