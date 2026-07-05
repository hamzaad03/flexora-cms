# 🚀 NovaCMS — Next-Gen Open Source CMS (WordPress Alternative)
> **Architect's Edition** — Comprehensive Technical Blueprint v2.0  
> *Authored with 50 years of software architecture experience*

---

## Table of Contents

1. [Vision & Mission](#1-vision--mission)
2. [Core Principles](#2-core-principles)
3. [Tech Stack](#3-tech-stack)
4. [System Architecture](#4-system-architecture)
5. [Folder Structure](#5-folder-structure)
6. [Core Components](#6-core-components)
7. [Authentication & Security](#7-authentication--security)
8. [Role-Based Access Control (RBAC)](#8-role-based-access-control-rbac)
9. [Super Admin Control Panel](#9-super-admin-control-panel)
10. [Visual Page Designer](#10-visual-page-designer)
11. [GSAP Animation Engine](#11-gsap-animation-engine)
12. [Plugin Architecture](#12-plugin-architecture)
13. [Theme Engine](#13-theme-engine)
14. [Custom Fields & Content Modeling](#14-custom-fields--content-modeling)
15. [API Layer](#15-api-layer)
16. [Performance Strategy](#16-performance-strategy)
17. [Database Architecture](#17-database-architecture)
18. [URL Management & Security](#18-url-management--security)
19. [Installation & Deployment Wizard](#19-installation--deployment-wizard)
20. [Admin Panel UX Design](#20-admin-panel-ux-design)
21. [eCommerce Module (Phase 5+)](#21-ecommerce-module-phase-5)
22. [Security Architecture](#22-security-architecture)
23. [Development Phases & Roadmap](#23-development-phases--roadmap)
24. [Coding Standards & Guidelines](#24-coding-standards--guidelines)
25. [Testing Strategy](#25-testing-strategy)
26. [DEVELOPMENT_LOG.md Structure](#26-development_logmd-structure)
27. [Future Enhancements](#27-future-enhancements)

---

## 1. Vision & Mission

### Mission Statement
Build the world's most **developer-friendly**, **performance-first**, and **design-forward** open source CMS that runs anywhere — from shared hosting to enterprise cloud — without sacrificing extensibility or user experience.

### What Makes NovaCMS Different

| Feature | WordPress | Strapi | NovaCMS |
|---|---|---|---|
| GSAP Native Integration | ❌ | ❌ | ✅ |
| Built-in Page Designer | Plugin | Plugin | ✅ Native |
| PHP + Shared Hosting | ✅ | ❌ | ✅ |
| API-First | Optional | ✅ | ✅ |
| Social Login (configurable keys) | Plugin | Plugin | ✅ Native |
| RBAC with Menu Visibility | Plugin | Plugin | ✅ Native |
| Super Admin Role Control | Limited | Limited | ✅ Full |
| Installation Wizard | ✅ | ❌ | ✅ |
| URL Security Built-in | Limited | Limited | ✅ Native |
| Performance Score (Lighthouse) | 40-70 | 60-80 | 90+ target |

---

## 2. Core Principles

1. **Stability over Features** — Every feature shipped must be solid, tested, and non-breaking.
2. **Performance-First** — Every architectural decision is measured against page speed impact.
3. **Security by Default** — Security is not an afterthought; it is baked into every layer.
4. **Developer Experience (DX)** — Clean APIs, intuitive hooks, excellent documentation.
5. **Non-Technical Usability** — The page designer must be usable without code knowledge.
6. **Modularity** — No module is required; every module is swappable.
7. **Backward Compatibility** — Breaking changes only in major version bumps, with migration paths.
8. **Framework Agnostic** — The core never depends on React, Vue, or any specific frontend framework.

---

## 3. Tech Stack

### Backend

| Layer | Technology | Rationale |
|---|---|---|
| Language | PHP 8.2+ | Shared hosting compatibility, JIT compiler, modern features |
| Architecture | Custom Micro-Kernel | No framework overhead; full control |
| Optional Components | Symfony Components (standalone) | PSR-compliant, battle-tested, e.g. HttpFoundation, Console, Mailer |
| Template Engine | PHP native + optional Twig | Lightweight; Twig optional for theme authors |
| CLI | Custom Console (Symfony Console component) | Migrations, cache flush, user creation |
| Queue System | Database queue (Phase 1), Redis (Phase 3+) | Emails, jobs, notifications |

### Frontend

| Layer | Technology | Rationale |
|---|---|---|
| Core JS | Vanilla ES2020+ | Zero dependencies in core |
| Animations | GSAP 3.x (CDN or bundled) | Industry standard, full ScrollTrigger support |
| Admin UI | Alpine.js (lightweight reactivity) | 15kb, no build step required |
| Page Designer | Custom JS (with optional React mode) | Custom drag-drop built-in |
| Optional Frontend | React / Vue / Svelte | Via integration adapters |
| CSS Framework | Custom CSS + CSS Variables | No Tailwind in core; theming via CSS vars |
| Build Tool | Vite (optional) | For advanced theme/plugin development |
| Icons | Phosphor Icons or Heroicons (MIT) | Lightweight, beautiful |

### Database

| Layer | Technology | Rationale |
|---|---|---|
| Primary | MySQL 8+ / MariaDB 10.6+ | Shared hosting compatibility |
| Caching | File cache (default), Redis / Memcached (optional) | Progressive enhancement |
| Full-text Search | MySQL FTS (default), Meilisearch (optional) | No external dependency for base install |
| Sessions | Database or File | No Redis required for shared hosting |

### Server Compatibility

- Apache 2.4+ with mod_rewrite
- Nginx with try_files rewrite
- LiteSpeed (cPanel default)
- PHP-FPM recommended, CGI/FastCGI supported
- Shared hosting: cPanel, Plesk, DirectAdmin
- VPS: Ubuntu 22.04 LTS, AlmaLinux 8+, Debian 12

---

## 4. System Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    PUBLIC REQUEST                        │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│              Web Server (Apache / Nginx)                 │
│         Rewrites all traffic → public/index.php          │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                   BOOT LAYER                             │
│   Autoloader → Environment → Config → Kernel::boot()    │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                MIDDLEWARE PIPELINE                        │
│  Rate Limit → CSRF → Auth → CORS → Locale → Cache       │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                    ROUTER                                │
│         URL → Route Match → Controller dispatch          │
└──────┬──────────────┬──────────────┬────────────────────┘
       │              │              │
  ┌────▼────┐   ┌─────▼─────┐  ┌────▼────────┐
  │  Web    │   │   Admin   │  │  API / REST │
  │ Routes  │   │  Routes   │  │   Routes    │
  └────┬────┘   └─────┬─────┘  └────┬────────┘
       │              │              │
┌──────▼──────────────▼──────────────▼────────┐
│              SERVICE LAYER                   │
│   ContentService | AuthService | MediaService│
│   PluginManager | ThemeEngine | CacheService │
└──────────────────────┬───────────────────────┘
                       │
┌──────────────────────▼───────────────────────┐
│              DATA LAYER (ORM / QB)            │
│   QueryBuilder → PDO → MySQL / MariaDB        │
└───────────────────────────────────────────────┘
```

### Request Lifecycle (Detailed)

1. **Webserver** receives HTTP request, rewrites to `public/index.php`
2. **Autoloader** (`composer autoload` or custom PSR-4 loader) loads classes on demand
3. **Environment Detector** loads `.env` or `config/env.php` based on `APP_ENV`
4. **Kernel::boot()** initializes: Config → DB Connection → Session → Service Container
5. **Plugin Loader** registers all active plugin hooks before routing
6. **Middleware Pipeline** processes request in order: RateLimiter → SecurityHeaders → CSRFMiddleware → AuthMiddleware → LocaleMiddleware → PageCacheMiddleware
7. **Router** matches URI to registered route, extracts parameters
8. **Controller** dispatches: validates input, calls Service layer
9. **Service Layer** executes business logic, fires hook events (before/after)
10. **ORM / Query Builder** executes database queries
11. **Response** assembled: HTML (via Theme Engine) or JSON (via API serializer)
12. **Response Middleware** runs: output compression, security headers injection, cache store
13. **Response** sent to browser

---

## 5. Folder Structure

```
/nova-cms                              ← Project root
 │
 ├── /core                             ← Framework kernel (never modify)
 │   ├── Kernel.php                    ← Application bootstrapper
 │   ├── Router.php                    ← Route registry & dispatcher
 │   ├── Controller.php                ← Base controller
 │   ├── Model.php                     ← Base model with QB
 │   ├── QueryBuilder.php              ← Fluent SQL builder
 │   ├── Middleware.php                ← Middleware interface & pipeline
 │   ├── ServiceContainer.php          ← IoC / DI container
 │   ├── EventDispatcher.php           ← Hook system (actions & filters)
 │   ├── Session.php                   ← Session management
 │   ├── Cache.php                     ← Cache abstraction layer
 │   ├── Auth.php                      ← Authentication engine
 │   ├── Request.php                   ← HTTP request wrapper
 │   ├── Response.php                  ← HTTP response builder
 │   ├── Validator.php                 ← Input validation
 │   ├── Logger.php                    ← PSR-3 logger
 │   └── Helpers.php                   ← Global utility functions
 │
 ├── /config                           ← Environment configuration
 │   ├── app.php                       ← App name, URL, timezone, locale
 │   ├── database.php                  ← DB credentials, pool settings
 │   ├── routes.php                    ← Core route definitions
 │   ├── auth.php                      ← Auth drivers, OAuth keys, JWT config
 │   ├── cache.php                     ← Cache driver, TTL settings
 │   ├── mail.php                      ← SMTP / Mailgun / SES config
 │   ├── security.php                  ← CSP, CSRF, rate limits, blocked IPs
 │   ├── permissions.php               ← Role definitions & capabilities
 │   └── features.php                  ← Feature flags per role
 │
 ├── /modules                          ← Core content modules (PSR-4 namespaced)
 │   ├── Blog/
 │   │   ├── BlogController.php
 │   │   ├── BlogService.php
 │   │   ├── BlogModel.php
 │   │   ├── migrations/
 │   │   └── views/
 │   ├── Pages/
 │   │   ├── PageController.php
 │   │   ├── PageService.php
 │   │   ├── PageModel.php
 │   │   ├── PageDesigner/             ← Visual page builder
 │   │   │   ├── DesignerController.php
 │   │   │   ├── BlockRegistry.php     ← Available blocks registry
 │   │   │   ├── LayoutEngine.php      ← Grid/flex layout builder
 │   │   │   └── AnimationMapper.php   ← GSAP animation bindings
 │   │   └── migrations/
 │   ├── Users/
 │   │   ├── UserController.php
 │   │   ├── UserService.php
 │   │   ├── RoleModel.php
 │   │   ├── PermissionModel.php
 │   │   └── migrations/
 │   ├── Media/
 │   │   ├── MediaController.php
 │   │   ├── ImageProcessor.php        ← Resize, WebP conversion, lazy src
 │   │   ├── MediaModel.php
 │   │   └── migrations/
 │   ├── CustomFields/
 │   │   ├── FieldRegistry.php
 │   │   ├── FieldRenderer.php
 │   │   ├── FieldTypes/               ← Text, Number, Date, Image, Relation, etc.
 │   │   └── migrations/
 │   ├── Navigation/
 │   ├── Forms/
 │   ├── SEO/                          ← Meta, OG tags, sitemap, robots.txt
 │   └── Analytics/                    ← Privacy-first analytics (no GA required)
 │
 ├── /plugins                          ← User-installed plugins
 │   └── example-plugin/
 │       ├── plugin.json               ← Manifest (name, version, hooks)
 │       ├── PluginClass.php
 │       ├── assets/
 │       └── views/
 │
 ├── /themes                           ← Theme packages
 │   └── nova-default/
 │       ├── theme.json                ← Theme manifest
 │       ├── index.php                 ← Homepage template
 │       ├── page.php
 │       ├── partials/
 │       ├── assets/
 │       │   ├── css/
 │       │   ├── js/
 │       │   └── gsap/                 ← GSAP config & animation presets
 │       └── components/               ← Reusable theme components
 │
 ├── /admin                            ← Admin panel frontend
 │   ├── /src
 │   │   ├── views/                    ← Admin page templates
 │   │   ├── components/               ← Reusable admin UI components
 │   │   ├── page-designer/            ← Visual builder UI
 │   │   │   ├── canvas.js             ← Drag-drop canvas
 │   │   │   ├── block-library.js      ← Available blocks sidebar
 │   │   │   ├── style-panel.js        ← Typography, spacing, colors
 │   │   │   ├── animation-panel.js    ← GSAP settings per block
 │   │   │   └── preview.js            ← Live preview renderer
 │   │   └── assets/
 │   └── AdminKernel.php               ← Admin bootstrap
 │
 ├── /api                              ← REST API layer
 │   ├── routes.php
 │   ├── /v1
 │   │   ├── ContentController.php
 │   │   ├── AuthController.php
 │   │   └── MediaController.php
 │   └── Serializer.php                ← JSON:API compliant serializer
 │
 ├── /install                          ← Installation wizard
 │   ├── index.php                     ← Wizard entry
 │   ├── steps/
 │   │   ├── Step1_Requirements.php    ← PHP version, extensions check
 │   │   ├── Step2_Database.php        ← DB connection & creation
 │   │   ├── Step3_AdminAccount.php    ← First superadmin setup
 │   │   ├── Step4_SiteConfig.php      ← Site name, URL, locale
 │   │   └── Step5_Complete.php        ← Success + lock installer
 │   └── assets/
 │
 ├── /migrations                       ← Database migration files (timestamped)
 │   ├── 2026_01_01_000001_create_users_table.php
 │   ├── 2026_01_01_000002_create_roles_table.php
 │   └── ...
 │
 ├── /storage                          ← Writable runtime storage
 │   ├── /cache                        ← Page cache, object cache
 │   ├── /logs                         ← Application logs (daily rotation)
 │   ├── /sessions                     ← File-based sessions
 │   ├── /uploads                      ← User-uploaded media
 │   │   ├── /images                   ← Original images
 │   │   ├── /thumbs                   ← Auto-generated thumbnails
 │   │   └── /documents
 │   └── /exports                      ← Content exports, backups
 │
 ├── /public                           ← Web root (only this is publicly accessible)
 │   ├── index.php                     ← Application entry point
 │   ├── .htaccess                     ← Apache rewrites + security headers
 │   ├── /assets                       ← Compiled, public-facing assets
 │   │   ├── css/
 │   │   ├── js/
 │   │   └── images/
 │   └── /uploads → symlink to /storage/uploads
 │
 ├── /vendor                           ← Composer dependencies (optional)
 ├── /tests                            ← Unit, integration, E2E tests
 │   ├── Unit/
 │   ├── Integration/
 │   └── E2E/
 │
 ├── .env.example                      ← Environment variable template
 ├── .env                              ← Local environment (gitignored)
 ├── composer.json
 ├── nova                              ← CLI tool (php nova migrate, etc.)
 ├── DEVELOPMENT_LOG.md
 └── PLAN.md
```

---

## 6. Core Components

### 6.1 Kernel

**Responsibilities:** Bootstrap the application, bind services to the DI container, fire lifecycle events.

```php
// core/Kernel.php
class Kernel {
    protected ServiceContainer $container;
    protected array $bootedProviders = [];

    public function boot(): void {
        $this->loadEnvironment();
        $this->bindCoreServices();
        $this->loadConfiguration();
        $this->bootServiceProviders();
        $this->loadPlugins();
        $this->registerRoutes();
    }

    protected function bindCoreServices(): void {
        $this->container->singleton(Database::class);
        $this->container->singleton(Cache::class);
        $this->container->singleton(Auth::class);
        $this->container->singleton(EventDispatcher::class);
        $this->container->singleton(Session::class);
    }
}
```

**Service Providers Pattern:**
- `DatabaseServiceProvider` — PDO connection pooling, query logging
- `AuthServiceProvider` — Auth drivers (native, OAuth, JWT)
- `CacheServiceProvider` — File, Redis, Memcached backends
- `PluginServiceProvider` — Discovers and loads enabled plugins
- `ThemeServiceProvider` — Loads active theme, registers template paths
- `MailServiceProvider` — SMTP / API-based email transport

### 6.2 Router

- Named routes with URL generation: `route('admin.users.edit', ['id' => 5])`
- Route groups with prefix, middleware, and namespace
- Route model binding (auto-resolves model from route parameter)
- RESTful resource routes with one declaration
- 404 / 405 custom handlers
- Route caching for production (file-serialized route map)

```php
// config/routes.php
$router->group(['prefix' => 'admin', 'middleware' => ['auth', 'admin']], function($r) {
    $r->resource('posts', PostController::class);
    $r->get('page-designer/{page}', [DesignerController::class, 'edit'])->name('designer.edit');
});

$router->group(['prefix' => 'api/v1', 'middleware' => ['api', 'throttle:60,1']], function($r) {
    $r->resource('content', ContentApiController::class);
    $r->post('auth/login', [AuthApiController::class, 'login']);
    $r->post('auth/oauth/{provider}', [OAuthController::class, 'callback']);
});
```

### 6.3 Query Builder (Custom ORM-Lite)

Design philosophy: SQL-close, transparent, no magic.

```php
// Example usage
$posts = DB::table('posts')
    ->select(['id', 'title', 'slug', 'published_at'])
    ->join('users', 'posts.author_id', '=', 'users.id')
    ->where('status', 'published')
    ->whereIn('category_id', [1, 2, 3])
    ->orderBy('published_at', 'DESC')
    ->paginate(15);

// Model usage
class Post extends Model {
    protected string $table = 'posts';
    protected array $fillable = ['title', 'slug', 'content', 'status'];
    protected array $casts = ['meta' => 'array', 'published_at' => 'datetime'];

    public function author(): BelongsTo {
        return $this->belongsTo(User::class, 'author_id');
    }
    public function tags(): BelongsToMany {
        return $this->belongsToMany(Tag::class, 'post_tags');
    }
}
```

**Supported Relations:** `hasOne`, `hasMany`, `belongsTo`, `belongsToMany`, `hasManyThrough`

### 6.4 Service Container (DI)

- Constructor injection auto-resolution via reflection
- Interface-to-implementation binding
- Singleton and transient lifetimes
- Contextual binding (e.g. inject a different logger per module)
- Lazy binding with closures

### 6.5 Event Dispatcher (Hook System)

WordPress-compatible naming for migration familiarity:

```php
// Register an action
Event::on('post.saved', function(Post $post) {
    CacheService::purgePostCache($post->id);
    SearchIndex::update($post);
}, priority: 10);

// Register a filter
Event::filter('content.output', function(string $content, Post $post) {
    return ShortcodeParser::parse($content, $post);
}, priority: 5);

// Fire hooks
Event::emit('post.saved', $post);
$filteredContent = Event::apply('content.output', $rawContent, $post);
```

**Built-in Action Hooks:**
- `cms.boot`, `cms.shutdown`
- `post.creating`, `post.created`, `post.updating`, `post.updated`, `post.deleted`
- `user.login`, `user.logout`, `user.registered`
- `page.rendering`, `page.rendered`
- `plugin.activated`, `plugin.deactivated`
- `theme.switched`, `theme.loaded`
- `media.uploaded`, `media.deleted`
- `cache.cleared`
- `admin.menu.building` — For plugins to inject menu items

**Built-in Filter Hooks:**
- `content.output` — Filter final HTML before output
- `post.title` — Filter post titles
- `meta.description` — SEO meta description
- `user.capabilities` — Extend user permissions dynamically
- `api.response` — Mutate API responses
- `admin.menu.items` — Modify admin navigation items

---

## 7. Authentication & Security

### 7.1 Authentication Architecture

NovaCMS uses a **multi-driver authentication system**. Each driver is enabled/disabled per installation.

```
/config/auth.php → drivers: ['native', 'google', 'microsoft', 'github']
```

#### Native Authentication
- Argon2id password hashing (PHP 8 default)
- Configurable password policy: min length, complexity, history
- "Remember Me" via secure rotating tokens (separate table)
- Account lockout after N failed attempts (configurable)
- Email verification on registration (optional)
- Password reset via signed time-limited URLs

#### Google OAuth (Configurable API Keys)
Users/admins provide their own Google OAuth credentials:

```php
// config/auth.php
'google' => [
    'enabled'       => env('GOOGLE_AUTH_ENABLED', false),
    'client_id'     => env('GOOGLE_CLIENT_ID'),
    'client_secret' => env('GOOGLE_CLIENT_SECRET'),
    'redirect_uri'  => env('APP_URL') . '/auth/google/callback',
    'allowed_domains' => env('GOOGLE_ALLOWED_DOMAINS', '*'), // e.g. 'company.com'
    'auto_register' => env('GOOGLE_AUTO_REGISTER', true),
    'default_role'  => 'subscriber',
]
```

**Flow:**
1. User clicks "Login with Google"
2. Redirect to Google with `client_id`, `scope=email profile`, `state=CSRF_token`
3. Google redirects back with `code`
4. Server exchanges `code` for access token (server-to-server, secret never exposed)
5. Fetch Google user profile
6. Find or create local user, bind `oauth_provider_id`
7. Issue session / JWT

#### Microsoft / Outlook OAuth
```php
'microsoft' => [
    'enabled'        => env('MICROSOFT_AUTH_ENABLED', false),
    'client_id'      => env('MICROSOFT_CLIENT_ID'),
    'client_secret'  => env('MICROSOFT_CLIENT_SECRET'),
    'tenant_id'      => env('MICROSOFT_TENANT_ID', 'common'), // 'common' or specific tenant
    'redirect_uri'   => env('APP_URL') . '/auth/microsoft/callback',
    'auto_register'  => env('MICROSOFT_AUTO_REGISTER', true),
    'default_role'   => 'subscriber',
]
```

#### Admin UI for OAuth Configuration
Super Admin can configure OAuth providers from the admin panel without touching `.env`:

```
Admin → Settings → Authentication → Social Login
├── Google OAuth
│   ├── [Toggle: Enabled/Disabled]
│   ├── Client ID: [input]
│   ├── Client Secret: [input - masked]
│   ├── Allowed Domains: [input - comma separated]
│   ├── Auto-register new users: [toggle]
│   └── Default Role for new OAuth users: [dropdown]
└── Microsoft OAuth
    ├── [Toggle: Enabled/Disabled]
    ├── Client ID: [input]
    ├── Client Secret: [input - masked]
    ├── Tenant ID: [input]
    └── ...
```

### 7.2 JWT for API

- Issued on login, short-lived (15 min access, 7-day refresh)
- Refresh token rotation (single-use, invalidated on use)
- Token family tracking to detect refresh token theft
- Revocation list in cache for immediate logout
- Claims: `sub`, `role`, `permissions_hash`, `iat`, `exp`

### 7.3 Session Security

- Regenerate session ID on login, privilege escalation
- HttpOnly + Secure + SameSite=Lax cookies
- Session fingerprinting (IP + User-Agent hash, configurable strictness)
- Idle timeout + absolute timeout configurable per role
- Concurrent session limit configurable per role (e.g. Super Admin: 1 session only)

---

## 8. Role-Based Access Control (RBAC)

### 8.1 Architecture

NovaCMS uses a **hierarchical, capabilities-based RBAC** model.

```
Super Admin
    └── Admin
        └── Editor
            └── Author
                └── Contributor
                    └── Subscriber
                        └── Guest (unauthenticated)
```

Custom roles can be created with any subset of capabilities.

### 8.2 Database Schema

```sql
-- Roles table
CREATE TABLE roles (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) UNIQUE NOT NULL,        -- 'editor', 'shop_manager'
    display_name VARCHAR(150) NOT NULL,
    parent_role_id INT UNSIGNED NULL,                 -- Inheritance
    is_system   TINYINT(1) DEFAULT 0,                 -- System roles can't be deleted
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Capabilities/permissions
CREATE TABLE capabilities (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(200) UNIQUE NOT NULL,          -- 'posts.publish', 'users.delete'
    module      VARCHAR(100) NOT NULL,                  -- 'posts', 'users', 'media'
    description TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Role ↔ Capability mapping
CREATE TABLE role_capabilities (
    role_id        INT UNSIGNED NOT NULL,
    capability_id  INT UNSIGNED NOT NULL,
    granted        TINYINT(1) DEFAULT 1,               -- Supports explicit deny
    PRIMARY KEY (role_id, capability_id)
);

-- User ↔ Role mapping (users can have multiple roles)
CREATE TABLE user_roles (
    user_id    INT UNSIGNED NOT NULL,
    role_id    INT UNSIGNED NOT NULL,
    granted_by INT UNSIGNED NULL,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id)
);

-- Per-user capability overrides
CREATE TABLE user_capability_overrides (
    user_id       INT UNSIGNED NOT NULL,
    capability_id INT UNSIGNED NOT NULL,
    granted       TINYINT(1) NOT NULL,                 -- Override grant or deny
    PRIMARY KEY (user_id, capability_id)
);
```

### 8.3 Capability Naming Convention

```
{module}.{action}[.{scope}]

Examples:
  posts.view
  posts.create
  posts.edit.own           ← can edit only own posts
  posts.edit.any           ← can edit any post
  posts.publish
  posts.delete.own
  posts.delete.any
  users.view
  users.create
  users.edit.own
  users.edit.any
  users.assign_role
  users.delete
  media.upload
  media.delete.own
  media.delete.any
  settings.view
  settings.edit
  plugins.install
  plugins.delete
  themes.switch
  themes.customize
  custom_fields.manage
  analytics.view
  api.access
  api.write
```

### 8.4 Capability Check in Code

```php
// In controllers
if (!Auth::can('posts.publish')) {
    throw new ForbiddenException();
}

// Blade-style template directive (custom)
@can('posts.edit.any')
    <a href="/admin/posts/{{ $post->id }}/edit">Edit</a>
@endcan

// Model-level scoping
class Post extends Model {
    public function scopeAccessible(QueryBuilder $q): QueryBuilder {
        if (Auth::can('posts.edit.any')) return $q;
        return $q->where('author_id', Auth::id());
    }
}
```

### 8.5 Default Role Capabilities Matrix

| Capability | Guest | Subscriber | Contributor | Author | Editor | Admin | Super Admin |
|---|---|---|---|---|---|---|---|
| posts.view (published) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| posts.create | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| posts.edit.own | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| posts.edit.any | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| posts.publish | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| posts.delete.any | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| users.create | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| users.assign_role | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| plugins.install | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| settings.edit | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |

---

## 9. Super Admin Control Panel

The Super Admin is the apex role — it cannot be deleted, restricted, or demoted by any other role.

### 9.1 Super Admin Exclusive Capabilities

- Install / uninstall / activate / deactivate plugins
- Install / switch / delete themes
- Create / delete / modify any role
- Assign any capability to any role
- **Control admin menu visibility per role** (a unique NovaCMS feature)
- Configure OAuth providers
- Access system health dashboard
- View all audit logs (including other admins)
- Enable/disable entire feature modules
- Manage the feature flag system
- Database maintenance tools (optimize, repair)
- Set up multi-site configurations (Phase 4+)
- API key management (create, revoke)
- Configure email settings
- System-wide cache clear
- Manage cron jobs

### 9.2 Menu & Feature Visibility Control

One of NovaCMS's killer features: **Super Admin can control which admin menu items and features each role can see**, independently of whether they have the underlying capability.

```
Super Admin → Roles → [Edit Role: Editor]
└── Admin Menu Visibility
    ├── [✅] Dashboard
    ├── [✅] Posts
    │   ├── [✅] All Posts
    │   ├── [✅] Add New
    │   ├── [❌] Categories (hidden for Editor role)
    │   └── [❌] Tags
    ├── [✅] Pages
    ├── [❌] Plugins          (hidden - not relevant to Editors)
    ├── [❌] Appearance       (hidden)
    ├── [✅] Media
    ├── [✅] Users
    │   └── [❌] Add New      (hidden even though they can view)
    └── [❌] Settings         (hidden)
```

This is stored in the `role_menu_visibility` table and checked by the admin menu builder before rendering.

### 9.3 Feature Flags per Role

```
Super Admin → Settings → Feature Flags
├── Page Designer
│   ├── [All roles]: [Enabled / Disabled / Role-specific]
│   ├── Subscriber: [Disabled]
│   ├── Author: [Disabled]
│   ├── Editor: [Enabled]
│   └── Admin: [Enabled]
├── GSAP Animation Editor
│   ├── Author: [Disabled]
│   └── Editor: [Enabled]
├── Custom Fields Manager
├── REST API Access
├── Analytics Dashboard
└── eCommerce Features
```

### 9.4 Audit Log

Every action is logged with context:

```sql
CREATE TABLE audit_log (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id     INT UNSIGNED NULL,
    action      VARCHAR(200) NOT NULL,       -- 'post.published', 'user.role_changed'
    model_type  VARCHAR(100) NULL,           -- 'Post', 'User'
    model_id    INT UNSIGNED NULL,
    old_values  JSON NULL,
    new_values  JSON NULL,
    ip_address  VARCHAR(45) NOT NULL,
    user_agent  TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_action (action),
    INDEX idx_created (created_at)
);
```

---

## 10. Visual Page Designer

The Page Designer is a **first-class, built-in visual editor** — not a plugin afterthought.

### 10.1 Design Philosophy

- Works without JavaScript frameworks (Alpine.js only)
- WYSIWYG canvas with real CSS rendering
- Every block can have GSAP animations assigned
- Responsive: design for mobile/tablet/desktop simultaneously
- Output is clean, semantic HTML — not nested `<div>` soup

### 10.2 Core Concepts

```
Page
 └── Sections (full-width rows)
      └── Columns (flex/grid layout)
           └── Blocks (atomic content units)
                └── GSAP Animation Config (per block)
```

### 10.3 Block Library (Built-in Blocks)

**Text & Content:**
- Heading (H1–H6, with typography controls)
- Rich Text (WYSIWYG — ProseMirror based)
- Quote / Blockquote
- Code Block (with syntax highlighting)
- Spacer / Divider
- Slider
- Carousel
- Flex Container
- 

**Media:**
- Image (with lazy load, WebP auto-convert, alt text)
- Image Gallery (lightbox-ready)
- Video (self-hosted or YouTube/Vimeo embed)
- Icon Block (from icon library)
- SVG Embed

**Layout:**
- Container (max-width wrapper)
- Columns (2, 3, 4 col with custom widths)
- Grid Block
- Tabs
- Accordion / FAQ
- Modal Trigger

**Interactive:**
- Button (with hover animation settings)
- Form (integrates with Forms module)
- Search Bar
- Social Share Buttons
- Countdown Timer

**Dynamic Content:**
- Latest Posts Block
- Featured Post
- Category Listing
- Custom Query Block (builder)

**Commerce (Phase 5+):**
- Product Card
- Add to Cart Button
- Price Block

### 10.4 Page Designer Architecture (Frontend)

```javascript
// admin/src/page-designer/canvas.js

class PageDesignerCanvas {
    constructor(pageId) {
        this.pageId     = pageId;
        this.sections   = [];
        this.selected   = null;
        this.history    = new UndoRedoStack(50); // 50 undo levels
        this.preview    = new PreviewRenderer();
        this.animPanel  = new AnimationPanel();
    }

    // Drag-and-drop block into canvas
    onBlockDrop(blockType, targetSection, targetColumn, position) { ... }

    // Select block → show style + animation panel
    onBlockSelect(blockId) {
        this.selected = blockId;
        StylePanel.open(this.getBlock(blockId));
        this.animPanel.open(this.getBlock(blockId));
    }

    // Serialize page to JSON for storage
    toJSON() { ... }

    // Load from stored JSON
    fromJSON(data) { ... }

    // Auto-save debounced
    save = debounce(() => api.post(`/admin/pages/${this.pageId}/designer`, this.toJSON()), 800);
}
```

### 10.5 Style Panel

For each block, the Style Panel exposes:

```
Typography
├── Font Family (from theme fonts or Google Fonts)
├── Font Size (px / rem / clamp for fluid)
├── Font Weight
├── Line Height
├── Letter Spacing
└── Text Color

Spacing
├── Padding (T/R/B/L, linked or independent)
└── Margin (T/R/B/L)

Colors & Backgrounds
├── Background Color (solid / gradient / transparent)
├── Background Image + Position + Overlay
└── Border (radius, color, width, style)

Responsive Controls
├── [Desktop] [Tablet] [Mobile] tabs
└── Each property independently adjustable per breakpoint

Custom CSS Class (advanced users)
Custom Inline CSS (advanced users)
```

### 10.6 Page Output

The Page Designer stores page data as JSON in the `page_layout` column. The theme renders it server-side:

```php
// modules/Pages/LayoutEngine.php
class LayoutEngine {
    public function render(array $layout): string {
        $html = '';
        foreach ($layout['sections'] as $section) {
            $html .= $this->renderSection($section);
        }
        return $html;
    }

    private function renderSection(array $section): string {
        // Outputs section with data-gsap-* attributes for animation binding
        $attrs = $this->buildAnimationAttributes($section['animation'] ?? []);
        // ... render columns and blocks
    }
}
```

---

## 11. GSAP Animation Engine

### 11.1 Architecture Overview

NovaCMS provides a **first-class GSAP integration layer** that works at three levels:
1. **Theme-level** — Global animation defaults defined in `theme.json`
2. **Page Designer level** — Per-block animation settings via the Animation Panel
3. **Developer level** — Direct GSAP API access in theme/plugin JS

### 11.2 GSAP Bundle

```html
<!-- Loaded in theme footer, only when animations are present on page -->
<script src="/assets/vendor/gsap/gsap.min.js"></script>
<script src="/assets/vendor/gsap/ScrollTrigger.min.js"></script>
<script src="/assets/vendor/gsap/ScrollSmoother.min.js"></script>   <!-- Premium -->
<script src="/assets/vendor/gsap/TextPlugin.min.js"></script>
<script src="/assets/vendor/gsap/SplitText.min.js"></script>         <!-- Premium -->
<script src="/assets/vendor/gsap/DrawSVGPlugin.min.js"></script>     <!-- Premium -->
<script src="/assets/vendor/gsap/Flip.min.js"></script>
<script src="/assets/vendor/gsap/MotionPathPlugin.min.js"></script>
<script src="/assets/js/nova-gsap.js"></script>                       ← NovaCMS animation engine
```

> ℹ️ Free GSAP plugins are bundled. Premium plugins (ScrollSmoother, SplitText, DrawSVG) require the user to provide their own GSAP Club license. The system detects and loads them if present.

### 11.3 Animation Types Supported

#### Basic Animations (gsap.to / gsap.from / gsap.fromTo)

| Animation | Properties | Easing Options |
|---|---|---|
| Fade In/Out | opacity: 0→1 | power1-4, elastic, bounce, back |
| Slide In | x, y transforms | expo.out, sine.inOut |
| Scale | scale, scaleX, scaleY | elastic.out |
| Rotate | rotation, rotationX, rotationY | back.out |
| Clip Reveal | clipPath reveal | power2.inOut |
| Color Change | color, backgroundColor | linear |
| Custom | Any GSAP property | Any easing |

#### ScrollTrigger Animations

| Type | Description |
|---|---|
| `scrub` | Animation tied directly to scroll position |
| `pin` | Element pinned while scroll continues |
| `parallax` | Different scroll speeds for elements |
| `reveal-on-scroll` | Trigger animation when element enters viewport |
| `counter` | Number counts up when in view |
| `stagger` | Child elements animate in sequence |
| `horizontal-scroll` | Horizontal section pinned with scroll |
| `progress-bar` | Scroll progress indicator |

#### Timeline Animations

- Sequential animations across multiple elements
- Overlapping timelines with labels
- Nested timelines for complex sequences
- Reverse and control via buttons/events

### 11.4 Animation Panel (Page Designer Integration)

```
[Block selected in Page Designer]

Animation Panel
├── Animation Type
│   ├── ○ None
│   ├── ○ On Page Load
│   ├── ○ On Scroll (ScrollTrigger)
│   └── ○ On Hover
│
├── [If On Scroll selected:]
│   ├── Effect
│   │   ├── Fade In
│   │   ├── Slide Up / Down / Left / Right
│   │   ├── Scale In
│   │   ├── Flip In
│   │   ├── Clip Reveal (left→right)
│   │   └── Custom (raw GSAP JSON)
│   │
│   ├── Trigger: [Start: top 80%] [End: bottom 20%]
│   ├── Scrub: [Toggle] [Scrub Amount: 1]
│   ├── Pin: [Toggle]
│   ├── Duration: [0.8s]
│   ├── Delay: [0.2s]
│   ├── Ease: [power2.out ▼]
│   ├── Stagger (for children): [0.1s]
│   └── Markers (dev mode): [Toggle]
│
└── [Preview Animation button]
```

### 11.5 Data Attributes Output

```html
<!-- Rendered HTML from LayoutEngine with animation data attributes -->
<div class="nova-block nova-block--heading"
     data-gsap="true"
     data-gsap-trigger="scroll"
     data-gsap-effect="slideUp"
     data-gsap-duration="0.8"
     data-gsap-delay="0.2"
     data-gsap-ease="power2.out"
     data-gsap-start="top 80%"
     data-gsap-scrub="false"
     data-gsap-stagger="0.1">
    <h1>Welcome to NovaCMS</h1>
</div>
```

### 11.6 GSAP Engine (nova-gsap.js)

```javascript
// public/assets/js/nova-gsap.js

class NovaGSAP {
    constructor() {
        gsap.registerPlugin(ScrollTrigger, Flip, MotionPathPlugin);
        this.init();
    }

    init() {
        // ScrollSmoother setup if available and enabled in theme settings
        if (typeof ScrollSmoother !== 'undefined' && novaTheme.smoothScroll) {
            ScrollSmoother.create({ smooth: 1.5, effects: true });
        }

        document.querySelectorAll('[data-gsap="true"]').forEach(el => {
            this.bindAnimation(el);
        });
    }

    bindAnimation(el) {
        const cfg = {
            trigger:  el.dataset.gsapTrigger  || 'scroll',
            effect:   el.dataset.gsapEffect   || 'fadeIn',
            duration: parseFloat(el.dataset.gsapDuration || 0.8),
            delay:    parseFloat(el.dataset.gsapDelay    || 0),
            ease:     el.dataset.gsapEase     || 'power2.out',
            start:    el.dataset.gsapStart    || 'top 80%',
            scrub:    el.dataset.gsapScrub    === 'true',
            pin:      el.dataset.gsapPin      === 'true',
            stagger:  parseFloat(el.dataset.gsapStagger  || 0),
        };

        const fromVars = this.effectToVars(cfg.effect);

        if (cfg.trigger === 'scroll') {
            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: el,
                    start: cfg.start,
                    scrub: cfg.scrub ? 1 : false,
                    pin: cfg.pin,
                    markers: novaTheme.gsapMarkers || false,
                }
            });

            if (cfg.stagger > 0 && el.children.length) {
                tl.from(el.children, { ...fromVars, duration: cfg.duration,
                    ease: cfg.ease, stagger: cfg.stagger });
            } else {
                tl.from(el, { ...fromVars, duration: cfg.duration,
                    delay: cfg.delay, ease: cfg.ease });
            }
        } else if (cfg.trigger === 'load') {
            gsap.from(el, { ...fromVars, duration: cfg.duration,
                delay: cfg.delay, ease: cfg.ease });
        } else if (cfg.trigger === 'hover') {
            this.bindHoverAnimation(el, fromVars, cfg);
        }
    }

    effectToVars(effect) {
        const effects = {
            fadeIn:    { opacity: 0 },
            slideUp:   { opacity: 0, y: 60 },
            slideDown: { opacity: 0, y: -60 },
            slideLeft: { opacity: 0, x: 80 },
            slideRight:{ opacity: 0, x: -80 },
            scaleIn:   { opacity: 0, scale: 0.8 },
            flipX:     { opacity: 0, rotationX: 90, transformOrigin: 'top center' },
            flipY:     { opacity: 0, rotationY: 90 },
            clipLeft:  { clipPath: 'inset(0 100% 0 0)' },
            clipRight: { clipPath: 'inset(0 0 0 100%)' },
        };
        return effects[effect] || effects.fadeIn;
    }
}

document.addEventListener('DOMContentLoaded', () => window.novaGSAP = new NovaGSAP());
```

### 11.7 Theme-Level GSAP Configuration

```json
// themes/nova-default/theme.json
{
    "gsap": {
        "smoothScroll": false,
        "scrollSmoother": {
            "smooth": 1.5,
            "effects": true
        },
        "defaults": {
            "duration": 0.8,
            "ease": "power2.out"
        },
        "presets": {
            "hero": {
                "effect": "slideUp",
                "duration": 1.2,
                "stagger": 0.15,
                "ease": "expo.out"
            },
            "card": {
                "effect": "scaleIn",
                "duration": 0.6,
                "start": "top 85%"
            }
        },
        "markers": false
    }
}
```

---

## 12. Plugin Architecture

### 12.1 Plugin Manifest

```json
// plugins/example-plugin/plugin.json
{
    "id": "example-plugin",
    "name": "Example Plugin",
    "version": "1.0.0",
    "description": "What this plugin does",
    "author": "Developer Name",
    "author_url": "https://example.com",
    "requires_cms": "1.0.0",
    "requires_php": "8.1",
    "namespace": "NovaCMS\\Plugins\\ExamplePlugin",
    "main_class": "ExamplePlugin",
    "hooks": ["post.saved", "content.output"],
    "admin_menu": {
        "title": "Example",
        "icon": "ph-puzzle",
        "capability": "example.manage",
        "position": 65
    },
    "settings_page": true,
    "migrations": ["migrations/001_create_example_table.php"]
}
```

### 12.2 Plugin Class

```php
namespace NovaCMS\Plugins\ExamplePlugin;

use NovaCMS\Core\BasePlugin;
use NovaCMS\Core\EventDispatcher;

class ExamplePlugin extends BasePlugin {

    public function register(): void {
        // Bind services to DI container
        $this->container->bind(ExampleService::class);
    }

    public function boot(): void {
        // Register hooks
        Event::on('post.saved', [$this, 'onPostSaved']);
        Event::filter('content.output', [$this, 'filterContent']);

        // Register admin routes
        if ($this->isAdminContext()) {
            $this->router->get('/admin/example', [ExampleAdminController::class, 'index']);
        }

        // Register GSAP blocks for Page Designer
        BlockRegistry::register('example-cta', ExampleCtaBlock::class);
    }

    public function onPostSaved(Post $post): void {
        // ... plugin logic
    }

    public function filterContent(string $content, Post $post): string {
        return ExampleContentFilter::apply($content);
    }
}
```

### 12.3 Plugin Security Sandbox

- Plugins run within PHP's namespace isolation
- File system access restricted to plugin directory + approved storage paths
- Outbound HTTP calls logged (optional — configurable in security settings)
- Plugin integrity verified via checksum on activation
- Plugin API has a curated allow-list of accessible core methods

---

## 13. Theme Engine

### 13.1 Theme Manifest (`theme.json`)

```json
{
    "name": "Nova Default",
    "version": "1.0.0",
    "description": "The official default NovaCMS theme",
    "author": "NovaCMS Team",
    "screenshot": "screenshot.png",
    "supports": {
        "page-designer": true,
        "custom-logo": true,
        "custom-header": true,
        "custom-footer": true,
        "post-thumbnails": true,
        "gsap": true,
        "dark-mode": true
    },
    "gsap": { ... },
    "colors": {
        "primary": "#6366F1",
        "secondary": "#8B5CF6",
        "accent": "#06B6D4",
        "surface": "#FFFFFF",
        "text": "#0F172A"
    },
    "fonts": {
        "heading": { "family": "Inter", "source": "google" },
        "body":    { "family": "Inter", "source": "google" }
    },
    "customizer": {
        "colors": true,
        "fonts": true,
        "layout": true,
        "header_styles": ["default", "transparent", "sticky", "fullscreen"],
        "footer_styles": ["default", "minimal", "mega"]
    }
}
```

### 13.2 Template Hierarchy

```
Request: /blog/my-post

Template resolution order (first match wins):
1. single-post-{slug}.php      → single-post-my-post.php
2. single-post-{id}.php        → single-post-42.php
3. single-{post-type}.php      → single-post.php
4. single.php
5. index.php
```

### 13.3 Theme Customizer

Live preview customizer (no page reload) accessible at:
`Admin → Appearance → Customize`

Sections:
- Site Identity (logo, name, tagline, favicon)
- Colors (mapped to CSS custom properties)
- Typography (font family, sizes, weights)
- Layout (container width, sidebar position)
- Header (style, sticky behavior, transparency)
- Footer (columns, copyright text, social links)
- GSAP Defaults (global animation settings)
- Custom CSS

---

## 14. Custom Fields & Content Modeling

### 14.1 Built-in Field Types

| Type | Description | Storage |
|---|---|---|
| `text` | Single line text | VARCHAR |
| `textarea` | Multi-line text | TEXT |
| `rich_text` | WYSIWYG content | LONGTEXT |
| `number` | Integer or decimal | DECIMAL |
| `boolean` | Toggle / checkbox | TINYINT |
| `date` | Date picker | DATE |
| `datetime` | Date + time picker | DATETIME |
| `email` | Email with validation | VARCHAR |
| `url` | URL with validation | VARCHAR |
| `color` | Color picker | VARCHAR |
| `image` | Media library picker (single) | INT (media_id) |
| `gallery` | Media library picker (multi) | JSON |
| `file` | File upload | INT (media_id) |
| `select` | Dropdown (single) | VARCHAR |
| `multi_select` | Dropdown (multi) | JSON |
| `radio` | Radio buttons | VARCHAR |
| `checkbox_group` | Multiple checkboxes | JSON |
| `relation` | Link to another post/CPT | INT / JSON |
| `repeater` | Repeatable field group | JSON |
| `group` | Grouped fields (no repeat) | JSON |
| `flexible_content` | Multiple layout blocks | JSON |
| `map` | Google Maps location | JSON (lat, lng, address) |
| `code` | Code editor | TEXT |
| `json` | Raw JSON editor | JSON |

### 14.2 Custom Post Types (CPT)

Registerable through Admin UI or code:

```php
// In plugin or functions.php equivalent
ContentTypes::register('portfolio', [
    'singular' => 'Portfolio Item',
    'plural'   => 'Portfolio Items',
    'icon'     => 'ph-image-square',
    'supports' => ['title', 'content', 'thumbnail', 'custom-fields'],
    'public'   => true,
    'archive'  => '/portfolio',
    'slug'     => 'portfolio/{slug}',
]);
```

---

## 15. API Layer

### 15.1 REST API Design

- Base URL: `/api/v1/`
- JSON:API 1.1 compliant response format
- Bearer token (JWT) authentication for write operations
- Public GET endpoints configurable per content type

### 15.2 Core Endpoints

```
Authentication
POST   /api/v1/auth/login                     → Issue JWT
POST   /api/v1/auth/logout                    → Revoke token
POST   /api/v1/auth/refresh                   → Refresh access token
POST   /api/v1/auth/oauth/{provider}          → OAuth callback (Google, Microsoft)

Content
GET    /api/v1/posts                           → List posts (with filters, pagination)
POST   /api/v1/posts                           → Create post
GET    /api/v1/posts/{id}                      → Get single post
PATCH  /api/v1/posts/{id}                      → Update post
DELETE /api/v1/posts/{id}                      → Delete post
GET    /api/v1/posts/{id}/revisions            → Post revision history

Pages
GET    /api/v1/pages
POST   /api/v1/pages
GET    /api/v1/pages/{id}
PATCH  /api/v1/pages/{id}/layout              → Update page designer layout
DELETE /api/v1/pages/{id}

Media
GET    /api/v1/media
POST   /api/v1/media/upload                   → Upload file (multipart)
DELETE /api/v1/media/{id}

Users
GET    /api/v1/users                          → Admin only
POST   /api/v1/users
GET    /api/v1/users/{id}
PATCH  /api/v1/users/{id}
DELETE /api/v1/users/{id}

Settings
GET    /api/v1/settings                       → Public settings (site name, etc.)
PATCH  /api/v1/settings                       → Admin only

Taxonomy
GET    /api/v1/taxonomies/{taxonomy}          → List terms
POST   /api/v1/taxonomies/{taxonomy}          → Create term
```

### 15.3 API Rate Limiting

```php
// config/security.php
'rate_limits' => [
    'api.public'       => '120 per minute',
    'api.authenticated'=> '600 per minute',
    'auth.login'       => '5 per minute',       // Brute force protection
    'auth.register'    => '3 per hour',
    'media.upload'     => '20 per minute',
]
```

---

## 16. Performance Strategy

### 16.1 Caching Architecture (Layered)

```
Request arrives
     │
     ▼
[L1] Page Cache (full HTML, file or Redis)   ← Fastest: bypasses PHP entirely
     │ Cache miss
     ▼
[L2] Object Cache (query results, computed)  ← Reduces DB queries
     │ Cache miss
     ▼
[L3] Query Cache (MySQL query cache / ORM)   ← DB-level optimization
     │
     ▼
     DB
```

### 16.2 Page Cache

- Full HTML output cached per URL + query string + logged-in state
- Cache key: `md5(url + role_group)`
- Automatic cache invalidation on:
  - Post publish/update/delete
  - Theme settings change
  - Plugin activation
- Manual purge per-page or global from admin
- Cache warming: CLI command `php nova cache:warm`
- Apache: `.htaccess` serves cache files directly without PHP
- Nginx: `try_files $uri /storage/cache/...` pattern

### 16.3 Asset Optimization

- CSS: Custom properties (no Sass required), minified in production
- JavaScript: ES modules, code splitting, lazy loading
- Images:
  - Automatic WebP conversion on upload (GD or ImageMagick)
  - Multiple sizes generated on upload (thumbnail, medium, large, original)
  - Lazy loading via `loading="lazy"` attribute (native browser)
  - Optional: blur-up placeholder (LQIP — Low Quality Image Placeholder)
  - Responsive `srcset` and `sizes` attributes auto-generated
- GSAP: Loaded only if page has animations (`data-has-gsap` check)
- Critical CSS inline extraction (optional, Phase 3)

### 16.4 Database Optimization

- Indexed columns: `status`, `author_id`, `published_at`, `slug`, `parent_id`
- Eager loading to prevent N+1 queries
- Query analysis: slow query log integration in dev mode
- Pagination with `LIMIT`/`OFFSET` plus cursor-based pagination for APIs
- Read replicas support (Phase 3+)

### 16.5 Performance Monitoring

```
Admin → Dashboard → Performance
├── Avg. Page Load Time (last 24h)
├── Cache Hit Rate
├── Slowest 10 Pages
├── DB Query Count per Request (dev mode)
└── Lighthouse Score estimate (via API)
```

---

## 17. Database Architecture

### 17.1 Core Tables

```sql
-- Users
users (id, email, username, password_hash, display_name, avatar_id, status, email_verified_at, last_login_at, created_at, updated_at)
user_meta (id, user_id, meta_key, meta_value)
oauth_identities (id, user_id, provider, provider_user_id, access_token_encrypted, refresh_token_encrypted, expires_at)
password_resets (id, user_id, token_hash, expires_at, used_at)
remember_tokens (id, user_id, token_hash, expires_at)

-- RBAC
roles (id, name, display_name, parent_role_id, is_system)
capabilities (id, name, module, description)
role_capabilities (role_id, capability_id, granted)
user_roles (user_id, role_id, granted_by, granted_at)
user_capability_overrides (user_id, capability_id, granted)
role_menu_visibility (role_id, menu_item_key, visible)
feature_flags (id, name, module, enabled_for_roles JSON)

-- Content
posts (id, title, slug, content, excerpt, status, author_id, type, parent_id, menu_order, password, published_at, created_at, updated_at)
post_meta (id, post_id, meta_key, meta_value)
post_revisions (id, post_id, content_snapshot JSON, created_by, created_at)
taxonomies (id, name, slug, type [tag|category|custom])
terms (id, taxonomy_id, name, slug, parent_id, description, count)
post_terms (post_id, term_id)
comments (id, post_id, author_id, parent_id, content, status, ip_address, created_at)

-- Media
media (id, filename, original_filename, mime_type, file_size, width, height, alt_text, caption, uploaded_by, storage_path, created_at)
media_sizes (id, media_id, size_name, filename, width, height)

-- Pages & Designer
pages (id, title, slug, status, author_id, template, page_layout JSON, seo JSON, created_at, updated_at)

-- Custom Fields
field_groups (id, name, key, rules JSON, position, created_at)
fields (id, group_id, type, name, key, settings JSON, conditional_logic JSON, order)
field_values (id, field_id, object_type, object_id, value LONGTEXT)

-- Navigation
menus (id, name, slug)
menu_items (id, menu_id, parent_id, type, object_id, title, url, target, icon, order)

-- Settings
settings (id, key VARCHAR(200) UNIQUE, value LONGTEXT, autoload TINYINT)

-- Audit
audit_log (id, user_id, action, model_type, model_id, old_values JSON, new_values JSON, ip_address, user_agent, created_at)

-- Cache / Sessions
cache (key VARCHAR(250), value MEDIUMTEXT, expiration INT)
sessions (id VARCHAR(100), user_id INT, payload TEXT, last_activity INT, ip_address, user_agent)
```

---

## 18. URL Management & Security

### 18.1 URL Structure

Configurable URL patterns per content type:

```
Posts:    /blog/{year}/{month}/{slug}    or    /blog/{slug}    or    /{slug}
Pages:    /{slug}                        or    /pages/{slug}
CPTs:     /{type}/{slug}                 or    /{slug}
Archives: /blog/                         or    /category/{slug}
Authors:  /author/{username}
Tags:     /tag/{slug}
```

### 18.2 URL Security

**Slug Sanitization:**
- Enforced alphanumeric + hyphens only
- Automatic slugification of titles
- Duplicate slug resolution (auto-append `-2`, `-3`)
- Reserved slug blocklist: `admin`, `api`, `login`, `logout`, `install`, `wp-admin`

**HTTPS Enforcement:**
- Auto-redirect HTTP → HTTPS when `APP_URL` uses HTTPS
- HSTS header: `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- Admin panel always forces HTTPS regardless of setting

**Security Headers (default):**

```
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
Content-Security-Policy: [configurable per site]
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

**Content Security Policy Builder:**
Admin UI to build CSP without manual header strings:
`Admin → Settings → Security → Content Security Policy`

**Protected Routes (admin):**
- Admin area accessible only to authenticated users with `admin.access` capability
- IP allowlist option for admin URL (optional, configurable)
- Custom admin URL (`/admin` changeable to reduce bot attacks)
- Login page with rate limiting and CAPTCHA (hCaptcha, configurable)

**File Upload Security:**
- MIME type validation (magic bytes, not just extension)
- Extension blocklist: `.php`, `.exe`, `.sh`, `.bat`, `.phar`, etc.
- Uploaded files stored outside webroot with indirect serving
- Image files re-processed through GD to strip EXIF and potential malicious payloads

### 18.3 CSRF Protection

```php
// Every form includes:
<input type="hidden" name="_token" value="{{ csrf_token() }}">

// Middleware validates:
class CSRFMiddleware {
    public function handle(Request $request): void {
        if (in_array($request->method(), ['POST', 'PUT', 'PATCH', 'DELETE'])) {
            if (!$this->validateToken($request->input('_token'))) {
                throw new CSRFException();
            }
        }
    }
}
```

### 18.4 SQL Injection Prevention

- All queries through Query Builder use PDO prepared statements
- Raw query support exists but emits a deprecation warning in dev mode
- Input sanitized at boundary; escape-on-output for HTML

---

## 19. Installation & Deployment Wizard

### 19.1 Pre-Installation Checklist (Step 1: Requirements)

Automated checks displayed as a visual checklist:

```
System Requirements Check

[✅] PHP Version: 8.2.5 (Required: 8.1+)
[✅] PDO Extension: Available
[✅] PDO MySQL: Available
[✅] GD Library: Available
[✅] Mbstring: Available
[✅] OpenSSL: Available
[✅] cURL: Available
[✅] /storage directory: Writable
[✅] /public directory: Writable
[⚠️] Redis Extension: Not available (Optional - file cache will be used)
[✅] mod_rewrite / Nginx rewrite: Detected
[✅] HTTPS: Available
```

### 19.2 Wizard Steps

```
Step 1: Requirements Check     → Automated server compatibility check
Step 2: Database Configuration → Host, DB name, user, password + connection test
Step 3: Site Settings          → Site name, admin email, URL, timezone, locale
Step 4: Admin Account          → Super Admin username, email, password
Step 5: OAuth Configuration    → Optional: Configure Google/Microsoft login
Step 6: Theme Selection        → Choose starting theme
Step 7: Install                → Run migrations, seed data, generate keys
Step 8: Complete               → Lock installer, show admin link
```

### 19.3 Post-Installation Security

After install completes:
1. Rename or delete `/install` directory (or write-protect it)
2. Generate `APP_KEY` (256-bit random, used for encryption/hashing)
3. Generate JWT secret (`JWT_SECRET`)
4. Set correct file permissions: `755` dirs, `644` files, `600` for `.env`
5. Create `INSTALLED.lock` file — wizard checks for this and refuses to re-run

### 19.4 CLI Installer

For server admins comfortable with terminal:

```bash
php nova install \
    --db-host=localhost \
    --db-name=novacms \
    --db-user=root \
    --db-pass=secret \
    --admin-email=admin@example.com \
    --admin-pass=supersecret \
    --site-name="My Website" \
    --site-url=https://example.com
```

### 19.5 Update Mechanism

```bash
# CLI update
php nova update             ← Check for updates, apply migrations
php nova update --check     ← Check only, no install

# Admin UI
Admin → Settings → System → Check for Updates
→ Shows changelog, allows one-click update with backup prompt
```

---

## 20. Admin Panel UX Design

### 20.1 Design Principles

- **Clean & Modern** — No clutter, generous whitespace, modern typography
- **Fast** — No full-page reloads for common actions (Alpine.js + fetch)
- **Dark Mode Support** — System preference aware + manual toggle
- **Responsive** — Fully usable on tablet and mobile
- **Keyboard Accessible** — Full keyboard navigation and ARIA compliance

### 20.2 Layout Structure

```
┌──────────────────────────────────────────────────────────┐
│  [NovaCMS Logo]          [Search] [Notifications] [User] │  ← Top Bar
├──────────┬───────────────────────────────────────────────┤
│          │  Breadcrumb > Path                            │
│ Sidebar  │  ────────────────────────────────────────     │
│          │                                               │
│ ● Dash   │              Content Area                     │
│ ● Posts  │                                               │
│ ● Pages  │                                               │
│ ● Media  │                                               │
│ ● Users  │                                               │
│ ● Design │                                               │
│ ● Plugins│                                               │
│ ● Settings│                                              │
│          │                                               │
│ [Collapse│                                               │
│  Sidebar]│                                               │
└──────────┴───────────────────────────────────────────────┘
```

### 20.3 Dashboard Widgets

Drag-and-drop configurable dashboard:
- Site Health Score
- Recent Posts
- Draft Posts
- Comments Awaiting Moderation
- Quick Stats (views, posts, users, comments)
- Activity Log (recent actions)
- Performance (cache hit rate, load time)
- Quick Draft (write a quick post)
- Page Designer shortcut

### 20.4 Post Editor

The post editor uses a block-based approach (not to be confused with the Page Designer — this is for blog posts):

- Rich text editor (ProseMirror-based, lightweight)
- Inline media insertion
- Custom field sidebar panel
- SEO panel (meta title, description, OG image, preview)
- Publishing panel (status, visibility, schedule, slug)
- Revision history sidebar
- Full-screen distraction-free writing mode

---

## 21. eCommerce Module (Phase 5+)

### 21.1 Architecture Decision

eCommerce is implemented as a **first-party plugin** — not baked into core. This keeps core lean while providing a polished official solution.

### 21.2 Product System

```
Product Types:
├── Simple Product (single SKU)
├── Variable Product (size/color/etc variants)
├── Digital Product (downloadable)
├── Subscription (recurring billing)
└── Bundle (grouped products)

Product Data:
├── Custom Fields (uses existing CF system)
├── Inventory Management
├── Pricing (regular, sale, tiered)
├── Images (gallery, variant-specific)
└── Related Products / Upsells
```

### 21.3 Payment Integrations (Plugin-Based)

- Stripe (official plugin)
- PayPal (official plugin)
- Razorpay (India-first option)
- Cash on Delivery
- Bank Transfer

### 21.4 eCommerce Features

- Cart (session-based or DB-stored for logged users)
- Checkout (multi-step or single page)
- Order management + fulfillment status
- Invoice generation (PDF)
- Coupon / discount system
- Tax rules (by region)
- Shipping rules
- Email notifications (order confirm, shipped, etc.)
- Customer account (order history, reorder)
- REST API for headless commerce
- GSAP-enhanced product pages (zoom, gallery, add-to-cart animations)

---

## 22. Security Architecture

### 22.1 Security Checklist (Built-in, Always On)

| Layer | Measure | Implementation |
|---|---|---|
| Input | Validation | Validator class, type casting, length limits |
| Input | Sanitization | htmlspecialchars on output, not input |
| Database | SQL Injection | PDO prepared statements exclusively |
| HTTP | CSRF | Synchronizer token pattern |
| HTTP | XSS | Content-Security-Policy + output escaping |
| HTTP | Clickjacking | X-Frame-Options: SAMEORIGIN |
| Auth | Brute Force | Rate limiting + account lockout |
| Auth | Session Hijack | Session regeneration + fingerprinting |
| Auth | Password | Argon2id hash, policy enforcement |
| Files | Upload | MIME validation, re-processing, isolated storage |
| Files | Path Traversal | basename() enforcement, no user-controlled paths |
| API | Authorization | JWT + capability check on every endpoint |
| Admin | 2FA | TOTP (Google Authenticator) — Phase 2 |
| Secrets | Storage | Encrypted `.env`, never in DB or code |
| Dependencies | Audit | `composer audit` in CI/CD |

### 22.2 Data Encryption

- `APP_KEY` used to encrypt: OAuth tokens, API keys stored in DB, sensitive settings
- Algorithm: AES-256-GCM
- Key rotation mechanism (Phase 3)

---

## 23. Development Phases & Roadmap

### Phase 1: Core Foundation (Months 0–2)
**Goal:** Working CMS you can install and use for basic content.

- [ ] Project setup: PSR-4 autoloader, folder structure, `.env` system
- [ ] Custom Kernel, ServiceContainer, Router
- [ ] Database connection, Query Builder, Base Model
- [ ] Session management
- [ ] Middleware pipeline (CSRF, Auth, Rate Limit)
- [ ] User model + native authentication (login, logout, register)
- [ ] Roles table + Super Admin seeding on install
- [ ] Post & Page CRUD
- [ ] Basic theme rendering (PHP templates)
- [ ] Static file serving + `.htaccess` / Nginx config
- [ ] Installation Wizard (Steps 1–8)
- [ ] CLI tool (`nova migrate`, `nova cache:clear`)
- [ ] DEVELOPMENT_LOG.md discipline established

### Phase 2: Admin Panel & Users (Months 2–4)
**Goal:** Polished admin experience with user management.

- [ ] Admin panel layout (sidebar, topbar, dashboard)
- [ ] Post editor (rich text, publish controls, SEO panel)
- [ ] Media library (upload, browse, insert)
- [ ] User management (list, create, edit, delete)
- [ ] Role management (create/edit roles, assign capabilities)
- [ ] Admin menu visibility control (per role)
- [ ] Feature flags per role
- [ ] OAuth integration (Google + Microsoft)
- [ ] Admin panel dark mode
- [ ] Audit log
- [ ] Settings pages (general, auth, security, performance)

### Phase 3: Animations & Page Designer (Months 4–6)
**Goal:** The visual WOW factor that differentiates NovaCMS.

- [ ] GSAP integration layer (`nova-gsap.js`)
- [ ] ScrollTrigger animations
- [ ] Page Designer canvas (drag-drop)
- [ ] Block library (20+ built-in blocks)
- [ ] Animation Panel (per-block GSAP settings)
- [ ] Style Panel (typography, spacing, colors)
- [ ] Responsive design mode (mobile/tablet/desktop)
- [ ] Theme Customizer
- [ ] GSAP preset library

### Phase 4: Plugin & Advanced Features (Months 6–9)
**Goal:** Extensibility and advanced content modeling.

- [ ] Plugin system (manifest, loader, hook API)
- [ ] Plugin marketplace directory browser
- [ ] Custom Fields module (all field types)
- [ ] Custom Post Types
- [ ] REST API (v1, full CRUD, JWT auth)
- [ ] GraphQL layer (optional, Phase 4b)
- [ ] Full-text search (MySQL FTS + optional Meilisearch)
- [ ] Navigation builder
- [ ] Forms module
- [ ] SEO module (sitemap, meta, robots.txt)
- [ ] Multi-language foundation (i18n strings)

### Phase 5: eCommerce (Months 9–12)
**Goal:** Production-ready commerce.

- [ ] Product CPT + commerce field types
- [ ] Cart + Checkout
- [ ] Order management
- [ ] Payment plugin architecture
- [ ] Stripe + PayPal official plugins
- [ ] Customer account area
- [ ] Email notification system
- [ ] PDF invoice generation

### Phase 6: Scale & Enterprise (Months 12+)
- [ ] Multi-site support
- [ ] Read replica support
- [ ] Redis queue for async jobs
- [ ] Static site export
- [ ] Headless mode (decoupled frontend support)
- [ ] CDN integration helpers
- [ ] SSO (SAML 2.0)
- [ ] Two-factor authentication (TOTP)
- [ ] Advanced analytics (privacy-first, no cookies)
- [ ] A/B testing framework

---

## 24. Coding Standards & Guidelines

### 24.1 PHP Standards

- **PSR-12** coding style (enforced by PHP_CodeSniffer in CI)
- **PSR-4** autoloading
- **PSR-3** logging (Monolog or custom)
- **PSR-7** HTTP messages (optional for API layer)
- Strict types: `declare(strict_types=1)` in all files
- Typed properties and return types (PHP 8+)
- No global variables outside of core bootstrap
- No `die()` or `exit()` — throw exceptions
- Every public method has a docblock

### 24.2 JavaScript Standards

- ES2020+ syntax
- No `var` — use `const` / `let`
- Modules via `type="module"` where supported
- No jQuery (even in admin)
- Event delegation over direct binding for dynamic content
- Debounce all resize/scroll handlers
- Never modify the GSAP core — only use its public API

### 24.3 Database Standards

- Every table has `created_at`, `updated_at` timestamps
- Foreign keys with explicit `ON DELETE` actions
- No `SELECT *` — always specify columns
- All queries must use prepared statements
- Index all foreign key columns and frequently queried columns
- Migration files are immutable once merged to main branch

### 24.4 Git Workflow

```
main          ← Production-ready, tagged releases
  └── develop ← Integration branch
       └── feature/nova-XXXX-short-description
       └── fix/nova-XXXX-short-description
       └── refactor/nova-XXXX-short-description
```

- Semantic versioning: `MAJOR.MINOR.PATCH`
- Conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `perf:`
- Every PR requires one reviewer approval
- CI must pass before merge

---

## 25. Testing Strategy

### 25.1 Testing Pyramid

```
         [E2E]            ← 10%: Critical user flows (Playwright)
       [Integration]      ← 30%: Module + DB interactions (PHPUnit)
     [Unit Tests]         ← 60%: Core classes, helpers, services (PHPUnit)
```

### 25.2 Required Test Coverage

| Component | Coverage Target |
|---|---|
| Core Kernel, Router | 90% |
| QueryBuilder | 95% |
| Authentication flows | 100% |
| RBAC / Permission checks | 100% |
| API endpoints | 85% |
| Plugin hook system | 90% |
| Installation wizard | 80% |

### 25.3 E2E Critical Path Tests (Playwright)

1. Full installation wizard
2. Login with native credentials
3. Login with Google OAuth (mocked)
4. Create, publish, and view a post
5. Page Designer: create page, add blocks, assign GSAP animation, publish, verify animation fires
6. Role creation + menu visibility control
7. Plugin install and activation
8. Media upload and insertion

---

## 26. DEVELOPMENT_LOG.md Structure

Every development session, every commit is logged. This creates an invaluable project history.

```markdown
# NovaCMS Development Log

---

## [YYYY-MM-DD] — Commit: {conventional commit message}

### Summary
Brief description of what was accomplished this session.

### Changes Made
- **Added:** Kernel.php with service container bootstrap
- **Added:** Router with named route support
- **Modified:** Database.php — added connection retry logic
- **Fixed:** Session not regenerating on role change
- **Removed:** Deprecated helper function `old_sanitize()`

### Architectural Decisions
- Chose file-based cache as default over Redis to support shared hosting.
  Redis remains optional via config. Decision: performance vs. compatibility trade-off.

### Known Issues / Tech Debt
- [ ] Router does not yet support optional parameters
- [ ] Page cache invalidation needs to be queue-aware (Phase 3)

### Next Steps
- [ ] Implement middleware pipeline
- [ ] Add CSRF token generation
```

---

## 27. Future Enhancements

### Headless / Decoupled Mode
- NovaCMS operates purely as a backend/API
- Frontend can be Next.js, Nuxt, Astro, SvelteKit
- Webhook system for content change notifications to frontends
- Preview mode for draft content in decoupled setups

### GraphQL API (Phase 4b)
- Schema auto-generated from registered content types
- Introspection available in dev mode
- Real-time subscriptions (WebSocket) for live preview

### Multi-Site
- Single codebase, multiple sites
- Shared or isolated databases
- Per-site themes, plugins, settings
- Super Admin manages all sites from one panel

### Static Site Export
- Export entire site to static HTML
- Useful for hosting on CDN / GitHub Pages
- Auto-triggered on publish via webhooks

### AI Content Assistant (Phase 6+)
- AI-powered content suggestions (title, meta, excerpt)
- Image alt text generation
- GSAP animation preset suggestions based on content type
- Pluggable AI backend (user provides their own API key)

### Developer Tools
- Debug bar (query count, cache hits, hooks fired, memory)
- GSAP Dev Mode (markers, timeline scrubber in admin preview)
- Schema viewer for custom fields
- Route list CLI command: `php nova route:list`
- Plugin scaffolding: `php nova make:plugin my-plugin`
- Module scaffolding: `php nova make:module Portfolio`

---

*NovaCMS — Built by developers, for developers and content creators.*  
*This plan is a living document. Update it as architecture evolves.*

---

**Document Version:** 2.0  
**Last Updated:** 2026-04-15  
**Status:** Active Development Blueprint
