---
name: plugin-builder
description: Build a plugin for FlxOraCMS — add a PluginModule to the static registry that registers actions/filters against the core hook bus, then sync, enable, and verify it. Use when the user asks to create, scaffold, or extend a plugin (e.g. "make a plugin that…", "add a hook into page rendering", "log every content save", "inject an admin menu item", "transform the final HTML"). Covers the hook contract, payloads per extension point, enable lifecycle, and gotchas.
---

# FlxOraCMS Plugin Builder

Plugins extend core via a **WordPress-style hook bus**: register **actions**
(side effects) and **filters** (transform a value) at well-known extension points.
The MVP delivery mechanism is a **static registry** — a plugin is a `PluginModule`
object added to `src/plugins/registry.ts`. (Dynamic/marketplace loading is post-MVP.)

Key files:
- `src/server/hooks/index.ts` — the bus + `HOOKS` names + `ActionFn`/`FilterFn` types.
- `src/plugins/registry.ts` — `PluginModule`/`PluginManifest`/`PluginApi` + `AVAILABLE_PLUGINS`.
- `src/server/services/plugins.ts` — sync/enable/reload lifecycle.
- `src/app/admin/(protected)/plugins/` — the admin UI that lists/toggles plugins.

## Anatomy of a plugin

A `PluginModule` has a `manifest` and a `register(api)` that wires hooks:

```ts
const myPlugin: PluginModule = {
  manifest: {
    slug: "my-plugin",          // kebab-case, unique — the DB + ownership identity
    name: "My Plugin",
    version: "1.0.0",
    description: "What it does.",
    author: "...",
  },
  register(api) {
    // api.addAction(name, fn, priority?)  — run a side effect
    // api.addFilter<T>(name, fn, priority?) — transform & return a value
  },
};
```

Then append it to the exported array:

```ts
export const AVAILABLE_PLUGINS: PluginModule[] = [poweredBy, auditLog, formBuilder, myPlugin];
```

`register` runs with an `api` scoped to your slug, so the bus tracks ownership and
can cleanly remove your hooks when the plugin is disabled. **Priority** (default
`10`) orders handlers ascending — lower runs first. The sample form-builder uses
priority `5` to render shortcodes before other `pageHtml` filters.

## Actions vs filters

- **Action** (`addAction` → fired by `doAction`): a side effect. Return value is
  ignored. Failures are **isolated** (logged, not thrown) so one plugin can't break
  a save or a render. Signature: `(...args) => void | Promise<void>`.
- **Filter** (`addFilter` → fired by `applyFilters`): receives a value, **must
  return** the (possibly transformed) value, which is threaded to the next filter.
  Signature: `(value, ...args) => T | Promise<T>`. Always handle the "no change"
  path by returning the input unchanged.

Both may be `async`. Keep heavy/optional imports lazy (`await import(...)`) inside
the handler — see the samples — to avoid load-time cost and dependency cycles.

## Extension points (`HOOKS`)

| Constant | String | Kind | Payload → what to return |
|---|---|---|---|
| `HOOKS.contentAfterSave` | `content.afterSave` | action | the saved `entry` |
| `HOOKS.contentAfterDelete` | `content.afterDelete` | action | the deleted entry |
| `HOOKS.userAfterSave` | `user.afterSave` | action | the `user` |
| `HOOKS.userAfterDelete` | `user.afterDelete` | action | `{ id }` |
| `HOOKS.roleAfterSave` | `role.afterSave` | action | the `role` |
| `HOOKS.roleAfterDelete` | `role.afterDelete` | action | the `role` |
| `HOOKS.pageContext` | `page.context` | filter | the Liquid template **context** object (`{ site, page, region, seo, menus, customizer, year, … }`) — return it to inject/override template variables |
| `HOOKS.pageHtml` | `page.html` | filter | the **final HTML document string** (after theme render + layout/script injection) — return transformed HTML |
| `HOOKS.adminMenu` | `admin.menu` | filter | `NavGroup[]` — return the array with your groups/items appended (permission-filtered downstream) |

Where they fire:
- `pageContext` — in `renderEntry` (`src/server/theme/render.ts`) before Liquid renders.
- `pageHtml` — last step of the public renderer (`src/app/(site)/[[...slug]]/route.ts`),
  after `enhanceLayout` + `injectSiteScripts`. This is how `powered-by` and the
  form-builder shortcode work.
- `adminMenu` — in the protected admin `layout.tsx`; add `{ heading, items: [{ label,
  href, icon, permission? }] }`. If you set `permission`, gate it on a real slug from
  `src/lib/rbac.ts` (add the permission there + re-seed if it doesn't exist).
- Content/user/role actions — fired from the respective services after a mutation.

Adding a **new** hook point = add a name to `HOOKS` and call `hooks.doAction(...)`
/ `hooks.applyFilters(...)` at the core site, then document it here.

## Worked patterns (from the shipped samples)

- **Transform final HTML** (filter, idempotent): check a marker before mutating so
  re-runs are safe — `poweredBy` injects `<!-- powered by FlxOraCMS -->` before
  `</body>`.
- **React to a save** (action, lazy import): `auditLog` imports the logger lazily
  and logs `{ id, title, status }` on `contentAfterSave`.
- **Render + nav extension** (two filters): `formBuilder` adds a `pageHtml` filter
  at priority 5 that replaces `[flxform]` shortcodes, plus an `adminMenu` filter
  adding a permission-gated Forms section.

## Lifecycle: how a plugin becomes active

Enabled state lives in the DB (`Plugin` table), not in code:

1. `syncPlugins()` upserts every manifest in `AVAILABLE_PLUGINS` (preserves
   `isEnabled`). Runs on the admin plugins list and on enable.
2. `setPluginEnabled(slug, true/false)` flips the DB flag and `reloadPlugins()`.
3. `reloadPlugins()` clears all owned hooks (`removeByOwner`) then re-registers the
   enabled set — idempotent.
4. `ensurePluginsLoaded()` re-validates against the DB at most once per second
   (TTL) before rendering, so toggles propagate across Next's separate dev module
   graphs without a DB read per render.

A new plugin appears at `/admin/plugins` automatically (via `listPluginsForAdmin`)
once it's in `AVAILABLE_PLUGINS` — **disabled by default**. Enable it there.

## Build procedure

1. Add the `PluginModule` to `src/plugins/registry.ts` and append it to
   `AVAILABLE_PLUGINS`. Keep types honest — avoid importing client component types
   into the registry; use a minimal structural type like the sample `NavGroupLike`.
2. If the plugin needs a new permission or admin route, add the permission to
   `src/lib/rbac.ts`, re-run `npm run db:seed`, and create the admin page under
   `src/app/admin/(protected)/<x>/` calling `requirePermission(<slug>)`.
3. `npm run typecheck && npm run lint && npm run format:check`.
4. `npm run dev`, go to `/admin/plugins`, enable the plugin, and exercise the hook
   (save content / load a public page / check the admin nav).
5. Add a unit test under `tests/unit/` for any non-trivial transform (filters are
   pure-ish and easy to test); cover render-affecting behavior in `tests/e2e`.

## Gotchas

- **`slug` is the ownership + DB key** — must be unique and stable; renaming it
  orphans the DB row and the enabled flag.
- **Filters must return a value.** Forgetting to return drops downstream content
  (the bus threads the accumulator). Return the input on the no-op path.
- **Hook errors are swallowed** (logged via `@/lib/logger`, never thrown) so a
  plugin can't break core. Don't rely on a throw propagating — assert in tests.
- **Dev toggle latency ~1s** (the reload TTL) and Next dev's separate module graphs
  for actions vs route handlers; it's instant in production.
- **Server-only:** the bus and registry are `import "server-only"`. Plugins run on
  the server; don't pull browser-only code into `register`.
- **No `console.log`** in server code — use `@/lib/logger` (lazy-imported in
  handlers, as the samples do).
