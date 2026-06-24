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

async function createDraftPage(page: Page) {
  const title = `Builder Slice ${Date.now()}`;
  await page.goto("/admin/content/page/new");
  await page.locator("#title").fill(title);
  await page.getByRole("button", { name: "Create" }).click();
  await page.waitForURL(/\/admin\/content\/page\/c[a-z0-9]{12,}$/);
  return title;
}

test("builder opens with empty desktop canvas and entry metadata", async ({
  page,
}) => {
  await login(page);
  const title = await createDraftPage(page);

  await page.getByRole("link", { name: "Visual builder" }).click();
  await expect(
    page.getByRole("heading", { name: `Visual builder: ${title}` }),
  ).toBeVisible();
  await expect(page.getByTestId("builder-entry-metadata")).toContainText(
    "Status",
  );
  await expect(page.getByTestId("builder-entry-metadata")).toContainText(
    "DRAFT",
  );
  await expect(page.getByTestId("builder-canvas")).toBeVisible();
  await expect(page.getByTestId("builder-empty-state")).toBeVisible();
  await expect(page.getByText("Desktop")).toBeVisible();

  const screenshot = await page.getByTestId("builder-canvas").screenshot();
  expect(screenshot.length).toBeGreaterThan(1000);
});

test("builder renders a starter section, container, and rich-text block", async ({
  page,
}) => {
  await login(page);
  await createDraftPage(page);

  await page.getByRole("link", { name: "Visual builder" }).click();
  await page.getByRole("button", { name: "Create starter section" }).click();

  await expect(page.getByTestId("builder-node-section")).toBeVisible();
  await expect(page.getByTestId("builder-node-container")).toBeVisible();
  await expect(page.getByTestId("builder-node-rich-text")).toBeVisible();
  await expect(page.getByText("Start building visually")).toBeVisible();

  const screenshot = await page.getByTestId("builder-canvas").screenshot();
  expect(screenshot.length).toBeGreaterThan(1000);
});
