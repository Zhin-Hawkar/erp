#!/usr/bin/env bash
set -e
cd /var/www/html

log() { echo -e "\033[0;35m[vite-entrypoint]\033[0m $*"; }

# Populate node_modules from the baked cache if the volume is empty (fast copy).
if [ ! -d node_modules ] || [ -z "$(ls -A node_modules 2>/dev/null)" ]; then
    if [ -d /opt/app-build/node_modules ]; then
        log "Populating node_modules from the baked cache (fast local copy)..."
        mkdir -p node_modules
        cp -a /opt/app-build/node_modules/. node_modules/ 2>/dev/null || true
    else
        log "No baked node_modules - running npm install (slow fallback)..."
        npm install
    fi
else
    log "node_modules present - skipping install."
fi

log "Starting: $*"
exec "$@"
