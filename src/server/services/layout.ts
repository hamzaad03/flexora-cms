import "server-only";
import type { LayoutAreaType } from "@prisma/client";

import { db } from "@/lib/db";
import { renderLayoutArea } from "@/server/layout/render";
import type { LayoutRenderCtx } from "@/server/layout/registry";
import type { AreaSettings, LayoutContent } from "@/lib/layout-types";

export async function listAreas(type?: LayoutAreaType) {
  return db.layoutArea.findMany({
    where: type ? { type } : {},
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });
}

export async function getArea(id: string) {
  return db.layoutArea.findUnique({
    where: { id },
    include: { assignments: true },
  });
}

export async function createArea(input: {
  type: LayoutAreaType;
  name: string;
  key?: string | null;
}) {
  return db.layoutArea.create({
    data: {
      type: input.type,
      name: input.name,
      key: input.key ?? null,
      content: { rows: [] },
      settings: {},
    },
  });
}

export async function updateArea(
  id: string,
  input: {
    name?: string;
    status?: boolean;
    content?: LayoutContent;
    settings?: AreaSettings;
  },
) {
  return db.layoutArea.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.content !== undefined
        ? { content: input.content as object }
        : {}),
      ...(input.settings !== undefined
        ? { settings: input.settings as object }
        : {}),
    },
  });
}

export async function deleteArea(id: string) {
  await db.layoutArea.delete({ where: { id } });
}

/** Replace an area's assignment rules and default flag (atomic). */
export async function setAssignments(
  areaId: string,
  input: {
    isDefault: boolean;
    contentTypeIds: string[];
    entryIds: string[];
  },
) {
  const area = await db.layoutArea.findUnique({ where: { id: areaId } });
  if (!area) throw new Error("Area not found.");

  await db.$transaction([
    // Only one default per type.
    ...(input.isDefault
      ? [
          db.layoutArea.updateMany({
            where: { type: area.type, isDefault: true, id: { not: areaId } },
            data: { isDefault: false },
          }),
        ]
      : []),
    db.layoutArea.update({
      where: { id: areaId },
      data: { isDefault: input.isDefault },
    }),
    db.layoutAssignment.deleteMany({ where: { layoutAreaId: areaId } }),
    db.layoutAssignment.createMany({
      data: [
        ...input.contentTypeIds.map((contentTypeId) => ({
          layoutAreaId: areaId,
          contentTypeId,
          priority: 10,
        })),
        ...input.entryIds.map((entryId) => ({
          layoutAreaId: areaId,
          entryId,
          priority: 20,
        })),
      ],
    }),
  ]);
}

/** Resolve the area for a request: entry > content type > default. */
async function resolveAssignedArea(
  type: LayoutAreaType,
  contentTypeId: string | null,
  entryId: string | null,
) {
  if (entryId) {
    const a = await db.layoutAssignment.findFirst({
      where: { entryId, layoutArea: { type, status: true } },
      include: { layoutArea: true },
      orderBy: { priority: "desc" },
    });
    if (a) return a.layoutArea;
  }
  if (contentTypeId) {
    const a = await db.layoutAssignment.findFirst({
      where: {
        contentTypeId,
        entryId: null,
        layoutArea: { type, status: true },
      },
      include: { layoutArea: true },
      orderBy: { priority: "desc" },
    });
    if (a) return a.layoutArea;
  }
  return db.layoutArea.findFirst({
    where: { type, isDefault: true, status: true },
  });
}

/** Resolve + render a region (header/footer/area) to HTML for the theme. */
export async function renderRegion(
  type: LayoutAreaType,
  contentTypeId: string | null,
  entryId: string | null,
  ctx: LayoutRenderCtx,
): Promise<string> {
  const area = await resolveAssignedArea(type, contentTypeId, entryId);
  if (!area) return "";
  return renderLayoutArea(
    area.content as LayoutContent,
    (area.settings as AreaSettings) ?? {},
    ctx,
  );
}
