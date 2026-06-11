import { test, expect } from "@playwright/test";

test.describe("Landing page", () => {
  test("loads and shows hero content", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/World Cup/i);
    // Hero section visible
    await expect(page.locator("h1")).toBeVisible();
  });

  test("shows sign in link when unauthenticated", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /sign in/i })).toBeVisible();
  });
});

test.describe("Auth page", () => {
  test("renders login form", async ({ page }) => {
    await page.goto("/auth");
    await expect(page.locator("input[type='email']")).toBeVisible();
    await expect(page.locator("input[type='password']")).toBeVisible();
  });

  test("shows error on bad credentials", async ({ page }) => {
    await page.goto("/auth");
    await page.fill("input[type='email']", "test@example.com");
    await page.fill("input[type='password']", "wrongpassword");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.locator("text=Invalid")).toBeVisible({ timeout: 10_000 });
  });
});

test.describe("Protected routes redirect", () => {
  test("dashboard redirects to auth when not logged in", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/auth/);
  });

  test("groups redirects to auth when not logged in", async ({ page }) => {
    await page.goto("/groups");
    await expect(page).toHaveURL(/\/auth/);
  });

  test("bracket redirects to auth when not logged in", async ({ page }) => {
    await page.goto("/bracket");
    await expect(page).toHaveURL(/\/auth/);
  });
});
