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
    "identity.title": "FlexoraCMS Demo",
    "identity.tagline": "The modern CMS for creative agencies.",
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
    "colors.primary": "#2563eb",
    "colors.secondary": "#0f172a",
    "colors.accent": "#8b5cf6",
    "colors.text": "#0f172a",
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

  const page = (
    title: string,
    slug: string,
    excerpt: string,
    contentHtml: string,
  ) =>
    db.contentEntry.create({
      data: {
        contentTypeId: pageType.id,
        title,
        slug,
        status: "PUBLISHED",
        publishedAt: now,
        authorId,
        excerpt,
        contentHtml,
      },
    });
  const post = (
    title: string,
    slug: string,
    excerpt: string,
    contentHtml: string,
    daysAgo: number,
  ) =>
    db.contentEntry.create({
      data: {
        contentTypeId: postType.id,
        title,
        slug,
        status: "PUBLISHED",
        publishedAt: new Date(now.getTime() - daysAgo * 86_400_000),
        authorId,
        excerpt,
        contentHtml,
      },
    });

  const home = await page(
    "A modern CMS for creative agencies",
    "home",
    "Upload a ready-made theme, model your own content, and edit everything without touching code.",
    `<h2>Everything you need to launch</h2>
<p>These sections are plain headings and lists in the page editor, styled by the active theme.</p>
<ul>
<li><strong>Themes without code</strong> Upload an HTML/CSS theme and have a live, editable site in minutes.</li>
<li><strong>Custom content types</strong> Model services, projects or products with your own fields.</li>
<li><strong>Visual builder</strong> Design headers, footers and page sections with optional animations.</li>
<li><strong>SEO built in</strong> Titles, descriptions, sitemaps and redirects, with a live score.</li>
<li><strong>Forms and leads</strong> Add secure contact forms to any page with a shortcode.</li>
<li><strong>Analytics</strong> Privacy-friendly visitor statistics inside the admin dashboard.</li>
</ul>
<h2>How it works</h2>
<ol>
<li><strong>Choose a theme</strong> Install a theme from a zip, or start from the included starter.</li>
<li><strong>Add your content</strong> Write pages and posts with the editor, and organize menus.</li>
<li><strong>Publish</strong> Go live, then track visits and enquiries from the dashboard.</li>
</ol>
<h2>Ready to start?</h2>
<p>Tell us about your project and we will get back to you. <a href="/contact">Contact us</a></p>`,
  );

  const about = await page(
    "About us",
    "about",
    "Who we are and how we work.",
    `<p>We are a small team that helps agencies and businesses build fast, flexible websites. This page is demo content, so replace it with your own story.</p>
<h2>What we believe</h2>
<p>Good websites are easy to edit, quick to load and simple to maintain. Your content should never be locked inside a theme.</p>
<h2>How we work</h2>
<p>We start with your goals, design the structure, then build and launch in small steps so you can see progress early.</p>`,
  );

  const services = await page(
    "Services",
    "services",
    "Design, build and grow your website.",
    `<h2>Website design</h2>
<p>Clean, responsive layouts that match your brand, built from reusable sections.</p>
<h2>Content and SEO</h2>
<p>Structured content, clear page titles and descriptions, and a sitemap so search engines can find your pages.</p>
<h2>Forms and enquiries</h2>
<p>Contact and enquiry forms with spam protection, so messages reach you.</p>
<p>Want to talk it through? <a href="/contact">Get in touch</a>.</p>`,
  );

  await page(
    "Contact",
    "contact",
    "Send us a message and we will reply soon.",
    `<p>Fill in the form below to start a conversation.</p>
<p>[flxform slug="contact"]</p>`,
  );

  await post(
    "Hello World",
    "hello-world",
    "Our very first post.",
    "<p>This is a sample blog post rendered by the theme. Edit or delete it from the admin.</p>",
    14,
  );
  await post(
    "Choosing a theme for your site",
    "choosing-a-theme",
    "What to look for in a theme before you install it.",
    "<p>A good theme is fast, accessible and easy to adapt. Check that it has the templates you need, such as home, page, post and archive, and that it works on small screens.</p>",
    7,
  );
  await post(
    "Writing pages that rank",
    "writing-pages-that-rank",
    "A short checklist for page titles and descriptions.",
    "<h2>The basics</h2><p>Give every page a clear title, a short description and one main topic. Use headings to structure the page, and add descriptive alt text to images.</p>",
    2,
  );

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
        {
          menuId: mainMenu.id,
          label: "Services",
          type: "page",
          reference: services.id,
          sortOrder: 2,
        },
        {
          menuId: mainMenu.id,
          label: "Blog",
          type: "custom",
          url: "/blog",
          sortOrder: 3,
        },
        {
          menuId: mainMenu.id,
          label: "Contact",
          type: "custom",
          url: "/contact",
          sortOrder: 4,
        },
      ],
    });
  }

  const footerMenu = await db.menu.findUnique({ where: { slug: "footer" } });
  if (footerMenu) {
    await db.menuItem.createMany({
      data: [
        {
          menuId: footerMenu.id,
          label: "About",
          type: "page",
          reference: about.id,
          sortOrder: 0,
        },
        {
          menuId: footerMenu.id,
          label: "Services",
          type: "page",
          reference: services.id,
          sortOrder: 1,
        },
        {
          menuId: footerMenu.id,
          label: "Blog",
          type: "custom",
          url: "/blog",
          sortOrder: 2,
        },
        {
          menuId: footerMenu.id,
          label: "Contact",
          type: "custom",
          url: "/contact",
          sortOrder: 3,
        },
      ],
    });
  }

  console.log("✓ Sample content: 4 pages, 3 posts, main + footer menus");
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
}

/**
 * Optionally seed a login for a role from env vars (dev/demo convenience).
 * Skipped when the email/password variables are not set.
 */
async function seedUserFromEnv(opts: {
  roleSlug: string;
  label: string;
  name: string;
  emailVar: string;
  passwordVar: string;
}) {
  const email = process.env[opts.emailVar];
  const password = process.env[opts.passwordVar];
  if (!email || !password) {
    console.log(
      `ℹ No ${opts.emailVar}/${opts.passwordVar} set — skipping ${opts.label}${
        opts.roleSlug === "super-admin" ? " (use the setup wizard)" : ""
      }.`,
    );
    return;
  }
  const role = await db.role.findUnique({ where: { slug: opts.roleSlug } });
  if (!role) return;
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await db.user.upsert({
    where: { email },
    update: { passwordHash, isActive: true },
    create: { email, name: opts.name, passwordHash, isActive: true },
  });
  await db.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: role.id } },
    update: {},
    create: { userId: user.id, roleId: role.id },
  });
  console.log(`✓ ${opts.label}: ${email}`);
}

async function seedSuperAdmin() {
  await seedUserFromEnv({
    roleSlug: "super-admin",
    label: "Super Admin",
    name: "Super Admin",
    emailVar: "SEED_ADMIN_EMAIL",
    passwordVar: "SEED_ADMIN_PASSWORD",
  });
  await seedUserFromEnv({
    roleSlug: "admin",
    label: "Administrator",
    name: "Administrator",
    emailVar: "SEED_STAFF_ADMIN_EMAIL",
    passwordVar: "SEED_STAFF_ADMIN_PASSWORD",
  });
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
