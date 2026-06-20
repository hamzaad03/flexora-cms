# FlxOraCMS — Build Checklist

Module-wise execution checklist. Checked off as each module lands. See `PLAN.md` for
architecture detail.

---

## 0. Foundation
- [x] Next.js 16 + TypeScript + TailwindCSS v4 + ShadCN UI scaffold (`output: 'standalone'`)
- [x] Project structure (`src/app`, `src/server`, `src/lib`, `src/components`)
- [x] Prisma + full base `schema.prisma` (data model for all modules) + `.env.example`
- [ ] Initial migration (`prisma migrate dev`) — pending a live MySQL connection
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
- [ ] LiquidJS render service + sandboxed config
- [ ] Placeholder/region contract + `docs/theme-spec.md`
- [ ] Theme zip upload → validate (zip-slip guard, type/size limits)
- [ ] Extract to `storage/themes/<slug>/`, parse `theme.json` manifest
- [ ] Theme activate / switch (active flag in `themes`)
- [ ] Bundled starter theme (templates + partials + assets)
- [ ] Customizer (colors/fonts/logo → `:root` CSS variables)
- [ ] Public route `(site)/[[...slug]]` → renders entry through theme
- [ ] Theme asset serving + render cache
- [ ] HTML import helper (detect header/footer/nav → suggest regions)

## 2. Content Core
- [ ] `content_types` + `content_fields` admin UI (Collections)
- [ ] Generic CRUD screens driven by content type definition
- [ ] Seeded Pages & Blog content types
- [ ] Tiptap rich-text editor → sanitized HTML storage
- [ ] Drafts + scheduled publish (`published_at`)
- [ ] Revisions (snapshot + restore)
- [ ] Taxonomies (categories/tags), terms, entry-term links
- [ ] Authors, featured/related entries
- [ ] Template assignment per entry/type
- [ ] EAV custom field values (`content_field_values`)

## 3. Layout & Animation Builders
- [ ] `@dnd-kit` row/column/component builder → `content_json`
- [ ] Native component registry (Logo, Menu, Button, Search, Social, Language, Phone,
      Email, Cart, Login, Custom HTML)
- [ ] Headers / Footers / Theme Areas CRUD + assignment rules (type/entry/default)
- [ ] Sticky / transparent / scroll-behavior settings (`settings_json`)
- [ ] Menus + drag-drop nested menu builder
- [ ] Mega-menu (multi-column + featured) via `menu_items.config_json`
- [ ] Region renderer: JSON → native React components → HTML injected into theme
- [ ] GSAP animation config UI (per block: type/trigger/duration/delay/easing/stagger)
- [ ] Animation presets ("Fade Up", "Zoom In On Scroll") + live preview
- [ ] GSAP + ScrollTrigger runtime (lazy-loaded, `data-anim` driven)
- [ ] `prefers-reduced-motion` handling; SSR/SEO-safe (no-JS renders content)

## 4. SEO / Media / Analytics
- [ ] SEO meta editor (title, description, canonical, robots, OG image, schema)
- [ ] Live SEO scoring (keyword density, meta length, headings, links, alt coverage)
- [ ] `sitemap.xml` + `robots.txt` generation
- [ ] Redirect manager (301/302)
- [ ] Media library: upload, folders, metadata, sharp optimization
- [ ] Storage abstraction (local now, S3/CDN later)
- [ ] Native analytics: tracking script + `/api/track` → `page_views`
- [ ] Analytics dashboard (views, visitors, referrers, countries, devices, top pages)
- [ ] External integrations (GA / GSC / Clarity) via settings-driven script injection

## 5. Plugin Framework + Hardening
- [ ] Hook bus: `addAction` / `addFilter` + core events (before/after save, render, adminMenu)
- [ ] Plugin manifest + enable/disable
- [ ] Settings module (site identity, integration keys)
- [ ] Security pass: CSRF, rate limits, sanitization audit, RBAC audit, secure cookies
- [ ] Performance pass: caching, indexes, pagination, image sizes
- [ ] Backup/restore (mysqldump + `storage/`)
- [ ] Deploy docs (`docs/deploy.md`): shared host (cPanel Node / Plesk) + VPS
- [ ] E2E test pass on all Verification flows
- [ ] Health-check endpoint + structured logging review

## Deferred (post-MVP)
- [ ] Full Tiptap block/page builder (blocks → JSON)
- [ ] Visual drag-drop theme builder
- [ ] GraphQL API
- [ ] AI SEO score (entities, citations, topical depth)
- [ ] Shop / e-commerce
- [ ] Multi-site / multi-tenant
- [ ] Form builder + CRM integration
