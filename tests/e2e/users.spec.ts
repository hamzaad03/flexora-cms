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

test("super admin can create users and custom roles", async ({ page }) => {
  await login(page);

  await page.goto("/admin/users");
  await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();

  await page.getByRole("link", { name: "New user" }).click();
  const email = `editor-${Date.now()}@example.com`;
  await page.locator("#name").fill("Editorial User");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill("password123");
  await page.getByLabel("Editor").check();
  await page.getByRole("button", { name: "Create user" }).click();
  await expect(page).toHaveURL(/\/admin\/users\/.+/);
  await expect(page.locator("#email")).toHaveValue(email);

  await page.goto("/admin/users/roles");
  await expect(page.getByText("Super Admin")).toBeVisible();
  await expect(page.getByText("system").first()).toBeVisible();

  const slug = `qa-role-${Date.now()}`;
  await page.getByLabel("Name").first().fill("QA Role");
  await page.getByLabel("Slug").first().fill(slug);
  await page.getByLabel("View content").first().check();
  await page.getByRole("button", { name: "Create role" }).click();
  await expect(page.getByText("Role saved.")).toBeVisible();
  await expect(page.getByText("QA Role")).toBeVisible();
});

test("current user cannot deactivate themselves", async ({ page }) => {
  await login(page);
  await page.goto("/admin/users");
  await page.locator('input[name="q"]').fill(EMAIL);
  await page.getByRole("button", { name: "Filter" }).click();
  await page.getByRole("link", { name: "Edit user" }).first().click();
  await page.getByLabel("Active account").click();
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(
    page.getByText("You cannot deactivate your own account."),
  ).toBeVisible();
});

test("subscriber cannot access user management", async ({ page }) => {
  await login(page);

  await page.goto("/admin/users/new");
  const email = `subscriber-${Date.now()}@example.com`;
  await page.locator("#name").fill("Subscriber User");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill("password123");
  await page.getByRole("button", { name: "Create user" }).click();
  await expect(page).toHaveURL(/\/admin\/users\/.+/);

  await page.context().clearCookies();
  await page.goto("/admin/login");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill("password123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/admin");
  await page.goto("/admin/users");
  await expect(page).toHaveURL(/\/admin\/forbidden/);
  await expect(
    page.getByRole("heading", { name: "Access denied" }),
  ).toBeVisible();
});
