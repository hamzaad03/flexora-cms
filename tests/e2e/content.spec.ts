import { test, expect, type Page } from "@playwright/test";

const EMAIL = "admin@example.com";
const PASSWORD = "password123";

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function login(page: Page) {
  await page.goto("/admin/login");
  await page.locator("#email").fill(EMAIL);
  await page.locator("#password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/admin");
}

test("create + publish a page, then it renders on the public site", async ({
  page,
}) => {
  await login(page);

  const title = `E2E Page ${Date.now()}`;
  const slug = slugify(title);

  await page.goto("/admin/content/page/new");
  await page.locator("#title").fill(title);

  // Type into the Tiptap editor.
  await page.locator(".ProseMirror").click();
  await page.keyboard.type("Hello from the E2E test.");

  // Status -> Published (Base UI select).
  await page.locator("#status").click();
  await page.getByRole("option", { name: "Published" }).click();

  await page.getByRole("button", { name: "Create" }).click();

  // Wait for the real save to finish: the editor redirects from /new to the
  // new entry's id (a cuid, never "new").
  await page.waitForURL(/\/admin\/content\/page\/c[a-z0-9]{12,}$/, {
    timeout: 15000,
  });

  // The published page renders through the active theme.
  await page.goto(`/${slug}`);
  await expect(page.locator("h1")).toContainText(title);
  await expect(page.locator("body")).toContainText("Hello from the E2E test.");
});
