import "server-only";

import { db } from "@/lib/db";

export type AnalyticsSummary = {
  views: number;
  visitors: number;
  topPages: { label: string; count: number }[];
  referrers: { label: string; count: number }[];
  devices: { label: string; count: number }[];
  countries: { label: string; count: number }[];
};

/** Aggregate page_views over the last `days` days. */
export async function getAnalytics(days = 30): Promise<AnalyticsSummary> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const where = { createdAt: { gte: since } };

  const [views, visitorsRows, pages, referrers, devices, countries] =
    await Promise.all([
      db.pageView.count({ where }),
      db.pageView.findMany({
        where,
        distinct: ["visitorHash"],
        select: { visitorHash: true },
      }),
      db.pageView.groupBy({
        by: ["path"],
        where,
        _count: { path: true },
        orderBy: { _count: { path: "desc" } },
        take: 10,
      }),
      db.pageView.groupBy({
        by: ["referrer"],
        where: { ...where, referrer: { not: null } },
        _count: { referrer: true },
        orderBy: { _count: { referrer: "desc" } },
        take: 10,
      }),
      db.pageView.groupBy({
        by: ["device"],
        where,
        _count: { device: true },
        orderBy: { _count: { device: "desc" } },
      }),
      db.pageView.groupBy({
        by: ["country"],
        where: { ...where, country: { not: null } },
        _count: { country: true },
        orderBy: { _count: { country: "desc" } },
        take: 10,
      }),
    ]);

  return {
    views,
    visitors: visitorsRows.length,
    topPages: pages.map((p) => ({ label: p.path, count: p._count.path })),
    referrers: referrers.map((r) => ({
      label: r.referrer ?? "—",
      count: r._count.referrer,
    })),
    devices: devices.map((d) => ({
      label: d.device ?? "unknown",
      count: d._count.device,
    })),
    countries: countries.map((c) => ({
      label: c.country ?? "—",
      count: c._count.country,
    })),
  };
}
