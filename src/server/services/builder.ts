import "server-only";
import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { hasPermission } from "@/lib/rbac";
import {
  builderDocumentFromHtml,
  parseBuilderDocument,
  validateBuilderDocument,
  type BuilderDocument,
  type BuilderNode,
} from "@/lib/builder/document";
import { renderBuilderDocument } from "@/lib/builder/render";
import { sanitizeBlockHtml, sanitizeRichText } from "@/lib/sanitize";
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
    document:
      entry.contentJson == null
        ? builderDocumentFromHtml(entry.contentHtml)
        : parseBuilderDocument(entry.contentJson),
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

  // Strict-validate (enforces depth/node limits) then sanitize every node's HTML.
  const clean = sanitizeBuilderDocument(validateBuilderDocument(document));
  // Derived projection: keep `contentHtml` in sync so SEO scoring, sitemap,
  // revisions, search, and excerpts keep working — and static content still
  // renders if the builder is later disabled.
  const { html } = renderBuilderDocument(clean);

  return db.contentEntry.update({
    where: { id },
    data: {
      contentJson: clean as unknown as Prisma.InputJsonValue,
      contentHtml: html,
    },
  });
}

/** Recursively sanitize user HTML on every node before persistence. */
function sanitizeBuilderNode(node: BuilderNode): BuilderNode {
  const props = { ...node.props };
  if (node.type === "richText" && typeof props.html === "string") {
    props.html = sanitizeRichText(props.html);
  }
  if (node.type === "html" && typeof props.html === "string") {
    props.html = sanitizeBlockHtml(props.html);
  }
  return {
    ...node,
    props,
    children: node.children.map(sanitizeBuilderNode),
  };
}

function sanitizeBuilderDocument(document: BuilderDocument): BuilderDocument {
  return {
    ...document,
    children: document.children.map(sanitizeBuilderNode),
  };
}
