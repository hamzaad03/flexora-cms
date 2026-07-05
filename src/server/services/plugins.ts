import "server-only";

import { db } from "@/lib/db";
import { hooks } from "@/server/hooks";
import {
  AVAILABLE_PLUGINS,
  type PluginApi,
  type PluginModule,
} from "@/plugins/registry";

// Re-validate enabled plugins against the DB at most every TTL ms. This keeps
// multiple instances (and Next dev's separate module graphs) in sync after a
// toggle, while avoiding a DB read on every render.
let lastLoad = 0;
const RELOAD_TTL_MS = 1000;

function apiFor(slug: string): PluginApi {
  return {
    addAction: (name, fn, priority) =>
      hooks.addAction(name, fn, priority ?? 10, slug),
    addFilter: (name, fn, priority) =>
      hooks.addFilter(name, fn, priority ?? 10, slug),
  };
}

/** Upsert available plugin manifests into the DB (keeps isEnabled as-is). */
export async function syncPlugins() {
  for (const p of AVAILABLE_PLUGINS) {
    await db.plugin.upsert({
      where: { slug: p.manifest.slug },
      update: {
        name: p.manifest.name,
        version: p.manifest.version,
        manifest: p.manifest as object,
      },
      create: {
        slug: p.manifest.slug,
        name: p.manifest.name,
        version: p.manifest.version,
        manifest: p.manifest as object,
      },
    });
  }
}

/** Re-register all enabled plugins' hooks (idempotent). */
export async function reloadPlugins() {
  const enabled = await db.plugin.findMany({ where: { isEnabled: true } });
  const enabledSlugs = new Set(enabled.map((p) => p.slug));

  const bySlug = new Map<string, PluginModule>(
    AVAILABLE_PLUGINS.map((p) => [p.manifest.slug, p]),
  );
  // Clear any previous registrations, then register the enabled set.
  for (const p of AVAILABLE_PLUGINS) hooks.removeByOwner(p.manifest.slug);
  for (const slug of enabledSlugs) {
    const mod = bySlug.get(slug);
    if (mod) mod.register(apiFor(slug));
  }
  lastLoad = Date.now();
}

/** Load enabled plugins, re-validating against the DB at most once per TTL. */
export async function ensurePluginsLoaded() {
  if (Date.now() - lastLoad < RELOAD_TTL_MS) return;
  try {
    await reloadPlugins();
  } catch {
    // Never let plugin loading break rendering.
    lastLoad = Date.now();
  }
}

export async function listPluginsForAdmin() {
  await syncPlugins();
  const rows = await db.plugin.findMany();
  const enabled = new Map(rows.map((r) => [r.slug, r.isEnabled]));
  return AVAILABLE_PLUGINS.map((p) => ({
    ...p.manifest,
    isEnabled: enabled.get(p.manifest.slug) ?? false,
  }));
}

export async function setPluginEnabled(slug: string, isEnabled: boolean) {
  await syncPlugins();
  await db.plugin.update({ where: { slug }, data: { isEnabled } });
  await reloadPlugins();
}
