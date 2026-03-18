import { expect, test, type Page } from "@playwright/test";

async function signIn(page: Page, path: string) {
  const email = process.env.STUDIO_OWNER_EMAIL ?? "owner@example.com";
  const password = process.env.STUDIO_OWNER_PASSWORD ?? "dev-password";

  await page.goto(path);
  await expect(page).toHaveURL(/\/sign-in/);

  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

test("creates a service package and shows explicit confirmation", async ({ page }) => {
  const packageName = `Website Refresh Package ${Date.now()}`;

  await signIn(page, "/service-packages/new");
  await expect(page).toHaveURL(/\/service-packages\/new$/);

  await page.getByLabel("Service package name").fill(packageName);
  await page.getByLabel("Category").fill("Web");
  await page.getByLabel("Starting price guidance").fill("$3,200");
  await page.getByLabel("Short summary").fill("Refresh a marketing site for relaunch.");
  await page.getByRole("button", { name: "Create service package" }).click();

  await expect(page).toHaveURL(/\/service-packages\/[^/?]+/);
  await expect(page.getByRole("status")).toContainText("Service package created");
  await expect(page.getByLabel("Service package name")).toHaveValue(packageName);
});

test("edits an existing service package and persists the latest saved values", async ({ page }) => {
  // Navigate directly to the seeded package via sign-in, matching the
  // pattern used in clients.spec.ts.  The creates test covers the full
  // create-through-redirect flow; this test focuses on the edit path.
  await signIn(page, "/service-packages/package-brand-launch?backTo=/service-packages");
  await expect(page).toHaveURL(/\/service-packages\/package-brand-launch/);

  await page.getByLabel("Category").fill("Brand Strategy");
  await page.getByRole("button", { name: "Save service package changes" }).click();

  await expect(page.getByRole("status")).toContainText("Service package saved");

  await page.reload();
  await expect(page.getByLabel("Category")).toHaveValue("Brand Strategy");
});

test("preserves entered values on invalid submission", async ({ page }) => {
  await signIn(page, "/service-packages/new");
  await expect(page).toHaveURL(/\/service-packages\/new$/);

  await page.getByLabel("Service package name").fill("Website Refresh Draft");
  await page.getByRole("button", { name: "Create service package" }).click();

  await expect(page.locator("form").getByRole("alert")).toContainText(
    "Please correct the highlighted fields.",
  );
  await expect(page.getByLabel("Service package name")).toHaveValue(
    "Website Refresh Draft",
  );
  await expect(page.getByText("Category is required.")).toBeVisible();
  await expect(page.getByText("Starting price guidance is required.")).toBeVisible();
});

test("supports keyboard-only completion in the service package form", async ({ page }) => {
  const packageName = `Keyboard Package ${Date.now()}`;

  await signIn(page, "/service-packages/new");
  await expect(page).toHaveURL(/\/service-packages\/new$/);

  await page.getByRole("link", { name: "Back to service packages" }).focus();
  await expect(page.getByRole("link", { name: "Back to service packages" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Service package name")).toBeFocused();
  await page.keyboard.type(packageName);
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Category")).toBeFocused();
  await page.keyboard.type("Content");
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Starting price guidance")).toBeFocused();
  await page.keyboard.type("$1,500");
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Short summary")).toBeFocused();
  await page.keyboard.type("A reusable content sprint package.");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Create service package" })).toBeFocused();
  await page.keyboard.press("Enter");

  await expect(page).toHaveURL(/\/service-packages\/[^/?]+/);
  await expect(page.getByRole("status")).toContainText("Service package created");
  await expect(page.getByLabel("Service package name")).toHaveValue(packageName);
});
