"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { icons } from "lucide-react";

import type { NavGroup, NavItem } from "./nav-items";
import { FlexoraLogo } from "@/components/brand/flexora-logo";
import { cn } from "@/lib/utils";

function Icon({ name, className }: { name: string; className?: string }) {
  // Map kebab-case nav icon names to lucide's PascalCase exports.
  const key = name
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join("") as keyof typeof icons;
  // `icons` holds canonical names only (e.g. "chart-column", not the
  // "bar-chart-3" alias); unknown names fall back to a circle.
  const LucideIcon = icons[key] ?? icons.Circle;
  return <LucideIcon className={cn("size-[1.05rem] shrink-0", className)} />;
}

export type QuickLink = NavItem & { external?: boolean };

export function Sidebar({
  groups,
  quickLinks = [],
  onNavigate,
}: {
  groups: NavGroup[];
  quickLinks?: QuickLink[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center px-5">
        <Link href="/admin" onClick={onNavigate} aria-label="FlexoraCMS home">
          <FlexoraLogo />
        </Link>
      </div>

      <nav
        aria-label="Admin"
        className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-3 pb-4"
      >
        {groups.map((group) => (
          <div key={group.heading} className="flex flex-col gap-0.5">
            <p className="text-muted-foreground/80 px-3 pb-1 text-[0.68rem] font-semibold tracking-wider uppercase">
              {group.heading}
            </p>
            {group.items.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon
                    name={item.icon}
                    className={active ? "text-primary dark:text-white" : ""}
                  />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}

        {quickLinks.length > 0 ? (
          <div className="flex flex-col gap-0.5 border-t pt-4">
            <p className="text-muted-foreground/80 px-3 pb-1 text-[0.68rem] font-semibold tracking-wider uppercase">
              Quick access
            </p>
            {quickLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noopener noreferrer" : undefined}
                className="text-muted-foreground hover:bg-muted hover:text-foreground flex items-center gap-3 rounded-lg px-3 py-1.5 text-[0.8rem] transition-colors"
              >
                <Icon name={item.icon} className="size-4" />
                {item.label}
              </Link>
            ))}
          </div>
        ) : null}
      </nav>
    </div>
  );
}
