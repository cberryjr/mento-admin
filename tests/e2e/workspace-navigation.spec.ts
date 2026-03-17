import { expect, test } from "@playwright/test";

test("supports keyboard nav and reopen flows", async ({ page }) => {
  const email = process.env.STUDIO_OWNER_EMAIL ?? "owner@example.com";
  const password = process.env.STUDIO_OWNER_PASSWORD ?? "dev-password";

  await page.goto("/clients");
  await expect(page).toHaveURL(/\/sign-in/);

  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/clients$/);

  const servicePackagesLink = page.getByRole("link", {
    name: "Service Packages",
    exact: true,
  });
  await servicePackagesLink.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/service-packages$/);

  const quotesLink = page.getByRole("link", { name: "Quotes", exact: true });
  await quotesLink.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/quotes$/);

  await page.getByRole("link", { name: "Clients", exact: true }).click();
  await page.getByRole("link", { name: /sunrise yoga studio/i }).click();
  await expect(page).toHaveURL(/\/clients\/client-sunrise-yoga/);
  await page.getByRole("link", { name: /back to clients/i }).click();
  await expect(page).toHaveURL(/\/clients$/);

  await page.getByRole("link", { name: "Service Packages", exact: true }).click();
  await page.getByRole("link", { name: /brand launch package/i }).click();
  await expect(page).toHaveURL(/\/service-packages\/package-brand-launch/);
  await page.getByRole("link", { name: /back to service packages/i }).click();
  await expect(page).toHaveURL(/\/service-packages$/);
});
