import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

import { cn } from "@/lib/utils";

// Small presentational helpers shared by the dashboard and search pages.
// Server-safe (no hooks).

const compact = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatCompact(n: number) {
  return n < 1000 ? String(n) : compact.format(n);
}

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 3600],
  ["month", 30 * 24 * 3600],
  ["week", 7 * 24 * 3600],
  ["day", 24 * 3600],
  ["hour", 3600],
  ["minute", 60],
];

export function formatRelative(date: Date, now = Date.now()) {
  const seconds = Math.round((date.getTime() - now) / 1000);
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) {
      return rtf.format(Math.round(seconds / size), unit);
    }
  }
  return "just now";
}

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  PUBLISHED: {
    label: "Published",
    className:
      "bg-emerald-50 text-emerald-700 ring-emerald-600/15 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/20",
  },
  DRAFT: {
    label: "Draft",
    className:
      "bg-amber-50 text-amber-700 ring-amber-600/15 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/20",
  },
  SCHEDULED: {
    label: "Scheduled",
    className:
      "bg-blue-50 text-blue-700 ring-blue-600/15 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-400/20",
  },
  TRASHED: {
    label: "Trashed",
    className:
      "bg-slate-100 text-slate-600 ring-slate-500/15 dark:bg-slate-500/10 dark:text-slate-300 dark:ring-slate-400/20",
  },
};

export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.DRAFT;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        style.className,
      )}
    >
      {style.label}
    </span>
  );
}

/**
 * Period-over-period change. `value` is a percentage (or percentage points
 * when `unit` is "pts"); null means there is no comparable previous value.
 */
export function Delta({
  value,
  unit = "%",
  suffix,
  emptyLabel = "No previous data",
}: {
  value: number | null;
  unit?: "%" | "pts";
  suffix?: string;
  emptyLabel?: string;
}) {
  if (value === null || !Number.isFinite(value)) {
    return <span className="text-muted-foreground text-xs">{emptyLabel}</span>;
  }
  const rounded = Math.round(value * 10) / 10;
  const dir = rounded > 0 ? "up" : rounded < 0 ? "down" : "flat";
  const Icon =
    dir === "up" ? ArrowUpRight : dir === "down" ? ArrowDownRight : Minus;
  const amount = `${Math.abs(rounded)}${unit === "%" ? "%" : " pts"}`;

  return (
    <span className="inline-flex items-center gap-1 text-xs">
      <span
        className={cn(
          "inline-flex items-center gap-0.5 font-semibold",
          dir === "up" && "text-success",
          dir === "down" && "text-destructive",
          dir === "flat" && "text-muted-foreground",
        )}
      >
        <Icon className="size-3.5" aria-hidden="true" />
        <span className="sr-only">
          {dir === "up" ? "Up" : dir === "down" ? "Down" : "No change"}
        </span>
        {amount}
      </span>
      {suffix ? <span className="text-muted-foreground">{suffix}</span> : null}
    </span>
  );
}

/** Percent change from `prev` to `curr`; null when there's no baseline. */
export function pctChange(curr: number, prev: number): number | null {
  if (prev === 0) return curr === 0 ? 0 : null;
  return ((curr - prev) / prev) * 100;
}
