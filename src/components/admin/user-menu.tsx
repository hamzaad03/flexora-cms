"use client";

import {
  ChevronDown,
  ChevronsUpDown,
  ExternalLink,
  LayoutDashboard,
  Loader2,
  LogOut,
  Settings,
  User,
} from "lucide-react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { logout } from "@/server/auth/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

function initialsFor(name: string | null | undefined, email: string) {
  const source = (name?.trim() || email).replace(/@.*/, "");
  return source
    .split(/[\s._-]+/)
    .filter(Boolean)
    .map((p) => p.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatRole(role: string | undefined) {
  if (!role) return "Team member";
  return role
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function UserMenu({
  name,
  email,
  roles = [],
  canManageSettings = false,
  variant = "icon",
}: {
  name?: string | null;
  email: string;
  roles?: string[];
  canManageSettings?: boolean;
  variant?: "icon" | "sidebar" | "header";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const displayName = name?.trim() || "Account";
  const initials = initialsFor(name, email);
  const role = formatRole(roles[0]);

  const signOut = () => {
    startTransition(async () => {
      await logout();
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={(props) =>
          variant === "sidebar" ? (
            <button
              {...props}
              type="button"
              className={cn(
                "hover:bg-muted/70 aria-expanded:bg-muted/70 flex w-full items-center gap-3 rounded-lg p-2 text-left outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
              )}
            >
              <Avatar size="lg">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {displayName}
                </span>
                <span className="text-muted-foreground block truncate text-xs">
                  {email}
                </span>
              </span>
              <ChevronsUpDown className="text-muted-foreground size-4" />
            </button>
          ) : variant === "header" ? (
            <button
              {...props}
              type="button"
              aria-label="Open account menu"
              className="hover:bg-muted aria-expanded:bg-muted focus-visible:ring-ring/50 flex items-center gap-2.5 rounded-lg py-1 pr-2 pl-1 text-left outline-none transition-colors focus-visible:ring-3"
            >
              <Avatar className="size-9">
                <AvatarFallback className="bg-gradient-to-br from-[#2563EB] to-[#8B5CF6] text-xs font-semibold text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden min-w-0 leading-tight lg:block">
                <span className="block max-w-36 truncate text-sm font-semibold">
                  {displayName}
                </span>
                <span className="text-muted-foreground block max-w-36 truncate text-xs">
                  {role}
                </span>
              </span>
              <ChevronDown className="text-muted-foreground hidden size-4 lg:block" />
            </button>
          ) : (
            <Button
              {...props}
              variant="ghost"
              size="icon"
              className="rounded-full"
              aria-label="Open account menu"
            >
              <Avatar className="size-8">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </Button>
          )
        }
      />
      <DropdownMenuContent
        align={variant === "sidebar" ? "start" : "end"}
        sideOffset={8}
        side={variant === "sidebar" ? "top" : "bottom"}
        className="w-64"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="p-2">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <span className="block truncate text-sm font-medium text-foreground">
                  {displayName}
                </span>
                <span className="text-muted-foreground block truncate text-xs">
                  {email}
                </span>
                <span className="text-muted-foreground block truncate text-xs">
                  {role}
                </span>
              </div>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/admin/account")}>
          <User className="size-4" />
          Account
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/admin")}>
          <LayoutDashboard className="size-4" />
          Dashboard
        </DropdownMenuItem>
        {canManageSettings ? (
          <DropdownMenuItem onClick={() => router.push("/admin/settings")}>
            <Settings className="size-4" />
            Settings
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem
          onClick={() => {
            window.open("/", "_blank", "noopener,noreferrer");
          }}
        >
          <ExternalLink className="size-4" />
          View site
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          disabled={pending}
          onClick={signOut}
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <LogOut className="size-4" />
          )}
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
