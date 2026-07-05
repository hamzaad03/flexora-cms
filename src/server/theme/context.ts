import "server-only";

import { env } from "@/lib/env";
import { getSettings } from "@/server/services/settings";
import {
  getCustomizer,
  buildCustomizerCss,
} from "@/server/services/customizer";
import { resolveMenu } from "@/server/services/menu";

export type SiteContext = {
  title: string;
  tagline: string;
  url: string;
  logo: string | null;
};

export type PageContext = {
  title: string;
  slug: string;
  url: string;
  type: string;
  excerpt: string | null;
  content: string;
  featured_image: string | null;
  published_at: Date | null;
};

export type BaseContext = {
  site: SiteContext;
  menus: Record<string, unknown>;
  customizer: Record<string, unknown> & { css: string };
  year: number;
};

/** Build the theme-wide context shared by every rendered page. */
export async function buildBaseContext(): Promise<BaseContext> {
  const [settings, customizer, main, footer] = await Promise.all([
    getSettings(),
    getCustomizer(),
    resolveMenu("main"),
    resolveMenu("footer"),
  ]);

  const site: SiteContext = {
    title: (settings["identity.title"] as string) ?? "FlxOraCMS",
    tagline: (settings["identity.tagline"] as string) ?? "",
    url: env.APP_URL,
    logo: (settings["identity.logo"] as string) ?? null,
  };

  return {
    site,
    menus: { main, footer },
    customizer: { ...customizer, css: buildCustomizerCss(customizer) },
    year: new Date().getFullYear(),
  };
}
