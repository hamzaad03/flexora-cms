"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import {
  changeOwnPasswordAction,
  updateAccountAction,
} from "@/app/admin/(protected)/users/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AccountForm({
  name,
  email,
  roles,
}: {
  name: string;
  email: string;
  roles: string[];
}) {
  const [profilePending, startProfileTransition] = useTransition();
  const [passwordPending, startPasswordTransition] = useTransition();
  const [displayName, setDisplayName] = useState(name);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const saveProfile = () => {
    startProfileTransition(async () => {
      const res = await updateAccountAction({ name: displayName || null });
      if (!res.ok) {
        toast.error(res.error ?? "Failed to update account.");
        return;
      }
      toast.success("Account updated.");
    });
  };

  const savePassword = () => {
    startPasswordTransition(async () => {
      const res = await changeOwnPasswordAction({
        currentPassword,
        newPassword,
      });
      if (!res.ok) {
        toast.error(res.error ?? "Failed to change password.");
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      toast.success("Password changed.");
    });
  };

  return (
    <div className="grid max-w-4xl gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="account-name">Name</Label>
            <Input
              id="account-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={email} disabled />
          </div>
          <div className="space-y-2">
            <Label>Roles</Label>
            <div className="flex flex-wrap gap-2">
              {roles.map((role) => (
                <Badge key={role} variant="outline">
                  {role}
                </Badge>
              ))}
            </div>
          </div>
          <Button onClick={saveProfile} disabled={profilePending}>
            {profilePending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : null}
            Save profile
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="current-password">Current password</Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            onClick={savePassword}
            disabled={
              passwordPending ||
              !currentPassword ||
              newPassword.length < 8 ||
              currentPassword === newPassword
            }
          >
            {passwordPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : null}
            Change password
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
