import { expect, test } from "@playwright/test";

async function signIn(page: import("@playwright/test").Page) {
  const email = process.env.STUDIO_OWNER_EMAIL ?? "owner@example.com";
  const password = process.env.STUDIO_OWNER_PASSWORD ?? "dev-password";

  await page.goto("/settings");
  await expect(page).toHaveURL(/\/sign-in/);

  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/settings$/);
}

test("saves and reloads studio defaults", async ({ page }) => {
  await signIn(page);

  await page.getByLabel("Studio name").fill("Northwind Creative");
  await page.getByLabel("Studio contact name").fill("Casey Jones");
  await page.getByLabel("Studio contact email").fill("casey@example.com");
  await page.getByLabel("Studio contact phone").fill("+1 555 0100");
  await page
    .getByLabel("Default quote terms")
    .fill("50% due at project start. Net 15 for remainder.");
  await page
    .getByLabel("Default invoice payment instructions")
    .fill("Please pay by ACH transfer within 15 days.");

  await page.getByRole("button", { name: "Save defaults" }).click();

  await expect(
    page.getByRole("alert").getByText("Defaults saved", { exact: true }),
  ).toBeVisible();

  await page.reload();

  await expect(page.getByLabel("Studio name")).toHaveValue("Northwind Creative");
  await expect(page.getByLabel("Studio contact email")).toHaveValue("casey@example.com");
  await expect(page.getByLabel("Default quote terms")).toHaveValue(
    "50% due at project start. Net 15 for remainder.",
  );
});

test("shows inline validation errors on invalid submit and preserves values", async ({ page }) => {
  await signIn(page);

  await page.getByLabel("Studio name").fill("Test Studio");
  await page.getByLabel("Default quote terms").fill("Some terms");

  await page.getByRole("button", { name: "Save defaults" }).click();

  await expect(page.getByRole("alert")).toBeVisible();

  await expect(page.getByLabel("Studio name")).toHaveValue("Test Studio");
  await expect(page.getByLabel("Default quote terms")).toHaveValue("Some terms");
});
