# ---------------------------------------------------------------------------
# Development image for the ERP (Laravel 12 + Inertia + React)
# PHP 8.3-FPM with every extension the app and its packages need.
# ---------------------------------------------------------------------------
FROM php:8.3-fpm

# Build args so the in-container user matches your host user (avoids
# permission problems on bind-mounted files, especially on Linux/WSL2).
ARG UID=1000
ARG GID=1000
ARG USER=www

# --- System dependencies -----------------------------------------------------
RUN apt-get update && apt-get install -y --no-install-recommends \
        git \
        curl \
        unzip \
        zip \
        ca-certificates \
        # intl
        libicu-dev \
        # gd (image handling for spatie/medialibrary)
        libpng-dev \
        libjpeg62-turbo-dev \
        libfreetype6-dev \
        libwebp-dev \
        # zip
        libzip-dev \
        # mbstring / xml
        libonig-dev \
        libxml2-dev \
        # postgres client libs not needed; mysql client for artisan db
        default-mysql-client \
        # optional image optimizers used by medialibrary conversions
        jpegoptim optipng pngquant gifsicle \
        # gosu lets the entrypoint drop privileges after fixing volume ownership
        gosu \
    && rm -rf /var/lib/apt/lists/*

# --- PHP extensions ----------------------------------------------------------
RUN docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp \
    && docker-php-ext-install -j"$(nproc)" \
        pdo_mysql \
        mbstring \
        bcmath \
        intl \
        zip \
        gd \
        exif \
        pcntl \
        opcache \
        sockets

# Redis extension (the app can use Redis for cache/queue/session if you switch to it)
RUN pecl install redis \
    && docker-php-ext-enable redis

# --- Composer ----------------------------------------------------------------
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# --- PHP config --------------------------------------------------------------
COPY docker/php/php.ini /usr/local/etc/php/conf.d/zz-erp.ini
# Run php-fpm worker processes as the "www" user (matches bind-mount ownership)
COPY docker/php/www-pool.conf /usr/local/etc/php-fpm.d/zz-www.conf

# --- Non-root user -----------------------------------------------------------
RUN groupadd -g ${GID} ${USER} \
    && useradd -u ${UID} -g ${USER} -m -s /bin/bash ${USER}

# --- Entrypoint --------------------------------------------------------------
COPY docker/php/entrypoint.sh /usr/local/bin/entrypoint
RUN chmod +x /usr/local/bin/entrypoint

WORKDIR /var/www/html

# --- Bake PHP dependencies into the image ------------------------------------
# Install vendor at BUILD time into a cache path OUTSIDE /var/www/html, so it is
# never shadowed by the source bind mount or the vendor volume. The entrypoint
# copies it into place on first boot with a fast local copy (no download), which
# is the key to a fast, non-"stuck" startup - even after `docker compose down -v`.
# --no-scripts skips artisan package discovery (no app source yet); Laravel
# rebuilds that automatically at runtime once the source is mounted.
RUN mkdir -p /opt/app-build
COPY composer.json composer.lock /opt/app-build/
RUN cd /opt/app-build \
    && composer install \
        --no-interaction \
        --prefer-dist \
        --no-progress \
        --no-scripts \
    && chown -R ${USER}:${USER} /opt/app-build

# NOTE: the container starts as root so the entrypoint can fix ownership of the
# named volumes (vendor / node_modules) and writable dirs. It then runs php-fpm
# (whose workers drop to "www" via the pool config) or drops to "www" with gosu
# for queue/scheduler/artisan commands.

ENTRYPOINT ["entrypoint"]
CMD ["php-fpm"]
