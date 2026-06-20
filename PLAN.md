# FlxOraCMS — Architecture & MVP Plan

## Context

We are building a self-hosted CMS (working name **FlxOraCMS**) that lets agencies
build and manage websites, deployable on **Node-capable shared hosting and VPS**,
with **MySQL** as the primary database. The differentiator is not "WordPress in
Next.js" — it is a CMS where a designer can **upload a purchased HTML/CSS/JS theme
and have a live, editable site in minutes**, with native SEO (a Yoast alternative),
native analytics, custom content types, and a header/footer/block builder — without
writing backend code.

### Decisions locked

| Area | Decision |
|------|----------|
| Stack | **Next.js 15+ (App Router) + TypeScript + TailwindCSS + ShadCN UI** |
| Database | **MySQL** via **Prisma** (typed client + migrations) |
| API | **REST-only** for MVP (Next.js Route Handlers). GraphQL deferred. |
| Theme engine | **Runtime HTML templates** with placeholders. NO rebuild to add a theme. |
| Deploy target | **Node shared host (cPanel Node / Plesk) + VPS.** `standalone` output, persistent disk, no edge-only features. |
| Admin UI | Server-rendered React (App Router) + ShadCN; React Hook Form + Zod. |
| Animation | **GSAP + ScrollTrigger** (lazy-loaded), per-block animation config in the editor. |

### The core architectural reconciliation (the crux)

The original spec mixed `.tsx` themes with "upload HTML, live in minutes." Those are
incompatible. Resolution:

- **Theme = page structure**, supplied as **HTML templates with placeholders**
  (`{{ content }}`, `{{ header }}`, `{{ footer }}`, `{{ menu.main }}`, loops over
  posts, etc.). Rendered at runtime by a template engine — no compile step.
- **Headers, footers, blocks, theme areas = dynamic content**, stored as **JSON
  component trees** and rendered by a **fixed registry of native React components**
  (Logo, Menu, Button, Search, Social, etc.). These are injected into the theme's
  placeholder *regions*.

So the theme controls layout/markup; the CMS controls the dynamic pieces that drop
into named regions. This is what makes both "upload any HTML theme" and "drag-and-drop
header builder" true at the same time.

---

## Tech Stack (concrete)

- **Runtime:** Node 20+, Next.js 15 App Router, output `standalone`.
- **Language:** TypeScript (strict).
- **DB:** MySQL 8 + Prisma ORM. Migrations via `prisma migrate`.
- **Templating (themes):** **LiquidJS** — designed for *untrusted, user-supplied*
  templates (Shopify uses it), sandboxed, logic-limited, supports filters/loops.
  Safer than Handlebars/EJS for agency-uploaded markup.
- **Auth:** **Auth.js (NextAuth v5)** credentials provider + Prisma adapter for
  sessions; **custom RBAC layer** (roles → permissions) via middleware +
  server-side `can(user, permission)` guard. Passwords: `bcrypt`/`argon2`.
- **UI:** TailwindCSS, ShadCN UI, React Hook Form, Zod, `@dnd-kit` for drag-and-drop
  (menus, header/footer builder).
- **Animation:** **GSAP + ScrollTrigger** (lazy-loaded), per-block animation config
  chosen in the editor. Respects `prefers-reduced-motion`; SSR/SEO-safe.
- **Rich content (MVP):** **Tiptap** (rich text → stored HTML). Full block editor is
  Phase 2 (deferred).
- **Validation:** Zod schemas shared between API route handlers and forms.
- **File storage:** local persistent disk (`/storage`) with a storage abstraction so
  S3/CDN can be swapped in later.

---

## High-Level Layout

```
Next.js app (single deployable, standalone output)
├── /(site)          → front-end site renderer (theme engine)
├── /admin           → admin dashboard (RBAC-gated)
├── /api/*           → REST Route Handlers
└── Services layer   → Content, Theme, Render, Menu, SEO, Analytics, Media,
                       User/Auth, Settings, Plugin/Hooks
        └── Prisma → MySQL
storage/
├── themes/<slug>/   → uploaded/extracted theme files (templates, assets)
└── media/           → uploaded media library files
```

---

## Data Model (core tables — Prisma models)

Auth & access: `users`, `roles`, `permissions`, `role_permissions`, `sessions`.

Content (generic, WP "post types" → **Collections**):
- `content_types` (slug, label, singular/plural, supports: SEO/revisions/author, icon)
- `content_fields` (per content_type custom fields: name, type, config)
- `content_entries` (content_type_id, title, slug, status, author_id, template_id,
  published_at, content_html / content_json, parent_id for page hierarchy)
- `content_field_values` (entry_id, field_id, value) — EAV for custom fields
- `revisions` (entry_id, snapshot_json, author_id, created_at)
- `taxonomies` + `terms` + `entry_terms` (categories, tags — reusable across types)

Theming & layout:
- `themes` (slug, name, version, manifest_json, active flag, screenshot)
- `templates` (theme_id, name, file_path, type: home/page/post/archive/404/search)
- builder content: `headers`, `footers`, `theme_areas`
  (name, type, status, content_json, settings_json) + assignment rules
- `customizer_settings` (key/value: colors, fonts, logo, layout) — global
- `menus`, `menu_items` (parent_id nesting, type: page/post/category/url/custom,
  mega-menu config_json)

SEO / analytics / media / settings:
- `seo_meta` (entry_id, title, description, canonical, robots, og_image, schema_json,
  focus_keyword, scores_json)
- `redirects` (from, to, code)
- `page_views` (path, visitor_hash, referrer, country, device, ts)
- `media` (path, mime, width, height, alt, caption, folder_id), `media_folders`
- `settings` (site identity, integrations: GA/GSC/Clarity keys), `plugins` (manifest,
  enabled).

---

## Module Design

### 1. Theme Engine (highest risk — build first, vertical slice)
- **Theme package** = zip uploaded via admin → validated → extracted to
  `storage/themes/<slug>/`. Manifest `theme.json` declares: name, version, templates,
  regions, supported menu locations, customizer fields.
- **Structure:** `theme.json`, `templates/` (`home.html`, `page.html`, `post.html`,
  `archive.html`), `partials/` (`header.html`, `footer.html`), `assets/`.
- **Placeholder contract (LiquidJS):** `{{ site.title }}`, `{{ content }}`,
  `{{ title }}`, `{{ featured_image }}`, region tags `{{ region.header }}`,
  `{{ region.footer }}`, `{{ menu.main }}`, loop helpers for archives
  (`{% for post in posts %}`). Documented in `docs/theme-spec.md`.
- **Render pipeline (Render Service):**
  1. Resolve route → content entry → its `template_id` (or type default).
  2. Load theme template HTML + assigned header/footer/area JSON.
  3. Render header/footer/area JSON via **native React component registry** to HTML.
  4. Bind data + region HTML into the Liquid template → final HTML.
  5. Inject customizer values as `:root{ --primary: … }` CSS variables + theme assets.
- **Import helper:** detect `<header>`/`<footer>`/`<nav>` in raw uploaded HTML and
  suggest region wrapping — assist, not full auto-magic, for MVP.

### 2. Content & Custom Content Types (Collections)
- Admin UI to define a content type, its fields, and behaviors → drives generic CRUD
  screens. Pages and Blog ship as **seeded default content types**. Tiptap for body
  content (MVP); block editor Phase 2.
- Revisions, drafts, scheduled publish, taxonomies, authors, featured/related.

### 3. Animation Styling (GSAP)
- **Every block/section** carries an optional `animation` config in its JSON: `type`
  (fade, slide-up/down/left/right, zoom-in/out, flip, rotate, blur, none), `trigger`
  (`onLoad` | `onScroll` via ScrollTrigger), `duration`, `delay`, `easing`, `stagger`,
  `once`/replay.
- **Editor UI:** an "Animation" tab in each block's settings panel with presets
  ("Fade Up", "Zoom In On Scroll") + fine-tuning + live preview.
- **Runtime:** one client-side **GSAP + ScrollTrigger** runtime reads `data-anim`
  attributes and wires tweens on mount. **Lazy-loaded only when a page has animations.**
  Honors `prefers-reduced-motion`. Presentation-only — content renders without JS
  (SSR/SEO-safe). Themes may declare default presets; block config overrides them.

### 4. Header / Footer / Theme-Area Builder
- Drag-and-drop (`@dnd-kit`) builder producing `content_json` (rows → columns →
  components). Registry: Logo, Menu, Button, Search, Social, Language, Phone, Email,
  Cart, Login, Custom HTML.
- Multiple named headers/footers with **assignment rules** (per content type, per
  entry, default). Sticky/transparent/scroll in `settings_json`. Mega-menu via
  `menu_items.config_json`.

### 5. SEO Engine (Yoast alternative)
- Per-entry meta editor (title, description, canonical, robots, OG image, schema).
- **Live analysis:** keyword density, meta length, headings, internal/external links,
  image alt coverage → score. Sitemap.xml + robots.txt generation. Redirect manager.
  (AI score / entity analysis = post-MVP.)

### 6. Analytics (native)
- Lightweight first-party tracking script → `/api/track` → `page_views`. Dashboard:
  views, visitors, referrers, countries, devices, top pages. Visitor hashing for
  privacy. External integrations (GA/GSC/Clarity) = settings-driven script injection.

### 7. User Management & RBAC
- Roles: Super Admin, Admin, Editor, Author, Contributor, Subscriber. Permissions
  stored separately; `can()` guard on every admin route handler + UI gating.

### 8. Media Library
- Upload, folders, image metadata (width/height/alt/caption), optimization (sharp).
  Storage abstraction for future CDN/S3.

### 9. Plugin / Hooks Framework (foundation in MVP)
- Server-side hook bus: `hooks.addAction()` / `hooks.addFilter()` with events
  `beforeSavePost`, `afterSavePost`, `beforeRenderPage`, `adminMenu`. Plugin manifest +
  enable/disable. Stable API; defer dynamic plugin loading.

---

## MVP Phasing

- **Phase 0 — Foundation:** scaffold Next.js + TS + Tailwind + ShadCN; Prisma + MySQL,
  base schema, migrations, seeders; Auth.js + RBAC; `/admin` shell.
- **Phase 1 — Theme engine vertical slice (de-risk early):** LiquidJS render service,
  theme upload/extract/activate, bundled starter theme, customizer, public render.
- **Phase 2 — Content core:** custom content types + fields, seeded Pages & Blog,
  Tiptap, taxonomies, revisions/drafts, menus + builder, template assignment.
- **Phase 3 — Layout & animation builders:** header/footer/theme-area JSON builder +
  native component registry + assignment rules + GSAP animation UI/runtime.
- **Phase 4 — SEO + Media + Analytics.**
- **Phase 5 — Plugin/Hooks foundation + hardening + deploy docs.**

**Deferred (post-MVP):** full block/page builder, visual theme builder, GraphQL,
AI SEO score, shop, multi-site.

---

## Project Structure

```
src/
├── app/
│   ├── (site)/[[...slug]]/page.tsx     # public renderer entry
│   ├── admin/                          # dashboard (RBAC-gated layout)
│   └── api/                            # REST route handlers
├── server/
│   ├── services/                       # content, theme, render, menu, seo,
│   │                                   #   analytics, media, user, settings
│   ├── theme/                          # LiquidJS engine, parser, region binder
│   ├── blocks/                         # native React component registry
│   ├── auth/                           # Auth.js config + RBAC (can())
│   └── hooks/                          # plugin hook bus
├── lib/ (db client, storage, zod schemas, utils)
└── components/ (ShadCN-based admin UI)
prisma/ (schema.prisma, migrations, seed.ts)
storage/ (themes/, media/)   docs/ (theme-spec.md, deploy.md)
```

---

## Production Readiness (first-class workstreams)

- **Security:** Zod-validated input on every route handler; CSRF on admin mutations;
  output escaping (LiquidJS auto-escape; sanitize Tiptap HTML with `sanitize-html`);
  Prisma parameterized queries; rate limiting on auth + `/api/track`; secure session
  cookies (httpOnly/SameSite/Secure); server-side RBAC on every admin action; secrets
  in env; theme zip validation (zip-slip guard, type/size limits, no executable assets).
- **Reliability:** centralized error handling + typed API errors; structured logging
  (pino); DB pooling; transactions for multi-row writes; health-check endpoint.
- **Performance:** rendered-page + theme-template caching; image optimization (sharp);
  lazy-load GSAP; indexes on slugs/FKs/`published_at`; pagination on list APIs.
- **SEO/observability:** sitemap, robots, canonical, OG, schema, redirects; analytics
  dashboard; optional Sentry-compatible error hook.
- **Quality gates:** TypeScript strict; ESLint + Prettier; **Vitest** unit tests
  (theme render, RBAC, SEO scoring); **Playwright** E2E for critical flows; GitHub
  Actions CI (lint + typecheck + test + build).
- **Ops/deploy:** `.env.example`; `output: 'standalone'`; documented shared-host
  (cPanel Node / Plesk) + VPS deploy in `docs/deploy.md`; Prisma migration workflow;
  backup/restore (mysqldump + `storage/`); seed + first-run setup wizard.

---

## Verification

- **DB/auth:** `prisma migrate dev` + seed; log in as Super Admin; confirm an Editor is
  blocked from a Super-Admin-only route.
- **Theme engine (key test):** upload bundled theme zip → activate → create a Page →
  visit URL → renders through Liquid template with header/footer regions + customizer
  colors. Change a customizer color → reflected without redeploy. Upload a second theme,
  switch → same content under new markup.
- **Content:** define a custom content type + field, create/edit (Tiptap), save a
  revision, publish; confirm it lists in an archive loop.
- **Layout/animation:** build a menu + header via drag-and-drop; add a "Fade Up on
  Scroll" GSAP animation to a section → animates on scroll, renders with JS disabled,
  suppressed under `prefers-reduced-motion`.
- **SEO:** set meta + focus keyword → live score; `/sitemap.xml` + `/robots.txt`
  generate; a redirect 301s.
- **Analytics:** load a public page → `page_views` row recorded and shown in dashboard.
- **Deploy smoke test:** `next build` (standalone) → `node server.js` against MySQL →
  media/theme uploads persist on disk.
