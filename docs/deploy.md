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

## Backup / restore

- **Database:** `mysqldump` of `DATABASE_URL`.
- **Files:** archive the `STORAGE_DIR` (themes + media).

Restore by importing the dump and extracting `STORAGE_DIR`.

> More detail (process managers, reverse proxy, cron for scheduled publishing)
> is added during Phase 5 hardening.
