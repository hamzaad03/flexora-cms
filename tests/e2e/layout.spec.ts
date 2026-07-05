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

test("home renders the header region and lazy-loads GSAP for animations", async ({
  page,
}) => {
  await page.goto("/");

  // The assigned header region rendered (button component).
  await expect(page.locator(".flx-region")).toBeVisible();
  await expect(page.getByText("Get Started")).toBeVisible();

  // Animated elements are present...
  expect(await page.locator("[data-anim]").count()).toBeGreaterThan(0);

  // ...so the runtime lazily loads GSAP. (Proves the animation pipeline.)
  await page.waitForFunction(
    () => Boolean((window as unknown as { gsap?: unknown }).gsap),
    undefined,
    { timeout: 10000 },
  );
});

test("layout + menu builders mount in the admin", async ({ page }) => {
  await login(page);

  await page.goto("/admin/layout");
  await expect(
    page.getByRole("heading", { name: "Headers & Footers" }),
  ).toBeVisible();
  await expect(page.getByText("Main Header")).toBeVisible();

  // Open the header builder and confirm the dnd client mounted.
  await page.getByText("Main Header").first().click();
  await expect(page.getByRole("button", { name: "Add row" })).toBeVisible();

  await page.goto("/admin/menus");
  await expect(page.getByRole("heading", { name: "Menus" })).toBeVisible();
});
