import "server-only";
import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { hasPermission } from "@/lib/rbac";
import {
  parseBuilderDocument,
  type BuilderDocument,
} from "@/lib/builder/document";
import { sanitizeRichText } from "@/lib/sanitize";
import type { SessionUser } from "@/server/auth/guard";

export class BuilderAccessError extends Error {
  constructor(message = "You cannot edit this entry.") {
    super(message);
    this.name = "BuilderAccessError";
  }
}

type BuilderEntry = NonNullable<Awaited<ReturnType<typeof findBuilderEntry>>>;

async function findBuilderEntry(id: string) {
  return db.contentEntry.findUnique({
    where: { id },
    include: {
      contentType: { select: { slug: true, labelSingular: true } },
      author: { select: { id: true, name: true, email: true } },
    },
  });
}

export function canEditBuilderEntry(
  user: SessionUser,
  entry: Pick<BuilderEntry, "authorId">,
) {
  const canEditAny = hasPermission(
    user.roles,
    user.permissions,
    "content.edit",
  );
  const canEditOwn =
    hasPermission(user.roles, user.permissions, "content.edit_own") &&
    entry.authorId === user.id;
  return canEditAny || canEditOwn;
}

export async function getBuilderEntryForEditor(id: string, user: SessionUser) {
  const entry = await findBuilderEntry(id);
  if (!entry) return null;
  if (!canEditBuilderEntry(user, entry)) throw new BuilderAccessError();
  return {
    entry,
    document: parseBuilderDocument(entry.contentJson),
  };
}

export async function saveBuilderDocument(
  id: string,
  document: BuilderDocument,
  user: SessionUser,
) {
  const entry = await findBuilderEntry(id);
  if (!entry) throw new Error("Entry not found.");
  if (!canEditBuilderEntry(user, entry)) throw new BuilderAccessError();

  return db.contentEntry.update({
    where: { id },
    data: {
      contentJson: sanitizeBuilderDocument(
        document,
      ) as unknown as Prisma.InputJsonValue,
    },
  });
}

function sanitizeBuilderDocument(document: BuilderDocument): BuilderDocument {
  return {
    ...document,
    sections: document.sections.map((section) => ({
      ...section,
      children: section.children.map((container) => ({
        ...container,
        children: container.children.map((block) => ({
          ...block,
          props: { ...block.props, html: sanitizeRichText(block.props.html) },
        })),
      })),
    })),
  };
}
