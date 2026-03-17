import { expect, test } from "@playwright/test";

test("sign-in protects workspace and allows valid credentials", async ({ page }) => {
  const email = process.env.STUDIO_OWNER_EMAIL ?? "owner@example.com";
  const password = process.env.STUDIO_OWNER_PASSWORD ?? "dev-password";

  await page.goto("/workspace");
  await expect(page).toHaveURL(/\/sign-in/);

  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/workspace$/);
  await expect(page.getByRole("heading", { name: "Settings and Defaults" })).toBeVisible();
});
