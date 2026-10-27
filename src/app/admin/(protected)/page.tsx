import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  FilePlus2,
  FileText,
  ImageUp,
  Newspaper,
  PenSquare,
  Settings,
  TrendingUp,
  TriangleAlert,
  Users,
  type LucideIcon,
} from "lucide-react";

import { requireUser } from "@/server/auth/guard";
import { hasPermission } from "@/lib/rbac";
import { logger } from "@/lib/logger";
import {
  DASHBOARD_RANGES,
  getContentSummary,
  getTrafficSummary,
  type ContentSummary,
  type DashboardRange,
  type TrafficSummary,
} from "@/server/services/dashboard";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { VisitorsChart } from "@/components/admin/dashboard/visitors-chart";
import {
  Delta,
  StatusBadge,
  formatCompact,
  formatRelative,
  pctChange,
} from "@/components/admin/dashboard/format";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

function parseRange(raw: string | string[] | undefined): DashboardRange {
  const n = Number(Array.isArray(raw) ? raw[0] : raw);
  return (DASHBOARD_RANGES as readonly number[]).includes(n)
    ? (n as DashboardRange)
    : 7;
}

function Panel({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("gap-4 rounded-2xl p-5 shadow-xs", className)}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </Card>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
  footer,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone: "blue" | "violet" | "cyan" | "purple";
  footer: React.ReactNode;
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300",
    violet:
      "bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300",
    cyan: "bg-cyan-50 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-300",
    purple:
      "bg-purple-50 text-purple-600 dark:bg-purple-500/15 dark:text-purple-300",
  };
  return (
    <Card className="gap-3 rounded-2xl p-5 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-muted-foreground text-sm font-medium">{label}</p>
          <p className="mt-1.5 text-3xl font-bold tracking-tight tabular-nums">
            {value}
          </p>
        </div>
        <span
          className={cn(
            "grid size-11 shrink-0 place-items-center rounded-xl",
            tones[tone],
          )}
        >
          <Icon className="size-5" aria-hidden="true" />
        </span>
      </div>
      <div>{footer}</div>
    </Card>
  );
}

function RangeToggle({ range }: { range: DashboardRange }) {
  return (
    <div
      role="group"
      aria-label="Date range"
      className="bg-card inline-flex rounded-lg border p-0.5 shadow-xs"
    >
      {DASHBOARD_RANGES.map((r) => (
        <Link
          key={r}
          href={r === 7 ? "/admin" : `/admin?range=${r}`}
          aria-current={r === range ? "true" : undefined}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            r === range
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Last {r} days
        </Link>
      ))}
    </div>
  );
}

type QuickAction = {
  label: string;
  hint: string;
  href: string;
  icon: LucideIcon;
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string | string[] }>;
}) {
  const user = await requireUser();
  const range = parseRange((await searchParams).range);
  const can = (p: Parameters<typeof hasPermission>[2]) =>
    hasPermission(user.roles, user.permissions, p);

  const canContent = can("content.view");
  const canAnalytics = can("analytics.view");

  let content: ContentSummary | null = null;
  let traffic: TrafficSummary | null = null;
  let loadError = false;
  try {
    [content, traffic] = await Promise.all([
      canContent ? getContentSummary(range) : null,
      canAnalytics ? getTrafficSummary(range) : null,
    ]);
  } catch (err) {
    loadError = true;
    logger.error({ err }, "dashboard data failed to load");
  }

  const firstName = user.name?.trim().split(/\s+/)[0];
  const periodLabel = `vs previous ${range} days`;

  const conversion = traffic
    ? {
        current:
          traffic.visitors.current > 0
            ? (traffic.leads.current / traffic.visitors.current) * 100
            : 0,
        previous:
          traffic.visitors.previous > 0
            ? (traffic.leads.previous / traffic.visitors.previous) * 100
            : null,
      }
    : null;

  const quickActions: QuickAction[] = [
    can("content.create") && {
      label: "Add new page",
      hint: "Create a new page",
      href: "/admin/content/page/new",
      icon: FilePlus2,
    },
    can("content.create") && {
      label: "Add new post",
      hint: "Write a blog post",
      href: "/admin/content/post/new",
      icon: PenSquare,
    },
    can("media.upload") && {
      label: "Upload media",
      hint: "Add files to the library",
      href: "/admin/media",
      icon: ImageUp,
    },
    can("settings.manage") && {
      label: "Settings",
      hint: "Manage your site",
      href: "/admin/settings",
      icon: Settings,
    },
  ].filter(Boolean) as QuickAction[];

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-[1.7rem]">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Welcome back{firstName ? `, ${firstName}` : ""}! Here&apos;s
            what&apos;s happening with your website.
          </p>
        </div>
        {canAnalytics || canContent ? <RangeToggle range={range} /> : null}
      </div>

      {loadError ? (
        <Card className="flex-row items-center gap-3 rounded-2xl border-amber-300 p-4 ring-amber-500/30">
          <TriangleAlert className="text-warning size-5 shrink-0" />
          <p className="text-sm">
            Dashboard data couldn&apos;t be loaded right now. Check the database
            connection and server logs, then refresh.
          </p>
        </Card>
      ) : null}

      {content || traffic ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {content ? (
            <>
              <StatCard
                label="Total pages"
                value={formatCompact(content.pages.total)}
                icon={FileText}
                tone="blue"
                footer={
                  <span className="text-muted-foreground text-xs">
                    <span className="text-foreground font-semibold">
                      +{content.pages.added}
                    </span>{" "}
                    added in the last {range} days
                  </span>
                }
              />
              <StatCard
                label="Blog posts"
                value={formatCompact(content.posts.total)}
                icon={Newspaper}
                tone="violet"
                footer={
                  <span className="text-muted-foreground text-xs">
                    <span className="text-foreground font-semibold">
                      +{content.posts.added}
                    </span>{" "}
                    added in the last {range} days
                  </span>
                }
              />
            </>
          ) : null}
          {traffic && conversion ? (
            <>
              <StatCard
                label="Visitors"
                value={formatCompact(traffic.visitors.current)}
                icon={Users}
                tone="cyan"
                footer={
                  <Delta
                    value={pctChange(
                      traffic.visitors.current,
                      traffic.visitors.previous,
                    )}
                    suffix={periodLabel}
                  />
                }
              />
              <StatCard
                label="Conversion rate"
                value={`${conversion.current.toFixed(1)}%`}
                icon={TrendingUp}
                tone="purple"
                footer={
                  <span className="flex flex-col gap-0.5">
                    <Delta
                      value={
                        conversion.previous === null
                          ? null
                          : conversion.current - conversion.previous
                      }
                      unit="pts"
                      suffix={periodLabel}
                    />
                    <span className="text-muted-foreground text-[0.7rem]">
                      {traffic.leads.current} form lead
                      {traffic.leads.current === 1 ? "" : "s"} ÷ visitors
                    </span>
                  </span>
                }
              />
            </>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-5">
        {traffic ? (
          <Panel
            title="Website analytics"
            className={quickActions.length ? "lg:col-span-3" : "lg:col-span-5"}
            action={
              <Link
                href="/admin/analytics"
                className="text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline"
              >
                Full report <ArrowRight className="size-3.5" />
              </Link>
            }
          >
            <p className="text-muted-foreground -mt-2 text-xs">
              Unique visitors per day (UTC)
            </p>
            <VisitorsChart data={traffic.daily} />
          </Panel>
        ) : null}

        {quickActions.length > 0 ? (
          <Panel
            title="Quick actions"
            className={traffic ? "lg:col-span-2" : "lg:col-span-5"}
          >
            <div className="grid flex-1 grid-cols-2 gap-3">
              {quickActions.map((a) => (
                <Link
                  key={a.label}
                  href={a.href}
                  className="group hover:border-primary/40 hover:bg-accent/50 flex flex-col gap-3 rounded-xl border p-4 transition-colors"
                >
                  <span className="bg-accent text-primary grid size-10 place-items-center rounded-lg transition-transform group-hover:scale-105 dark:text-blue-300">
                    <a.icon className="size-5" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">
                      {a.label}
                    </span>
                    <span className="text-muted-foreground block text-xs">
                      {a.hint}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </Panel>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {content ? (
          <Panel
            title="Recent content"
            className={traffic ? "lg:col-span-3" : "lg:col-span-5"}
            action={
              <Link
                href="/admin/content/page"
                className="text-primary text-sm font-medium hover:underline"
              >
                View all
              </Link>
            }
          >
            {content.recent.length === 0 ? (
              <p className="text-muted-foreground py-6 text-center text-sm">
                No content yet.{" "}
                <Link
                  href="/admin/content/page/new"
                  className="text-primary underline"
                >
                  Create your first page
                </Link>
                .
              </p>
            ) : (
              <div className="-mx-5 overflow-x-auto">
                <table className="w-full min-w-[520px] text-sm">
                  <thead>
                    <tr className="text-muted-foreground border-b text-left text-xs">
                      <th scope="col" className="px-5 pb-2 font-medium">
                        Title
                      </th>
                      <th scope="col" className="px-2 pb-2 font-medium">
                        Type
                      </th>
                      <th scope="col" className="px-2 pb-2 font-medium">
                        Status
                      </th>
                      <th
                        scope="col"
                        className="px-5 pb-2 text-right font-medium"
                      >
                        Updated
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {content.recent.map((e) => (
                      <tr
                        key={e.id}
                        className="hover:bg-muted/50 transition-colors"
                      >
                        <td className="px-5 py-3">
                          <Link
                            href={`/admin/content/${e.typeSlug}/${e.id}`}
                            className="flex items-center gap-3 font-medium hover:underline"
                          >
                            <span className="bg-accent text-primary grid size-8 shrink-0 place-items-center rounded-lg dark:text-blue-300">
                              <FileText className="size-4" aria-hidden="true" />
                            </span>
                            <span className="truncate">{e.title}</span>
                          </Link>
                        </td>
                        <td className="text-muted-foreground px-2 py-3">
                          {e.typeLabel}
                        </td>
                        <td className="px-2 py-3">
                          <StatusBadge status={e.status} />
                        </td>
                        <td className="text-muted-foreground px-5 py-3 text-right whitespace-nowrap">
                          {formatRelative(e.updatedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        ) : null}

        {traffic ? (
          <Panel
            title="Top pages"
            className={content ? "lg:col-span-2" : "lg:col-span-5"}
            action={
              <BarChart3
                className="text-muted-foreground size-4"
                aria-hidden="true"
              />
            }
          >
            {traffic.topPages.length === 0 ? (
              <p className="text-muted-foreground py-6 text-center text-sm">
                No page views in the last {range} days.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground border-b text-left text-xs">
                    <th scope="col" className="pb-2 font-medium">
                      Page
                    </th>
                    <th scope="col" className="pb-2 text-right font-medium">
                      Views
                    </th>
                    <th scope="col" className="pb-2 text-right font-medium">
                      Change
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {traffic.topPages.map((p) => (
                    <tr key={p.path}>
                      <td className="max-w-0 py-3 pr-3">
                        <span
                          className="block truncate font-medium"
                          title={p.path}
                        >
                          {p.path}
                        </span>
                      </td>
                      <td className="py-3 text-right tabular-nums">
                        {formatCompact(p.views)}
                      </td>
                      <td className="py-3 pl-3 text-right">
                        <Delta
                          value={pctChange(p.views, p.previousViews)}
                          emptyLabel="New"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Panel>
        ) : null}
      </div>
    </div>
  );
}
