import { describe, expect, it } from "vitest";

import { hasPermission, ROLES, PERMISSIONS } from "@/lib/rbac";

describe("hasPermission", () => {
  it("grants everything to super-admin regardless of explicit permissions", () => {
    expect(hasPermission(["super-admin"], [], "users.manage")).toBe(true);
    expect(hasPermission(["super-admin"], [], "settings.manage")).toBe(true);
  });

  it("grants a permission the user explicitly has", () => {
    expect(
      hasPermission(["editor"], ["content.publish"], "content.publish"),
    ).toBe(true);
  });

  it("denies a permission the user does not have", () => {
    expect(hasPermission(["author"], ["content.create"], "users.manage")).toBe(
      false,
    );
  });

  it("denies everything to a user with no roles or permissions", () => {
    expect(hasPermission([], [], "content.view")).toBe(false);
  });
});

describe("RBAC definitions", () => {
  it("admin role references only known permission slugs", () => {
    const known = new Set(Object.keys(PERMISSIONS));
    const adminPerms = ROLES.admin.permissions as string[];
    for (const p of adminPerms) {
      expect(known.has(p)).toBe(true);
    }
  });

  it("super-admin uses the wildcard sentinel", () => {
    expect(ROLES["super-admin"].permissions).toBe("*");
  });
});
