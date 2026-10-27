"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Globe, Menu, Moon, Search, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import type { NavGroup } from "./nav-items";
import { Sidebar, type QuickLink } from "./sidebar";
import { UserMenu } from "./user-menu";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const noopSubscribe = () => () => {};

function SearchBox({ canSearch }: { canSearch: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  // Platform never changes; read it on the client, assume Mac during SSR.
  const isMac = useSyncExternalStore(
    noopSubscribe,
    () => /Mac|iPhone|iPad/.test(navigator.platform),
    () => true,
  );

  useEffect(() => {
    // ⌘K / Ctrl+K focuses the search box from anywhere in the admin.
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!canSearch) return <div className="flex-1" />;

  return (
    <form
      action="/admin/search"
      method="get"
      role="search"
      className="relative w-full max-w-md flex-1"
    >
      <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
      <label htmlFor="admin-search" className="sr-only">
        Search content
      </label>
      <input
        ref={inputRef}
        id="admin-search"
        name="q"
        type="search"
        placeholder="Search content…"
        autoComplete="off"
        className="bg-muted/70 border-input focus-visible:border-ring focus-visible:ring-ring/40 placeholder:text-muted-foreground h-10 w-full rounded-lg border pr-14 pl-9 text-sm outline-none focus-visible:ring-3"
      />
      <kbd className="text-muted-foreground bg-card pointer-events-none absolute top-1/2 right-2.5 hidden -translate-y-1/2 rounded border px-1.5 py-0.5 font-sans text-[0.68rem] sm:inline-block">
        {isMac ? "⌘" : "Ctrl"} K
      </kbd>
    </form>
  );
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      className="rounded-lg"
      aria-label="Toggle dark mode"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      {/* Both icons render; CSS shows the right one, so SSR never mismatches. */}
      <Moon className="size-[1.1rem] dark:hidden" />
      <Sun className="hidden size-[1.1rem] dark:block" />
    </Button>
  );
}

export function Topbar({
  groups,
  quickLinks,
  user,
  canSearch,
  canManageSettings,
}: {
  groups: NavGroup[];
  quickLinks: QuickLink[];
  user: { name?: string | null; email: string; roles: string[] };
  canSearch: boolean;
  canManageSettings: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-card/85 supports-[backdrop-filter]:bg-card/70 sticky top-0 z-30 flex h-16 items-center gap-3 border-b px-4 backdrop-blur md:px-6">
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetTrigger
          render={(props) => (
            <Button
              {...props}
              variant="ghost"
              size="icon"
              className="rounded-lg md:hidden"
              aria-label="Open navigation"
            >
              <Menu className="size-5" />
            </Button>
          )}
        />
        <SheetContent side="left" className="bg-sidebar w-72 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Sidebar
            groups={groups}
            quickLinks={quickLinks}
            onNavigate={() => setMenuOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <SearchBox canSearch={canSearch} />

      <div className="ml-auto flex items-center gap-1.5">
        <Button
          asChild
          variant="outline"
          className="hidden h-9 rounded-lg px-3 sm:inline-flex"
        >
          <a href="/" target="_blank" rel="noopener noreferrer">
            <Globe className="size-4" />
            View website
          </a>
        </Button>
        <ThemeToggle />
        <div className="bg-border mx-1 hidden h-7 w-px sm:block" />
        <UserMenu
          name={user.name}
          email={user.email}
          roles={user.roles}
          canManageSettings={canManageSettings}
          variant="header"
        />
      </div>
    </header>
  );
}
