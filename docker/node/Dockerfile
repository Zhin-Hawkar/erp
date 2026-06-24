# ---------------------------------------------------------------------------
# Vite dev-server image. node_modules is baked at build time into a cache path
# OUTSIDE /var/www/html, then copied into place by the entrypoint on first boot
# (fast local copy, not an npm install) -> fast frontend startup, even after
# `docker compose down -v`.
# ---------------------------------------------------------------------------
FROM node:20-alpine

RUN apk add --no-cache bash

# Bake dependencies into a cache dir that the bind mount / node_modules volume
# can't shadow.
RUN mkdir -p /opt/app-build
COPY package.json package-lock.json /opt/app-build/
RUN cd /opt/app-build && npm ci

COPY docker/node/entrypoint.sh /usr/local/bin/entrypoint
RUN chmod +x /usr/local/bin/entrypoint

WORKDIR /var/www/html

ENTRYPOINT ["entrypoint"]
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
