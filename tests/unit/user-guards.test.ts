import { describe, expect, it } from "vitest";

import {
  assertNotSelfTarget,
  assertSelfMutationSafe,
  isSelfTarget,
  isSuperAdmin,
  shouldProtectLastSuperAdmin,
  UserManagementError,
} from "@/lib/user-guards";

describe("user management guards", () => {
  it("identifies Super Admin actors", () => {
    expect(isSuperAdmin({ roles: ["super-admin"] })).toBe(true);
    expect(isSuperAdmin({ roles: ["admin"] })).toBe(false);
  });

  it("detects self-targeted actions", () => {
    expect(isSelfTarget("u1", "u1")).toBe(true);
    expect(isSelfTarget("u1", "u2")).toBe(false);
  });

  it("blocks self delete-style actions", () => {
    expect(() => assertNotSelfTarget("u1", "u1", "delete")).toThrow(
      UserManagementError,
    );
    expect(() => assertNotSelfTarget("u1", "u2", "delete")).not.toThrow();
  });

  it("blocks removing the only active Super Admin", () => {
    expect(
      shouldProtectLastSuperAdmin(
        { isActive: true, roleSlugs: ["super-admin"] },
        { isActive: false, roleSlugs: ["super-admin"] },
        0,
      ),
    ).toBe(true);
    expect(
      shouldProtectLastSuperAdmin(
        { isActive: true, roleSlugs: ["super-admin"] },
        { isActive: false, roleSlugs: ["super-admin"] },
        1,
      ),
    ).toBe(false);
  });

  it("allows an active Super Admin to remain active with the role", () => {
    expect(
      shouldProtectLastSuperAdmin(
        { isActive: true, roleSlugs: ["super-admin"] },
        { isActive: true, roleSlugs: ["super-admin"] },
        0,
      ),
    ).toBe(false);
  });

  it("blocks self deactivation and self admin-access removal", () => {
    expect(() =>
      assertSelfMutationSafe("u1", "u1", {
        isActive: false,
        keepsAdminAccess: true,
      }),
    ).toThrow("deactivate");
    expect(() =>
      assertSelfMutationSafe("u1", "u1", {
        isActive: true,
        keepsAdminAccess: false,
      }),
    ).toThrow("admin access");
    expect(() =>
      assertSelfMutationSafe("u1", "u2", {
        isActive: false,
        keepsAdminAccess: false,
      }),
    ).not.toThrow();
  });
});
