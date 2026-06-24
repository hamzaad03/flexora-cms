<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# FlxOraCMS — Agent & Developer Guide

This file orients any AI model or developer working on this repo. Read it before
making changes; keep it current when conventions change. (The block above is
managed by tooling — don't edit it.)

Concrete Next.js 16 differences you will hit:

- `middleware.ts` is renamed to **`proxy.ts`** (we use `src/proxy.ts`).
- Route handler / page `params` are **async**: `{ params }: { params: Promise<…> }` → `await params`.
- Server Actions are the default mutation path (`"use server"`).
- Build output is **`standalone`**. When unsure, read `node_modules/next/dist/docs/`.

---

## What this is

A self-hosted CMS (working name **FlxOraCMS**) for agencies. Differentiator: a
designer can **upload a ready-made HTML/CSS theme and edit content without code**,
plus native SEO, analytics, a header/footer/block builder with GSAP animations,
custom content types, a plugin system, and a secure form builder.

Deployable on **Node-capable shared hosting (cPanel Node / Plesk) and VPS**.
Primary DB: **MySQL**. See `PLAN.md` (architecture) and `TODO.md` (status — all 6
MVP phases plus the form-builder plugin are complete).

---

## Tech stack (and why)

| Area | Choice | Notes |
|------|--------|-------|
| Framework | Next.js 16 App Router, React 19, TS strict | `output: "standalone"` |
| Styling | Tailwind v4 + ShadCN UI | **ShadCN here is Base UI–based**, not Radix — see Gotchas |
| DB / ORM | MySQL 8 + **Prisma 6** | Pinned to v6 on purpose (v7 dropped `url` from schema) |
| Auth | **Auth.js v5** (NextAuth beta) credentials, JWT sessions | Custom RBAC layer on top |
| Templating (themes) | **LiquidJS** | Sandboxed, logic-limited, safe for uploaded templates |
| Drag-and-drop | `@dnd-kit` | Layout builder, menu builder, form fields |
| Animation | **GSAP + ScrollTrigger** | Lazy-loaded UMD from `public/vendor/gsap` |
| Rich text | **Tiptap 3** (MIT/open source) | StarterKit + Link only (no paid Pro extensions) |
| Images | **sharp** | Optimized on upload |
| Sanitization | **sanitize-html** | `sanitizeRichText` + `sanitizeBlockHtml` |
| Validation | **zod** | `src/lib/validations/*` |
| Logging | **pino** | `src/lib/logger.ts` |

---

## Run it

```bash
# 1. Env: copy .env.example → .env, set DATABASE_URL + AUTH_SECRET
# 2. Schema + data
npm run db:push           # apply schema (we use db push; switch to migrate for prod)
npm run db:seed           # roles, permissions, content types, sample content, demo form
npm run db:install-themes # install + activate the bundled starter theme
# 3. Dev
npm run dev               # http://localhost:3000  → /setup on first run
```

Other scripts: `build` (`prisma generate && next build`), `start`, `typecheck`,
`lint`, `format` / `format:check`, `test` (Vitest), `test:e2e` (Playwright),
`db:migrate`, `db:deploy`, `db:studio`, `db:install-themes <folder> [--activate]`.

**Test admin (dev/seed):** `admin@example.com` / `password123` (create via the
`/setup` wizard, or set `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` before seeding).

Env vars (validated fail-fast in `src/lib/env.ts`): `DATABASE_URL`, `AUTH_SECRET`,
`APP_URL`, `AUTH_URL`, `STORAGE_DIR`, `NODE_ENV`, `LOG_LEVEL`.

---

## Directory map

```
src/
├── app/
│   ├── (site)/[[...slug]]/route.ts   # PUBLIC site renderer — a Route Handler that
│   │                                 # returns a full HTML document (NOT a React page)
│   ├── admin/login, app/setup        # unauthenticated admin entry
│   ├── admin/(protected)/            # authed admin — route group; its layout.tsx
│   │   ├── layout.tsx                #   requires a user + builds nav (RBAC + admin.menu hook)
│   │   ├── content/[type]/…          #   generic content CRUD per content type
│   │   ├── content-types, themes, customizer, layout, menus,
│   │   │   seo, media, analytics, settings, plugins, forms, users, account
│   ├── api/                          # auth/[...nextauth], track, health, forms/[slug]
│   ├── theme-assets/[slug]/[...path] # serves theme assets from storage
│   ├── media/[...path]               # serves uploaded media from storage
│   ├── sitemap.xml, robots.txt       # route handlers
│   └── layout.tsx                    # root layout (fonts + Toaster)
├── server/
│   ├── services/                     # business logic, all `import "server-only"`
│   │                                 #   content, content-type, taxonomy, seo, redirect,
│   │                                 #   theme, layout, menu, media, analytics, settings,
│   │                                 #   site-scripts, plugins, forms, access, editor-context
│   ├── theme/                        # LiquidJS engine, render pipeline, context, manifest
│   ├── layout/                       # component registry (HTML-string) + region renderer
│   ├── forms/render.ts               # form HTML + [flxform] shortcode replacement
│   ├── hooks/index.ts                # the hook bus (addAction/addFilter/doAction/applyFilters)
│   └── auth/                         # config.ts (edge-safe), index.ts (Node), guard.ts, actions.ts
├── plugins/registry.ts              # static plugin modules (powered-by, audit-log, form-builder)
├── lib/                             # db, env, logger, storage, rbac, slug, sanitize, rate-limit,
│                                    #   animation, layout-types, layout-components, forms,
│                                    #   seo-score, utils, validations/*
├── components/ui/                   # ShadCN (Base UI) primitives
├── components/admin/                # admin UI (editor, content, layout, menu, media, forms)
└── proxy.ts                         # edge gate for /admin (Next 16 "middleware")
prisma/schema.prisma, prisma/seed.ts
themes/starter, themes/minimal       # bundled theme SOURCES (installed into storage/themes/)
public/flx-anim.js, flx-analytics.js, flx-forms.js, *.css, vendor/gsap/*
storage/themes, storage/media        # persistent uploads (gitignored)
docs/theme-spec.md, docs/deploy.md
scripts/install-starter.ts, backup.sh, restore.sh
tests/unit (Vitest), tests/e2e (Playwright)
```

---

## Core conventions

- **Service layer:** all data/business logic lives in `src/server/services/*` and
  starts with `import "server-only"`. Pages/actions call services; they rarely query
  Prisma directly. The Prisma singleton is `@/lib/db`.
- **Mutations = Server Actions** in `actions.ts` files (`"use server"`). **Every
  admin action calls `requirePermission(<slug>)`** from `@/server/auth/guard` first,
  then validates input with a zod schema from `@/lib/validations/*`. Actions return
  `{ ok, error?, id? }`; the client toasts + `router.refresh()`.
- **RBAC:** permissions & roles are in `src/lib/rbac.ts` (`PERMISSIONS`, `ROLES`).
  Runtime: `can()`, `requirePermission()`, `requireUser()`, `hasPermission()`.
  **Super Admin bypasses all checks.** Adding a permission = edit `rbac.ts` + re-run
  `db:seed` (it syncs roles/permissions).
- **User management:** admin screens live under `/admin/users`, `/admin/users/roles`,
  and `/admin/account`. Mutations call `src/server/services/users.ts`, which protects
  against self-deactivation, self-demotion, and removing the last active Super Admin.
  Auth.js stores roles/permissions in JWT sessions, so role/capability changes are
  guaranteed on next login; current sessions may need re-login to see new claims.
- **User HTML is always sanitized server-side** before persistence/output:
  `sanitizeRichText` (Tiptap content), `sanitizeBlockHtml` (layout "Custom HTML").
- **Slugs:** `slugify` / `uniqueSlug` in `@/lib/slug`. **Logging:** `@/lib/logger`
  (pino) — don't `console.log` in server code. **Filesystem:** only via
  `@/lib/storage` (path-traversal safe, swappable for S3).

---

## The public rendering pipeline (important)

The public site is **not** React pages. `src/app/(site)/[[...slug]]/route.ts` is a
Route Handler that:

1. Checks redirects (`matchRedirect`) → 301/302 if matched.
2. Resolves the path to a live `ContentEntry` (`resolveRoute`; treats scheduled-but-
   due as published).
3. Renders it through the **active theme** via LiquidJS (`renderEntry` in
   `src/server/theme/render.ts`) → a complete HTML document string.
4. Post-processes the string in `finalize()`:
   - `enhanceLayout` — injects `flx-layout.css` (when a region exists) and
     `flx-anim.js` (when any `[data-anim]` exists).
   - `injectSiteScripts` — analytics beacon + GA/GSC/Clarity from settings.
   - `hooks.applyFilters(HOOKS.pageHtml, html)` — plugins transform final HTML (how
     the **form-builder** renders `[flxform]` shortcodes; how **powered-by** works).

**Themes** = HTML/Liquid in `storage/themes/<slug>/` (sources under `themes/`). The
template context (`site`, `page`, `region.header/footer`, `menus`, `customizer.css`,
`seo`, `year`) is documented in `docs/theme-spec.md`. Headers/footers/areas are JSON
component trees rendered to HTML by the **component registry**
(`src/server/layout/registry.ts`) and injected into theme regions.

---

## Subsystems at a glance

- **Theme engine:** `src/server/theme/*` (LiquidJS engine cached per active theme;
  call `invalidateThemeCache()` after install/activate/customizer/settings changes).
- **Layout & animation:** `src/server/layout/*` (registry + region render),
  `src/lib/animation.ts` (presets + `data-anim` serialization), `public/flx-anim.js`
  (lazy GSAP runtime; honors `prefers-reduced-motion`; SSR/SEO-safe).
- **Hooks/plugins:** `src/server/hooks/index.ts` (bus), `src/plugins/registry.ts`
  (modules), `src/server/services/plugins.ts` (sync/load/enable). Core hooks:
  `content.afterSave`, `page.context`, `page.html`, `admin.menu`. Enabled state lives
  in the DB; `ensurePluginsLoaded()` re-validates on a 1s TTL.
- **Forms (plugin):** `src/server/services/forms.ts` (secure submit: honeypot +
  time-trap + rate-limit + same-origin + validation + optional Turnstile),
  `src/server/forms/render.ts` (shortcode → form HTML), `public/flx-forms.{js,css}`,
  admin under `/admin/forms`. Embed via `[flxform slug="…"]` or the "Form" component.
- **SEO/Media/Analytics:** per-entry SEO in the entry editor (live score from
  `src/lib/seo-score.ts`); `sitemap.xml`/`robots.txt` handlers; redirect manager;
  media library (sharp); first-party analytics (`/api/track`, privacy-hashed) +
  dashboard; integrations via Settings.

---

## Gotchas (read before coding)

- **ShadCN is Base UI–based here, not Radix.** Therefore:
  - `Select` `onValueChange` yields `string | null` — handle the null
    (`(v) => set(v ?? "default")`).
  - `Dialog`/`DropdownMenu` triggers use a **`render` prop**, not `asChild`.
  - `Slot` comes from `"radix-ui"` as `Slot.Root`.
- **Auth redirect loop:** the login page must stay OUTSIDE the `(protected)` route
  group (whose layout calls `requireUser()`), or it redirects to itself. Gating is
  via the `authorized` callback in `src/server/auth/config.ts` + `src/proxy.ts`.
- **Prisma pinned to v6** — don't bump to v7 without adopting the driver-adapter
  config model.
- **DB workflow:** currently `prisma db push` (no `migrations/` folder yet). Switch
  to `prisma migrate` for production.
- **Lint/format ignores:** `public/**` is ESLint-ignored; `public/vendor` + `*.md`
  are Prettier-ignored.
- **Plugin toggles in dev** can take ~1s to reflect (TTL) because Next dev may load
  separate module graphs for actions vs route handlers; instant in production.
- **Verification bar:** keep `typecheck`, `lint`, `format:check`, `test`, `build`,
  and Playwright (`tests/e2e`) green. Run `npm run dev`, then
  `E2E_BASE_URL=http://localhost:3000 npx playwright test` to reuse the server.

---

## How to extend (recipes)

- **Admin page:** create `src/app/admin/(protected)/<x>/page.tsx`, call
  `requirePermission(<slug>)`, add a nav entry in
  `src/components/admin/nav-items.ts`, put mutations in `actions.ts`.
- **Content field type:** extend `FIELD_TYPES` in
  `src/lib/validations/content.ts` and render it in `entry-editor.tsx` (`CustomField`).
- **Layout component:** add a renderer in `src/server/layout/registry.ts`
  (`COMPONENTS` + `COMPONENT_TYPES`) and a client def in
  `src/lib/layout-components.ts`. Output is HTML; `data-anim` is supported.
- **Plugin:** add a `PluginModule` to `src/plugins/registry.ts` (manifest +
  `register(api)` using `api.addAction`/`api.addFilter` against `HOOKS.*`). It
  appears under `/admin/plugins`; enabling registers its hooks.
- **Theme:** a folder with `theme.json` + `templates/` + `partials/` + `assets/`
  (see `themes/starter` and `docs/theme-spec.md`). Install via `/admin/themes` (zip)
  or `db:install-themes`.
