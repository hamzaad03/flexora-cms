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

## 7. User Management + RBAC
- [x] Review current `User`, `Role`, `Permission`, `UserRole`, and `RolePermission`
      schema usage against WordPress-style user workflows.
- [x] Add user service layer (`src/server/services/users.ts`) for listing, reading,
      creating, updating, activating/deactivating, deleting, and role assignment.
- [x] Add zod validation schemas for user create/update/password/role inputs under
      `src/lib/validations/users.ts`.
- [x] Build `/admin/users` list view with search, role/status filters, pagination,
      user status, assigned roles, last-created metadata, and row actions.
- [x] Build `/admin/users/new` create-user flow with name, email, password,
      active status, and one or more roles.
- [x] Build `/admin/users/[id]` edit-user flow with profile fields, role assignment,
      active/inactive toggle, password reset, and safe delete/deactivate actions.
- [x] Add a WordPress-like role management view (`/admin/users/roles`) showing
      built-in roles, permission groups, and role capabilities.
- [x] Allow custom role creation/editing while protecting system roles from unsafe
      slug changes or deletion.
- [x] Enforce server-side RBAC on every user action: `users.view` for reading,
      `users.manage` for mutations, and Super Admin bypass.
- [x] Add self-protection rules: prevent users from deleting/deactivating themselves,
      removing their final admin-capable role, or demoting the last active Super Admin.
- [x] Make role/permission changes refresh Auth.js JWT permission data on next
      login and document that current sessions may need re-login unless refreshed.
- [x] Add audit logging hooks for user create/update/delete/role changes through the
      existing plugin hook bus or logger.
- [x] Add profile/account surface for the current user: view account details and
      change own password without granting broad `users.manage`.
- [x] Add focused unit tests for RBAC/self-protection helpers and service-level
      mutation guards.
- [x] Add Playwright coverage for Super Admin user CRUD, custom role assignment,
      forbidden access for non-admin users, and self-demotion protection.
- [x] Update admin nav/actions so Users points to the completed user management
      screens and hidden actions remain permission-filtered.
- [x] Update `AGENTS.md`/docs if conventions change while implementing user
      management.

## 8. Full Visual Page Builder

> **Locked architecture — decided with the user; do not deviate without updating this block.**
> (Recursive node tree + token-first scoped-CSS compiler. Framework-neutral output.)
>
> **Why the v1 builder hit a wall (root cause):** it stored a *closed, flat, typed*
> tree (`section → container → richText`, enum-only props) styled through *build-time
> Tailwind classes*. Tailwind purges any class it didn't see at build, so runtime
> user-chosen values can't exist — which forced the enum cage. A visual builder needs
> the opposite: an **open, recursive node tree** styled through **runtime CSS**.
> Tailwind stays for the **admin UI only**; it is NOT the saved page format.
>
> - **Framework-neutral saved format.** A node saves a **neutral JSON style object**,
>   never Tailwind/React markup. The public page is portable HTML + compiled CSS.
> - **Recursive node model.** One `BuilderNode` shape, nestable to a depth limit:
>   ```ts
>   type BuilderNode = {
>     id: string;
>     type: "section" | "container" | "grid" | "richText" | "heading"
>         | "image" | "button" | "icon" | "shortcode" | "html" | "form" | "spacer";
>     props: Record<string, unknown>;
>     styles: { base?; sm?; md?; lg?; hover? };   // neutral CSS-property maps
>     advancedCss?: string;                        // raw-CSS escape hatch (sanitized)
>     children?: BuilderNode[];                     // any node can nest any node
>   };
>   ```
>   Containers/grids/sections are just nodes that hold children; **adding content
>   nests a Container, it does NOT spawn a new Section** (the v1 bug). True columns,
>   cards, split heroes = nested flex containers, exactly like Elementor/Wix.
> - **Token-first scoped-CSS compiler.** Builder controls write design tokens
>   (CSS vars: `--space-*`, `--color-*`) by default for theme consistency; a per-node
>   **raw-CSS escape hatch** covers pixel-perfect cases. **Both feed ONE pipeline** —
>   `styles{}` + `advancedCss` compile to **scoped CSS** keyed by a generated class:
>   ```html
>   <section class="flx-node-abc123">…</section>
>   <style>
>   .flx-node-abc123 { padding: var(--space-6); background: var(--color-primary); }
>   @media (min-width:768px){ .flx-node-abc123 { display:flex; gap:var(--space-4); } }
>   .flx-node-abc123:hover { transform: translateY(-2px); }
>   </style>
>   ```
>   The compiler **whitelists CSS properties + sanitizes values** (no `{}<>;@import`,
>   `expression()`, `javascript:`, unsafe `url()`), so uploaded-theme pages stay safe.
>   Raw CSS is **permission-gated** (advanced users/admins only).
> - **Responsive + states.** Per-node breakpoint overrides (`sm/md/lg`) and `hover`
>   compile to `@media`/`:hover` rules on the same scoped class.
> - **Opt-in per entry.** `ContentEntry.editorMode` (`classic | builder`, default
>   `classic`). Public site uses builder output **only** when `editorMode==="builder"`
>   AND `BUILDER_ENABLED`. Opening the builder never changes the live page until an
>   explicit builder-mode save. (Replaces the unsafe `builderHtml || contentHtml`.)
> - **Write-back to `contentHtml`.** On save, render sanitized HTML into `contentHtml`
>   so SEO scoring, sitemap, revisions, search, and excerpts keep working unchanged.
> - **Unknown / disabled-block fallback.** Renderer skips unknown or disabled-plugin
>   node types gracefully (render nothing) — a toggled-off plugin never breaks a page.
> - **Shortcodes first-class.** Rich-text + a dedicated Shortcode/Form node pass `[…]`
>   through unescaped into the `page.html` hook pipeline (`[flxform slug="…"]` works).
> - **Reuse, don't duplicate.** Dynamic nodes reuse the layout component registry and
>   the GSAP `data-anim`/`data-parallax` runtime — no parallel client framework.

**MVP builder scope (in order):** 8A foundation (recursive model + scoped-CSS compiler +
render safety) → 8B–8C canvas + selection (recursive) → 8D inline content editing →
8E container add/nest/duplicate/reorder (flex layout) → 8F token-first style panel +
raw-CSS escape hatch → 8G animation/parallax → core nodes: Rich Text, Heading, Image,
Button, Icon, Shortcode, Custom HTML, Form, Spacer, Grid → 8H responsive breakpoints +
hover → revisions + autosave. **Builder v2:** template-inherited overrides, global
styles/theme-style sync, optimistic locking, more elements (tabs/accordion/video).

### 8A. Foundation — recursive model + scoped-CSS compiler + render safety (DONE FIRST)
- [x] Builder feature flag/config (`BUILDER_ENABLED`) without disrupting the classic editor.
- [x] Save/load `contentJson` server action with `content.edit` / `content.edit_own`.
- [x] `/admin/content/[type]/[id]/builder` route loads a page + previews builder JSON.
- [ ] **Recursive `BuilderNode` schema** (`src/lib/builder/document.ts`): one nestable
      node type; `styles{base,sm,md,lg,hover}` + `advancedCss` + `children`; zod types;
      v1→v2 migration of stored docs; enforce max depth / children / payload limits.
- [ ] **Token-first scoped-CSS compiler** (`src/lib/builder/styles.ts`): neutral style
      JSON → scoped `.flx-node-<id>` CSS with `@media` (sm/md/lg) + `:hover`; whitelist
      CSS properties; sanitize values + `advancedCss` (block `{}<>;@import`,
      `expression()`, `javascript:`, unsafe `url()`).
- [ ] **Recursive renderer** (`src/lib/builder/render.ts`) → `{ html, css }`; core nodes
      section/container/grid/richText/heading/image/button/icon/shortcode/html/form/spacer;
      unknown/disabled node types skipped; shortcode/form pass `[…]` through unescaped.
- [ ] **Add `ContentEntry.editorMode` (`classic`|`builder`, default `classic`)** + db push.
- [ ] **Gate public render on `editorMode === "builder"` AND `BUILDER_ENABLED`** + inject
      the compiled `<style>` — removes the `builderHtml || contentHtml` precedence that
      dropped classic content + shortcodes (broke `/about`).
- [ ] **Write-back:** on builder save, render sanitized HTML into `contentHtml`
      (SEO/sitemap/revisions/excerpts unaffected).
- [ ] On first builder open, convert existing `contentHtml` into a Rich-Text node (no loss).
- [ ] Restore the `/about` demo (clear the stray starter `contentJson`) once opt-in lands.
- [ ] Tests: schema parse/migrate/limits; compiler scoping + sanitization; renderer html+css
      + unknown-node skip + shortcode passthrough; selection recursion; opening/saving leaves
      title/slug/SEO/status untouched; classic renders `contentHtml`, builder renders builder.

### 8B. Simple Canvas + Page Preview
- [x] Build the first visual canvas with desktop preview only, stable toolbar,
      scrollable page area, and empty-state controls.
- [x] Render sections, containers, and rich-text blocks as selectable visual nodes.
- [x] Add a visual outline/hover state that does not shift layout.
- [x] Add Playwright test: builder page opens, empty canvas appears, and existing
      page metadata remains visible outside the canvas.
- [x] Add screenshot check for an empty page and a page with one section/container.

### 8C. Click-to-Select Elements
- [x] Add click selection for page, section, container, inner container, and content
      block nodes.
- [x] Show a compact breadcrumb/selection path such as `Page > Section > Container >
      Text`.
- [x] Add clear labels for node origin: page content, global region, template
      inherited, plugin block, or locked element.
- [x] Add keyboard selection movement: select parent, select next sibling, select
      previous sibling, and escape to clear selection.
- [x] Add tests for selecting nested nodes, selecting empty containers, and keeping
      selection stable after save/reload.

### 8D. Basic Content Editing
- [ ] Allow inline editing for rich text/paragraph/heading content.
- [ ] Add inspector controls for selected content: text, link, heading level,
      alignment, and simple typography.
- [ ] Add save/discard controls for edited content.
- [ ] Convert existing `contentHtml` into a first rich-text block when a page is
      opened in the builder for the first time.
- [ ] Add tests for converting old content, editing text, saving, reloading, and
      rendering edited content publicly.

### 8E. Container-First Layout Editing (primary builder interaction)
- [ ] **Add Container** as the main action: insert a container into a section or
      **nest it inside another container** (rows/columns/cards) — do NOT create a new
      Section per add. Sections are an optional top-level band added separately.
- [ ] Container controls: add, **nest**, duplicate, reorder (drag + keyboard),
      delete, and select parent/child.
- [ ] Quick layout presets for a container (one click): single column, 2/3/4 columns,
      sidebar split, row, stack — all just preset flex `layout` values.
- [ ] Add Element into a container (rich-text, image, button, shortcode, form, menu)
      via an inline insert affordance.
- [ ] Safe empty states: empty container shows an "add element / add container" drop
      zone; deleting the last item never leaves an unselectable/broken canvas.
- [ ] Section controls remain available but secondary: add/duplicate/move/delete band.
- [ ] Tests for add/nest/duplicate/delete/reorder containers and elements, and that
      "add" never spawns an extra Section.

### 8F. Beginner-Friendly Styling Controls
- [ ] Add simple style panel for selected content: font family, font size, font
      style, font weight, text color, background color, alignment, and spacing.
- [ ] **Container style panel (the core of flexible design):**
      - **Layout (flex):** direction, wrap, justify, align, gap.
      - **Size:** width, max-width, height, min-height.
      - **Spacing/box:** padding, margin, border, radius, shadow.
      - **Background:** color, gradient, image (media-library picker, focal/position,
        size, repeat) + overlay color/opacity.
- [ ] Add color picker with theme color tokens, recent colors, and manual hex input.
- [ ] Clamp/validate all style values server-side (property + unit allowlist; reject
      `expression()`, `url(javascript:)`, `<`, etc.) — emit as sanitized inline style
      + CSS vars.
- [ ] Add tests for applying flex layout, size, background image+overlay, color,
      typography, spacing, and invalid-style rejection.

### 8G. Animation Slice
- [ ] Add animation panel for selected content/section/container using existing GSAP
      presets.
- [ ] Support animation type, trigger, duration, delay, easing, stagger, once/replay,
      and reset-to-none.
- [ ] Preview animation in the builder without requiring a public page reload.
- [ ] Save animation as validated builder node config and render it as `data-anim`.
- [ ] **Background parallax for containers** via GSAP ScrollTrigger: enabled / speed /
      direction → emitted as `data-parallax`; the `flx-anim.js` runtime scrubs a GPU
      `transform` (no `background-attachment: fixed`); disabled under
      `prefers-reduced-motion`; SSR-safe (static background without JS).
- [ ] Add tests for applying/removing animation + parallax and public render injection
      of `flx-anim.js` only when needed.

### 8H. Responsive Editing Slice — _Builder v2 (post-MVP)_
- [ ] Add desktop/tablet/mobile preview toggles.
- [ ] Add responsive overrides for hide/show, column stacking, gaps, padding, font
      size, width, and ordering.
- [ ] Show which controls are global vs breakpoint-specific.
- [ ] Add tests for breakpoint override persistence and visual screenshot checks for
      desktop/tablet/mobile.

### 8I. Template-Inherited Element Selection — _Builder v2 (post-MVP)_
- [ ] Add theme/developer contract for selectable inherited elements using stable
      `data-flx-*` attributes.
- [ ] Allow clicking template-inherited elements in preview and show them as
      selectable but not directly destructive-editable.
- [ ] For inherited elements, expose safe actions: inspect, edit linked global
      region, add page-level style override, add animation override, or convert/copy
      into editable page content.
- [ ] Store page-level overrides in the database; never rewrite uploaded Liquid/HTML
      template files from the visual editor.
- [ ] Add tests for selecting inherited hero/header/content elements, applying color
      override, adding animation override, and confirming source template files are
      unchanged.

### 8J. Media + Button + Link Blocks
- [ ] Add Image block with media-library picker, alt text, focal point, dimensions,
      lazy loading, and missing-media fallback.
- [ ] Add Button and Button Group blocks with label, URL, target, rel, style, icon,
      and alignment controls.
- [ ] Add URL validation for internal links, external links, anchors, downloads, and
      unsafe schemes.
- [ ] Add tests for media replacement, missing media, link validation, and public
      render output.

### 8K. Forms, Menus, Shortcodes, and Dynamic Content Blocks
- [ ] Add a **Shortcode block** (raw `[…]` input, passed through to the `page.html`
      pipeline) + shortcode passthrough inside Rich Text. Handle unknown shortcodes
      (render the literal text, no crash).
- [ ] Add Form block that uses the existing form-builder plugin and handles disabled
      plugin/missing form states.
- [ ] Add Menu block that uses existing menu data and handles missing/empty menus.
- [ ] Add Dynamic Content Query block for posts/custom content types with limit,
      ordering, taxonomy filter, author filter, and empty state.
- [ ] Add tests for form block render, menu block render, query filtering, empty
      query state, and missing dependency fallback.

### 8L. Autosave, Drafts, Revisions, and Conflicts
- [ ] Add autosave draft storage separate from published builder content.
- [ ] Add manual save, publish/update, discard draft, restore autosave, and revision
      restore flows.
- [ ] Add optimistic locking/version conflict detection for two open editor sessions.
      _(Builder v2 — post-MVP; MVP may use last-write-wins + a stale warning.)_
- [ ] Snapshot builder JSON into existing revision flow.
- [ ] Add tests for autosave, discard, publish, stale editor conflict, revision
      restore, and public render parity after restore.

### 8M. Accessibility, SEO, and Performance Checks
- [ ] Add builder warnings for missing alt text, heading order, empty links/buttons,
      duplicate IDs, contrast, form labels, focus order, and aria misuse.
- [ ] Add SEO extraction from rendered builder blocks for headings, links, alt text,
      keyword checks, and meta preview parity.
- [ ] Add performance limits for nesting depth, block count, payload size, image
      dimensions, and render time.
- [ ] Add tests for warnings, SEO extraction, payload limits, and render cache
      invalidation.

### 8N. Plugin API + Developer Experience
- [ ] Add plugin hooks for registering builder blocks, inspector panels, toolbar
      actions, renderers, and preview transforms.
- [ ] Require plugin blocks to define schema, sanitizer, renderer, fallback output,
      and permission requirements.
- [ ] Document the theme developer contract for editable slots, locked regions,
      selectable inherited elements, and style/animation hooks.
- [ ] Add tests for a sample plugin block, invalid plugin block schema, missing
      plugin fallback, and permission-filtered plugin controls.

### 8O. Final Hardening + Acceptance
- [ ] Add import/export for builder JSON with schema validation and versioned
      migrations.
- [ ] Add corrupt JSON recovery, unknown block fallback, missing media fallback,
      failed autosave handling, failed publish handling, and stale restore handling.
- [ ] Add full Playwright flow: open old page, convert content, select/edit text,
      style section, add animation, add media/button/form block, publish, and verify
      public render.
- [ ] Add visual regression/screenshot checks across desktop/tablet/mobile for the
      default block set.
- [ ] Update `docs/theme-spec.md` and `AGENTS.md` with builder conventions,
      verification commands, and developer/theme integration rules.

### Detailed Builder Backlog
- [ ] Define the page-builder data contract for `ContentEntry.contentJson`: document
      version, sections, rows, columns, blocks, reusable/global blocks, responsive
      overrides, style tokens, animation settings, visibility rules, and migration
      metadata.
- [ ] Add zod schemas and TypeScript types for builder documents, block props,
      layout settings, style settings, responsive breakpoints, animation config,
      and revision snapshots.
- [ ] Build a server-side builder render pipeline that converts page JSON to safe
      HTML and plugs into the existing public Liquid theme render before falling
      back to `contentHtml`.
- [ ] Keep existing page content editable by converting current `contentHtml` into
      an initial Rich Text block without data loss.
- [ ] Add an `/admin/content/[type]/[id]/builder` visual editor entry point for
      pages and other content types that opt into builder support.
- [ ] Add an "Edit visually" action from the normal entry editor and list screens,
      preserving title, slug, status, SEO, taxonomies, template, and publishing
      workflows.
- [ ] Make the visual editor UX-first and simple: click visible content to edit it,
      click sections/containers/inner containers to style them, and keep advanced
      controls discoverable but not in the way.
- [ ] Add visual element selection for rendered pages, including builder blocks,
      content regions, global header/footer/layout regions, and template-inherited
      elements annotated with stable `data-flx-*` editing metadata.
- [ ] For selected template-inherited elements, show safe actions: inspect source,
      edit linked global region, apply page-level style/animation override, or
      convert/copy the element into editable page content.
- [ ] Store template/page overrides in the database rather than rewriting uploaded
      Liquid/HTML theme files, so developers can build themes freely while editors
      get a Wix-like visual editing experience.
- [ ] Implement builder autosave drafts separate from published content, with manual
      save, publish/update, discard draft, restore, and conflict detection.
- [ ] Add optimistic locking/version checks so two editors cannot silently overwrite
      each other's page-builder changes.
- [ ] Integrate builder changes with existing revisions: snapshot `contentJson`,
      `contentHtml` fallback, SEO data, custom fields, terms, and template
      assignment; restore must rebuild/render the page correctly.
- [ ] Add a canvas with desktop/tablet/mobile preview modes, responsive breakpoint
      controls, zoom, fit-to-screen, rulers/guides, and scrollable page preview.
- [ ] Add drag-and-drop for sections, rows, columns, and blocks using `@dnd-kit`,
      with keyboard-accessible reorder controls and safe empty/drop states.
- [ ] Add selection, hover, breadcrumbs, block outline, parent/child navigation,
      duplicate, copy/paste, delete, undo/redo, and keyboard shortcuts, with clear
      labels for whether the selected element is page content, a container, a global
      region, or a template-inherited element.
- [ ] Add a block library/sidebar with search, categories, favorites, recently used
      blocks, reusable blocks, and permission-aware/plugin-extensible block groups.
- [ ] Support core layout blocks: Section, Container, Grid/Columns, Spacer, Divider,
      Tabs, Accordion, Card/List, and Custom HTML.
- [ ] Support content blocks: Heading, Paragraph/Rich Text, Image, Gallery, Video,
      Button, Button Group, Icon, Quote, List, Embed, Table, Form, Menu, Search,
      Breadcrumbs, Related Content, and Dynamic Content Query/List.
- [ ] Support theme/CMS blocks that reuse existing systems: menus, forms, media
      library, custom fields, taxonomies, SEO preview data, and layout animations.
- [ ] Add inspector panels for content, section, container, inner-container, layout,
      style, background, typography, animation, visibility, accessibility, advanced
      attributes, and custom CSS classes.
- [ ] Add style controls for spacing, sizing, alignment, borders, radius, shadows,
      typography, colors, backgrounds, gradients/images, opacity, z-index, and
      responsive overrides.
- [ ] Add beginner-friendly content controls for selected text/images/buttons:
      edit text inline, replace media, edit links, change font family/size/style,
      font weight, text color, background color, alignment, and simple spacing.
- [ ] Add section/container styling controls for selected wrappers: background
      color/image/gradient, overlay, padding, margin, width, min height, columns,
      gaps, borders, radius, shadows, and responsive stacking.
- [ ] Add safe background/image controls with media-library picker, alt text, focal
      point, lazy loading, intrinsic dimensions, and responsive image output.
- [ ] Add responsive behavior controls: hide/show per breakpoint, column stacking,
      ordering, gap changes, min/max widths, aspect ratios, and overflow handling.
- [ ] Add animation controls reusing existing GSAP presets and `data-anim`
      serialization, with preview, reset, reduced-motion handling, and validation.
- [ ] Add dynamic query/list block support for posts/custom content types with
      filters, sorting, pagination/limit, taxonomy filters, author filters, and
      empty/loading states.
- [ ] Add form-block integration for the form-builder plugin, including disabled
      plugin fallback, missing form fallback, and shortcode compatibility.
- [ ] Add reusable/global block management: create from selection, insert, detach,
      update global instances, permission guard, and safe deletion warnings.
- [ ] Add template-part awareness so page builder edits content areas only and does
      not accidentally mutate global headers/footers/theme regions.
- [ ] Add a theme-developer contract for editable/selectable elements: optional
      attributes/classes that identify editable content slots, lock regions, expose
      style hooks, and declare which inherited elements support overrides.
- [ ] Add preview rendering that matches public output, including active theme CSS,
      customizer CSS, layout CSS, forms CSS, animation assets, and plugin filters.
- [ ] Add server-side sanitization for all rich text/custom HTML/style inputs: strip
      scripts/event handlers, reject unsafe URLs, clamp CSS values, and validate
      allowed attributes.
- [ ] Add URL/asset validation for links, embeds, iframes, downloads, external
      images, and media-library references.
- [ ] Add accessibility checks and warnings for missing image alt text, heading
      order, empty links/buttons, contrast, form labels, duplicate IDs, focus order,
      and aria misuse.
- [ ] Add SEO helpers inside the builder: content analysis from rendered blocks,
      heading outline, image alt coverage, internal/external links, and meta
      preview parity with the existing SEO panel.
- [ ] Add performance safeguards: block count limits, nesting depth limits, payload
      size limits, image-size warnings, lazy loading defaults, and render caching.
- [ ] Add robust error states: corrupt JSON recovery, unknown block fallback,
      missing media, missing plugin block, deleted reusable block, invalid schema,
      failed autosave, failed publish, and stale revision restore.
- [ ] Add import/export for builder JSON with schema validation and versioned
      migrations so future block changes do not break existing pages.
- [ ] Add block schema migration utilities and tests for upgrading old page-builder
      documents to the current version.
- [ ] Add plugin extension points so plugins can register blocks, inspector fields,
      toolbar actions, page-builder filters, and renderers without bypassing
      sanitization/RBAC.
- [ ] Add RBAC enforcement: `content.view` to preview, `content.edit` or
      `content.edit_own` to save drafts, `content.publish` to publish, and relevant
      plugin/media/form permissions for dependent controls.
- [ ] Add current-user ownership handling so Authors can visually edit only their
      own entries while Editors/Admins can edit all permitted content.
- [ ] Add mobile and narrow-screen admin fallbacks: inspector drawers, stable toolbar
      wrapping, non-overlapping controls, and usable touch targets.
- [ ] Add end-to-end Playwright tests for opening existing pages, converting rich
      text, drag/drop reorder, editing block props, responsive preview, autosave,
      publish, revision restore, and public render parity.
- [ ] Add unit tests for schemas, migrations, sanitizer, renderer, query blocks,
      permission guards, autosave conflict handling, and unknown-block fallback.
- [ ] Add visual regression/screenshot checks for common blocks at desktop, tablet,
      and mobile breakpoints.
- [ ] Update `docs/theme-spec.md` with how themes expose the page-builder content
      slot and how builder output interacts with Liquid templates.
- [ ] Update `AGENTS.md` with builder conventions, file locations, block registry
      rules, sanitization requirements, and verification commands.

## Deferred (post-MVP)
- [ ] Visual drag-drop theme builder
- [ ] AI SEO score (entities, citations, topical depth)
- [ ] Shop / e-commerce
- [ ] Multi-site / multi-tenant
- [ ] Form email notifications + CRM integration
