import { HOOKS, type ActionFn, type FilterFn } from "@/server/hooks";

// A plugin registers actions/filters through a scoped API. This static registry
// is the MVP delivery mechanism (dynamic/marketplace loading is post-MVP).

export type PluginManifest = {
  slug: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
};

export type PluginApi = {
  addAction: (name: string, fn: ActionFn, priority?: number) => void;
  addFilter: <T>(name: string, fn: FilterFn<T>, priority?: number) => void;
};

export type PluginModule = {
  manifest: PluginManifest;
  register: (api: PluginApi) => void;
};

// --- Sample plugin 1: appends a marker to every rendered page (filter) ---
const poweredBy: PluginModule = {
  manifest: {
    slug: "powered-by",
    name: "Powered By Banner",
    version: "1.0.0",
    description: "Adds a 'powered by FlxOraCMS' comment to rendered pages.",
    author: "FlxOraCMS",
  },
  register(api) {
    api.addFilter<string>(HOOKS.pageHtml, (html) => {
      const marker = "<!-- powered by FlxOraCMS -->";
      if (html.includes(marker)) return html;
      return html.includes("</body>")
        ? html.replace("</body>", `${marker}</body>`)
        : html + marker;
    });
  },
};

// --- Sample plugin 2: logs content saves (action) ---
const auditLog: PluginModule = {
  manifest: {
    slug: "content-audit-log",
    name: "Content Audit Log",
    version: "1.0.0",
    description: "Logs an entry to the server log whenever content is saved.",
    author: "FlxOraCMS",
  },
  register(api) {
    api.addAction(HOOKS.contentAfterSave, async (entry) => {
      const { logger } = await import("@/lib/logger");
      const e = entry as { id?: string; title?: string; status?: string };
      logger.info(
        { id: e.id, title: e.title, status: e.status },
        "[audit] content saved",
      );
    });
  },
};

// --- Form Builder: renders [flxform] shortcodes + adds the Forms admin nav ---
const formBuilder: PluginModule = {
  manifest: {
    slug: "form-builder",
    name: "Form Builder",
    version: "1.0.0",
    description:
      'Secure forms (honeypot, time-trap, rate-limit, Turnstile) embedded via [flxform slug="…"] or the Form layout component.',
    author: "FlxOraCMS",
  },
  register(api) {
    // Render forms anywhere the shortcode appears in the final HTML.
    api.addFilter<string>(
      HOOKS.pageHtml,
      async (html) => {
        if (!html.includes("[flxform")) return html;
        const { renderFormsInHtml } = await import("@/server/forms/render");
        return renderFormsInHtml(html);
      },
      5,
    );

    // Add a Forms section to the admin nav (permission-filtered downstream).
    api.addFilter<NavGroupLike[]>(HOOKS.adminMenu, (groups) => [
      ...groups,
      {
        heading: "Forms",
        items: [
          {
            label: "Forms",
            href: "/admin/forms",
            icon: "inbox",
            permission: "forms.manage",
          },
        ],
      },
    ]);
  },
};

// Minimal structural type for nav groups (avoids importing client component types).
type NavGroupLike = {
  heading: string;
  items: {
    label: string;
    href: string;
    icon: string;
    permission?: string;
  }[];
};

export const AVAILABLE_PLUGINS: PluginModule[] = [
  poweredBy,
  auditLog,
  formBuilder,
];
