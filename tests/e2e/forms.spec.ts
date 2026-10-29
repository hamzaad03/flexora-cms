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

test("contact form renders, submits, and shows success", async ({ page }) => {
  await page.goto("/contact");
  // The form-builder plugin renders the shortcode into a real form.
  await expect(page.locator("form.flx-form")).toBeVisible();

  // Wait past the 2s time-trap so this counts as a genuine submission.
  await page.waitForTimeout(2300);

  await page.locator('form.flx-form input[name="name"]').fill("E2E User");
  await page
    .locator('form.flx-form input[name="email"]')
    .fill("e2e@example.com");
  await page
    .locator('form.flx-form textarea[name="message"]')
    .fill("Hello from the form E2E test.");
  await page.locator('form.flx-form button[type="submit"]').click();

  await expect(page.locator(".flx-form__status.is-success")).toBeVisible();
});

test("Forms admin appears when the plugin is enabled", async ({ page }) => {
  await login(page);
  await expect(page.getByRole("link", { name: "Forms" })).toBeVisible();
  await page.goto("/admin/forms");
  await expect(page.getByText("Contact form")).toBeVisible();
});
