import { test, expect } from "@playwright/test";

// Critical-path placeholder: the app boots and shows its name (TESTING.md).
test("app boots and shows its name", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Lexica" })).toBeVisible();
});
