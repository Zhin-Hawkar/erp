# Running the ERP with Docker (development)

This stack runs the Laravel 12 + Inertia/React ERP in containers with hot module
reloading for the frontend.

## Services

| Service     | Image / Build            | Purpose                                              | Host port |
|-------------|--------------------------|------------------------------------------------------|-----------|
| `web`       | nginx:1.27-alpine        | Serves the app, proxies PHP to `app`                 | 8000      |
| `app`       | `docker/php/Dockerfile`  | PHP 8.3-FPM; runs first-run setup                    | –         |
| `queue`     | same as `app`            | `queue:work` – **required** (queued event listeners) | –         |
| `scheduler` | same as `app`            | `schedule:work`                                      | –         |
| `mysql`     | mysql:8.0                | Database                                             | 3306      |
| `redis`     | redis:7-alpine           | Optional cache/queue/session backend                 | 6379      |
| `vite`      | node:20-alpine           | Vite dev server (HMR)                                | 5173      |

> The app dispatches **queued** event listeners (e.g. seeding a new company's
> default data). The `queue` container must be running for company creation and
> related actions to complete.

## First-time setup

```bash
# 1. Create your env file (or let the app container copy it on first boot)
cp .env.docker.example .env

# 2. (Linux/WSL2) set UID/GID so bind-mounted files stay writable by you
echo "UID=$(id -u)" >> .env
echo "GID=$(id -g)" >> .env

# 3. Build & start everything
docker compose up -d --build

# 4. Set up the database
docker compose exec app php artisan migrate --seed

# 5. Mark the app installed (skips the web installer) and link storage
docker compose exec app touch storage/installed
docker compose exec app php artisan storage:link
```

Then open:

- App:  http://localhost:8000
- Vite: starts automatically; the app loads assets from http://localhost:5173

Default seeded logins (from the project seeders):

- Super admin: `superadmin@example.com`
- Company:     `company@example.com`

(Password is whatever the project's `PermissionRoleSeeder` sets.)

### Automating setup instead of step 4–5

Set these in `.env` before `docker compose up` and the `app` container will do it
on first boot:

```env
AUTO_MIGRATE=true
AUTO_SEED=true
MARK_INSTALLED=true
```

## Day-to-day

```bash
docker compose up -d              # start
docker compose down               # stop (keeps data volumes)
docker compose logs -f app        # PHP logs
docker compose logs -f vite       # Vite/HMR logs
docker compose logs -f queue      # queue worker

docker compose exec app php artisan migrate
docker compose exec app php artisan tinker
docker compose exec app composer require <pkg>
docker compose exec vite npm install <pkg>
```

## Using an existing database dump

If you already have a `designvision` dump, skip the `migrate --seed` step and
import it into the `mysql` container instead:

```bash
docker compose exec -T mysql mysql -uerp -psecret designvision < dump.sql
docker compose exec app touch storage/installed
```

## Performance — "it's slow" / "erp_app stuck" (read this)

Two different things were causing slowness; both are now addressed.

### A. Slow / "stuck" startup — fixed by baking dependencies into the images

`vendor/` and `node_modules/` are installed at **image build time** into a cache
inside the image, and copied into place on first boot with a fast local copy
(seconds) instead of being downloaded on every container start. So:

- The **first** `docker compose up -d --build` is slower because it *builds* the
  images (runs `composer install` + `npm ci` once). Let it finish.
- After that, `up` is fast, and even `down -v` + `up` is fast (the copy is local,
  no re-download).

If `erp_app` ever looks stuck, watch `docker compose logs -f app`: you'll see
"Populating vendor from the baked cache (fast local copy)" then
"Starting php-fpm" within seconds.

### B. Slow *requests* on Windows/macOS — the bind mount

Even with fast startup, each request reads many source files over the host↔
container bind mount, which is slow on Docker Desktop. Fixes, by impact:

### 1. (Windows) Put the project inside the WSL2 filesystem — biggest win

If the code lives on `C:\Users\...`, Docker Desktop syncs it over a slow bridge.
Move it into the Linux side instead:

```bash
# in a WSL2 (Ubuntu) terminal
mkdir -p ~/code && cd ~/code
git clone <your repo>          # or: cp -r /mnt/c/path/to/project .
cd project
docker compose up -d --build
```

Edit it from VS Code with the **WSL** extension (`code .` from that folder).
This alone typically makes it 5–20× faster. Then set `CHOKIDAR_USEPOLLING=false`
in `.env` for fast, low-CPU HMR (polling is only needed for code on `C:\`).

### 2. `vendor` and `node_modules` are already in named volumes

This stack keeps both in container-local volumes instead of syncing them from the
host, which removes the worst of the file-read cost. If you ever see "class not
found" after changing dependencies, refresh the vendor volume:

```bash
docker compose exec app composer install
# or, full reset:
docker compose down && docker volume rm $(docker compose ls -q 2>/dev/null)_vendor
```

### 3. OPcache is tuned for a large app

`docker/php/php.ini` raises `opcache.max_accelerated_files`, memory, and the
realpath cache so PHP isn't constantly recompiling or re-stat-ing files. No action
needed — just don't override these.

### 4. (macOS) the same applies

macOS bind mounts are also slow. The named volumes help; for the remaining source
mount you can add `:delegated` (e.g. `- .:/var/www/html:delegated`) for a modest
gain, or use Mutagen via Docker Desktop's settings.

### Still slow?

- Make sure you're not also running XAMPP/another MySQL on 3306 (port clash).
- `docker stats` to see if a container is CPU-bound — if `vite` is pegged, set
  `CHOKIDAR_USEPOLLING=false` (requires WSL2-hosted code).
- Give Docker Desktop more CPU/RAM in its settings (Resources).

## Troubleshooting

### 502 Bad Gateway

nginx is up but can't reach php-fpm in the `app` container.

```bash
docker compose ps          # is "app" healthy, or Exited / Restarting?
docker compose logs -f app # watch what it's doing
```

- **First boot is now fast** (deps are baked into the images). If `erp_app`
  still looks stuck, you likely have an old image — rebuild:
  `docker compose build --no-cache app vite && docker compose up -d`.
- **`permission denied` in the logs:** rebuild — the image starts as root,
  fixes ownership, then runs php-fpm workers as `www`:
  `docker compose down && docker compose up -d --build`.
- **Reset a corrupted vendor volume:**
  `docker compose down && docker volume rm $(docker compose ls -q 2>/dev/null)_vendor && docker compose up -d --build`.

### `erp_app` stuck on "Waiting"

The app is waiting on MySQL. Most often the `mysql-data` volume is left over from
an earlier run with a different password, so MySQL never authenticates. Check:

```bash
docker compose logs mysql      # auth errors, or "ready for connections"?
```

Fix by recreating the volumes (safe if you haven't imported your real DB yet):

```bash
docker compose down -v          # removes mysql-data, vendor, node_modules volumes
docker compose up -d --build
```

The app now waits for the DB port itself rather than gating on MySQL's
healthcheck, so a clean `down -v` + `up` resolves this.

## Notes

- **Redis is included but not used by default** – the app's defaults are file
  cache/session and a database queue. To switch, set `CACHE_STORE=redis`,
  `SESSION_DRIVER=redis`, `QUEUE_CONNECTION=redis` and the `REDIS_*` values in
  `.env` (host is `redis`), then `docker compose restart app queue scheduler`.
- **node_modules** lives in a named volume (`vite-node-modules`), not your host
  folder, because native binaries (rollup/esbuild) differ between your OS and the
  Linux container. To rebuild it: `docker compose down && docker volume rm <project>_vite-node-modules`.
- **Production**: this setup is dev-focused (bind mounts, HMR, debug on). A
  production image would instead copy code in, run `composer install --no-dev`
  and `npm run build`, enable OPcache timestamp validation off, and drop the
  `vite` service.
