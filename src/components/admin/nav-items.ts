import type { PermissionSlug } from "@/lib/rbac";

export type NavItem = {
  label: string;
  href: string;
  icon: string; // lucide icon name (resolved in the client sidebar)
  permission?: PermissionSlug; // undefined = visible to any authenticated user
};

export type NavGroup = {
  heading: string;
  items: NavItem[];
};

// Single source of truth for the admin sidebar. Items are filtered by the
// current user's permissions in the layout before rendering.
export const NAV: NavGroup[] = [
  {
    heading: "Overview",
    items: [{ label: "Dashboard", href: "/admin", icon: "layout-dashboard" }],
  },
  {
    heading: "Content",
    items: [
      {
        label: "Pages",
        href: "/admin/content/page",
        icon: "file-text",
        permission: "content.view",
      },
      {
        label: "Posts",
        href: "/admin/content/post",
        icon: "newspaper",
        permission: "content.view",
      },
      {
        label: "Content Types",
        href: "/admin/content-types",
        icon: "database",
        permission: "content_types.manage",
      },
      {
        label: "Media",
        href: "/admin/media",
        icon: "image",
        permission: "media.view",
      },
    ],
  },
  {
    heading: "Appearance",
    items: [
      {
        label: "Themes",
        href: "/admin/themes",
        icon: "palette",
        permission: "themes.manage",
      },
      {
        label: "Customizer",
        href: "/admin/customizer",
        icon: "sliders-horizontal",
        permission: "customizer.manage",
      },
      {
        label: "Headers & Footers",
        href: "/admin/layout",
        icon: "panels-top-left",
        permission: "layout.manage",
      },
      {
        label: "Menus",
        href: "/admin/menus",
        icon: "menu",
        permission: "menus.manage",
      },
    ],
  },
  {
    heading: "Marketing",
    items: [
      {
        label: "SEO",
        href: "/admin/seo",
        icon: "search",
        permission: "seo.manage",
      },
      {
        label: "Analytics",
        href: "/admin/analytics",
        icon: "bar-chart-3",
        permission: "analytics.view",
      },
    ],
  },
  {
    heading: "System",
    items: [
      {
        label: "Users",
        href: "/admin/users",
        icon: "users",
        permission: "users.view",
      },
      {
        label: "Plugins",
        href: "/admin/plugins",
        icon: "plug",
        permission: "plugins.manage",
      },
      {
        label: "Settings",
        href: "/admin/settings",
        icon: "settings",
        permission: "settings.manage",
      },
    ],
  },
];
