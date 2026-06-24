import "server-only";

import { db } from "@/lib/db";

export async function listRedirects() {
  return db.redirect.findMany({ orderBy: { createdAt: "desc" } });
}

export async function createRedirect(from: string, to: string, code: number) {
  const f = from.startsWith("/") ? from : `/${from}`;
  return db.redirect.upsert({
    where: { from: f },
    update: { to, code },
    create: { from: f, to, code },
  });
}

export async function deleteRedirect(id: string) {
  await db.redirect.delete({ where: { id } });
}

/** Look up a redirect for a path and bump its hit counter. */
export async function matchRedirect(path: string) {
  const r = await db.redirect.findUnique({ where: { from: path } });
  if (r) {
    await db.redirect.update({
      where: { id: r.id },
      data: { hits: { increment: 1 } },
    });
  }
  return r;
}
