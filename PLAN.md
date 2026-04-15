# 🚀 Next-Gen Open Source CMS (WordPress Alternative)

## 1. Vision
Build a lightweight, high-performance, extensible CMS that:
- Runs on shared hosting (PHP + MySQL)
- Supports themes, plugins, and modern JS frameworks
- Enables advanced animations (GSAP)
- Provides built-in custom fields & content modeling
- Includes scalable eCommerce capabilities (later phase)

---

## 2. Core Principles
- Framework-independent core (custom PHP micro-kernel)
- Modular architecture
- API-first design
- Performance-first
- Backward compatibility
- Minimal external dependencies

---

## 3. Tech Stack

### Backend
- Language: PHP 8+
- Architecture: Custom micro-kernel (no heavy frameworks)
- Optional: Use LTS components (Symfony components only, not full framework)

### Frontend
- Vanilla JS (default)
- Optional integration:
  - React
  - Vue
  - GSAP (animations)

### Database
- MySQL / MariaDB

### Server Compatibility
- Apache / Nginx
- Shared hosting compatible (cPanel support)

### Build Tools
- Vite (optional, for advanced users)

---

## 4. System Architecture

### High-Level Layers
1. Core Kernel
2. Module System
3. Plugin System
4. Theme Engine
5. API Layer
6. Admin Panel

### Request Lifecycle
1. Request hits index.php
2. Router resolves route
3. Middleware executed
4. Controller invoked
5. Service layer processes logic
6. Response returned (HTML / JSON)

---

## 5. Folder Structure

```
/root
 ├── /core
 │   ├── Kernel.php
 │   ├── Router.php
 │   ├── Controller.php
 │   ├── Model.php
 │   ├── Middleware.php
 │   └── Helpers.php
 │
 ├── /config
 │   ├── app.php
 │   ├── database.php
 │   └── routes.php
 │
 ├── /modules
 │   ├── Blog
 │   ├── Pages
 │   └── Users
 │
 ├── /plugins
 │   └── (installed plugins)
 │
 ├── /themes
 │   └── (active themes)
 │
 ├── /storage
 │   ├── cache
 │   ├── logs
 │   └── uploads
 │
 ├── /public
 │   ├── index.php
 │   └── assets
 │
 ├── /api
 │   └── routes.php
 │
 ├── /vendor (optional)
 │
 ├── DEVELOPMENT_LOG.md
 └── plan.md
```

---

## 6. Core Components

### 6.1 Kernel
- Bootstraps application
- Loads config
- Initializes services

### 6.2 Router
- Lightweight routing system
- Supports REST APIs

### 6.3 ORM (Custom or Lightweight)
- Avoid heavy ORM
- Use query builder pattern

### 6.4 Plugin System
- Hook-based system (actions & filters)
- Namespaced plugins
- Sandboxed execution

### 6.5 Theme Engine
- PHP templating (lightweight)
- Component-based rendering

---

## 7. Plugin Architecture

### Features
- Hook system
- Event dispatcher
- Dependency isolation

### Example Hooks
- before_render
- after_save
- on_user_login

---

## 8. Custom Fields & Content Modeling

### Features
- Built-in custom fields
- Dynamic schema
- JSON-based storage (optional)

### Content Types
- Posts
- Pages
- Custom Types

---

## 9. Animation Support (GSAP)

### Strategy
- Native JS hooks
- Animation API layer
- Theme-level animation config

---

## 10. Performance Strategy

- Full page caching
- Object caching
- Lazy loading
- Asset minification
- Query optimization

---

## 11. Security

- CSRF protection
- XSS filtering
- SQL injection prevention
- Role-based access control

---

## 12. eCommerce (Phase 4+)

### Goals
- Fully customizable product schema
- Flexible pricing models
- Plugin-based extensions

### Features
- Product types
- Custom fields
- Payment integrations

---

## 13. Development Phases

### Phase 1: Core (0-2 months)
- Kernel
- Router
- Basic CMS (posts/pages)

### Phase 2: Admin (2-4 months)
- Dashboard
- User system
- Theme system

### Phase 3: Plugins (4-6 months)
- Plugin API
- Hook system

### Phase 4: Advanced (6-9 months)
- Custom fields
- API layer

### Phase 5: eCommerce (9-12 months)
- Product system
- Checkout

---

## 14. DEVELOPMENT_LOG.md Structure

```
# Development Log

## [YYYY-MM-DD]
### Commit: <commit message>
- Feature added
- Bug fixed
- Refactor details
```

### Example
```
## 2026-04-15
### Commit: Initialize core kernel
- Created Kernel.php
- Setup config loader
```

---

## 15. Coding Guidelines

- PSR standards
- Modular code
- Avoid tight coupling
- Write testable code

---

## 16. Future Enhancements

- Headless CMS
- GraphQL API
- Multi-site support
- Static site export

---

## 17. Deployment Strategy

- One-click installer
- Environment detection
- Config wizard

---

## 18. Final Notes

Focus on:
- Stability over features
- Performance over complexity
- Developer experience

This project should evolve as an ecosystem, not just a CMS.
