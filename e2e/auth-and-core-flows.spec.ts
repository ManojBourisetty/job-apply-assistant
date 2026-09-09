import { test, expect } from "@playwright/test";

// Requires a real, reachable Supabase project (NEXT_PUBLIC_SUPABASE_URL /
// NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local) with the Phase 1-5
// migrations applied. Run wherever that's reachable — e.g. your machine,
// or CI with network access — not from a network-restricted sandbox.
//
//   npx playwright test e2e/auth-and-core-flows.spec.ts
//
// Steps run in order against one signed-up user, since later steps depend
// on state created by earlier ones (a job, an application, a resume).

test.describe.serial("core signed-in flows", () => {
  const email = `e2e-${Date.now()}@example.com`;
  const password = "TestPassword123!";

  test("sign up and land on the dashboard", async ({ page }) => {
    await page.goto("/signup");
    await page.fill("#email", email);
    await page.fill("#password", password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    await expect(page.getByText(/Good (morning|afternoon|evening)/)).toBeVisible();
  });

  test("add a job manually and see it on the detail page", async ({ page }) => {
    await page.goto("/jobs/new");
    await page.fill("#title", "Senior SRE");
    await page.fill("#company_name", "Acme Corp");
    await page.fill("#location", "Remote - US");
    await page.fill("#technologies", "AWS, Kubernetes, Terraform");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/jobs\/[a-f0-9-]+$/, { timeout: 10000 });
    await expect(page.getByRole("heading", { name: "Senior SRE" })).toBeVisible();
    await expect(page.getByText("Acme Corp")).toBeVisible();
  });

  test("track the application and see it in the kanban board", async ({ page }) => {
    await page.getByRole("button", { name: /track application/i }).click();
    await expect(page).toHaveURL(/\/applications/, { timeout: 10000 });
    await expect(page.getByText("Discovered")).toBeVisible();
    await expect(page.getByText("Senior SRE")).toBeVisible();
  });

  test("create a master resume and fill in contact info", async ({ page }) => {
    await page.goto("/resumes/new");
    await page.fill("#title", "Master Resume");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/resumes\/[a-f0-9-]+$/, { timeout: 10000 });

    await page.getByLabel("Full name").fill("Jane Doe");
    await page.getByLabel("Email").fill("jane@example.com");
    await page.getByRole("button", { name: /save new version/i }).click();
    await expect(page.getByText(/resume saved/i)).toBeVisible({ timeout: 10000 });
  });

  test("create a search profile", async ({ page }) => {
    await page.goto("/search-profiles/new");
    await page.getByLabel(/profile name/i).fill("Senior SRE Remote");
    await page.getByRole("button", { name: /create profile/i }).click();
    await expect(page).toHaveURL(/\/search-profiles$/, { timeout: 10000 });
    await expect(page.getByText("Senior SRE Remote")).toBeVisible();
  });

  test("add a company", async ({ page }) => {
    await page.goto("/companies/new");
    await page.getByLabel(/company name/i).fill("Acme Corp");
    await page.getByRole("button", { name: /add company/i }).click();
    await expect(page).toHaveURL(/\/companies$/, { timeout: 10000 });
    await expect(page.getByText("Acme Corp")).toBeVisible();
  });

  test("add a recruiter", async ({ page }) => {
    await page.goto("/recruiters/new");
    await page.getByLabel(/^name/i).fill("Alex Recruiter");
    await page.getByRole("button", { name: /add recruiter/i }).click();
    await expect(page).toHaveURL(/\/recruiters$/, { timeout: 10000 });
    await expect(page.getByText("Alex Recruiter")).toBeVisible();
  });

  test("recommended jobs page shows a real match score", async ({ page }) => {
    await page.goto("/recommended");
    await expect(page.getByText(/\/100/)).toBeVisible({ timeout: 10000 });
  });

  test("analytics tabs render", async ({ page }) => {
    await page.goto("/analytics");
    await expect(page.getByText("Total applications")).toBeVisible();
    await page.getByRole("tab", { name: "Market Insights" }).click();
    await expect(page.getByText(/target market/i)).toBeVisible();
  });

  test("dark mode toggle changes the theme", async ({ page }) => {
    await page.goto("/dashboard");
    const before = await page.locator("html").getAttribute("class");
    await page.click('button[aria-label="Toggle theme"]');
    await page.getByText("Dark", { exact: true }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    const after = await page.locator("html").getAttribute("class");
    expect(after).not.toBe(before);
  });

  test("settings page saves profile info", async ({ page }) => {
    await page.goto("/settings");
    await page.getByLabel("Full name").fill("Jane Doe");
    await page.getByRole("button", { name: /save settings/i }).click();
    await expect(page.getByText(/settings saved/i)).toBeVisible({ timeout: 10000 });
  });
});
