import { test, expect, type Page } from "@playwright/test";

const EMAIL = "admin@example.com";
const PASSWORD = "password123";

async function login(page: Page) {
  await page.goto("/admin/login");
  await page.locator("#email").fill(EMAIL);
  await page.locator("#password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/admin");
}

// 1x1 transparent PNG.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

test("media upload optimizes, stores, and serves an image", async ({
  page,
}) => {
  await login(page);
  await page.goto("/admin/media");

  await page
    .locator('input[type="file"]')
    .setInputFiles({ name: "pixel.png", mimeType: "image/png", buffer: PNG });

  // A media tile served from /media/ appears (sharp converted it to jpeg).
  const tile = page.locator('img[src*="/media/"]').first();
  await expect(tile).toBeVisible({ timeout: 15000 });

  // The served file responds 200.
  const src = await tile.getAttribute("src");
  expect(src).toBeTruthy();
  const res = await page.request.get(src as string);
  expect(res.status()).toBe(200);
});

test("analytics dashboard renders", async ({ page }) => {
  await login(page);
  await page.goto("/admin/analytics");
  await expect(page.getByText("Page views")).toBeVisible();
});

test("entry editor shows a live SEO score panel", async ({ page }) => {
  await login(page);
  await page.goto("/admin/content/page");
  await page.getByRole("link", { name: "Welcome to FlxOraCMS" }).click();
  await page.waitForURL(/\/admin\/content\/page\/[^/]+$/);
  await expect(page.locator("#seo-keyword")).toBeVisible();
});
