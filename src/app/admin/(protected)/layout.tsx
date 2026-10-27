import { requireUser } from "@/server/auth/guard";
import { hasPermission, type PermissionSlug } from "@/lib/rbac";
import { NAV, type NavGroup } from "@/components/admin/nav-items";
import { Sidebar, type QuickLink } from "@/components/admin/sidebar";
import { Topbar } from "@/components/admin/topbar";
import { hooks, HOOKS } from "@/server/hooks";
import { ensurePluginsLoaded } from "@/server/services/plugins";

// Sidebar "Quick access" shortcuts; each is shown only with its permission.
const QUICK_LINKS: QuickLink[] = [
  {
    label: "Create new page",
    href: "/admin/content/page/new",
    icon: "file-plus",
    permission: "content.create",
  },
  {
    label: "Add new post",
    href: "/admin/content/post/new",
    icon: "square-pen",
    permission: "content.create",
  },
  {
    label: "Upload media",
    href: "/admin/media",
    icon: "image-up",
    permission: "media.upload",
  },
  { label: "View website", href: "/", icon: "globe", external: true },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const can = (p?: PermissionSlug) =>
    !p || hasPermission(user.roles, user.permissions, p);

  // Filter nav by the user's permissions (items without a permission are public
  // to any authenticated user). Drop empty groups.
  // Let plugins extend the nav first, then permission-filter the result so
  // plugin-added items also respect the user's permissions.
  await ensurePluginsLoaded();
  const fullNav = await hooks.applyFilters<NavGroup[]>(HOOKS.adminMenu, NAV);

  const groups: NavGroup[] = fullNav
    .map((group) => ({
      heading: group.heading,
      items: group.items.filter((item) => can(item.permission)),
    }))
    .filter((group) => group.items.length > 0);
  const quickLinks = QUICK_LINKS.filter((l) => can(l.permission));

  return (
    <div className="bg-background grid min-h-svh grid-cols-1 md:grid-cols-[16.5rem_1fr]">
      <aside className="bg-sidebar sticky top-0 hidden h-svh border-r md:block">
        <Sidebar groups={groups} quickLinks={quickLinks} />
      </aside>

      <div className="flex min-w-0 flex-col">
        <Topbar
          groups={groups}
          quickLinks={quickLinks}
          user={{ name: user.name, email: user.email, roles: user.roles }}
          canSearch={can("content.view")}
          canManageSettings={can("settings.manage")}
        />
        <main className="min-w-0 flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
