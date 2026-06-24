export type UserGuardActor = {
  roles: string[];
};

export class UserManagementError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserManagementError";
  }
}

export function isSuperAdmin(actor: UserGuardActor): boolean {
  return actor.roles.includes("super-admin");
}

export function isSelfTarget(actorId: string, targetId: string): boolean {
  return actorId === targetId;
}

export function assertNotSelfTarget(
  actorId: string,
  targetId: string,
  action: string,
) {
  if (isSelfTarget(actorId, targetId)) {
    throw new UserManagementError(`You cannot ${action} your own account.`);
  }
}

export function shouldProtectLastSuperAdmin(
  current: { isActive: boolean; roleSlugs: string[] },
  next: { isActive: boolean; roleSlugs: string[] },
  otherActiveSuperAdmins: number,
) {
  const isCurrentlyActiveSuperAdmin =
    current.isActive && current.roleSlugs.includes("super-admin");
  const remainsActiveSuperAdmin =
    next.isActive && next.roleSlugs.includes("super-admin");
  return (
    isCurrentlyActiveSuperAdmin &&
    !remainsActiveSuperAdmin &&
    otherActiveSuperAdmins === 0
  );
}

export function assertSelfMutationSafe(
  actorId: string,
  targetId: string,
  next: { isActive: boolean; keepsAdminAccess: boolean },
) {
  if (!isSelfTarget(actorId, targetId)) return;
  if (!next.isActive) {
    throw new UserManagementError("You cannot deactivate your own account.");
  }
  if (!next.keepsAdminAccess) {
    throw new UserManagementError("You cannot remove your own admin access.");
  }
}
