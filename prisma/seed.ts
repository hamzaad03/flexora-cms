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

async function seedSampleContent() {
  const pageType = await db.contentType.findUnique({ where: { slug: "page" } });
  const postType = await db.contentType.findUnique({ where: { slug: "post" } });
  if (!pageType || !postType) return;

  const existingHome = await db.contentEntry.findFirst({
    where: { contentTypeId: pageType.id, slug: "home" },
  });
  if (existingHome) {
    console.log("ℹ Sample content exists — skipping");
    return;
  }

  const admin = await db.user.findFirst({
    where: { roles: { some: { role: { slug: "super-admin" } } } },
  });
  const authorId = admin?.id ?? null;
  const now = new Date();

  const home = await db.contentEntry.create({
    data: {
      contentTypeId: pageType.id,
      title: "Welcome to FlxOraCMS",
      slug: "home",
      status: "PUBLISHED",
      publishedAt: now,
      authorId,
      excerpt: "A self-hosted CMS where you upload a theme and edit content.",
      contentHtml:
        "<p>This home page is served through your active theme. Edit it in the admin, switch themes, and the content stays the same.</p>",
    },
  });

  const about = await db.contentEntry.create({
    data: {
      contentTypeId: pageType.id,
      title: "About",
      slug: "about",
      status: "PUBLISHED",
      publishedAt: now,
      authorId,
      excerpt: "About this site.",
      contentHtml:
        "<p>FlxOraCMS lets agencies import ready-made HTML/CSS themes and manage content without touching code.</p>",
    },
  });

  await db.contentEntry.create({
    data: {
      contentTypeId: postType.id,
      title: "Hello World",
      slug: "hello-world",
      status: "PUBLISHED",
      publishedAt: now,
      authorId,
      excerpt: "Our very first post.",
      contentHtml: "<p>This is a sample blog post rendered by the theme.</p>",
    },
  });

  const mainMenu = await db.menu.findUnique({ where: { slug: "main" } });
  if (mainMenu) {
    await db.menuItem.createMany({
      data: [
        {
          menuId: mainMenu.id,
          label: "Home",
          type: "page",
          reference: home.id,
          sortOrder: 0,
        },
        {
          menuId: mainMenu.id,
          label: "About",
          type: "page",
          reference: about.id,
          sortOrder: 1,
        },
      ],
    });
  }

  const footerMenu = await db.menu.findUnique({ where: { slug: "footer" } });
  if (footerMenu) {
    await db.menuItem.create({
      data: {
        menuId: footerMenu.id,
        label: "About",
        type: "page",
        reference: about.id,
        sortOrder: 0,
      },
    });
  }

  console.log("✓ Sample content: home, about, hello-world + menu items");
}

async function seedFormsDemo() {
  const fid = () => `f_${Math.random().toString(36).slice(2, 9)}`;
  const existing = await db.form.findUnique({ where: { slug: "contact" } });
  if (!existing) {
    await db.form.create({
      data: {
        slug: "contact",
        name: "Contact form",
        isActive: true,
        fields: [
          {
            id: fid(),
            type: "text",
            name: "name",
            label: "Name",
            required: true,
            width: "half",
          },
          {
            id: fid(),
            type: "email",
            name: "email",
            label: "Email",
            required: true,
            width: "half",
          },
          {
            id: fid(),
            type: "textarea",
            name: "message",
            label: "Message",
            required: true,
            width: "full",
          },
        ],
        settings: {
          submitLabel: "Send message",
          successMessage: "Thanks — we'll be in touch shortly.",
        },
      },
    });
    console.log("✓ Sample form: contact");
  }

  // Enable the Form Builder plugin so the shortcode renders out of the box.
  await db.plugin.upsert({
    where: { slug: "form-builder" },
    update: { isEnabled: true },
    create: {
      slug: "form-builder",
      name: "Form Builder",
      version: "1.0.0",
      isEnabled: true,
    },
  });

  // Drop the shortcode onto the About page if not already there.
  const about = await db.contentEntry.findFirst({ where: { slug: "about" } });
  if (about && !(about.contentHtml ?? "").includes("[flxform")) {
    await db.contentEntry.update({
      where: { id: about.id },
      data: {
        contentHtml: `${about.contentHtml ?? ""}\n<h2>Get in touch</h2>\n<p>[flxform slug="contact"]</p>`,
      },
    });
    console.log("✓ Added contact form to the About page");
  }
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
  await seedSampleContent();
  await seedFormsDemo();
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
