import { test, expect } from "@playwright/test";

// These checks don't depend on Supabase being reachable — they verify the
// app itself serves, renders, and degrades gracefully. They were run and
// verified passing even in a network-restricted environment; run the rest
// of the e2e suite (auth-and-core-flows.spec.ts) somewhere with real
// internet access to your Supabase project.

test.describe("unauthenticated redirects", () => {
  test("root redirects to /login", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });

  test("protected route redirects to /login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("public pages render", () => {
  test("login page has email, password, and magic link tab", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.getByRole("tab", { name: /magic link/i })).toBeVisible();
  });

  test("signup page renders", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
  });

  test("page title is set", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveTitle(/JobPilot/);
  });
});

test.describe("graceful degradation", () => {
  test("a failed signup submission does not crash the app", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (e) => pageErrors.push(e.message));

    await page.goto("/signup");
    await page.fill("#email", `smoke-test-${Date.now()}@example.com`);
    await page.fill("#password", "TestPassword123!");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    await expect(page.locator("body")).not.toContainText("Application error");
    expect(pageErrors).toHaveLength(0);
  });
});
