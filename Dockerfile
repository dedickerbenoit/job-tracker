# Stage 1: Build React frontend
FROM node:20-alpine AS frontend-build

WORKDIR /build

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ .

ENV VITE_API_URL=/api/v1
RUN npm run build

# Stage 2: Laravel backend + frontend assets
FROM php:8.3-fpm-alpine

RUN apk add --no-cache \
    nginx \
    postgresql-dev libzip-dev unzip \
    && docker-php-ext-install pdo pdo_pgsql zip bcmath opcache \
    && rm -rf /var/cache/apk/*

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

# Nginx configuration
COPY docker/nginx.conf /etc/nginx/http.d/default.conf

# Entrypoint script
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Create app user and set permissions
RUN addgroup -g 1000 app && adduser -u 1000 -G app -s /bin/sh -D app \
    && mkdir -p storage/framework/{sessions,views,cache} storage/logs \
    && chown -R app:app /app storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache \
    && chown -R app:app /var/lib/nginx /var/log/nginx /run/nginx

# Configure PHP-FPM to run as app user
RUN sed -i 's/^user = .*/user = app/' /usr/local/etc/php-fpm.d/www.conf \
    && sed -i 's/^group = .*/group = app/' /usr/local/etc/php-fpm.d/www.conf

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD wget -qO- http://localhost:8080/api/v1/health || exit 1

EXPOSE 8080

ENTRYPOINT ["entrypoint.sh"]
