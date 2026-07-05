"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { icons } from "lucide-react";

import type { NavGroup } from "./nav-items";
import { cn } from "@/lib/utils";

function Icon({ name }: { name: string }) {
  // Map kebab-case nav icon names to lucide's PascalCase exports.
  const key = name
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join("") as keyof typeof icons;
  const LucideIcon = icons[key] ?? icons.Circle;
  return <LucideIcon className="size-4 shrink-0" />;
}

export function Sidebar({ groups }: { groups: NavGroup[] }) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <nav className="flex flex-col gap-4 p-3">
      {groups.map((group) => (
        <div key={group.heading} className="flex flex-col gap-1">
          <p className="text-muted-foreground px-2 text-xs font-medium uppercase tracking-wide">
            {group.heading}
          </p>
          {group.items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                isActive(item.href)
                  ? "bg-muted text-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              <Icon name={item.icon} />
              {item.label}
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );
}
