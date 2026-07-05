# FlxOraCMS Theme Specification

A theme is a folder (distributed as a `.zip`) of HTML/Liquid templates, partials,
and assets. Themes are rendered at runtime by **LiquidJS** — no rebuild is needed
to install or switch a theme.

## Folder structure

```
my-theme/
├── theme.json          # manifest (required)
├── layouts/            # base layouts (optional)
│   └── base.liquid
├── partials/           # reusable includes (header, footer, head, …)
├── templates/          # one per template type
│   ├── home.liquid
│   ├── page.liquid
│   ├── post.liquid
│   ├── archive.liquid
│   └── 404.liquid
└── assets/             # css, js, images (served at /theme-assets/<slug>/…)
```

## `theme.json`

```json
{
  "name": "Starter",
  "slug": "starter",
  "version": "1.0.0",
  "author": "You",
  "description": "…",
  "templates": {
    "home": "templates/home.liquid",
    "page": "templates/page.liquid",
    "post": "templates/post.liquid",
    "archive": "templates/archive.liquid",
    "404": "templates/404.liquid"
  },
  "regions": ["header", "footer"],
  "menus": ["main", "footer"]
}
```

- `slug` must be kebab-case (`a-z`, `0-9`, `-`). It is the install identity.
- `templates` maps a **template type** to a file. `page` is the fallback when a
  requested type is missing. Recognised types: `home`, `page`, `post`,
  `archive`, `search`, `404`.

## Template context (variables)

Every template receives:

| Variable | Description |
|---|---|
| `site.title` / `site.tagline` / `site.url` / `site.logo` | Site identity (Settings) |
| `page.title` / `page.slug` / `page.url` / `page.type` | Current entry |
| `page.content` | Rendered HTML body (output raw — Liquid does not auto-escape) |
| `page.excerpt` / `page.featured_image` / `page.published_at` | Entry meta |
| `posts` | Array of entries (archive templates) |
| `menus.main` / `menus.footer` | Nested menu items: `{ label, url, target, children[] }` |
| `customizer.css` | `:root{…}` CSS variables block from the Customizer |
| `customizer.*` | Raw customizer values (e.g. `customizer["colors.primary"]`) |
| `year` | Current year |

## Filters

- `asset` — resolve a path inside `assets/` to a URL:
  `{{ 'css/style.css' | asset }}` → `/theme-assets/<slug>/css/style.css`
- All standard Liquid filters (`date`, `escape`, `truncate`, …).

## Layouts, partials, blocks

- Use a base layout: a template begins with `{% layout 'layouts/base' %}` and
  defines `{% block content %}…{% endblock %}`; the layout renders
  `{% block content %}{% endblock %}` where content should appear.
- Include shared partials with `{% include 'partials/header' %}` (shares scope,
  so partials see `site`, `page`, `menus`, `customizer`).

## Customizer → CSS variables

The Customizer writes CSS custom properties consumed by your CSS:

| Customizer key | CSS variable |
|---|---|
| `colors.primary` | `--primary` |
| `colors.secondary` | `--secondary` |
| `colors.accent` | `--accent` |
| `colors.text` | `--text` |
| `colors.background` | `--background` |
| `fonts.heading` | `--font-heading` |
| `fonts.body` | `--font-body` |

Include the block in `<head>`: `<style>{{ customizer.css }}</style>`, then
reference the variables in your stylesheet (e.g. `color: var(--primary)`).

## Security

- Uploaded zips are validated: zip-slip protection, a 50MB cap, and an
  executable-file blocklist (`.php`, `.exe`, `.sh`, `.bat`, `.cmd`).
- LiquidJS is logic-limited (no arbitrary JS) and sandboxed to the theme folder.

## Regions (headers/footers/blocks)

`regions` declares named slots a theme exposes. In Phase 3 these are filled by
the drag-and-drop header/footer/area builder. Until then, a theme provides its
own header/footer partials (as the starter theme does).
