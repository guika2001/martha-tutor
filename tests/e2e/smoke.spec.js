const { test, expect } = require("@playwright/test");

test("login shell renders core Martha UI", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("#authStatus")).toBeVisible();
  await expect(page.getByRole("button", { name: /Google Sign-In/i })).toBeVisible();
  await expect(page.getByText(/Abitur Mathe Tutor/i).first()).toBeVisible();
});
