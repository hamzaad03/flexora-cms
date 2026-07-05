# Deploying FlxOraCMS

FlxOraCMS builds to a self-contained Node server (`output: "standalone"`), so it
runs on Node-capable shared hosting (cPanel Node / Plesk) and on a VPS.

## Prerequisites

- Node.js 20+ (22 recommended)
- A MySQL 8 database
- A persistent, writable directory for `STORAGE_DIR` (themes + media uploads)

## 1. Configure environment

Copy `.env.example` to `.env` and set real values:

```
DATABASE_URL="mysql://user:pass@host:3306/dbname"
AUTH_SECRET="<openssl rand -base64 32>"
APP_URL="https://your-domain.com"
AUTH_URL="https://your-domain.com"
STORAGE_DIR="/home/youruser/flxoracms-storage"
NODE_ENV="production"
```

## 2. Install, migrate, build

```bash
npm ci
npm run db:deploy      # apply migrations (prisma migrate deploy)
npm run db:seed        # roles, permissions, default content types, settings
npm run build          # prisma generate + next build (standalone)
```

## 3. Run

The standalone server is emitted to `.next/standalone`. Start it with:

```bash
node .next/standalone/server.js
```

On shared hosting, point the Node app's startup file at
`.next/standalone/server.js` and set the environment variables in the host's
Node app manager. Copy `.next/static` and `public/` alongside the standalone
output as required by your host.

First visit `/setup` to create the Super Admin (or set `SEED_ADMIN_EMAIL` /
`SEED_ADMIN_PASSWORD` before `db:seed`).

## Packaging the standalone output

`next build` emits `.next/standalone`. For a server deploy, ship:

- `.next/standalone/` (the server)
- `.next/static/` → copy to `.next/standalone/.next/static`
- `public/` → copy to `.next/standalone/public` (includes `flx-anim.js`,
  `flx-analytics.js`, `flx-layout.css`, and `vendor/gsap/*`)
- `themes/` → copy next to the server (the bundled starter/minimal themes are
  installed from here on first run)
- `prisma/` (for migrations) and your `.env`

## Process manager

Keep the Node server alive with **pm2** or **systemd**:

```bash
pm2 start .next/standalone/server.js --name flxoracms
pm2 save && pm2 startup
```

On cPanel/Plesk, register `.next/standalone/server.js` as the app entry point in
the Node app manager and set env vars there.

## Reverse proxy (VPS)

Terminate TLS at Nginx and proxy to the Node port:

```nginx
location / {
  proxy_pass http://127.0.0.1:3000;
  proxy_set_header Host $host;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Real-IP $remote_addr;
}
```

`X-Forwarded-For` is required for analytics + rate limiting to see real IPs.

## Health check

`GET /api/health` returns `{ "status": "ok", "db": true }` (503 if the DB is
down). Point your load balancer / uptime monitor at it.

## Scheduled publishing

Scheduled entries become visible automatically when their publish time passes
(the public resolver treats `SCHEDULED` + due as live) — no cron required. If you
want statuses flipped to `PUBLISHED` for reporting, add a cron hitting a small
admin task (future enhancement).

## Backup / restore

Scripts are provided (Linux servers; require `mysqldump`/`mysql` + `tar`):

```bash
set -a; . ./.env; set +a       # load DATABASE_URL + STORAGE_DIR
./scripts/backup.sh            # -> backups/db-*.sql + backups/storage-*.tar.gz
./scripts/restore.sh backups/db-XXXX.sql backups/storage-XXXX.tar.gz
```

Schedule `backup.sh` via cron for regular snapshots.

## Security checklist

- Generate a strong `AUTH_SECRET` (`openssl rand -base64 32`).
- Serve over HTTPS — auth cookies are `Secure` in production.
- Keep `.env` out of the webroot and out of version control.
- The app rate-limits login (10/min/IP) and the analytics beacon (60/min/IP).
