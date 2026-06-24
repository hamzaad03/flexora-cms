"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import {
  createUserAction,
  resetUserPasswordAction,
  updateUserAction,
} from "@/app/admin/(protected)/users/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export type RoleOption = {
  slug: string;
  name: string;
  description: string | null;
  isSystem: boolean;
};

export type UserFormData = {
  id?: string;
  name: string;
  email: string;
  isActive: boolean;
  roles: string[];
};

function toggleRole(roles: string[], slug: string, checked: boolean) {
  return checked
    ? Array.from(new Set([...roles, slug]))
    : roles.filter((r) => r !== slug);
}

export function UserForm({
  user,
  roles,
  canAssignSuperAdmin,
}: {
  user?: UserFormData;
  roles: RoleOption[];
  canAssignSuperAdmin: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const isNew = !user?.id;
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [isActive, setIsActive] = useState(user?.isActive ?? true);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(
    user?.roles ?? ["subscriber"],
  );
  const includesLockedSuperAdmin =
    selectedRoles.includes("super-admin") && !canAssignSuperAdmin;

  const save = () => {
    const payload = {
      name: name || null,
      email,
      ...(isNew ? { password } : {}),
      isActive,
      roles: selectedRoles,
    };
    startTransition(async () => {
      const res = isNew
        ? await createUserAction(payload)
        : await updateUserAction(user.id!, payload);
      if (!res.ok) {
        toast.error(res.error ?? "Save failed.");
        return;
      }
      toast.success("Saved.");
      if (isNew && res.id) router.push(`/admin/users/${res.id}`);
      else router.refresh();
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="max-w-2xl space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        {isNew ? (
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Roles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {roles.map((role) => {
              const lockedSuperAdmin =
                role.slug === "super-admin" && !canAssignSuperAdmin;
              return (
                <label
                  key={role.slug}
                  className="flex items-start gap-3 rounded-md border p-3 text-sm"
                >
                  <input
                    type="checkbox"
                    className="mt-1 size-4"
                    checked={selectedRoles.includes(role.slug)}
                    disabled={lockedSuperAdmin}
                    onChange={(e) =>
                      setSelectedRoles((current) =>
                        toggleRole(current, role.slug, e.target.checked),
                      )
                    }
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 font-medium">
                      {role.name}
                      {role.isSystem ? (
                        <Badge variant="outline">system</Badge>
                      ) : null}
                    </span>
                    <span className="text-muted-foreground block">
                      {role.description || role.slug}
                    </span>
                  </span>
                </label>
              );
            })}
            {includesLockedSuperAdmin ? (
              <p className="text-muted-foreground text-xs">
                Only a Super Admin can edit Super Admin assignments.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">Active account</Label>
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
            <Button
              onClick={save}
              disabled={
                pending ||
                !email ||
                selectedRoles.length === 0 ||
                (isNew && password.length < 8) ||
                includesLockedSuperAdmin
              }
              className="w-full"
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              {isNew ? "Create user" : "Save changes"}
            </Button>
          </CardContent>
        </Card>

        {!isNew && user?.id ? <PasswordReset userId={user.id} /> : null}
      </div>
    </div>
  );
}

function PasswordReset({ userId }: { userId: string }) {
  const [pending, startTransition] = useTransition();
  const [password, setPassword] = useState("");

  const save = () => {
    startTransition(async () => {
      const res = await resetUserPasswordAction(userId, { password });
      if (!res.ok) {
        toast.error(res.error ?? "Password reset failed.");
        return;
      }
      setPassword("");
      toast.success("Password updated.");
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Password</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="new-password">New password</Label>
          <Input
            id="new-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          onClick={save}
          disabled={pending || password.length < 8}
          className="w-full"
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : null}
          Reset password
        </Button>
      </CardContent>
    </Card>
  );
}
