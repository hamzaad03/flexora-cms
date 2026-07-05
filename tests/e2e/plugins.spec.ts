import { test, expect, type Page } from "@playwright/test";

const EMAIL = "admin@example.com";
const PASSWORD = "password123";
const MARKER = "powered by FlxOraCMS";

async function login(page: Page) {
  await page.goto("/admin/login");
  await page.locator("#email").fill(EMAIL);
  await page.locator("#password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/admin");
}

test("enabling a plugin changes rendered page output (hook bus)", async ({
  page,
}) => {
  await login(page);
  await page.goto("/admin/plugins");

  const sw = page.getByRole("switch", { name: "Toggle Powered By Banner" });

  // Ensure enabled.
  if ((await sw.getAttribute("aria-checked")) !== "true") {
    await sw.click();
    await expect(page.getByText("Plugin enabled.")).toBeVisible();
  }
  // Marker appears (poll to allow the reload TTL to elapse across instances).
  await expect
    .poll(
      async () =>
        (await page.request.get("/")).text().then((t) => t.includes(MARKER)),
      {
        timeout: 8000,
      },
    )
    .toBe(true);

  // Disable → marker disappears.
  await page.goto("/admin/plugins");
  const sw2 = page.getByRole("switch", { name: "Toggle Powered By Banner" });
  await sw2.click();
  await expect(page.getByText("Plugin disabled.")).toBeVisible();
  await expect
    .poll(
      async () =>
        (await page.request.get("/")).text().then((t) => t.includes(MARKER)),
      {
        timeout: 8000,
      },
    )
    .toBe(false);
});
