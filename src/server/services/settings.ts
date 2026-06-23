import "server-only";

import { db } from "@/lib/db";

/** All site settings as a flat key -> value map. */
export async function getSettings(): Promise<Record<string, unknown>> {
  const rows = await db.setting.findMany();
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function getSetting<T = unknown>(
  key: string,
  fallback?: T,
): Promise<T | undefined> {
  const row = await db.setting.findUnique({ where: { key } });
  return (row?.value as T) ?? fallback;
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  await db.setting.upsert({
    where: { key },
    update: { value: value as object },
    create: { key, value: value as object },
  });
}
