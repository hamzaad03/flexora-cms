# FlxOraCMS --- Product Architecture and Future Development Plan

**Document type:** Long-lived engineering specification for Claude Code,
Codex, and human maintainers\
**Product:** FlxOraCMS\
**Status:** Proposed roadmap; current implementation claims are based on
project-owner summary and must be verified against the repository\
**Last updated:** 2026-10-25\
**Revision note (2026-10-25):** WordPress theme/plugin compatibility
promoted to a major product objective (Section 9A) and the former
Phase 9 expanded into the Phase 9.1--9.10 compatibility program. No
compatibility capability described here exists yet.

------------------------------------------------------------------------

## 1. Purpose and operating rule

FlxOraCMS is intended to become an independent, open-source CMS for
agencies, creators, and businesses. It should provide a modern visual
design experience, a portable theme format, a durable content model, a
safe extension system, high performance, and an incremental path to
eCommerce.

This file is the long-lived plan of record. AI coding agents must read
it before making changes and must not treat a roadmap item as proof that
the feature already exists.

### 1.1 Existing baseline reported by the project owner

The owner reports that the MVP and form-builder plugin are complete.
Reported functionality includes:

-   Next.js 16, Prisma, MySQL, and Auth.js.
-   Generic content CRUD, custom content types, taxonomies, Tiptap
    editor and server-side sanitization.
-   HTML/CSS theme uploads, LiquidJS templates, `starter` and `minimal`
    themes, and full-HTML rendering through a route handler.
-   Drag-and-drop header/footer/block builders using `@dnd-kit`,
    GSAP/ScrollTrigger animations, and a menu builder.
-   Page SEO, sitemap, robots, redirects, optimized media, first-party
    privacy-hashed analytics and external analytics integrations.
-   Hook-based plugin modules; `powered-by`, `audit-log`, and
    `form-builder` plugins.
-   Secure form submissions with honeypot, time-trap, rate limiting,
    same-origin checks and optional Turnstile.
-   RBAC, user/role management, protections against self-demotion and
    removing the last Super Admin.
-   Environment validation, Pino logging, Vitest/Playwright, deployment
    documentation and backup/restore scripts.

**Important:** this is a reported baseline, not a verified code audit.
The first phase must compare every item with repository code, tests,
migrations, deployment behavior, and documentation.

### 1.2 Repository facts relevant to WordPress compatibility

Observed on 2026-10-25 by reading source files and configuration (no
commands, tests or builds were run for this revision). Re-verify in
Phase 0 and 9.1 before relying on them.

-   **No WordPress import, export or analysis code exists.** The only
    WordPress references in the repository are the "WordPress-style"
    hook bus and role UI.
-   **Themes** are Liquid/HTML packages. Upload (`src/server/theme/install.ts`)
    applies zip-slip protection, a 50 MB uncompressed cap and blocks
    `.php`, `.exe`, `.sh`, `.bat`, `.cmd`. The manifest
    (`src/server/theme/manifest.ts`) has name, slug, version, author,
    templates, regions and menus only --- no API-version or capability
    fields.
-   **Plugins** are static in-repo modules (`src/plugins/registry.ts`)
    with nine core hook names (`src/server/hooks/index.ts`); there is no
    dynamic loading, dependency model or permission declaration yet.
-   **Content model** (`prisma/schema.prisma`): `ContentEntry` with
    `contentHtml`/`contentJson`, status DRAFT/PUBLISHED/SCHEDULED/TRASHED,
    slug unique per content type, `parentId`; `ContentField` /
    `ContentFieldValue` (JSON values); `Revision` snapshots; taxonomies
    and terms; `SeoMeta`; `Redirect` (unique exact `from`); `Media`
    (no source URL or external ID); `Menu`/`MenuItem`; `Setting`
    (key/JSON). There is **no comment model, no source-ID mapping and no
    import-batch ledger**.
-   **Database workflow:** one Prisma migration exists
    (`20260620174522_initial`) while `AGENTS.md` documents
    `prisma db push`. Schema additions for migration tooling require
    the move to `prisma migrate` first.
-   **Deployment:** standalone Node build, MySQL, `STORAGE_DIR`
    abstraction (`src/lib/storage.ts`, path-traversal safe),
    `scripts/backup.sh` and `scripts/restore.sh` (restore verification
    is a Phase 1 task, not a verified fact). No PHP is part of the
    stack; PHP-only hosting is unsupported.
-   **Tests/CI:** Vitest unit tests and Playwright specs exist; the CI
    workflow installs, generates Prisma, typechecks, lints,
    format-checks and runs unit tests.
-   **File naming:** the repository contains `PLAN.md` (and
    `README.md`, `TODO.md`), not `plan.md`. This document and Section 15
    say `plan.md`; the filename difference is hidden on
    case-insensitive filesystems (macOS) but breaks on Linux CI. Phase 1
    must settle the canonical name; until then read `PLAN.md`.
    `DEVELOPMENT_LOG.md` did not exist before this revision.

## 2. Product vision and non-goals

### 2.1 Product promise

"Design freely. Model any content. Extend safely. Deploy practically."

FlxOraCMS should let agencies create highly customized websites with
modern layouts and animation, without requiring the customer to assemble
a fragile stack of unrelated plugins for basic content modeling and
design needs.

### 2.2 Product pillars

1.  **Independent CMS domain:** content, routing, permissions, themes,
    plugins, and upgrades are defined by FlxOraCMS contracts---not by a
    framework's conventions.
2.  **Visual freedom:** themes can use HTML/CSS/JavaScript, components,
    responsive layouts, and GSAP where appropriate.
3.  **Structured content built in:** custom post types, fields,
    relationships, taxonomies, revisions, validation, and query APIs are
    core capabilities.
4.  **Portable deployment:** a documented compatibility matrix for
    supported Node-capable shared hosts, managed Node hosting, and
    VPS/container environments.
5.  **Safe extensibility:** versioned plugin APIs, explicit permissions,
    compatibility metadata, and no promise that arbitrary untrusted code
    can be safely sandboxed inside the same process.
6.  **Operational trust:** safe upgrades, rollback strategy, backups,
    observability, security updates, and migration tooling.
7.  **Incremental commerce:** a flexible product/catalog foundation
    followed by inventory, cart, checkout, taxes, shipping, orders, and
    payment adapters.
8.  **Evidence-based WordPress compatibility:** migrate WordPress
    content, media, URLs, settings and designs; map plugin
    functionality to native features, adapters or alternatives; and
    publish measured, reproducible compatibility results. See Section
    9A and Phase 9.

### 2.3 Explicit non-goals

-   Do not promise compatibility with all WordPress plugins or themes,
    and do not claim that WordPress PHP themes or plugins run natively in
    FlxOraCMS. WordPress compatibility is a measured, tiered objective
    (Section 9A: conversion, adapters, alternatives, and an isolated
    runtime only if research proves it safe) alongside a distinct
    FlxOraCMS ecosystem.
-   Do not claim universal shared-hosting support without testing
    specific runtime capabilities.
-   Do not build a microservices platform for the first release.
-   Do not create a custom ORM, authentication cryptography, sanitizer,
    or payment processor merely to avoid dependencies.
-   Do not rewrite the current system from scratch unless a documented
    architecture decision record (ADR), measured evidence, migration
    plan, and approval justify it.
-   Do not run arbitrary plugin code under a claim of strong sandboxing
    unless an actual isolation boundary exists.

## 3. Product and architecture principles

-   **Modular monolith first:** clear modules and contracts within one
    deployable application.
-   **Framework is an adapter, not the domain:** isolate Next.js,
    Prisma, Auth.js, LiquidJS, GSAP, and other libraries behind internal
    interfaces where their lifecycle or API is likely to leak into core
    business logic.
-   **Incremental replacement:** new code must coexist with the current
    system until a tested migration path is available.
-   **Backward compatibility:** public plugin APIs, theme contracts,
    configuration, CLI behavior, and data formats use explicit versions
    and deprecation windows.
-   **Database portability where practical:** MySQL/MariaDB are
    first-class targets. Avoid engine-specific SQL in domain logic
    unless documented and tested.
-   **Security by default:** least privilege, secure defaults,
    validation at trust boundaries, output encoding, and auditable
    privileged actions.
-   **Testable design:** business rules should be testable without
    booting the whole web server.
-   **Measure performance:** establish a reproducible baseline before
    optimizing.
-   **No silent destructive operations:** migrations, uninstallers,
    imports, restores, and bulk actions must be explicit, logged, and
    recoverable.
-   **Accessibility and progressive enhancement:** admin and generated
    websites should work with keyboard navigation and respect
    reduced-motion preferences.
-   **Open-source clarity:** choose and document a license; audit
    dependency licenses and trademarks before public release.
-   **Compatibility is measured, not claimed:** any statement about
    WordPress (or other) compatibility must be backed by a recorded,
    reproducible test run, and compatibility code stays optional and
    outside the core domain.

## 4. Tech stack and dependency policy

### 4.1 Current stack to preserve until evidence says otherwise

  -----------------------------------------------------------------------
  Area                    Current reported choice Policy
  ----------------------- ----------------------- -----------------------
  Application/runtime     Next.js 16 / Node.js    Keep initially; verify
                                                  support on target hosts
                                                  and pin supported Node
                                                  ranges

  Language                TypeScript              Strict mode; avoid
                                                  `any` except documented
                                                  boundaries

  Database                MySQL                   Primary supported
                                                  database

  Data access             Prisma                  Isolate behind
                                                  repositories; pin
                                                  versions; test
                                                  generated migrations
                                                  and upgrade paths

  Authentication          Auth.js                 Encapsulate
                                                  session/provider
                                                  details behind internal
                                                  identity interfaces

  Theme templates         LiquidJS                Define FlxOraCMS
                                                  template contract
                                                  independent of
                                                  engine-specific helpers

  Rich-text editor        Tiptap                  Persist a versioned
                                                  content format and
                                                  provide
                                                  conversion/migration
                                                  tests

  Drag/drop               `@dnd-kit`              Treat as editor UI
                                                  implementation, not
                                                  saved-layout contract

  Animation               GSAP / ScrollTrigger    Optional frontend
                                                  dependency; honor
                                                  reduced motion and
                                                  avoid loading globally
                                                  when unused

  Logging                 Pino                    Standard structured
                                                  logger interface

  Tests                   Vitest, Playwright      Unit, integration,
                                                  security, browser,
                                                  migration and
                                                  deployment tests

  Media                   Sharp                   Feature-detect
                                                  compatible binaries;
                                                  provide graceful
                                                  operational diagnostics

  Package manager         Verify repo             Pin lockfile and
                                                  document supported
                                                  package manager
  -----------------------------------------------------------------------

### 4.2 Runtime and shared-hosting reality

Next.js applications generally require a supported Node.js runtime and
process model. A conventional PHP-only shared host cannot run this
application just because it supports MySQL. The project must
distinguish:

-   **Tier A --- Node-capable shared hosting:** supported only when
    provider exposes a compatible Node runtime, persistent app
    process/reverse proxy or documented hosting integration, environment
    variables, writable storage where required, and compatible native
    dependencies.
-   **Tier B --- managed Node hosting/VPS/container:** supported
    deployment target for the complete application.
-   **Tier C --- static export:** optional only for explicitly
    static/public routes; it is not a replacement for dynamic admin,
    authentication, forms, analytics, or eCommerce.
-   **PHP-only hosting:** not supported by the current architecture.
    Supporting this later would require a separately scoped
    runtime/edition or a substantial rewrite, not a deployment toggle.
-   **PHP for WordPress compatibility:** the application itself never
    needs PHP. Only an optional, isolated compatibility runtime
    (Phase 9.9, which exists only if the Phase 9.8 research approves it)
    could require PHP, and it would be a separate process, expected on
    Tier B at most. Migration analysis and import must still work on
    Tier A through chunked, resumable steps or an offline CLI.

The release team must publish a compatibility table by provider/version
and run install, upgrade, restart, upload, backup, restore, and load
smoke tests on representative environments.

### 4.3 Dependency rules

1.  Prefer stable, actively maintained libraries with compatible
    licenses and a documented security policy.
2.  Use a framework's LTS release when an LTS channel exists and meets
    the product's requirements; otherwise pin a supported release and
    maintain an upgrade policy. Do not claim a version is LTS without
    checking its official lifecycle.
3.  Pin runtime and dependency ranges; commit the lockfile.
4.  Automate dependency update PRs, license checks, vulnerability
    scanning, and regression tests.
5.  Avoid framework-specific types in domain interfaces and persisted
    data formats.
6.  Maintain a dependency register: purpose, owner, version, license,
    update cadence, replacement cost, and security contact.
7.  Never upgrade a major dependency automatically in a production
    release without tests and release notes.
8.  Do not remove useful dependencies solely to achieve a "zero
    dependency" slogan. Minimize dependency surface and make replacement
    feasible.

## 5. Target system architecture

Use a **modular monolith** with explicit module boundaries. A module
owns its domain rules, data access, application services, and public
contracts. Cross-module access must use contracts or application
services rather than arbitrary imports of internal files.

### 5.1 Logical layers

1.  **Delivery adapters:** Next.js route handlers/pages, CLI, scheduled
    jobs, webhook endpoints.
2.  **Application layer:** use cases such as publish content, resolve
    route, activate theme, install plugin, run upgrade, submit form.
3.  **Domain modules:** Content, Fields, Taxonomy, Routing, Themes,
    Layouts, Plugins, Identity/Access, Media, SEO, Analytics, Forms,
    Updates, Commerce (later).
4.  **Ports/contracts:** repositories, clock, cache, filesystem/storage,
    mail, event bus, logger, HTTP client, job runner, payment provider.
5.  **Infrastructure adapters:** Prisma/MySQL, filesystem/object
    storage, cache, email providers, external analytics, framework
    adapters.
6.  **Presentation:** admin UI, public renderer, theme assets and plugin
    UI extensions.

### 5.2 Request lifecycle

1.  Validate request size, method, origin where applicable, and
    correlation ID.
2.  Resolve tenant/site and locale if multi-site support is enabled.
3.  Authenticate and authorize using a centralized policy service.
4.  Resolve route to a typed target: content, taxonomy archive, search,
    system endpoint, redirect, or 404.
5.  Load only required data; apply bounded pagination and query limits.
6.  Render via the active theme contract or return a typed API response.
7.  Apply cache rules based on content version, locale, route, role, and
    personalization.
8.  Emit structured logs and metrics without secrets or unnecessary
    personal data.

### 5.3 Module boundaries

-   **Content:** content identity, status, slug, revisions, author,
    publication dates, locale.
-   **Content Types & Fields:** schemas, field definitions, validation,
    defaults, indexes, versioning.
-   **Taxonomy:** vocabularies, terms, relationships and archives.
-   **Routing:** canonical URL rules, slug uniqueness, redirects,
    conflict detection.
-   **Theme Runtime:** theme manifests, templates, assets, components,
    render context, theme validation.
-   **Layout Builder:** versioned JSON document schema and
    editor-to-renderer contract.
-   **Animation Runtime:** declarative animation metadata and optional
    client-side libraries.
-   **Plugin Manager:** manifest validation, dependencies, permissions,
    lifecycle, hooks, extension points.
-   **Identity & Authorization:** sessions, roles, permissions, policy
    checks, recovery flows.
-   **Media:** metadata, safe storage, transformations, responsive
    derivatives.
-   **SEO:** metadata, canonical links, structured data, sitemap, robots
    rules.
-   **Forms:** schema, rendering, submission validation, spam defense,
    retention.
-   **Analytics:** consent/privacy policy, event collection,
    aggregation, retention.
-   **Upgrade Manager:** schema migrations, application version
    compatibility, preflight, backup integration, recovery guidance.
-   **WordPress Compatibility (optional module):** package analyzer and
    Compatibility Report, source adapters, migration engine and import
    ledger, theme converter, plugin catalog and adapters, migration
    assistant, and (only if approved) the isolated runtime broker. It
    depends on core contracts; core never depends on it.
-   **Commerce (future):** catalog, pricing, stock, carts, checkout,
    orders, refunds, taxes, shipping, payment adapters.

### 5.4 Key architecture decisions required

Create an ADR before any irreversible choice for: - Whether to retain
Prisma long-term or place it behind repositories and later replace it. -
Whether theme uploads may include executable server-side code (default:
no). - Plugin trust model and permissions. - Tenant/site model and
whether multi-tenancy is in initial scope. - Content field storage
strategy (relational columns, typed field tables, JSON, or a hybrid). -
Cache adapter and invalidation model. - Background work strategy for
hosts without persistent workers. - Upgrade and rollback guarantees. -
License and trademark policy. - WordPress compatibility (see Phase 9):
levels and claims policy, supported source versions, module boundary,
import ledger and rollback model, PHP parsing approach, theme conversion
strategy, plugin catalog/adapter contract, and whether any PHP runtime
is built at all (research ADR before any implementation).

Every ADR must include context, options, decision, consequences, risks,
and date.

## 6. Proposed repository structure

Adapt this to the existing repository; do not perform a mass move solely
to match this diagram. Record deviations in an ADR.

``` text
/
├── AGENTS.md
├── plan.md
├── DEVELOPMENT_LOG.md
├── CHANGELOG.md
├── README.md
├── CONTRIBUTING.md
├── SECURITY.md
├── LICENSE
├── package.json
├── lockfile
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── app/                         # Next.js delivery/UI adapter only
│   ├── cms/
│   │   ├── application/             # use cases
│   │   ├── domain/
│   │   │   ├── content/
│   │   │   ├── fields/
│   │   │   ├── taxonomy/
│   │   │   ├── routing/
│   │   │   ├── themes/
│   │   │   ├── layouts/
│   │   │   ├── plugins/
│   │   │   ├── identity/
│   │   │   ├── media/
│   │   │   ├── seo/
│   │   │   ├── forms/
│   │   │   ├── analytics/
│   │   │   └── commerce/            # later, do not pre-build empty abstractions
│   │   ├── contracts/               # stable internal/public ports
│   │   ├── infrastructure/
│   │   │   ├── database/
│   │   │   ├── cache/
│   │   │   ├── storage/
│   │   │   ├── mail/
│   │   │   └── logging/
│   │   ├── compat/wordpress/        # Phase 9 only; optional, never imported by core
│   │   │   ├── analyzer/            # static package analysis + Compatibility Report
│   │   │   ├── migration/           # source adapters, mappers, import ledger
│   │   │   ├── themes/              # WordPress theme -> FlxOraCMS theme conversion
│   │   │   ├── plugins/             # catalog loader + data/behavior adapters
│   │   │   └── assistant/           # guided migration use cases
│   │   ├── rendering/
│   │   ├── security/
│   │   └── shared/
│   ├── plugins/
│   │   ├── powered-by/
│   │   ├── audit-log/
│   │   └── form-builder/
│   ├── themes/
│   │   ├── starter/
│   │   └── minimal/
│   ├── cli/
│   └── jobs/
├── public/
├── storage/                         # only if runtime supports safe writable storage
├── scripts/
│   ├── backup/
│   ├── restore/
│   ├── release/
│   └── hosting-smoke/
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── contract/
│   ├── security/
│   ├── migrations/
│   ├── e2e/
│   ├── performance/
│   └── fixtures/
├── docs/
│   ├── architecture/
│   ├── adr/
│   ├── plugin-api/
│   ├── theme-api/
│   ├── deployment/
│   ├── upgrades/
│   ├── wordpress/                   # charter, corpus, mapping, runtime research
│   └── security/
├── compat/                          # Phase 9.10 generated directory data (themes/, plugins/)
├── experiments/                     # Phase 9.8 PoC only; excluded from build and deploy
└── .github/
    └── workflows/
```

### Folder structure rules

-   Keep Next.js route handlers thin: validate/translate the HTTP
    request, invoke an application use case, translate the result.
-   Domain modules must not import from `src/app`.
-   Domain contracts must not expose Prisma-generated model types.
-   Keep public plugin API types in a versioned, documented package or
    stable module.
-   Treat `public/` as deployable assets only; never store secrets or
    private uploads there by default.
-   Never commit secrets, production data, uploaded customer content, or
    generated environment files.
-   Avoid empty folders and speculative abstractions; add a module when
    a real use case requires it. The `compat/`, `experiments/` and
    `src/cms/compat/wordpress/` entries above are proposals for Phase 9
    and must not be created before their sub-phase starts.
-   `src/cms/compat/**` may import core contracts; core modules must not
    import it (enforce with an architecture lint rule). `experiments/`
    is never imported, built or deployed.
-   WordPress packages, exports and corpus items are never stored in
    `public/` or committed unless their license allows and 9.1 records
    it.

## 7. Data modeling strategy

### 7.1 Content model

Support built-in and custom content types with: - stable internal IDs
independent of slugs; - schema definitions with explicit schema
versions; - draft/published/scheduled/archived states; - revisions and
audit history; - slug uniqueness scoped by site/locale/content type as
specified; - relationships with defined cardinality and deletion
behavior; - taxonomy assignments; - field-level validation and
permissions; - query limits, sorting and indexes; - import/export with
stable IDs and schema metadata.

### 7.2 Custom fields

Build custom fields as a core capability, not a mandatory third-party
plugin. Initial field types: - short text, long text, rich text; -
integer, decimal, boolean; - date/time; - single/multi select; - URL,
email, phone; - image/file reference; - relationship/reference; -
repeatable group and structured object; - derived/read-only field where
safe.

Each field definition must specify type, validation, required/default
rules, UI widget, indexing/search behavior, access policy, storage
representation, and migration behavior. Unknown field types must fail
safely and remain exportable.

Use a hybrid storage strategy only after benchmarking. Do not blindly
store every value in a single JSON column or create an EAV schema
without considering indexing, query complexity, and migrations. Document
the decision with representative query benchmarks.

### 7.3 Migration rules

-   Use forward migrations that are deterministic, reviewed, versioned,
    and safe to rerun only when explicitly designed to be idempotent.
-   Separate schema migration from large data backfills where necessary.
-   Never assume a production database is empty.
-   Test upgrades from at least the previous supported release and a
    clean installation.
-   Define backup, preflight checks, maintenance/locking behavior,
    timeouts, and recovery steps.
-   Avoid destructive column/table removal in the same release that
    stops writing the old representation; use expand → migrate →
    contract.
-   A rollback is not always possible after data transformation. State
    this clearly and use verified backups for recovery.
-   Test migration with realistic volume and interrupted-run scenarios.

## 8. Theme, layout, and animation contracts

### 8.1 Theme package

Each theme should have a validated manifest containing: - theme ID,
display name, version, license, author, minimum/maximum compatible CMS
API versions; - entry templates and route templates; - asset manifest; -
required features and optional integrations; - settings schema; -
declared components/blocks; - migration notes for theme data.

Themes should be portable packages with a documented folder format. The
template engine is an implementation detail behind the FlxOraCMS theme
contract.

### 8.2 Rendering safety

-   Theme templates receive a deliberately limited render context, not
    database clients, secrets, filesystem access, or unrestricted server
    objects.
-   Escape text by default; trusted HTML must be explicit and sanitized.
-   Validate template paths and prevent traversal.
-   Disallow arbitrary server-side executable code in uploaded themes.
-   Define behavior for missing templates, invalid manifests, and
    incompatible versions.
-   Cache compiled templates where supported and invalidate when
    theme/version/content changes.

### 8.3 Layout builder

Store layouts as a versioned JSON document with: - stable node IDs; -
block type and version; - typed properties and content bindings; -
responsive configuration; - accessibility metadata; - animation
configuration; - references to reusable components; - migration
functions between schema versions.

The editor and renderer must consume the same schema. Never persist raw
React component source as the layout format. Unknown blocks should
render a safe placeholder and remain exportable rather than corrupting
the whole page.

### 8.4 Animation and GSAP

-   GSAP is an optional enhancement, not a server-rendering dependency.
-   Animation metadata should be declarative: trigger, target, duration,
    delay, easing, and approved options.
-   Do not permit arbitrary JavaScript injection through ordinary
    content fields.
-   Avoid layout shift and excessive main-thread work; animate
    transform/opacity where possible.
-   Honor `prefers-reduced-motion`, provide disable controls, and test
    keyboard/screen-reader experience.
-   Lazy-load animation code only on pages that use it.
-   Document how custom theme JavaScript is packaged and secured.

## 9. Plugin system and public extension API

### 9.1 Manifest

Every plugin should declare: - unique ID, name, version, license, entry
point; - supported CMS and plugin API versions; - dependencies and
conflicts; - requested capabilities/permissions; - migrations and
uninstall behavior; - hooks/events and admin routes it registers; -
network access requirements where applicable.

### 9.2 API design

-   Use versioned contracts and typed inputs/outputs.
-   Prefer explicit events, filters, and registered extension points
    over unrestricted global mutation.
-   Define hook ordering, error handling, timeouts where enforceable,
    and whether failures block a request.
-   Plugins must not silently modify core tables or bypass
    authorization.
-   Database access must go through approved repositories/services or a
    documented plugin data API.
-   Validate and authorize every plugin-created route and admin action.
-   Provide lifecycle methods: validate, install, activate, deactivate,
    upgrade, health check, uninstall.
-   Deactivation must not delete user data. Uninstall must be explicit
    and disclose what will be removed.
-   Publish compatibility tests and a plugin development kit with
    example plugins.

### 9.3 Security boundary

A hook system is not a sandbox. PHP/Node code executing in the same
process usually has the application's process privileges. For
marketplace distribution: - treat third-party code as trusted code
unless execution is genuinely isolated; - require review,
signatures/checksums, permissions disclosure, and release provenance; -
never claim that a manifest alone prevents malicious code; - consider
remote/out-of-process execution for untrusted extensions only after
evaluating latency, reliability, and deployment costs. The same rule
governs WordPress PHP: it is untrusted code, it is never run in the
application process, and any runtime for it is gated by the Phase 9.8
research and architecture review (Section 9A).

## 9A. WordPress compatibility strategy (cross-cutting)

### 9A.1 Objective

WordPress compatibility is a **major product objective** of FlxOraCMS:
lowering the cost for agencies and site owners to move an existing
WordPress site --- content, media, URLs, settings and design --- and to
find a FlxOraCMS-native path for the functionality their plugins
provide. It is delivered by the Phase 9 program (9.1--9.10).

This objective does **not** change the product's independence
(Section 2.2, pillar 1). FlxOraCMS is not "WordPress in Next.js"
(`PLAN.md`). Domain contracts stay FlxOraCMS-shaped; the compatibility
module sits at the edge, is optional, and core code never depends on it.

### 9A.2 What is and is not possible

-   WordPress themes and plugins are PHP programs that assume WordPress
    core is loaded (global functions, `$wpdb`, the hook and options
    machinery, often wp-admin). They **cannot run directly in
    Next.js** or any Node process.
-   Therefore compatibility is delivered by *conversion*, *adapters*,
    *alternatives* and, only if proven safe and worthwhile, an
    *isolated runtime* --- never by promising that arbitrary themes or
    plugins "just work".
-   Universal compatibility is explicitly **not** a goal. Some themes
    and plugins (deep wp-admin integrations, custom tables with bespoke
    logic, membership, LMS, complex builders) will remain unsupported or
    best-effort, and the product must say so before migration.

**Compatibility levels** (used by reports, the directory and docs):

  -----------------------------------------------------------------------
  Level   Meaning                                     WordPress code runs?
  ------- ------------------------------------------- -------------------
  C1      Native conversion: data and design become   No
          FlxOraCMS-native content, themes, blocks,
          settings

  C2      Adapter: a reviewed FlxOraCMS-native        No
          adapter reads the plugin's data and/or
          implements a documented behavior subset
          (for example shortcodes)

  C3      Isolated runtime: requires the optional     Yes, in isolation
          PHP runtime (exists only if Phase 9.9 is
          approved and shipped)

  C4      Unsupported: reported with reason and       No
          alternatives
  -----------------------------------------------------------------------

Fidelity is graded separately (A--D) because a theme can be C1 yet lose
detail. Hosting tiers (A/B/C in Section 4.2) are unrelated to
compatibility levels.

### 9A.3 Claims policy

-   Do not use "100% compatible", "works with all WordPress
    themes/plugins", or any universal claim.
-   Every public number cites its corpus size, date, tool versions and
    a link to the recorded run (Phase 9.10).
-   Use factual, nominative wording such as "imports content exported
    from WordPress"; do not imply endorsement or certification by the
    WordPress project or any vendor, and follow the applicable
    trademark policies (ADR-WP-003).
-   Roadmap items are not capabilities. Docs, UI and release notes may
    describe only what a recorded test run supports.
-   Unknown means unknown: reports must never present unanalyzed
    features as compatible.

### 9A.4 Cross-cutting requirements

**Security**

-   All WordPress packages, exports, databases, remote URLs and crawled
    pages are untrusted input (Section 15, rule 11).
-   Static analysis only in the product; no execution of third-party PHP
    outside disposable test containers (9.3, 9.8) or an approved,
    isolated runtime (9.9).
-   Threats to test in every relevant sub-phase: zip-slip, zip bombs,
    symlinks, XXE and entity expansion, PHP object-injection through
    serialized data, XSS via imported titles/meta/content/headers, SSRF
    during media fetch or crawl, path traversal in attachment paths,
    SQL in dumps, malicious theme JavaScript, credential leakage in
    logs and reports, and privilege escalation through migration
    permissions.
-   Migration actions require explicit RBAC permissions, server-side
    authorization, rate limits and audit-log entries.
-   Credentials for a source database are held in memory only, are
    never logged or exported, and use a read-only account.

**Licensing and trademark**

-   Verify the license of every corpus item, converted asset, font and
    bundled library. Many WordPress themes and plugins are GPL-2.0 or
    later; some are commercial with redistribution restrictions. Do
    not assume --- record it per item (9.1).
-   Choose FlxOraCMS's own license before bundling or deriving from
    WordPress code (Section 3, open-source clarity). Implement adapters
    from public documentation and observed behavior; do not copy
    WordPress core or plugin code without a recorded license
    compatibility review.
-   Never redistribute premium or restricted themes/plugins through the
    corpus or directory; store hashes and instructions only.
-   Converted themes remain subject to the original theme's license; the
    converter must preserve license and author metadata and surface
    them to the user.
-   Trademark: follow ADR-WP-003 for naming and branding; no
    impersonation of the WordPress project or of third-party vendors.

**Performance**

-   Compatibility code must add no cost to the request path of sites that
    do not use it.
-   Import and analysis work is bounded: memory caps, streaming parsers,
    chunked batches, query budgets and indexes for the ledger tables.
-   Any runtime overhead (9.9) is measured against the Phase 8 baseline
    with budgets set before implementation.
-   Converted themes are measured against the source site (transfer size,
    script weight) and regressions are reported.

**Hosting**

-   The migration engine must work on Tier A hosting through chunked,
    resumable steps without a persistent worker; an offline CLI
    analyzer is an accepted path for tightly constrained hosts.
-   An isolated PHP runtime is expected, at most, on Tier B
    (VPS/container) profiles unless the 9.8 evidence proves otherwise.
    PHP-only hosting stays unsupported (Section 4.2).
-   The assistant requires writable storage, the backup prerequisites of
    Phase 7, and enough disk for source uploads plus the verified
    pre-migration backup; preflight checks must say so.

**Maintenance**

-   WordPress, popular themes and plugins change continuously. The
    program is therefore a permanent operating cost, not a one-time
    feature: owners, a re-test cadence after each WordPress major
    release, stale-status handling and a CI cost budget are required
    (9.10).
-   The Compatibility Report schema, plugin catalog format and mapping
    tables are versioned contracts with deprecation windows
    (Section 18).
-   Supported WordPress source versions follow ADR-WP-002 and are
    retired on a published schedule.

### 9A.5 Metrics

Compatibility metrics (corpus coverage, grade distribution,
classification accuracy, migration success and rollback success rates,
unsupported-feature reporting quality, directory freshness) are listed
in Section 19 and are published only with their methodology.

## 10. Security and privacy baseline

Required controls include: - centralized authorization checks at every
privileged application use case; - secure session cookies, session
rotation, logout invalidation, CSRF protection where applicable; -
strict input validation and output encoding; - SQL injection prevention
through parameterized access; - SSRF protection for URL fetches,
webhooks, image imports and integrations; - upload size/type checks,
generated filenames, safe storage, and image parser limits; - rate
limits for login, forms, password reset, APIs, and expensive queries; -
secure secret handling and environment validation; - safe error messages
without stack traces/secrets in production; - audit logs for privileged
and sensitive changes; - dependency scanning, secret scanning, static
analysis, and threat modeling; - retention limits, export/deletion
workflows, and privacy notices for analytics/form data; - documented
security reporting process and patch policy.

Security tests must include authorization bypass, stored/reflected XSS,
CSRF, SQL injection, path traversal, malicious uploads, SSRF, rate-limit
bypass, tenant/site isolation if applicable, and plugin permission
abuse. For the WordPress compatibility program, also test zip bombs and
symlinks in packages, XXE/entity expansion in exports, PHP-serialized
object injection, SSRF in media fetch and site crawling, and secret
leakage in migration logs and reports (Section 9A.4).

## 11. Performance and concurrency plan

Do not promise a fixed concurrency number until a repeatable benchmark
is run on a defined host. Establish baseline and publish methodology.

### 11.1 Measurement

Track at minimum: - p50/p95/p99 latency by route class; - throughput and
error rate; - CPU and memory; - database connection/query duration and
slow queries; - cache hit ratio; - render time and asset size; -
cold-start/restart behavior; - performance under realistic mixed
read/write workloads.

### 11.2 Optimization order

1.  Measure current behavior and identify bottlenecks.
2.  Fix N+1 queries, unbounded queries, missing indexes, and repeated
    work.
3.  Add bounded pagination and database query budgets.
4.  Add public-page caching with explicit cache keys and invalidation.
5.  Add immutable cache headers for fingerprinted assets.
6.  Use image derivatives/responsive images and lazy loading.
7.  Avoid loading editor, analytics, GSAP, and admin bundles on public
    pages unless needed.
8.  Add optional object cache only when deployment supports it; do not
    require Redis for baseline shared hosting.
9.  Move expensive work to queues when available; provide a bounded
    cron/polling fallback only when safe.
10. Retest after each meaningful optimization.

### 11.3 Cache correctness

Never serve one user's private/admin response to another. Cache keys
must include all relevant route, locale, tenant, content version, and
variation inputs. Invalidate after publishing, changing menus,
activating themes/plugins, changing redirects, or updating SEO metadata.
Add tests for stale content and cross-user cache leakage.

## 12. Testing and quality gates

Every feature must include appropriate tests. "Tests pass" means the
commands actually ran and results were observed.

-   **Unit:** pure domain rules and validation.
-   **Integration:** database repositories, transactions, storage, cache
    and auth adapter behavior.
-   **Contract:** plugin/theme APIs and schema compatibility.
-   **Migration:** clean install, upgrade from prior supported version,
    interrupted migration, data preservation.
-   **Compatibility (WordPress):** corpus-based analyzer, migration,
    theme-fidelity and plugin-adapter suites with recorded, reproducible
    results; rollback-equivalence tests; regression gates on a pinned
    subset (Phases 9.3 and 9.10).
-   **Security:** negative tests for trust boundaries and authorization.
-   **E2E:** core user journeys in a browser.
-   **Performance:** representative workload and regression thresholds.
-   **Deployment smoke:**
    build/start/restart/install/upgrade/upload/backup/restore on
    supported host profiles.
-   **Accessibility:** keyboard navigation, reduced motion, contrast,
    labels and common screen-reader checks.

CI should run formatting, lint, type checking, unit/integration tests,
build, dependency/security checks, and relevant E2E tests. Never weaken
or delete a failing test merely to make CI green; explain and fix the
underlying issue or document a justified exception.

## 13. Phased roadmap

Phases are gate-based, not calendar promises. Complete acceptance
criteria before declaring a phase done. Work should be divided into
small PRs/commits.

Phase 9 is a program of sub-phases (9.1--9.10) ordered by dependency, not
by number alone: read-only research (9.1, 9.8) may overlap Phases 2--8,
but migration features (9.4--9.7) wait for the content model (Phase 3),
theme contract (Phase 4), plugin API (Phase 6) and verified
backup/restore (Phase 7). WordPress compatibility work must not displace
or delay the core phases it depends on.

### Phase 0 --- Repository audit and product truth

**Goal:** establish what actually exists and reduce architectural
uncertainty.

Tasks: - Read `AGENTS.md`, `plan.md`, package manifests, schema,
migrations, tests, deployment docs, and Git history. - Map reported
features to implementation files and test coverage. - Run existing
lint/type/test/build commands and record failures. - Inspect
auth/authorization boundaries, plugin execution, theme upload/rendering,
file storage, migrations, caching, logging and backup/restore. -
Identify unused dependencies, duplicated domain rules, framework
leakage, security risks and unsupported deployment assumptions. -
Produce `docs/architecture/CURRENT_STATE.md`,
`docs/architecture/FEATURE_MATRIX.md`, and prioritized risk register. -
Add ADRs for major architecture choices; do not restructure the entire
repository in this phase.

Acceptance: - Every reported MVP feature marked verified/partial/missing
with evidence. - Baseline CI and local test instructions documented. -
Critical security/deployment risks ranked by severity and likelihood. -
No product rewrite started without a written case.

### Phase 1 --- Engineering governance and release foundation

**Goal:** make changes safe and reproducible.

Tasks: - Create/update `AGENTS.md` with repository-specific agent
instructions. - Add `DEVELOPMENT_LOG.md` and `CHANGELOG.md`
conventions. - Pin supported runtime/package manager; commit lockfile. -
Establish CI for lint, typecheck, unit tests, build, dependency audit
and secret scanning. - Add consistent error handling, correlation IDs,
structured logs, and health/readiness checks. - Define semantic
versioning, support policy, security reporting and release procedure. -
Add backup/restore verification, not merely backup script existence.

Acceptance: - Fresh clone can install, test and build from documented
commands. - CI blocks merges on required checks. - Logs redact secrets
and sensitive form data. - Backup can be restored to a clean test
environment and integrity verified.

### Phase 2 --- Domain boundaries and framework isolation

**Goal:** make FlxOraCMS---not Next.js/Prisma/Auth.js---the owner of its
domain contracts.

Tasks: - Inventory imports from Prisma and Next.js across business
logic. - Introduce repository interfaces around high-value domains,
starting with content, fields, taxonomy and routing. - Move business
rules into application/domain modules where beneficial. - Encapsulate
session/identity details behind internal interfaces without
reimplementing authentication. - Keep Next.js route handlers as thin
delivery adapters. - Add architecture tests/lint rules to prevent domain
imports from delivery and generated ORM types. - Avoid a large "clean
architecture" rewrite; migrate one vertical slice at a time.

Acceptance: - At least one complete content use case can be unit-tested
without Next.js request objects. - Domain contracts do not expose
Prisma-generated types. - Existing behavior and data are preserved by
integration tests. - Any remaining framework coupling is documented and
prioritized.

### Phase 3 --- Content model and custom fields maturity

**Goal:** make structured content a first-class differentiator.

Tasks: - Audit custom content type and field implementation. - Define a
versioned field schema and field-type registry. - Implement
validation/defaults, relationship rules, repeatable groups, permissions,
query/index behavior and schema evolution. - Add revisions, publish
scheduling behavior, content status transitions, and conflict-safe
editing where not already present. - Define typed APIs for querying
content and relationships with pagination/limits. - Add import/export
that preserves stable IDs, field definitions and relationships. -
Benchmark relational, JSON, or hybrid storage before selecting or
changing the storage model.

Acceptance: - Custom content types/fields work without a third-party
plugin for basic modeling. - Invalid schemas and invalid field values
fail predictably. - Schema changes preserve data or provide explicit
migration steps. - Query APIs are bounded and indexed for common access
patterns. - Export/import round-trip tests pass.

### Phase 4 --- Theme contract and rendering runtime

**Goal:** allow designers to distribute themes without coupling to
Next.js internals.

Tasks: - Document theme package layout and manifest. - Define supported
template helpers, content context, URL generation, asset handling,
components and settings. - Validate theme packages before activation. -
Prevent traversal and server-code execution through uploaded theme
packages. - Add compatibility checks, preview/staging, safe activation,
and fallback theme recovery. - Add template caching and invalidation
where measurable. - Document a theme SDK and create a theme conformance
suite.

Acceptance: - A third-party sample theme can be created from
documentation alone. - Invalid/incompatible themes are rejected
safely. - Theme failure does not permanently lock the admin out. -
Existing `starter` and `minimal` themes pass conformance tests.

### Phase 5 --- Layout builder, component system and animations

**Goal:** deliver modern visual flexibility with stable saved data.

Tasks: - Define a versioned layout/block JSON schema and migration
policy. - Separate editor UI implementation from persisted layout
format. - Define reusable components, slots, typed props, content
bindings, responsive rules and safe fallbacks. - Build block validation
and preview. - Integrate GSAP as optional client-side behavior with
reduced-motion support. - Prevent ordinary content editors from
injecting arbitrary script. - Test rendering output, layout migration,
responsive behavior, keyboard operation and bundle size.

Acceptance: - Layouts remain readable and exportable across editor
library upgrades. - Unknown blocks fail gracefully. - Animations can be
disabled and respect reduced-motion settings. - Public pages do not load
editor code and unused animation bundles.

### Phase 6 --- Plugin API v1 and extension lifecycle

**Goal:** build an ecosystem around stable contracts rather than ad hoc
hooks.

Tasks: - Document plugin manifest, API versioning, permissions,
lifecycle and dependency resolution. - Specify hooks/events, ordering,
errors, timeout/latency expectations, and critical/noncritical
behavior. - Provide typed public APIs and a sample plugin. - Add
install/activate/deactivate/upgrade/uninstall flows with preflight and
audit events. - Define plugin storage and migration conventions. - Add
compatibility checks and conformance tests. - Document honestly that
same-process plugins are trusted code, not sandboxed code.

Acceptance: - A separately developed sample plugin works without editing
core source. - Incompatible plugins are blocked with actionable
errors. - Deactivation preserves data; uninstall behavior is explicit. -
Plugin failures do not expose secrets or bypass access control. - API v1
compatibility policy is published.

### Phase 7 --- Deployment, installer, upgrade and recovery

**Goal:** make installation and maintenance reliable for real agencies.

Tasks: - Define supported Node-capable shared-hosting profiles and
unsupported PHP-only profiles. - Create an installation/preflight wizard
or CLI that checks runtime, database, filesystem permissions, required
extensions and environment. - Ensure secrets/config are outside public
web roots where the host permits. - Document reverse proxy/base
path/domain/HTTPS and persistent storage requirements. - Build upgrade
preflight, database backup, migration execution, version checks, and
recovery instructions. - Test clean install, update, restart, file
permissions, media upload, email, cron/background work, backup and
restore. - Provide host-specific guides only after actual validation.

Acceptance: - A clean install and upgrade succeed on every claimed
supported profile. - Failed preflight prevents destructive migration. -
Backup restore is tested. - The compatibility matrix clearly labels
tested, community-tested, and unsupported providers.

### Phase 8 --- Performance, reliability and scale

**Goal:** quantify the performance advantage and improve concurrency
without requiring expensive infrastructure.

Tasks: - Build reproducible load scenarios for public pages, content
API, admin reads, writes, media and forms. - Capture p50/p95/p99,
throughput, errors, memory, DB latency and cache hit rate. - Fix
bottlenecks in order of measured impact. - Add cache policy and
invalidation tests. - Add database indexes and query budgets based on
representative data. - Add optional cache/queue adapters without making
Redis mandatory for baseline operation. - Define behavior under DB
outage, full disk, cache outage, provider rate limits and worker
failure.

Acceptance: - Benchmarks are reproducible with hardware/runtime/database
configuration recorded. - Performance targets are explicitly set after
baseline measurement. - No critical data corruption or cross-user cache
leakage under load tests. - Degraded dependencies fail predictably and
are observable.

### Phase 9 --- WordPress compatibility program (Phases 9.1--9.10)

**Goal:** make adopting FlxOraCMS from WordPress cheap, predictable and
honest: migrate content, media, URLs, settings and designs; map plugin
functionality to native features, adapters or alternatives; and decide,
with evidence, whether an isolated PHP runtime is justified for what
cannot be converted.

This program replaces the former single "WordPress migration and
ecosystem adoption" phase. The number 9 is kept so references to Phases
10 and 11 stay stable. Read **Section 9A** (objective, compatibility
levels, claims policy and cross-cutting requirements) before starting any
sub-phase. Every sub-phase inherits Section 9A.

**Dependency order.** Sub-phases are gate-based like all other phases.
Research and read-only work may overlap earlier phases; anything that
changes product behavior may not.

  ---------------------------------------------------------------------------
  Sub-phase                       Hard prerequisites                 May run in parallel with
  ------------------------------- ---------------------------------- ---------------------
  9.1 Charter, corpus, baseline   Phase 0 (feature matrix), Phase 1  Phases 2--4 (read-only
                                  (governance, log, CI)              research)

  9.2 Static analyzer and report  9.1; Phase 4 theme contract;      Phases 5, 7
                                  Phase 6 plugin manifest draft

  9.3 Test harness and corpus     9.1, 9.2 (report schema); CI       9.4 design
  automation                      from Phase 1

  9.4 Content/DB/media/URL/       Phase 3 (field schema,             9.5, 9.6 design
  settings migration engine       import/export), Phase 7 (verified
                                  backup/restore), 9.2, 9.3

  9.5 Theme migration and design  Phase 4, Phase 5, 9.2, 9.3, 9.4    9.6
  preservation

  9.6 Plugin detection, adapters, Phase 6 (plugin API v1), 9.2, 9.3, 9.5
  dependencies, alternatives      9.4

  9.7 Guided migration assistant  Phase 2 (application layer),       9.8
                                  Phase 7, minimum viable 9.2/9.4/
                                  9.5/9.6

  9.8 PHP runtime research, PoC   9.1, 9.2 (census), 9.3, Phase 6    9.4--9.7
  and architecture review         trust-model ADR, Phase 7 host
                                  profiles

  9.9 Isolated runtime            **Accepted 9.8 ADR (Go)**, Phase 8 --
  implementation (conditional)    baseline, Phase 7 matrix, security
                                  review

  9.10 Compatibility directory    9.3; grows with 9.5/9.6; public    Continuous
  and maintenance program         launch gated by Phase 11
  ---------------------------------------------------------------------------

**Program-wide rules (apply to every sub-phase):**

-   Never execute uploaded or downloaded WordPress PHP inside the
    Next.js process or on the production host while analyzing,
    converting or importing. Analysis is static (parse, never
    `include`/`eval`/run). The existing `.php` blocklist in theme upload
    (`src/server/theme/install.ts`) stays; converted themes must pass
    conformance with no PHP present.
-   The source WordPress site, database and files are read-only inputs and
    are never modified.
-   Nothing is silently dropped. Every source item and every detected
    feature ends as imported, imported with warnings, or listed in the
    unsupported report with a reason.
-   Compatibility code is an optional module. Core domain code must not
    import it, and the CMS must build, run and pass its tests with the
    module removed or disabled.
-   Every target number below is **provisional**. Sub-phase 9.1 measures
    baselines and an ADR ratifies, changes or rejects each target before
    it becomes a gate. Targets are never edited afterwards to make a
    result pass; changes are logged in `DEVELOPMENT_LOG.md` with reasons.
-   No result, percentage, version support or capability may be written
    into docs, UI or marketing until a recorded test run supports it
    (see Section 9A.3).
-   Schema additions are additive (expand, migrate, contract). The
    repository currently has one Prisma migration and documents
    `prisma db push` as its workflow, so switching to `prisma migrate`
    (Phases 1 and 7) is a prerequisite for shipping any schema change in
    this program.

------------------------------------------------------------------------

#### Phase 9.1 --- Charter, corpus selection and baseline

**Goal:** define what "compatible" means and build the evidence base
before any product code exists.

**Prerequisites:** Phase 0 feature matrix complete; Phase 1 governance
(development log, CI) in place; availability of a maintainer or counsel
to review licensing and trademark questions.

**Architecture decisions (ADRs):**

-   ADR-WP-001: compatibility levels (C1--C4), fidelity grading, and
    claims policy (adopts or amends Section 9A).
-   ADR-WP-002: supported WordPress source versions (a bounded window,
    for example the current major and the previous one --- decide from
    data), source types (WXR export, SQL dump, read-only live DB, HTTP
    crawl of a live site, REST API) and which ship in the first release.
-   ADR-WP-003: licensing and trademark policy for corpus items,
    derived code, naming ("imports from WordPress" vs any implication of
    endorsement) and FlxOraCMS's own license (open question in Section
    3).
-   ADR-WP-004: module boundary --- where compatibility code lives, how
    it is disabled, and how it is kept out of the core import graph.

**Deliverables:**

-   `docs/wordpress/CHARTER.md`: objective, non-goals, levels, claims
    policy, definitions of "compatible", "fidelity grade" and
    "supported".
-   Corpus manifest (`tests/fixtures/wordpress/corpus.json` plus
    `docs/wordpress/corpus.md`): selection criteria, retrieval date and
    source (official directory ranking), version, checksum and license
    for each item. Cover classic themes, block themes, page-builder
    themes, and plugin categories (SEO, forms, custom fields, caching,
    security, backup, sliders/galleries, page builders, multilingual,
    eCommerce, membership). Non-redistributable items are recorded by
    checksum and download instructions only and are never committed.
-   Synthetic fixture sites generated by script in a pinned reference
    WordPress environment (no real customer data).
-   Feature census: ranked frequency of WordPress functions, hooks,
    shortcodes, block types, CPT/taxonomy registrations, REST/AJAX
    endpoints and custom tables across the corpus. This drives adapter
    priority and the runtime demand estimate in 9.8.
-   Threat model for importing hostile packages and exports.
-   Baseline measurements and proposed target values for 9.2--9.10.

**Acceptance criteria:**

-   ADRs accepted by maintainers; each corpus item has a recorded
    license and redistribution status.
-   The census method is documented and re-running it on the same
    corpus gives the same result.
-   No compatibility product code is merged in this sub-phase.

**Tests:** corpus integrity script (checksum verification); census
reproducibility test; licensing checklist review recorded in the log.

**Security controls:** corpus fetched only from official sources over
HTTPS and verified by checksum; corpus code is stored outside the
repository and is **never executed** in this sub-phase; fixtures contain
synthetic content only.

**Measurable targets (provisional):** corpus of at least 50 themes
(including at least 10 block themes) and 100 plugins at the first
internal milestone, growing toward the most-installed themes and plugins
by public launch; 100% of items have license and checksum recorded;
census reproducible.

------------------------------------------------------------------------

#### Phase 9.2 --- Static analyzer and compatibility report

**Goal:** read-only analysis of WordPress theme and plugin packages (and
optionally a site inventory) that produces a versioned Compatibility
Report.

**Prerequisites:** 9.1; Phase 4 (defines what a native theme is); Phase 6
(plugin manifest and capability vocabulary).

**Architecture decisions (ADRs):**

-   PHP parsing approach: a JavaScript parser library, a separate
    tool using a mature PHP parser, or heuristics. Evaluate accuracy on
    the corpus, license, maintenance, memory/time behavior on hostile
    input, and hosting constraints. Do not decide before measuring.
-   Where analysis runs: bounded worker inside the app, child process,
    or an offline CLI users run on their workstation (the likely answer
    for constrained shared hosting).
-   Compatibility Report schema, its versioning and its stability
    promise.
-   How "unknown" is represented so it can never be read as
    "compatible".

**Deliverables:**

-   Package ingestion: zip handling with the existing zip-slip
    protections plus entry-count, expansion-ratio and nested-archive
    limits; symlinks rejected; extraction into a non-served quarantine
    directory only.
-   Header parsing: theme `style.css` headers; plugin main-file headers
    (version, `Requires at least`, `Requires PHP`, `Requires Plugins`,
    license, text domain).
-   Theme inspection: template hierarchy, template parts,
    `functions.php` behavior, `theme.json`, block templates and
    patterns, enqueued styles/scripts, fonts, external CDN
    dependencies.
-   Plugin inspection: registered shortcodes, blocks, CPTs, taxonomies,
    REST routes, AJAX actions, cron events, custom DB tables / `$wpdb`
    use, file writes, outbound HTTP, and obfuscation or eval-style
    indicators.
-   Compatibility Report v1 (JSON plus an admin view): per feature a
    level (C1--C4), confidence, reason, evidence (file and line), and
    suggested path; overall effort estimate.
-   CLI entry point for offline analysis (name decided in the ADR).

**Acceptance criteria:**

-   The analyzer never executes PHP and makes no network calls.
-   Output is deterministic: identical input and tool version give
    byte-identical reports.
-   Unrecognized constructs are reported as unknown, not compatible.
-   Resource limits are enforced and tested on hostile archives.

**Tests:** parser unit tests; golden-file report per corpus item;
hostile-archive tests (zip bomb, zip-slip, symlink, oversized file,
invalid UTF-8, deep nesting, huge single-line files); determinism test;
report schema contract test; performance test on a large theme.

**Security controls:** static analysis only; quarantine extraction; hard
caps on size, count, depth, time and memory; all extracted strings
(headers, names, authors) escaped when rendered in the admin UI; no
filesystem writes outside the quarantine area; permission-gated route.

**Measurable targets (provisional):** header detection correct on at
least 99% of corpus items; template-hierarchy detection correct on at
least 95% of a hand-labelled sample (at least 30 themes); false
"compatible" rate (C1/C2 reported where manual review finds a blocker)
at most 2% on the labelled sample; a 20 MB package analyzed within a
time and memory budget set from the 9.1 baseline.

------------------------------------------------------------------------

#### Phase 9.3 --- Compatibility test harness and corpus automation

**Goal:** make every later claim measurable before building conversion
features.

**Prerequisites:** 9.1; 9.2 report schema; Phase 1 CI.

**Architecture decisions (ADRs):**

-   How ground truth is produced: a pinned, containerized reference
    WordPress environment (with WP-CLI) used **only** in dev/CI to
    render corpus items and export fixtures --- never part of the
    product runtime.
-   Visual comparison method: viewports, masking of dynamic content,
    metric (for example SSIM or pixel difference) and tolerances.
-   Cadence and cost: per-PR smoke subset versus nightly full run;
    artifact storage and retention.

**Deliverables:**

-   Reference environment definition with pinned versions and
    deterministic seeding.
-   Pipeline runner: analyze, migrate, render, compare, score; per-item
    isolation so one failing item never hides others.
-   Result schema recording FlxOraCMS version, tool versions,
    WordPress version, corpus item version/checksum, date, level, and
    scores; results stored as CI artifacts.
-   Regression gate on a pinned subset: a change may not lower a score
    without a logged explanation.
-   Contributor guide for adding corpus items; flaky-test quarantine
    with tracked issues.

**Acceptance criteria:** the pipeline runs end to end on at least 10
corpus items with only what exists at that point (analysis plus
rendering of the ground truth); results are reproducible; failures are
attributable to a specific item and stage.

**Tests:** harness self-tests; determinism test (same input produces a
zero-difference screenshot across three runs in the same environment);
failure-isolation test.

**Security controls:** third-party WordPress code runs **only** inside
disposable CI/dev containers that hold no secrets, have egress denied or
allow-listed, run as unprivileged users and are destroyed after each
run; corpus is never mounted into the application or database used for
development data; CI logs scrubbed.

**Measurable targets (provisional):** run-to-run variance of the visual
score at most 0.5 percentage points; nightly duration within a budget
set from baseline; corpus growth policy per release recorded.

------------------------------------------------------------------------

#### Phase 9.4 --- Content, database, media, URL and settings migration engine

**Goal:** import WordPress data into FlxOraCMS safely, idempotently and
with a dry run that makes no writes.

**Prerequisites:** Phase 3 (versioned field schema, stable-ID
import/export); Phase 7 (backup/restore verified, `prisma migrate`
adopted); 9.2 report schema; 9.3 fixtures.

**Architecture decisions (ADRs):**

-   Source adapters: WXR file, SQL dump parsed offline, read-only live
    MySQL connection, REST API of the source site. WXR is the lowest
    risk; direct DB gives higher fidelity (post meta, options, plugin
    tables). Decide which ship first from measured fidelity and risk.
-   Import ledger: additive tables (for example `import_batches` and
    `import_items`) recording source system, source type, source ID,
    target ID, checksum, status and a journal of prior values for any
    updated row. This enables idempotency, resume and rollback.
-   Import mode: default is import into a fresh or empty site, or
    additive-only; overwriting existing entries requires explicit
    per-conflict resolution.
-   Status mapping: WordPress has `publish`, `draft`, `pending`,
    `private`, `future`, `trash` and internal statuses; FlxOraCMS has
    DRAFT, PUBLISHED, SCHEDULED and TRASHED. Decide `pending` and
    `private` handling explicitly --- no silent mapping.
-   Comments: FlxOraCMS has no comment model. Decide between report-only,
    archived export, or a future module; never drop silently.
-   Users: map authors and roles; do not import password hashes by
    default (require reset or invitation); evaluate hash import only as
    an explicit opt-in.
-   PHP-serialized data (options, post meta): a data-only parser with
    size and depth limits and no object instantiation.
-   Body conversion: classic HTML to sanitized rich text; Gutenberg
    block comments to FlxOraCMS blocks or HTML via a mapping table
    (core blocks first); shortcodes to native equivalents or preserved
    placeholders; page-builder content stored raw, flagged and reported.
-   Multisite and multilingual (WPML/Polylang etc.): detect and report
    in the first release; migration is out of scope until separately
    planned.

**Deliverables:**

-   Source adapters, mapping tables (`docs/wordpress/migration-mapping.md`)
    and import-ledger migration.
-   Mapping coverage: posts, pages, CPTs and their meta (typed via
    heuristics and field-group definitions), hierarchy, authors,
    categories/tags/custom taxonomies and term hierarchy, menus,
    attachments (alt text, caption, featured images), and settings
    (site title, tagline, timezone, static front page, permalink
    structure, reading settings, analytics IDs).
-   SEO plugin metadata (title, description, canonical, robots, social
    image) into `SeoMeta` where the 9.6 catalog supports the source
    plugin.
-   URL preservation: compute each item's WordPress URL from the source
    permalink structure; compare with the FlxOraCMS route; generate
    redirects for differences, including `?p=`/`?page_id=` forms,
    category/tag/author archives, date archives, feeds and
    `/wp-content/uploads/` paths. Decide whether exact-match redirects
    (the current `Redirect.from` unique model) suffice or pattern rules
    are needed.
-   Content link and media URL rewriting; media import from an uploads
    archive or remote fetch, deduplication by hash, regenerated
    derivatives (source thumbnails are not imported).
-   Dry-run engine producing a change plan (counts, conflicts, missing
    parents, orphaned media, unsupported statuses, slug collisions) with
    zero writes; apply engine in resumable, transactional batches;
    verification report (counts, relationships, links, checksums).

**Acceptance criteria:**

-   Dry run performs no database or storage writes (asserted by test).
-   Re-running the same import creates no duplicates.
-   An interrupted import resumes without corruption.
-   Imported and reported counts reconcile with the source; every
    non-imported item is in the report.
-   Batch rollback removes created rows/files and restores journaled
    prior values.

**Tests:** unit tests per mapper; golden fixtures from the 9.3 reference
environment; MySQL integration tests; property tests for slug and URL
mapping; kill-and-resume tests; large-site test (for example 10,000
posts and 20,000 media files --- confirm size from 9.1) with memory
profile; hostile-input tests (XXE and entity expansion in XML, huge
XML, malicious serialized data, XSS in titles/meta/content, traversal in
attachment paths, SSRF in media URLs, SQL dump with unexpected
statements); schema migration tests (clean install and upgrade).

**Security controls:** XML parsing with DTD and external entities
disabled and size limits; no PHP object semantics; all HTML through the
existing sanitizers; SSRF guard on every remote fetch (block private,
loopback, link-local and metadata addresses; re-validate redirects;
size and time caps; default host allow-list limited to the source
domain); DB credentials held in memory only, never persisted or logged,
read-only user recommended; new RBAC permissions (Super Admin by
default); audit-log entries for every run; PII (emails, comments)
minimized, with retention stated in the report.

**Measurable targets (provisional):** on fixtures, at least 99.5% of
entries imported with correct title, slug, status, dates, parent and
author; 100% of non-imported items present in the report; at least 98%
of internal URLs resolve (200, or 301 to the correct target) after
migration; at least 99% of media files imported with correct alt and
caption; normalized body-text equality for every imported entry that
contains no unsupported block; idempotent re-run creates 0 new rows;
large-site import within a time and memory budget set from baseline.

------------------------------------------------------------------------

#### Phase 9.5 --- Theme migration and design preservation

**Goal:** convert WordPress themes into FlxOraCMS themes with the highest
achievable visual fidelity, and state honestly where fidelity is lost.

**Prerequisites:** Phase 4 (theme contract and conformance suite);
Phase 5 (layout/animation); 9.2; 9.3; 9.4 (content to render).

**Architecture decisions (ADRs):** a strategy ladder, chosen per theme
from report evidence. A proof of concept on the corpus must compare
strategies before one becomes the default.

-   **S1 --- Block (FSE) themes:** deterministic conversion of
    `theme.json` design tokens, block templates and patterns to Liquid
    templates, partials and customizer variables.
-   **S2 --- Classic PHP themes:** (a) *rendered capture*: crawl the
    user's own live site over HTTP to collect final CSS, JS, fonts and
    images and infer header/footer/loop regions by comparing pages
    (heuristic, confidence-scored); (b) *template translation*: static
    translation of a small, documented set of template tags
    (`the_title`, `the_content`, `the_permalink`, `get_header`,
    `get_footer`, `have_posts` loops, `wp_nav_menu`, `bloginfo`,
    `wp_head`, `wp_footer`, `body_class`) to Liquid, flagging everything
    else; (c) guided manual conversion with visual-diff tooling.
-   **S3 --- Page-builder output** (Elementor, Divi, WPBakery and
    similar): rendered capture into static blocks or builder documents;
    reported as best-effort with per-page grades.
-   Policy for jQuery and other bundled libraries (ship locally only
    when the theme needs them, with license check), self-hosted versus
    remote fonts, and removal of WordPress-specific output (admin bar,
    emoji scripts, generator tags).
-   A from-scratch "WordPress core block styles" stylesheet so imported
    content using `wp-block-*`, `alignwide`, `alignfull`,
    `screen-reader-text` and similar classes renders correctly.
-   Mapping of widget areas to layout regions, menu locations to
    manifest menus, `theme_mods` to customizer settings, page templates
    to templates, and template parts to partials.

**Deliverables:**

-   Converter producing a valid FlxOraCMS theme package that passes the
    Phase 4 conformance suite; a conversion report listing mapped,
    dropped and manual-TODO items.
-   Visual-diff tool in the admin and CLI: side by side source versus
    converted, per page, at 375 / 768 / 1280 px, with a score.
-   Fidelity grades (A--D) with published thresholds, computed per
    theme and per page.
-   Staged preview and safe activation with automatic fallback to the
    previous theme; documentation and a manual-fix guide.

**Acceptance criteria:**

-   Converted themes contain no PHP and pass conformance.
-   Conversion is deterministic and every template is converted or
    listed.
-   Every converted page has a computed visual score and a grade.
-   Predicted grade (from the 9.2 report) is within one grade of the
    measured grade for the corpus at the target rate below.

**Tests:** golden conversion per corpus theme; visual regression against
the 9.3 reference render at three breakpoints; conformance suite;
accessibility scan comparing source and converted output; console-error
check; transfer-size comparison; hostile-theme tests (obfuscated JS,
base64 PHP in assets, external script injection, CSS `@import` of remote
resources).

**Security controls:** no PHP executed or retained; theme JavaScript
is third-party code served to visitors, so list external domains and
require admin acknowledgment, and document Content-Security-Policy
options; theme assets served by the existing safe asset route with
correct MIME types; remote CSS/JS references reported and, by default,
not fetched at conversion time except via the SSRF-guarded crawler;
crawler limited to the user-supplied origin; no secrets in captured
output (strip nonces, tokens, logged-in-only markup).

**Measurable targets (provisional; recalibrate after the S1--S3
proof of concept):** at least 90% of corpus block themes reach grade B
or better on home, single, page and archive templates; at least 70% of
corpus classic themes using only supported template tags reach grade B
or better; page-builder pages are graded individually and not
promised; predicted grade within one grade of measured grade for at
least 90% of the corpus; converted-page transfer size no more than a
set percentage above the source (set from baseline).

------------------------------------------------------------------------

#### Phase 9.6 --- Plugin detection, API adapters, dependency mapping and alternatives

**Goal:** for every detected plugin, produce an evidence-backed
classification and a concrete path: native feature, adapter, alternative,
isolated runtime (only if 9.9 exists), or unsupported.

**Prerequisites:** Phase 6 (plugin API v1, manifest, capabilities);
9.2; 9.3; 9.4.

**Architecture decisions (ADRs):**

-   **What "WordPress API adapter" means.** FlxOraCMS does not
    re-create WordPress's global function namespace in Node. Adapters
    implement documented *behaviors* of a selected, census-ranked
    subset: the shortcode API, content/CPT/taxonomy registration,
    options and post-meta access as data mapping, a limited
    block-to-block mapping, and a hook-name translation table to
    FlxOraCMS hooks. Adapters work on a plugin's **data** and public
    output; they do not run its PHP.
-   Catalog format: data-only, versioned, validated in CI, accepting
    community contributions under review.
-   Adapter trust: adapters are first-party or reviewed native
    FlxOraCMS plugins under the Phase 6 trust model; the catalog itself
    carries no executable code.
-   Plugin identification: slug and version from headers and directory
    metadata, plus file-hash signatures; handling of forks, renamed,
    premium and pirated ("nulled") copies (warn, never recommend).

**Deliverables:**

-   Catalog schema and initial entries ranked by the 9.1 census: for
    each plugin, version ranges, status (native, adapter, alternative,
    runtime-only, unsupported), the FlxOraCMS equivalent, data-mapping
    notes, limitations, and linked fixture/test.
-   Dependency graph in the report: `Requires Plugins`, `Requires PHP`
    and extensions, `function_exists`/`class_exists`/
    `is_plugin_active` checks, theme-to-plugin dependencies (shortcodes,
    CPTs), custom tables owned by plugins.
-   First adapters, prioritized by census: custom-field plugins
    (ACF and similar) to custom fields; SEO plugins (Yoast, Rank Math,
    AIOSEO) and redirect plugins to `SeoMeta` and `Redirect`; form
    plugins (form definitions to the form builder, with `[flxform]`
    replacing their shortcodes; submission history only if exported);
    core shortcodes (`gallery`, `caption`, `embed`, `audio`, `video`);
    analytics plugins to integration IDs. WooCommerce and other
    eCommerce plugins are detected and reported; their data migration
    waits for Phase 10A.
-   Alternatives section in the report and a public alternatives list
    (for example caching/backup/security plugins whose purpose the
    platform already covers --- each statement backed by a test or
    documented platform behavior).

**Acceptance criteria:**

-   Every detected plugin has a classification, evidence and, where
    one exists, an alternative. Unknown plugins are labeled unknown
    --- never "safe to ignore".
-   Adapters are idempotent and reversible per import batch.
-   Each catalog entry has a fixture and a passing test; schema is
    validated in CI.

**Tests:** catalog schema and contract tests; adapter golden tests using
data produced by the real plugins in the 9.3 reference environment;
negative tests (version outside range, renamed plugin, conflicting
dependencies); shortcode parser fuzzing (nested, malformed, oversized);
mapping-loss tests that assert unmapped data is reported.

**Security controls:** catalog is data-only; shortcode attributes and
adapter output sanitized and escaped; no `eval` or dynamic code
loading; contributions require review and CI validation; no premium or
license-restricted plugin code is stored or redistributed (metadata and
hashes only, where legally permitted); adapters cannot request
capabilities beyond their declared manifest.

**Measurable targets (provisional):** 100% of the corpus's top-100
plugins classified with evidence; share of those with a native
alternative or adapter is **measured and published, not promised** (a
planning hypothesis of at least 60% is to be validated or revised in
9.1); at least 95% field-level fidelity for supported adapters on
fixtures; 100% of core shortcodes handled; 0 silently dropped plugin
features.

------------------------------------------------------------------------

#### Phase 9.7 --- Guided migration assistant

**Goal:** one guided flow (admin UI and CLI parity) that ties analysis,
migration, theme conversion and plugin mapping together with preview,
verification and rollback.

**Prerequisites:** Phase 2 (application layer for use cases); Phase 7
(backup/restore verified, installer/preflight); minimum viable 9.2, 9.4,
9.5 and 9.6; RBAC.

**Architecture decisions (ADRs):**

-   Migration session state machine: created, analyzed, decided,
    planned, previewed, applying, applied, verified, cut over, closed,
    plus failed and rolled back.
-   Execution model for hosts without persistent workers: chunked,
    resumable steps persisted after each chunk, with a documented
    cron/polling fallback (see Section 11.2, item 9). No step may
    depend on a single long HTTP request.
-   Preview strategy: (i) migrate into a fresh install (recommended
    default); (ii) batch-scoped preview mode on an existing site that is
    invisible to the public; (iii) separate instance. Choose after
    evaluating isolation and cache-leak risk (Section 11.3).
-   Where users' decisions (status mapping, comments, users, theme
    strategy, plugin alternatives) are stored and how they are replayed.

**Rollback strategy (must be specified in the ADR and runbook):**

-   **R0 --- Pre-flight:** automatic backup of database and storage,
    verified restorable (reusing the Phase 1/7 restore verification),
    before the first write. Refuse to start without it unless the user
    gives an explicit, logged override.
-   **R1 --- Batch rollback:** delete everything created by an import
    batch and restore journaled prior values for any updated rows and
    files.
-   **R2 --- Full restore** from the R0 backup for catastrophic cases.
-   **R3 --- Cutover rollback:** the source WordPress site is untouched;
    reverting DNS and removing redirects restores the old site.
    The assistant never edits DNS.
-   Document what cannot be rolled back (edits made in FlxOraCMS after
    cutover) and that reverse migration to WordPress is not promised.

**Deliverables:**

-   Wizard under the admin area (new nav entry, new permissions) and CLI
    parity covering: source intake with scope selection; analysis and
    Compatibility Report with a go/no-go summary, blockers and effort
    estimate; decisions; dry-run plan (counts, conflicts, time and
    storage estimate); isolated preview; apply; automated verification
    (link check, media check, visual diff, SEO parity of titles, meta,
    canonicals and sitemap URLs against the source); cutover checklist
    (redirects, robots, sitemap, analytics IDs, DNS guidance);
    post-migration 404 monitoring that suggests redirects.
-   Persisted sessions, exportable reports (JSON and printable) with
    secrets and PII stripped, audit trail, concurrency lock, runbook,
    and troubleshooting guide.

**Acceptance criteria:**

-   A corpus fixture site completes upload to verified cutover checklist
    using only the assistant.
-   Rollback is tested from every reachable state and returns database
    row counts and the storage file tree to the pre-migration snapshot.
-   Closing the browser or restarting the server mid-run never corrupts
    state; the session resumes.
-   Two concurrent migrations are blocked.

**Tests:** Playwright end-to-end of the full flow on a fixture;
failure injection at every state; rollback equivalence tests; RBAC and
CSRF tests; concurrency test; accessibility checks; a run under the
constrained timeouts of a documented shared-hosting profile.

**Security controls:** new permissions (for example `migration.view`,
`migration.run`, `migration.rollback`), Super Admin by default;
server-action authorization on every step; upload limits and the 9.2/9.4
hostile-input protections; every source-derived string escaped in the UI;
rate limits; outbound requests only to user-approved origins through the
SSRF guard; secrets never written to reports or logs; audit entry for
each state change.

**Measurable targets (provisional):** in a usability test with at least
five participants, a first-time user completes a migration of a site
of up to 500 items within 30 minutes of active time; rollback restores
the pre-migration snapshot in 100% of tests; the unsupported-feature list
in the pre-migration report matches the post-migration verification
for at least 95% of items.

------------------------------------------------------------------------

#### Phase 9.8 --- PHP compatibility runtime research, proof of concept and architecture review

**Goal:** decide with evidence whether, and how, FlxOraCMS could run a
bounded set of WordPress functionality that cannot be converted.
**Research and decision only --- no production implementation.**

**Prerequisites:** 9.1 and 9.2 (census showing which features are
C3-only and how common they are --- the demand evidence); 9.3 (to
measure); Phase 6 plugin trust-model ADR; Phase 7 hosting profiles. May
run alongside 9.4--9.7.

**Why this is research:** Next.js cannot execute PHP. WordPress themes
and plugins depend on WordPress core being present: global functions,
`$wpdb`, the options/hook/query machinery, and often wp-admin screens.
Any runtime is therefore a separate system, with its own security,
hosting and maintenance cost. A hook system is not a sandbox
(Section 9.3), and PHP-only hosting remains unsupported (Section 4.2).

**Options to evaluate (none pre-selected):**

-   **A. No runtime.** Conversion, adapters and alternatives only.
    This is the default outcome unless the evidence favors another
    option.
-   **B. Real WordPress core plus PHP in a separate container or
    service** acting as a headless renderer/bridge for specific
    features, with its own database.
-   **C. PHP compiled to WebAssembly** (the approach used by projects
    such as WordPress Playground) executed beside or inside Node ---
    verify current maturity, database support (including MySQL versus
    SQLite shims), extension availability, performance, memory,
    license and isolation properties.
-   **D. Re-implementation of a WordPress API subset in Node.** This is
    9.6 extended; evaluate where the effort tail becomes unbounded.
-   **E. External or hosted compatibility service** (per site or
    shared): operations, cost, data residency, trust.
-   **F. FastCGI to PHP provided by the host**, with hardening:
    compatible with some shared hosts but weakest isolation; evaluate
    whether it is acceptable even for administrator-trusted code.

**Evaluation criteria (weights recorded before testing):** isolation
strength and how it is verified; corpus coverage gained over C1/C2;
p95 latency overhead and per-site memory; hosting feasibility by tier;
operational burden (PHP patching, CVE response, image updates);
licensing; coupling to the WordPress database schema; failure modes;
maintainability and bus factor; total cost.

**Proof-of-concept protocol:**

-   Time-boxed. Code lives in a clearly separated location (for example
    `experiments/`) that is excluded from builds, lint targets that
    ship, routes and deployment; never reachable from production.
-   Uses only corpus fixtures, measured with the 9.3 harness.
-   Includes an attack suite: file reads outside the allowed directory,
    environment-variable and secret reads, outbound network and SSRF to
    internal/metadata addresses, fork/memory/CPU/disk exhaustion,
    infinite loops, database access beyond grants, symlink and
    stream-wrapper tricks (`phar://`, `php://filter`),
    `disable_functions`/`open_basedir` bypass attempts, and
    cross-site access in multi-site setups.

**Deliverables:**

-   Research report (`docs/wordpress/runtime-research.md`) and
    ADR-WP-0xx with the options matrix, measured data, PoC results
    including failures, threat model, cost and operations estimate, and
    an explicit statement of what cannot be isolated.
-   Recommendation: **Go (scoped)**, **Conditional**, or **No-Go**,
    with the exact scope (for example "front-end shortcode rendering
    only"), hosting tiers allowed, and exit criteria.
-   Independent security review of the design by someone other than the
    PoC author; human maintainer sign-off recorded.

**Acceptance criteria:**

-   Every option is evaluated against the same criteria with evidence.
-   The attack suite results are documented, including unresolved
    escapes and accepted residual risk.
-   The ADR is accepted or rejected by maintainers. On No-Go, product
    documentation states conversion-only compatibility and Phase 9.9 is
    cancelled.

**Tests:** isolation/escape suite (becomes the regression suite on Go);
corpus compatibility measurement; load and resource-exhaustion tests;
cold-start measurements.

**Security controls:** PoC runs only in disposable VMs or containers
with no secrets, denied egress, unprivileged users, and resource
quotas; corpus code is treated as hostile; no PoC code or credentials
in the main branch; vulnerabilities found in third-party code are
handled through responsible disclosure.

**Go criteria (provisional, set in the ADR):** 100% of defined escape
attempts blocked or mitigated with documented, maintainer-accepted
residual risk; p95 overhead and per-site memory within budgets set from
the Phase 8 baseline; additional corpus coverage beyond C1/C2 of at
least a threshold (hypothesis: 10 percentage points of top-100 plugin
features --- validate against the census) so the cost is justified;
operational burden accepted by maintainers.

------------------------------------------------------------------------

#### Phase 9.9 --- Isolated compatibility runtime implementation (conditional)

**Do not start unless the 9.8 ADR is accepted with a Go decision.** If it
is Conditional, only the conditions' scope may start.

**Prerequisites:** accepted 9.8 ADR; Phase 8 performance baseline;
Phase 7 hosting matrix; completed security review.

**Architecture requirements (to be refined by the ADR):**

-   Scope exactly as accepted; off by default; opt-in per site and per
    plugin with an explicit risk disclosure; instant kill switch.
-   Separate process boundary with its own OS user, read-only
    filesystem except designated paths, no network by default
    (allow-list only), CPU/memory/time/disk quotas, and no access to
    FlxOraCMS secrets or database credentials.
-   Communication through a narrow, versioned, schema-validated RPC; any
    data access goes through a brokered API, not shared DB credentials;
    all returned HTML sanitized before entering a page.
-   Graceful degradation: if the runtime is down or slow, the page
    renders with a static fallback and a logged degradation, never a
    500 for the whole site.
-   Supply chain: pinned PHP/WordPress versions or image digests, SBOM,
    CVE monitoring and a documented patch SLA.
-   Allowed only on hosting profiles proven in the Phase 7 matrix.

**Deliverables:** runtime service, supervisor and health checks,
broker API, admin controls and risk disclosure, quotas, audit logging,
runbook, upgrade and uninstall procedures, and the isolation suite
wired into CI.

**Acceptance criteria:** the 9.8 isolation suite passes in CI; chaos
tests (kill, hang, out-of-memory) never take down the core; disabling
the runtime leaves the site functional with reported degradation;
independent security review has no unresolved high or critical finding;
measured corpus gain matches the ADR's claim.

**Tests:** RPC contract tests; isolation regression; chaos tests; load
tests; upgrade/rollback tests; corpus re-measurement.

**Security controls:** as in the architecture requirements plus
seccomp/AppArmor or equivalent where containers are used, audit logs for
every execution request, secrets scrubbing, and per-site isolation.

**Measurable targets:** as ratified in the 9.8 ADR; no target here
overrides it.

------------------------------------------------------------------------

#### Phase 9.10 --- Compatibility directory, continuous suite and maintenance

**Goal:** a living, evidence-backed directory of tested WordPress themes
and plugins, kept current by automation.

**Prerequisites:** 9.3 (harness); 9.2 report schema; outputs of 9.5 and
9.6. An internal directory can exist early; public publication is gated
by Phase 11.

**Architecture decisions (ADRs):**

-   Directory data format: versioned data files in the repository
    (for example `compat/themes/<slug>.json`, `compat/plugins/<slug>.json`)
    generated from CI artifacts, rendered as a static site or in-app
    page.
-   Status model: **Verified** (passed a recorded run), **Community
    reported**, **Unverified**, **Unsupported**, **Stale** (not retested
    within the freshness window or a newer item version exists).
-   Opt-in community reporting: what is collected (item, versions, level
    outcome --- never content, URLs or PII), consent, abuse controls.

**Deliverables:**

-   Directory generator and pages: per item name, tested versions,
    WordPress and FlxOraCMS versions, level, fidelity grade, test date,
    link to the run, known issues, alternatives, license, last-verified.
-   Automation: corpus expansion from official directory rankings,
    version watching with re-tests on new releases of top-ranked items,
    automatic downgrade of status on failing re-test, security-advisory
    awareness (flag items with known vulnerabilities).
-   Maintenance policy: owners (CODEOWNERS), re-test within a window
    after each WordPress major release, retirement of old source
    versions, budget for CI cost, contribution guide, takedown and
    trademark/nominative-use statement.

**Acceptance criteria:** every directory status is traceable to a CI run
(manual overrides are explicit and logged); stale detection works; a
failing re-test downgrades the entry without human action; the
methodology is public.

**Tests:** schema validation; link checks; generator tests;
downgrade-on-failure test; privacy test proving community reports
contain no content or PII; accessibility checks on directory pages.

**Security controls:** submissions validated and rate-limited; submitted
artifacts never executed; no third-party code hosted; data releases
checksummed or signed; spam and brigading protection.

**Measurable targets (provisional):** the directory covers the full
9.1 corpus at the first internal milestone; 100% of "Verified" entries
have a run no older than 90 days; the suite is re-run within 30 days
of each WordPress major release; public numbers always cite corpus size
and date.

### Phase 10 --- eCommerce foundation and staged commerce

**Goal:** add a flexible commerce platform without destabilizing the
CMS.

**Do not begin full checkout until content, permissions, migrations,
backup/restore and deployment are production-ready.**

WooCommerce data migration (products, orders, customers) depends on
Subphase A (catalog) and is reported-only until then (Phase 9.6).

Subphase A --- catalog: - Product types and versioned field schemas. -
Simple, variable, digital, downloadable, subscription-ready and
service/bookable product modeling only as each is designed and tested. -
Product variants, attributes, media, categories, SKU rules,
pricing/currency representation and import/export. - Search/filter
indexing and inventory invariants.

Subphase B --- transaction core: - Cart, checkout state machine, order
snapshots, inventory reservations, idempotency keys and transaction
boundaries. - Never derive historical order totals from mutable current
product data. - Explicit currency precision and rounding policy. - Audit
trail for order/payment state changes.

Subphase C --- providers and operations: - Payment-provider adapters;
never store raw card data. - Verify webhook signatures, idempotency,
retries and event ordering. - Tax/shipping adapters, refunds,
cancellations, receipts and customer notifications. - Privacy,
retention, fraud controls and operational reconciliation.

Acceptance: - Catalog fields are extensible without breaking core order
invariants. - Duplicate webhook delivery cannot double-charge or
double-fulfill. - Payment failure, partial refund, inventory contention
and abandoned checkout are tested. - Security review and provider
sandbox tests pass before public launch.

### Phase 11 --- Release candidate and public launch

Tasks: - Complete threat model and independent security review
appropriate to project maturity. - Verify accessibility, performance,
backup/restore, migration and supported-host matrix. - Freeze public
API/theme/plugin contracts for the release candidate. - Publish install,
upgrade, rollback, migration, theme/plugin authoring and troubleshooting
docs. - Publish release notes, known limitations, support policy,
security contact and contribution guide. - Establish issue templates and
a triage policy. - Run a pilot with real agency sites and consented,
anonymized diagnostics where applicable. - Publish the WordPress
compatibility directory and methodology (Phase 9.10) and verify that
every public compatibility claim cites a recorded run, corpus size and
date.

Acceptance: - All release blockers resolved or explicitly accepted by
maintainers. - Clean installation and upgrade from the previous
supported version pass. - No known critical/high unresolved security
findings without a documented risk decision. - Public claims match
measured/tested capabilities.

## 14. `DEVELOPMENT_LOG.md` --- mandatory change record

Every code change committed to Git must have a corresponding entry.
Update the log in the same commit as the change. Do not fabricate a
commit hash before the commit exists.

Use this template:

``` md
## YYYY-MM-DD — <short title>
- **Commit:** `<full hash>` — `<exact git subject>`
- **Phase/issue:** Phase N / issue or PR URL
- **Summary:** What changed and why.
- **Files/modules:** Important paths.
- **Database:** Migration IDs, backfill, compatibility and rollback notes; or `None`.
- **Security:** Relevant threat boundary and controls; or `Not applicable — reason`.
- **Tests run:** Exact commands and observed pass/fail results.
- **Deployment/operations:** Config, cron, storage, backup, upgrade or hosting impact.
- **Known limitations:** Remaining risks or follow-up issues.
- **Follow-up:** Next concrete action or `None`.
```

Rules: - Use the actual commit date and actual Git hash/subject. - If
the workflow requires logging before commit, write a temporary
`PENDING COMMIT` entry and replace it with the real hash/subject
immediately after commit; never leave it pending in the main branch. -
If a change is reverted, add a new entry explaining the revert; do not
erase history. - Record failed tests honestly. - Do not log secrets,
personal data, tokens, customer content or production database values. -
A docs-only commit must also be logged. - The log complements Git
history; it does not replace it.

## 15. Required `AGENTS.md` instructions for Claude Code and Codex

Add or merge the following rules into the repository's `AGENTS.md`:

1.  Read `plan.md`, `DEVELOPMENT_LOG.md`, relevant ADRs, and current
    module docs before coding.
2.  Start each task by checking `git status`, current branch, and recent
    relevant commits. Never overwrite unrelated user changes.
3.  Verify the current implementation before assuming a feature is
    absent or complete.
4.  State the intended outcome, affected modules, data/migration impact,
    security implications, and tests before large changes.
5.  Implement one small vertical slice at a time. Do not execute the
    entire roadmap in one prompt.
6.  Do not perform broad rewrites, mass renames, framework replacements,
    or schema redesign without an ADR and explicit human approval.
7.  Preserve public APIs and persisted data formats unless a versioned
    migration is included.
8.  Do not invent command results. Run tests and report exact results;
    if unable to run a command, say so.
9.  Never disable security checks or delete failing tests merely to pass
    CI.
10. Never add secrets to code, logs, test fixtures, commits, or
    generated docs.
11. Treat content, theme packages, uploaded files, plugin metadata, and
    external API responses as untrusted input.
12. For database changes, include migration tests and recovery/backfill
    notes.
13. For public plugin/theme changes, add contract tests and update the
    relevant versioned documentation.
14. Update `DEVELOPMENT_LOG.md` with the actual commit hash and subject
    as part of the commit workflow.
15. Do not commit unless the user or repository workflow explicitly
    authorizes committing. Never push or deploy without explicit
    approval.
16. End every task with: summary, files changed, tests run and results,
    migration/deployment impact, risks, and recommended next task.
17. If the task uncovers a critical security issue or a data-loss risk,
    stop the risky operation, explain the evidence, and propose a safe
    path.
18. Prefer the smallest maintainable change that satisfies acceptance
    criteria.
19. For WordPress compatibility work, read Section 9A first. Never
    execute WordPress PHP in the application process, never remove the
    `.php` upload blocklist, and never touch the source WordPress site
    in migration code.
20. Do not implement or scaffold any PHP compatibility runtime before the
    Phase 9.8 research report and ADR are accepted by maintainers with a
    Go decision. PoC code lives only in `experiments/`.
21. Do not state or imply WordPress compatibility, percentages or
    supported-plugin lists in code, docs or UI unless a recorded test
    run supports it; do not invent or estimate test results.

## 16. Standard workflow for each task

1.  **Orient:** read instructions, status, relevant code, tests, schema
    and ADRs.
2.  **Verify:** reproduce current behavior or failure; inspect existing
    tests.
3.  **Plan:** identify scope, acceptance criteria, files, risks and
    migration needs.
4.  **Implement:** small change with clear boundaries; avoid unrelated
    cleanup.
5.  **Test:** unit → integration → contract/security as relevant →
    typecheck/lint/build → E2E/performance if affected.
6.  **Review:** inspect diff for secrets, accidental generated files,
    API breaks, unsafe queries, auth gaps, logging of private data and
    missing docs.
7.  **Document:** update API/docs/ADR/changelog and development log as
    appropriate.
8.  **Commit:** only when authorized; use a clear conventional commit
    subject, e.g. `feat(content): add repeatable field validation`.
9.  **Report:** list actual commands/results and unresolved limitations.

## 17. Definition of done

A task is done only when: - acceptance criteria are met; - code is
formatted, linted, typed and tested as appropriate; - authorization and
validation are enforced at the server boundary; - migrations and
persisted-data compatibility are addressed; - documentation and
compatibility contracts are updated; - logs avoid secrets and sensitive
data; - performance impact is considered for hot paths; - the
development log is updated with verified commit metadata; - known
limitations are disclosed.

A phase is done only when all phase acceptance criteria are met and
evidence is linked from the phase report.

## 18. Release, compatibility and deprecation policy

-   Adopt semantic versioning for public releases.
-   Version plugin APIs, theme contracts, layout schemas, and
    import/export formats independently where useful.
-   Publish a compatibility matrix for CMS version × plugin API × theme
    API × supported runtime/database.
-   Deprecate before removal and provide migration tooling where
    feasible.
-   Define supported upgrade paths and a minimum supported prior
    release.
-   Maintain security fixes for a declared support window.
-   Keep release notes user-facing and `DEVELOPMENT_LOG.md`
    engineering-facing.
-   Do not promise zero downtime on hosts that do not provide the
    required process/DB capabilities.
-   Version the Compatibility Report schema, plugin catalog format,
    migration mapping tables and directory data independently, with
    deprecation windows; publish the supported WordPress source-version
    window and retire versions on a published schedule (ADR-WP-002).

## 19. Product metrics

Track a small number of measurable metrics: - time to install and
complete first site; - time to create and publish a custom content
type; - time to install/activate a compatible theme/plugin; - upgrade
success and recovery rate; - p95 public-page latency and error rate on a
defined test host; - median JS transferred on a basic content page; -
successful migration rate and unsupported-feature reporting quality; -
number and age of unresolved security findings; - plugin/theme
conformance and compatibility failures; - backup restore verification
success; - WordPress compatibility (published with corpus size, date and
methodology): corpus coverage, theme fidelity-grade distribution,
analyzer classification accuracy, migration success and rollback
success rates, unsupported-feature reporting accuracy, directory
freshness, and migration time-to-first-report.

Metrics must be privacy-conscious and must not silently collect customer
content.

## 20. Immediate next tasks

Do these in order:

1.  Audit repository and create current-state/feature-matrix reports.
2.  Run baseline test/build/security checks and document actual results.
3.  Write ADRs for runtime/hosting target, domain boundary strategy,
    theme trust model, plugin trust model, and custom-field storage.
4.  Fix any critical security, data-loss, backup/restore or upgrade
    blockers.
5.  Establish CI and mandatory development logging.
6.  Extract one complete content use case behind domain/application
    contracts as a proof of architecture.
7.  Define and test the custom-field schema contract.
8.  Define the theme package contract and plugin API v1 only after audit
    findings.
9.  Build the hosting compatibility matrix and load-test baseline.
10. Start Phase 9.1 (WordPress compatibility charter, corpus and census)
    as read-only research once Phases 0 and 1 are done; it may run
    alongside tasks 6--9. Do not write compatibility product code, and do
    not start any PHP runtime work, before its prerequisites and ADRs.
11. Proceed to migration (Phases 9.4--9.7) and commerce only when their
    prerequisite gates pass; decide the PHP runtime question only via
    the Phase 9.8 research and architecture review.

## 21. Final instruction to coding agents

Do not interpret this plan as permission to build every listed feature
immediately. The repository's verified current state, security,
compatibility and user priorities take precedence over assumptions in
this document. Work phase by phase, keep the system deployable, preserve
existing customer data, and use evidence---not marketing claims---to
decide when FlxOraCMS is production-ready.
