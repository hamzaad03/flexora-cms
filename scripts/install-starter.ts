import { PrismaClient } from "@prisma/client";
import { promises as fs } from "node:fs";
import path from "node:path";

// Self-contained CLI installer for the bundled starter theme (relative imports
// only, so `tsx` runs it without alias resolution). Idempotent.

const db = new PrismaClient();
const STORAGE = path.resolve(
  process.cwd(),
  process.env.STORAGE_DIR || "./storage",
);
// Usage: tsx scripts/install-starter.ts [themeFolder] [--activate]
const THEME = process.argv[2]?.startsWith("--")
  ? "starter"
  : (process.argv[2] ?? "starter");
const FORCE_ACTIVATE = process.argv.includes("--activate");
const SRC = path.join(process.cwd(), "themes", THEME);

async function copyDir(src: string, dest: string) {
  await fs.mkdir(dest, { recursive: true });
  for (const item of await fs.readdir(src, { withFileTypes: true })) {
    const s = path.join(src, item.name);
    const d = path.join(dest, item.name);
    if (item.isDirectory()) await copyDir(s, d);
    else await fs.copyFile(s, d);
  }
}

async function main() {
  const manifest = JSON.parse(
    await fs.readFile(path.join(SRC, "theme.json"), "utf8"),
  );
  const dest = path.join(STORAGE, "themes", manifest.slug);
  await fs.rm(dest, { recursive: true, force: true });
  await copyDir(SRC, dest);

  const theme = await db.theme.upsert({
    where: { slug: manifest.slug },
    update: {
      name: manifest.name,
      version: manifest.version,
      author: manifest.author,
      manifest,
    },
    create: {
      slug: manifest.slug,
      name: manifest.name,
      version: manifest.version,
      author: manifest.author,
      manifest,
    },
  });

  await db.template.deleteMany({ where: { themeId: theme.id } });
  await db.template.createMany({
    data: Object.entries(manifest.templates as Record<string, string>).map(
      ([type, filePath]) => ({
        themeId: theme.id,
        name: type,
        type,
        filePath,
      }),
    ),
  });

  const active = await db.theme.findFirst({ where: { isActive: true } });
  if (FORCE_ACTIVATE || !active) {
    await db.theme.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });
    await db.theme.update({
      where: { id: theme.id },
      data: { isActive: true },
    });
    console.log(`✓ Installed and activated "${manifest.slug}"`);
  } else {
    console.log(
      `✓ Installed "${manifest.slug}" (active theme unchanged: ${active.slug})`,
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
