import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

import { PERMISSIONS, ROLES } from "../src/lib/rbac";

// Self-contained seed (relative imports only, so `tsx` runs it without alias
// resolution). Idempotent: safe to re-run.

const db = new PrismaClient();

async function seedPermissions() {
  for (const [slug, def] of Object.entries(PERMISSIONS)) {
    await db.permission.upsert({
      where: { slug },
      update: { name: def.name, group: def.group },
      create: { slug, name: def.name, group: def.group },
    });
  }
  console.log(`✓ Permissions: ${Object.keys(PERMISSIONS).length}`);
}

async function seedRoles() {
  const allPermissions = await db.permission.findMany();
  const bySlug = new Map(allPermissions.map((p) => [p.slug, p.id]));

  for (const [slug, def] of Object.entries(ROLES)) {
    const role = await db.role.upsert({
      where: { slug },
      update: { name: def.name, description: def.description, isSystem: true },
      create: {
        slug,
        name: def.name,
        description: def.description,
        isSystem: true,
      },
    });

    const permSlugs =
      def.permissions === "*"
        ? Object.keys(PERMISSIONS)
        : (def.permissions as string[]);

    // Reset and reconnect this role's permissions.
    await db.rolePermission.deleteMany({ where: { roleId: role.id } });
    await db.rolePermission.createMany({
      data: permSlugs
        .map((ps) => bySlug.get(ps))
        .filter((id): id is string => Boolean(id))
        .map((permissionId) => ({ roleId: role.id, permissionId })),
      skipDuplicates: true,
    });
  }
  console.log(`✓ Roles: ${Object.keys(ROLES).length}`);
}

async function seedContentTypes() {
  await db.contentType.upsert({
    where: { slug: "page" },
    update: {},
    create: {
      slug: "page",
      label: "Pages",
      labelSingular: "Page",
      icon: "file-text",
      isSystem: true,
      supports: {
        seo: true,
        revisions: true,
        author: true,
        hierarchical: true,
      },
    },
  });

  await db.contentType.upsert({
    where: { slug: "post" },
    update: {},
    create: {
      slug: "post",
      label: "Posts",
      labelSingular: "Post",
      icon: "newspaper",
      isSystem: true,
      supports: {
        seo: true,
        revisions: true,
        author: true,
        hierarchical: false,
        taxonomies: ["category", "tag"],
      },
    },
  });
  console.log("✓ Content types: page, post");
}

async function seedTaxonomies() {
  await db.taxonomy.upsert({
    where: { slug: "category" },
    update: {},
    create: { slug: "category", label: "Categories", hierarchical: true },
  });
  await db.taxonomy.upsert({
    where: { slug: "tag" },
    update: {},
    create: { slug: "tag", label: "Tags", hierarchical: false },
  });
  console.log("✓ Taxonomies: category, tag");
}

async function seedMenus() {
  await db.menu.upsert({
    where: { slug: "main" },
    update: {},
    create: { slug: "main", name: "Main Menu" },
  });
  await db.menu.upsert({
    where: { slug: "footer" },
    update: {},
    create: { slug: "footer", name: "Footer Menu" },
  });
  console.log("✓ Menus: main, footer");
}

async function seedSettings() {
  const settings: Record<string, unknown> = {
    "identity.title": "FlxOraCMS Site",
    "identity.tagline": "Built with FlxOraCMS",
    "identity.logo": null,
    "identity.favicon": null,
  };
  for (const [key, value] of Object.entries(settings)) {
    await db.setting.upsert({
      where: { key },
      update: {},
      create: { key, value: value as never },
    });
  }

  const customizer: Record<string, unknown> = {
    "colors.primary": "#0066ff",
    "colors.secondary": "#111111",
    "colors.accent": "#22c55e",
    "colors.text": "#171717",
    "colors.background": "#ffffff",
    "fonts.heading": "Inter",
    "fonts.body": "Inter",
  };
  for (const [key, value] of Object.entries(customizer)) {
    await db.customizerSetting.upsert({
      where: { key },
      update: {},
      create: { key, value: value as never },
    });
  }
  console.log("✓ Settings + customizer defaults");
}

async function seedSuperAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    console.log(
      "ℹ No SEED_ADMIN_EMAIL/PASSWORD set — skipping admin (use the setup wizard).",
    );
    return;
  }
  const role = await db.role.findUnique({ where: { slug: "super-admin" } });
  if (!role) return;
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await db.user.upsert({
    where: { email },
    update: { passwordHash, isActive: true },
    create: { email, name: "Super Admin", passwordHash, isActive: true },
  });
  await db.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: role.id } },
    update: {},
    create: { userId: user.id, roleId: role.id },
  });
  console.log(`✓ Super Admin: ${email}`);
}

async function main() {
  console.log("Seeding FlxOraCMS...");
  await seedPermissions();
  await seedRoles();
  await seedContentTypes();
  await seedTaxonomies();
  await seedMenus();
  await seedSettings();
  await seedSuperAdmin();
  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
