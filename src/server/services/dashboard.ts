import "server-only";

import { db } from "@/lib/db";

// Data for the admin dashboard. Periods are whole UTC days ending today; the
// "previous" period is the same length immediately before it. Page views are
// stored in UTC, so day buckets are UTC dates.

export const DASHBOARD_RANGES = [7, 30] as const;
export type DashboardRange = (typeof DASHBOARD_RANGES)[number];

const DAY_MS = 24 * 60 * 60 * 1000;

function periodBounds(days: number) {
  const now = new Date();
  const todayUtc = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  const since = new Date(todayUtc - (days - 1) * DAY_MS);
  const prevSince = new Date(since.getTime() - days * DAY_MS);
  return { since, prevSince };
}

export type ContentSummary = {
  pages: { total: number; added: number };
  posts: { total: number; added: number };
  recent: {
    id: string;
    title: string;
    status: string;
    updatedAt: Date;
    typeSlug: string;
    typeLabel: string;
  }[];
};

export async function getContentSummary(days: number): Promise<ContentSummary> {
  const { since } = periodBounds(days);
  const [pages, pagesAdded, posts, postsAdded, recent] = await Promise.all([
    db.contentEntry.count({ where: { contentType: { slug: "page" } } }),
    db.contentEntry.count({
      where: { contentType: { slug: "page" }, createdAt: { gte: since } },
    }),
    db.contentEntry.count({ where: { contentType: { slug: "post" } } }),
    db.contentEntry.count({
      where: { contentType: { slug: "post" }, createdAt: { gte: since } },
    }),
    db.contentEntry.findMany({
      where: { status: { not: "TRASHED" } },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        status: true,
        updatedAt: true,
        contentType: { select: { slug: true, labelSingular: true } },
      },
    }),
  ]);

  return {
    pages: { total: pages, added: pagesAdded },
    posts: { total: posts, added: postsAdded },
    recent: recent.map((e) => ({
      id: e.id,
      title: e.title,
      status: e.status,
      updatedAt: e.updatedAt,
      typeSlug: e.contentType.slug,
      typeLabel: e.contentType.labelSingular,
    })),
  };
}

export type TrafficSummary = {
  visitors: { current: number; previous: number };
  leads: { current: number; previous: number };
  daily: { date: string; visitors: number }[]; // date = YYYY-MM-DD (UTC)
  topPages: { path: string; views: number; previousViews: number }[];
};

export async function getTrafficSummary(days: number): Promise<TrafficSummary> {
  const { since, prevSince } = periodBounds(days);

  const [visitorRows, dailyRows, leadsCurrent, leadsPrevious, top] =
    await Promise.all([
      db.$queryRaw<{ curr: bigint; prev: bigint }[]>`
        SELECT
          COUNT(DISTINCT CASE WHEN created_at >= ${since} THEN visitor_hash END) AS curr,
          COUNT(DISTINCT CASE WHEN created_at < ${since} THEN visitor_hash END) AS prev
        FROM page_views
        WHERE created_at >= ${prevSince}`,
      db.$queryRaw<{ day: Date | string; visitors: bigint }[]>`
        SELECT DATE(created_at) AS day, COUNT(DISTINCT visitor_hash) AS visitors
        FROM page_views
        WHERE created_at >= ${since}
        GROUP BY DATE(created_at)
        ORDER BY day`,
      db.formSubmission.count({
        where: { spam: false, createdAt: { gte: since } },
      }),
      db.formSubmission.count({
        where: { spam: false, createdAt: { gte: prevSince, lt: since } },
      }),
      db.pageView.groupBy({
        by: ["path"],
        where: { createdAt: { gte: since } },
        _count: { path: true },
        orderBy: { _count: { path: "desc" } },
        take: 5,
      }),
    ]);

  const previousTop =
    top.length > 0
      ? await db.pageView.groupBy({
          by: ["path"],
          where: {
            createdAt: { gte: prevSince, lt: since },
            path: { in: top.map((t) => t.path) },
          },
          _count: { path: true },
        })
      : [];
  const prevByPath = new Map(previousTop.map((p) => [p.path, p._count.path]));

  // Fill every day in the range so the chart has no gaps.
  const byDay = new Map(
    dailyRows.map((r) => [
      (r.day instanceof Date ? r.day.toISOString() : String(r.day)).slice(
        0,
        10,
      ),
      Number(r.visitors),
    ]),
  );
  const daily = Array.from({ length: days }, (_, i) => {
    const date = new Date(since.getTime() + i * DAY_MS)
      .toISOString()
      .slice(0, 10);
    return { date, visitors: byDay.get(date) ?? 0 };
  });

  return {
    visitors: {
      current: Number(visitorRows[0]?.curr ?? 0),
      previous: Number(visitorRows[0]?.prev ?? 0),
    },
    leads: { current: leadsCurrent, previous: leadsPrevious },
    daily,
    topPages: top.map((t) => ({
      path: t.path,
      views: t._count.path,
      previousViews: prevByPath.get(t.path) ?? 0,
    })),
  };
}
