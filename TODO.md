# FlxOraCMS — Build Checklist

Module-wise execution checklist. Checked off as each module lands. See `PLAN.md` for
architecture detail.

---

## 0. Foundation
- [x] Next.js 16 + TypeScript + TailwindCSS v4 + ShadCN UI scaffold (`output: 'standalone'`)
- [x] Project structure (`src/app`, `src/server`, `src/lib`, `src/components`)
- [x] Prisma + full base `schema.prisma` (data model for all modules) + `.env.example`
- [x] Initial migration (`prisma migrate dev`) — pending a live MySQL connection
- [x] Seeders (`prisma/seed.ts`): roles, permissions, default content types, settings
- [x] Auth.js (NextAuth v5) credentials provider (JWT) + adapter tables for future OAuth
- [x] RBAC layer: roles/permissions tables, `can(user, permission)` guard, proxy gate
- [x] Admin shell layout (`/admin`) — permission-filtered nav, ShadCN theme
- [x] First-run setup wizard (create Super Admin)
- [x] Tooling: ESLint + Prettier, strict TS config
- [x] Testing: Vitest (unit, RBAC covered) + Playwright (E2E smoke) setup
- [x] GitHub Actions CI (typecheck + lint + format + test + build)
- [x] `.env.example`, env validation (zod), logging (pino), storage abstraction

## 1. Theme Engine
- [x] LiquidJS render service + sandboxed config (engine per theme, asset filter)
- [x] Placeholder/region contract + `docs/theme-spec.md`
- [x] Theme zip upload → validate (zip-slip guard, size cap, executable blocklist)
- [x] Extract to `storage/themes/<slug>/`, parse `theme.json` manifest (zod)
- [x] Theme activate / switch (active flag in `themes`, atomic)
- [x] Bundled starter theme (+ minimal theme) — auto-install + CLI `db:install-themes`
- [x] Customizer (colors/fonts → `:root` CSS variables, reflects without rebuild)
- [x] Public route `(site)/[[...slug]]` → renders entry through theme (+ 404)
- [x] Theme asset serving (`/theme-assets/<slug>/…`) + template/engine cache
- [ ] HTML import helper (detect header/footer/nav → suggest regions) — deferred to Phase 3

## 2. Content Core
- [x] `content_types` + `content_fields` admin UI (Collections)
- [x] Generic CRUD screens driven by content type definition
- [x] Seeded Pages & Blog content types (+ sample content)
- [x] Tiptap rich-text editor → sanitized HTML storage (sanitize-html allowlist)
- [x] Drafts + scheduled publish (`published_at`; scheduled-due served publicly)
- [x] Revisions (snapshot + restore)
- [x] Taxonomies (categories/tags), terms, entry-term links (inline assignment)
- [x] Authors (assigned on create); featured/related — deferred (needs media, Phase 4)
- [x] Template assignment per entry/type
- [x] EAV custom field values (`content_field_values`)

## 3. Layout & Animation Builders
- [x] `@dnd-kit` row/column/component builder → `content_json`
- [x] Native component registry (Logo, Menu, Button, Search, Social, Language, Phone,
      Email, Cart, Login, Custom HTML)
- [x] Headers / Footers / Theme Areas CRUD + assignment rules (type/entry/default)
- [x] Sticky / transparent / scroll-behavior settings (`settings_json`)
- [x] Menus + drag-drop nested menu builder (reorder + indent/outdent)
- [x] Mega-menu via `menu_items.config_json` (toggle + CSS)
- [x] Region renderer: JSON → component registry → HTML injected into theme regions
- [x] GSAP animation config UI (per row & component: type/trigger/duration/delay/easing/stagger)
- [x] Animation presets ("Fade Up", "Zoom In On Scroll", …)
- [x] GSAP + ScrollTrigger runtime (lazy-loaded, `data-anim` driven, auto-injected)
- [x] `prefers-reduced-motion` handling; SSR/SEO-safe (no-JS renders content)

## 4. SEO / Media / Analytics
- [x] SEO meta editor (title, description, canonical, robots, OG image, schema) — in entry editor
- [x] Live SEO scoring (keyword density, meta length, headings, links, alt coverage)
- [x] `sitemap.xml` + `robots.txt` generation
- [x] Redirect manager (301/302) — admin + applied in public route
- [x] Media library: upload, metadata, sharp optimization (folders: model ready, UI later)
- [x] Storage abstraction (local now, S3/CDN later) — used by media + themes
- [x] Native analytics: tracking script + `/api/track` → `page_views` (privacy-hashed)
- [x] Analytics dashboard (views, visitors, referrers, countries, devices, top pages)
- [x] External integrations (GA / GSC / Clarity) via settings-driven script injection

## 5. Plugin Framework + Hardening
- [x] Hook bus: `addAction` / `addFilter` + core events (afterSave, page context/html, adminMenu)
- [x] Plugin manifest + enable/disable (registry + admin UI + 2 sample plugins)
- [x] Settings module (site identity, integration keys) — built in Phase 4
- [x] Security pass: rate limits (login + track), secure cookies + trustHost, JSON-LD escape,
      sanitization (Tiptap + block HTML) + server-side RBAC on every action
- [x] Performance pass: indexes (slugs/FKs/status/contentType), sharp image sizing,
      template/engine cache, list pagination caps
- [x] Backup/restore (`scripts/backup.sh` + `restore.sh`: mysqldump + `storage/`)
- [x] Deploy docs (`docs/deploy.md`): standalone packaging, pm2/systemd, Nginx, health, backups
- [x] E2E test pass on all Verification flows (9 Playwright tests)
- [x] Health-check endpoint (`/api/health`) + structured logging (pino) review

## 6. Form Builder (plugin)
- [x] Form + FormSubmission models; field types + validations
- [x] Form builder admin (dnd fields, settings) + submissions inbox
- [x] Secure submit handler: honeypot + time-trap + rate-limit + validation + same-origin
- [x] Cloudflare Turnstile (optional, global settings) + verification
- [x] Embed via `[flxform slug="…"]` shortcode + "Form" layout component
- [x] Delivered as a toggleable plugin (hook bus: page-html + admin-menu)
- [x] Progressive-enhancement client (`flx-forms.js`) + styles
- [ ] Email notifications + CRM integration (deferred)

## Deferred (post-MVP)
- [ ] Full Tiptap block/page builder (blocks → JSON)
- [ ] Visual drag-drop theme builder
- [ ] AI SEO score (entities, citations, topical depth)
- [ ] Shop / e-commerce
- [ ] Multi-site / multi-tenant
- [ ] Form email notifications + CRM integration
