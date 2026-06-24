#!/usr/bin/env bash
set -e

# ---------------------------------------------------------------------------
# Container entrypoint for the ERP (development).
#
# Starts as root so it can:
#   - install composer deps into the (root-owned) named "vendor" volume,
#   - fix ownership of the named volumes and writable dirs to the "www" user.
# Then it either runs php-fpm (master root, workers drop to www via the pool
# config) or drops to www with gosu for queue/scheduler/artisan commands.
# Shared by the app / queue / scheduler containers.
# ---------------------------------------------------------------------------

cd /var/www/html

APP_USER="${APP_USER:-www}"

log() { echo -e "\033[0;36m[entrypoint]\033[0m $*"; }

# 0. Ensure the writable dirs exist and are writable by whatever user php-fpm
#    workers run as. On Docker Desktop bind mounts, chown doesn't always stick,
#    so we also chmod 777 (dev only) to guarantee Laravel can write cache,
#    sessions, compiled views and logs.
mkdir -p \
    storage/framework/cache/data \
    storage/framework/sessions \
    storage/framework/views \
    storage/framework/testing \
    storage/logs \
    storage/app/public \
    bootstrap/cache
chown -R "${APP_USER}:${APP_USER}" storage bootstrap/cache 2>/dev/null || true
chmod -R 777 storage bootstrap/cache 2>/dev/null || true

run_as_app() { gosu "${APP_USER}" "$@"; }

# 1. PHP dependencies. vendor is baked into the image at /opt/app-build/vendor.
#    On first boot (empty volume) we copy it into place - a fast local copy, not
#    a download - so the container is ready in seconds instead of minutes.
if [ ! -f vendor/autoload.php ]; then
    if [ -d /opt/app-build/vendor ]; then
        log "Populating vendor from the baked cache (fast local copy)..."
        mkdir -p vendor
        cp -a /opt/app-build/vendor/. vendor/ 2>/dev/null || true
        chown -R "${APP_USER}:${APP_USER}" vendor 2>/dev/null || true
    else
        log "No baked vendor found - installing via composer (slow fallback)..."
        mkdir -p vendor
        chown -R "${APP_USER}:${APP_USER}" vendor 2>/dev/null || true
        run_as_app composer install --no-interaction --prefer-dist
    fi
else
    log "vendor present - skipping install."
fi

# 2. Ensure an .env exists.
if [ ! -f .env ]; then
    if [ -f .env.docker.example ]; then
        log "No .env found - copying .env.docker.example"
        run_as_app cp .env.docker.example .env
    elif [ -f .env.example ]; then
        log "No .env found - copying .env.example"
        run_as_app cp .env.example .env
    fi
fi

# 3. Generate APP_KEY if empty.
if ! grep -q '^APP_KEY=base64:' .env 2>/dev/null; then
    log "Generating application key..."
    run_as_app php artisan key:generate --force || true
fi

# 4. Wait for the database to accept connections.
if [ -n "${DB_HOST}" ]; then
    log "Waiting for database at ${DB_HOST}:${DB_PORT:-3306}..."
    until php -r "exit(@fsockopen(getenv('DB_HOST'), (int)(getenv('DB_PORT') ?: 3306)) ? 0 : 1);" 2>/dev/null; do
        sleep 2
    done
    log "Database is reachable."
fi

# 5. First-run setup, only on the main app container.
if [ "${RUN_SETUP}" = "true" ]; then
    run_as_app php artisan storage:link 2>/dev/null || true

    if [ "${AUTO_MIGRATE}" = "true" ]; then
        log "Running migrations..."
        run_as_app php artisan migrate --force || true

        if [ "${AUTO_SEED}" = "true" ]; then
            log "Seeding database..."
            run_as_app php artisan db:seed --force || true
        fi
    fi

    if [ "${MARK_INSTALLED}" = "true" ] && [ ! -f storage/installed ]; then
        log "Marking application as installed."
        run_as_app touch storage/installed
    fi

    run_as_app php artisan optimize:clear 2>/dev/null || true
fi

# 6. Start the requested process.
#    - php-fpm: keep the master as root (it needs root to spawn www workers).
#    - anything else (queue:work, schedule:work, artisan ...): drop to www.
if [ "$1" = "php-fpm" ]; then
    log "Starting php-fpm (workers run as ${APP_USER})"
    exec "$@"
else
    log "Starting as ${APP_USER}: $*"
    exec gosu "${APP_USER}" "$@"
fi
