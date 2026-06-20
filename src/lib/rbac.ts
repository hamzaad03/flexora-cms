// Canonical RBAC definitions: permissions, roles, and their mappings.
// Used by the seed script and the runtime `can()` guard (see src/server/auth).

export const PERMISSIONS = {
  // Content
  "content.view": { name: "View content", group: "Content" },
  "content.create": { name: "Create content", group: "Content" },
  "content.edit": { name: "Edit any content", group: "Content" },
  "content.edit_own": { name: "Edit own content", group: "Content" },
  "content.publish": { name: "Publish content", group: "Content" },
  "content.delete": { name: "Delete content", group: "Content" },
  "content_types.manage": { name: "Manage content types", group: "Content" },
  // Media
  "media.view": { name: "View media", group: "Media" },
  "media.upload": { name: "Upload media", group: "Media" },
  "media.delete": { name: "Delete media", group: "Media" },
  // Themes & layout
  "themes.manage": { name: "Manage themes", group: "Appearance" },
  "customizer.manage": { name: "Manage customizer", group: "Appearance" },
  "layout.manage": {
    name: "Manage headers/footers/areas",
    group: "Appearance",
  },
  "menus.manage": { name: "Manage menus", group: "Appearance" },
  // SEO & analytics
  "seo.manage": { name: "Manage SEO", group: "Marketing" },
  "analytics.view": { name: "View analytics", group: "Marketing" },
  // Users
  "users.view": { name: "View users", group: "Users" },
  "users.manage": { name: "Manage users & roles", group: "Users" },
  // System
  "settings.manage": { name: "Manage settings", group: "System" },
  "plugins.manage": { name: "Manage plugins", group: "System" },
} as const;

export type PermissionSlug = keyof typeof PERMISSIONS;

export const ROLES = {
  "super-admin": {
    name: "Super Admin",
    description: "Full, unrestricted access to everything.",
    // Super admin implicitly has all permissions (handled in can()).
    permissions: "*" as const,
  },
  admin: {
    name: "Administrator",
    description: "Manages the site, content, users, and settings.",
    permissions: Object.keys(PERMISSIONS) as PermissionSlug[],
  },
  editor: {
    name: "Editor",
    description: "Creates, edits, and publishes all content.",
    permissions: [
      "content.view",
      "content.create",
      "content.edit",
      "content.publish",
      "content.delete",
      "media.view",
      "media.upload",
      "media.delete",
      "menus.manage",
      "seo.manage",
      "analytics.view",
    ] as PermissionSlug[],
  },
  author: {
    name: "Author",
    description: "Creates and publishes their own content.",
    permissions: [
      "content.view",
      "content.create",
      "content.edit_own",
      "content.publish",
      "media.view",
      "media.upload",
      "seo.manage",
    ] as PermissionSlug[],
  },
  contributor: {
    name: "Contributor",
    description: "Writes content but cannot publish.",
    permissions: [
      "content.view",
      "content.create",
      "content.edit_own",
      "media.view",
      "media.upload",
    ] as PermissionSlug[],
  },
  subscriber: {
    name: "Subscriber",
    description: "Reads only; no admin capabilities.",
    permissions: [] as PermissionSlug[],
  },
} as const;

export type RoleSlug = keyof typeof ROLES;

export const SUPER_ADMIN_ROLE: RoleSlug = "super-admin";

/**
 * Pure permission check. Super Admin short-circuits to allow everything.
 * `userRoles` and `userPermissions` come from the resolved session.
 */
export function hasPermission(
  userRoles: string[],
  userPermissions: string[],
  permission: PermissionSlug,
): boolean {
  if (userRoles.includes(SUPER_ADMIN_ROLE)) return true;
  return userPermissions.includes(permission);
}
