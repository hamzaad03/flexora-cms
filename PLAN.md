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
- **Menu visibility & feature flags** layer on top of permissions (see
  "Page Designer & Platform Enhancements" below) — decouples *what a role can see*
  from *what it is allowed to do*.

### 8. Media Library
- Upload, folders, image metadata (width/height/alt/caption), optimization (sharp).
  Storage abstraction for future CDN/S3.

### 9. Plugin / Hooks Framework (foundation in MVP)
- Server-side hook bus: `hooks.addAction()` / `hooks.addFilter()` with events
  `beforeSavePost`, `afterSavePost`, `beforeRenderPage`, `adminMenu`. Plugin manifest +
  enable/disable. Stable API; defer dynamic plugin loading.

---

## Page Designer & Platform Enhancements

These are concepts distilled from the original architecture blueprint
(`ALTERNATE_CMS_PLAN.md`, written for the PHP era and still authoritative as a spec)
and mapped onto the live Next.js/TypeScript/Prisma stack. Two — the **page-designer
block model + animation/style-panel contract** and **per-role menu visibility +
feature flags** — are the headline adoptions; the rest are smaller, additive wins.

### A. Page Designer — block model (Section → Column → Block)

The visual page builder is no longer deferred; it is being built now under
`src/components/admin/builder/*`, `src/lib/builder/*`, and
`src/server/services/builder.ts`. The blueprint's `Page → Sections → Columns →
Blocks` taxonomy maps onto a **single recursive node tree** (`BuilderDocument`
v2, `src/lib/builder/document.ts`) so the format stays framework-neutral and
portable (compiles to plain HTML + scoped CSS — never Tailwind in the saved page).

```
BuilderDocument (version 2, type "page")
└── BuilderNode[]                       ← top-level sections
     • container types: section, container, grid   (the "Section / Column" layer)
     • leaf types:      richText, heading, image, button, icon, shortcode,
                        html, form, spacer          (the "Block" layer)
     • each node: { id, type, props, styles, advancedCss?, children[] }
```

Guard rails (already enforced on save): `MAX_DEPTH = 8`, `MAX_NODES = 500`,
`MAX_CHILDREN = 60`. Stored JSON is safe-parsed with v1→v2 migration so older
documents never break the canvas. Unknown/future node types render to nothing
rather than erroring — forward-compatible by design.

### B. Style panel — per-breakpoint contract

Each node carries a **responsive style map** rather than utility classes. The
Style Panel writes a neutral, kebab-case CSS-property map per breakpoint; the
token-first compiler (`src/lib/builder/styles.ts`) emits scoped rules keyed by a
generated `.flx-node-<id>` class.

```
ResponsiveStyles = {
  base?:  StyleMap   // mobile-first default
  sm?:    StyleMap   // @media (min-width: 640px)
  md?:    StyleMap   // @media (min-width: 768px)
  lg?:    StyleMap   // @media (min-width: 1024px)
  hover?: StyleMap   // :hover state
}
advancedCss?: string  // raw escape-hatch, declarations only
```

- **Breakpoints** map directly to the blueprint's Desktop/Tablet/Mobile tabs
  (mobile-first: `base` → `sm` → `md` → `lg`).
- **Security is enforced at compile time:** only a whitelisted set of CSS
  properties is emitted; every value is sanitized against declaration break-out,
  selector injection, `@import`/`expression()`, and unsafe `url()` — essential
  because these pages render inside *untrusted, agency-uploaded* themes. The
  `advancedCss` escape hatch accepts declarations only (no nested rules/selectors).

### C. Animation panel — contract (to finish wiring)

The animation model already exists in `src/lib/animation.ts` (types, presets,
eases, `data-anim*` serialization) and the GSAP runtime (`public/flx-anim.js`)
reads it. **The remaining work is to make a builder node's animation a
first-class, structured field** instead of the current bare `props.anim` string
emitted by `src/lib/builder/render.ts`.

Target per-node shape (Animation Panel writes this; renderer serializes via the
existing `animAttrString`):

```
node.props.anim = {
  type:     fade | slide-up/down/left/right | zoom-in/out | flip | rotate | blur | none
  trigger:  onload | onscroll        // ScrollTrigger when onscroll
  duration, delay, ease, stagger     // stagger applies to a container's children
  once                               // play once vs. replay
}
```

- One-click **presets** ("Fade Up", "Zoom In On Scroll", …) plus fine-tuning,
  matching the blueprint's Animation Panel.
- Runtime stays presentation-only and lazy-loaded (GSAP injected only when a page
  contains `[data-anim]`); honors `prefers-reduced-motion`; content renders fully
  without JS (SSR/SEO-safe).
- Theme-level GSAP defaults/presets may seed values; per-block config overrides.

### D. Per-role admin menu visibility

Decouples *"can see the menu item"* from *"has the capability"* — a role may hold
a permission yet have a menu entry hidden, and vice-versa. The sidebar is already
RBAC-driven via `src/components/admin/nav-items.ts` (each `NavItem` declares an
optional `permission`); this adds a **visibility override layer** on top.

- New table `role_menu_visibility (role_id, menu_item_key, visible)`. `menu_item_key`
  = a stable key per nav entry (e.g. `content.pages`, `appearance.themes`).
- Nav build order: filter by `permission` (current behavior) **then** subtract any
  entries a role has explicitly hidden. Super Admin bypasses both.
- Managed under `Users → Roles → [role] → Admin Menu Visibility` (checkbox tree
  mirroring `NAV`). Default = visible, so existing installs are unchanged.

### E. Feature flags per role

Gates whole features (independently of menus/permissions) — e.g. enable the Page
Designer for Editors but not Authors; gate the GSAP animation editor, REST API
access, analytics, etc.

- New table `feature_flags (key, module, enabled_for_roles JSON)` (+ a runtime
  helper `featureEnabled(key, userRoles)` alongside `can()`).
- Checked in both the server guard and UI gating, same pattern as `requirePermission`.
- Managed under `Settings → Feature Flags`. Super Admin always passes.

### F. Audit log (structured who-did-what)

An audit-log plugin already exists; this formalizes a **structured schema** as the
reference target so entries are queryable, not just textual.

```
audit_log (id, user_id, action, model_type, model_id,
           old_values JSON, new_values JSON, ip_address, user_agent, created_at)
  indexes: (user_id), (action), (created_at)
```

Written from the service layer / hook bus (`afterSavePost`, role changes, plugin
toggles, login). Viewable by Super Admin; scoped for others.

### G. CSP builder + security-header defaults (Settings)

- Ship the standard hardening headers by default (set in `src/proxy.ts` /
  response finalize): `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options:
  nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`,
  and HSTS when `APP_URL` is HTTPS.
- A **CSP builder UI** under `Settings → Security` to assemble a
  `Content-Security-Policy` from toggles/allow-lists instead of hand-writing the
  header string. Stored in `settings`; injected at render.

### H. OAuth from the admin UI (keys in DB, not just `.env`)

Let Super Admin configure Google/Microsoft social login from
`Settings → Authentication` without editing `.env`.

- Provider keys (client id/secret, allowed domains, auto-register, default role)
  stored **encrypted** in `settings` (AES-GCM via an app key); secrets masked in
  the UI. `.env` remains a valid fallback/override.
- Wired as additional Auth.js providers, enabled per the stored toggle.

### I. Media pipeline — LQIP + responsive `srcset`

Extend the existing `sharp` upload pipeline:

- Generate multiple sizes on upload (thumb/medium/large/original) and emit
  `srcset` + `sizes` automatically wherever media renders (builder `image` block,
  theme images).
- Produce a tiny blurred **LQIP** placeholder (inline data-URI / dominant color)
  for blur-up loading, paired with native `loading="lazy"`.

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

**Post-MVP / in progress:** the **visual page designer** (block model + style &
animation panels — see "Page Designer & Platform Enhancements") is now being built;
per-role menu visibility, feature flags, structured audit log, CSP builder,
OAuth-from-admin-UI, and the LQIP/`srcset` media upgrade follow as additive layers.

**Still deferred:** visual theme builder, GraphQL, AI SEO score, shop, multi-site.

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
