# FlxOraCMS

A self-hosted CMS for agencies, built on **Next.js 16**, **React 19**, and **MySQL**.
Its differentiator: a designer can **upload a ready-made HTML/CSS theme and edit
content without code** — plus native SEO, first-party analytics, a
header/footer/block builder with GSAP animations, custom content types, a plugin
system, a secure form builder, and a WordPress-style user & role manager.

Designed to run on **Node-capable shared hosting (cPanel Node / Plesk) and VPS** —
`standalone` output, persistent disk, no edge-only features.

> **Heads up:** This project targets **Next.js 16**, which has breaking changes vs.
> earlier versions (e.g. middleware is `src/proxy.ts`, route `params` are async,
> Server Actions are the default mutation path). See [AGENTS.md](AGENTS.md) before
> contributing.

---

## Features

- **Theme engine** — upload a purchased HTML/CSS/JS theme (zip) and go live in
  minutes. Templates are rendered at runtime with **LiquidJS** (sandboxed, safe for
  untrusted markup) — no rebuild to add a theme. Includes a live **customizer**
  (colors/fonts → CSS variables, no rebuild) and a bundled starter + minimal theme.
- **Content core** — custom content types & fields (Collections), generic CRUD,
  **Tiptap** rich text (sanitized on save), drafts + scheduled publishing,
  revisions, taxonomies (categories/tags), authors, and per-entry templates.
- **Layout & animation builders** — drag-and-drop header/footer/theme-area builder
  (`@dnd-kit`), a native component registry (Logo, Menu, Button, Search, Social,
  etc.), a nested menu builder with mega-menu support, and per-block **GSAP +
  ScrollTrigger** animations (lazy-loaded, `prefers-reduced-motion`-aware, SSR/SEO-safe).
- **Visual page builder** *(in progress)* — a recursive node-tree editor with a
  token-first scoped-CSS compiler; opt-in per entry via `editorMode`, gated behind
  `BUILDER_ENABLED`.
- **SEO** — per-entry meta editor (title, description, canonical, robots, OG, schema)
  with live scoring, plus `sitemap.xml`, `robots.txt`, and a 301/302 redirect manager.
- **Media library** — uploads optimized with **sharp**, served through a
  path-traversal-safe storage abstraction (local now, S3/CDN-ready).
- **Analytics** — first-party, privacy-hashed page tracking (`/api/track`) with a
  dashboard, plus optional GA / GSC / Clarity injection via settings.
- **Plugin framework** — a WordPress-style hook bus (`addAction`/`addFilter`) with a
  registry and admin UI. Ships with `powered-by`, `audit-log`, and a **form-builder**.
- **Form builder (plugin)** — drag-and-drop fields, a submissions inbox, and a
  hardened submit handler (honeypot + time-trap + rate-limit + same-origin +
  optional Cloudflare Turnstile). Embed via `[flxform slug="…"]` or a layout component.
- **Users & RBAC** — roles → permissions with a `can()` guard, Super Admin bypass,
  user/role admin screens, an account page, and self-protection rules.

See [PLAN.md](PLAN.md) for architecture and [TODO.md](TODO.md) for the build status
(all 6 MVP phases + form builder + user management are complete; the full visual page
builder is under active development).

---

## Tech stack

| Area | Choice |
|------|--------|
| Framework | Next.js 16 (App Router), React 19, TypeScript (strict), `output: "standalone"` |
| Styling | Tailwind v4 + ShadCN UI (**Base UI**–based, not Radix) |
| DB / ORM | MySQL 8 + Prisma 6 (pinned) |
| Auth | Auth.js v5 (NextAuth beta), credentials + JWT sessions, custom RBAC |
| Theme templating | LiquidJS (sandboxed) |
| Drag-and-drop | `@dnd-kit` |
| Animation | GSAP + ScrollTrigger |
| Rich text | Tiptap 3 |
| Images | sharp |
| Sanitization | sanitize-html |
| Validation | zod |
| Logging | pino |
| Testing | Vitest (unit) + Playwright (E2E) |

---

## Prerequisites

- **Node.js 20+**
- **MySQL 8** (a reachable database + credentials)
- **npm** (repo uses `package-lock.json`)

---

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy the example env file and fill in real values:

```bash
cp .env.example .env
```

Then edit `.env`. At minimum set:

- `DATABASE_URL` — your MySQL connection string
  (`mysql://USER:PASSWORD@HOST:PORT/DATABASE`)
- `AUTH_SECRET` — generate with `openssl rand -base64 32`

All env vars are validated fail-fast at startup by [`src/lib/env.ts`](src/lib/env.ts):

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | MySQL connection string (Prisma) |
| `AUTH_SECRET` | Auth.js signing secret (32-byte base64) |
| `APP_URL` | Public base URL (canonical URLs, sitemap, OG) |
| `AUTH_URL` | Auth.js callback base URL |
| `STORAGE_DIR` | Persistent storage path for themes + media (default `./storage`) |
| `NODE_ENV` | `development` \| `production` \| `test` |
| `LOG_LEVEL` | `trace` \| `debug` \| `info` \| `warn` \| `error` \| `fatal` |
| `SERVER_ACTIONS_BODY_SIZE_LIMIT` | Max Server Action body size (e.g. `25mb`) |

### 3. Set up the database

```bash
npm run db:push            # apply the Prisma schema to MySQL
npm run db:seed            # roles, permissions, content types, sample content, demo form
npm run db:install-themes  # install + activate the bundled starter theme
```

> The seed creates an admin from `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` if set,
> otherwise you create the Super Admin through the `/setup` wizard on first run.
> Dev default: `admin@example.com` / `password123`.

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). On first run you'll be taken to
**`/setup`** to create the Super Admin; the admin lives at **`/admin`**.

---

## Available scripts

| Script | What it does |
|--------|--------------|
| `npm run dev` | Start the dev server |
| `npm run build` | `prisma generate` + `next build` (standalone) |
| `npm run start` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run format` / `format:check` | Prettier write / check |
| `npm run test` / `test:watch` | Vitest unit tests |
| `npm run test:e2e` | Playwright E2E tests |
| `npm run db:push` | Apply schema with `prisma db push` |
| `npm run db:migrate` / `db:deploy` | Prisma migrate (dev / prod) |
| `npm run db:seed` | Seed roles, permissions, content, demo form |
| `npm run db:install-themes` | Install bundled theme(s) into storage |
| `npm run db:studio` | Open Prisma Studio |

### Running E2E tests against a live server

```bash
npm run dev
# in another shell:
E2E_BASE_URL=http://localhost:3000 npx playwright test
```

---

## Project structure

```
src/
├── app/
│   ├── (site)/[[...slug]]/route.ts   # public site renderer (returns full HTML documents)
│   ├── admin/login, admin/setup      # unauthenticated admin entry
│   ├── admin/(protected)/            # authed admin (content, themes, layout, menus,
│   │                                 #   seo, media, analytics, plugins, forms, users…)
│   ├── api/                          # auth, track, health, forms
│   ├── theme-assets/, media/         # serve themes + uploads from storage
│   └── sitemap.xml, robots.txt
├── server/
│   ├── services/                     # business logic (all `import "server-only"`)
│   ├── theme/                        # LiquidJS engine + render pipeline
│   ├── layout/                       # component registry + region renderer
│   ├── hooks/                        # the plugin hook bus
│   └── auth/                         # Auth.js config + RBAC guards
├── plugins/registry.ts               # static plugin modules
├── lib/                              # db, env, logger, storage, rbac, sanitize, validations…
├── components/                       # ShadCN primitives + admin UI
└── proxy.ts                          # edge gate for /admin (Next 16 "middleware")
prisma/schema.prisma, prisma/seed.ts
themes/starter, themes/minimal        # bundled theme sources
docs/theme-spec.md, docs/deploy.md
tests/unit (Vitest), tests/e2e (Playwright)
```

For deeper conventions, subsystem notes, and gotchas, read [AGENTS.md](AGENTS.md).
For deployment (standalone packaging, pm2/systemd, Nginx, backups) see
[docs/deploy.md](docs/deploy.md).

---

## Verification bar

Before pushing, keep these green:

```bash
npm run typecheck
npm run lint
npm run format:check
npm run test
npm run build
npm run test:e2e
```
