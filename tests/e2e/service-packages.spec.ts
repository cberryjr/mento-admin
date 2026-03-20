import { expect, test, type Locator, type Page } from "@playwright/test";

async function signIn(page: Page, path: string) {
  const email = process.env.STUDIO_OWNER_EMAIL ?? "owner@example.com";
  const password = process.env.STUDIO_OWNER_PASSWORD ?? "dev-password";

  await page.goto(path);
  await expect(page).toHaveURL(/\/sign-in/);

  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

async function tabUntilFocused(page: Page, target: ReturnType<Page["getByLabel"]>, maxTabs = 12) {
  for (let index = 0; index < maxTabs; index += 1) {
    await page.keyboard.press("Tab");

    if (await target.evaluate((element) => element === document.activeElement)) {
      return;
    }
  }

  throw new Error("Could not reach target with keyboard navigation.");
}

async function expectBackToParam(link: Locator, expectedBackTo: string) {
  const href = await link.getAttribute("href");
  expect(href).toBeTruthy();

  const backTo = new URL(href!, "https://example.com").searchParams.get("backTo");
  expect(backTo).toBe(expectedBackTo);
}

test("browses, filters, and reopens service packages from the library", async ({ page }) => {
  await signIn(page, "/service-packages");
  await expect(page).toHaveURL(/\/service-packages$/);

  const brandLaunchLink = page.locator(
    'a[href^="/service-packages/package-brand-launch?backTo="]',
  );
  const contentSprintLink = page.locator(
    'a[href^="/service-packages/package-content-sprint?backTo="]',
  );

  await expect(page.getByRole("heading", { name: "Service Packages" })).toBeVisible();
  await expect(page.getByText(/\d+ service packages?/)).toBeVisible();
  await expect(brandLaunchLink).toBeVisible();
  await expect(contentSprintLink).toBeVisible();
  await expectBackToParam(brandLaunchLink, "/service-packages");
  await expectBackToParam(contentSprintLink, "/service-packages");
  await expect(brandLaunchLink).toContainText(/Updated Mar \d{1,2}, 2026/);

  const searchInput = page.getByLabel("Search service packages");
  await searchInput.fill("campaign push");
  const filteredContentSprintLink = page.locator(
    'a[href^="/service-packages/package-content-sprint?backTo="]',
  );
  await expect(filteredContentSprintLink).toBeVisible();
  await expect(brandLaunchLink).toBeHidden();
  await expectBackToParam(filteredContentSprintLink, "/service-packages?search=campaign%20push");

  await searchInput.fill("non-matching term");
  await expect(page.getByText("No service packages match your search")).toBeVisible();
  await page.getByRole("button", { name: "Clear search" }).click();

  await expect(brandLaunchLink).toBeVisible();
  await expect(contentSprintLink).toBeVisible();

  await searchInput.fill("campaign push");
  await expect(filteredContentSprintLink).toBeVisible();
  await expect(brandLaunchLink).toBeHidden();

  await filteredContentSprintLink.click();
  await expect(page).toHaveURL(/\/service-packages\/package-content-sprint/);
  await expect(page.getByLabel("Service package name")).toHaveValue("Content Sprint Package");

  await page.getByRole("link", { name: /back to service packages/i }).click();
  await expect(page).toHaveURL(/\/service-packages\?search=campaign(?:%20|\+)push$/);
  await expect(page.getByLabel("Search service packages")).toHaveValue("campaign push");
  await expect(filteredContentSprintLink).toBeVisible();
  await expect(brandLaunchLink).toBeHidden();
});

test("supports keyboard filtering and reopen flow from the service package library", async ({ page }) => {
  await signIn(page, "/service-packages");
  await expect(page).toHaveURL(/\/service-packages$/);

  const searchInput = page.getByLabel("Search service packages");
  await tabUntilFocused(page, searchInput);
  await expect(searchInput).toBeFocused();
  await page.keyboard.type("campaign push");

  const filteredPackageLink = page.locator(
    'a[href^="/service-packages/package-content-sprint?backTo="]',
  );
  await page.keyboard.press("Tab");
  await expect(filteredPackageLink).toBeFocused();
  await expectBackToParam(filteredPackageLink, "/service-packages?search=campaign%20push");
  await page.keyboard.press("Enter");

  await expect(page).toHaveURL(/\/service-packages\/package-content-sprint/);
  await expect(page.getByLabel("Service package name")).toHaveValue("Content Sprint Package");

  await page.getByRole("link", { name: /back to service packages/i }).click();
  await expect(page).toHaveURL(/\/service-packages\?search=campaign(?:%20|\+)push$/);
  await expect(page.getByLabel("Search service packages")).toHaveValue("campaign push");
});

test("creates a structured service package and shows explicit confirmation", async ({ page }) => {
  const packageName = `Website Refresh Package ${Date.now()}`;

  await signIn(page, "/service-packages/new");
  await expect(page).toHaveURL(/\/service-packages\/new$/);

  await page.getByLabel("Service package name").fill(packageName);
  await page.getByLabel("Category").fill("Web");
  await page.getByLabel("Short summary").fill("Refresh a marketing site for relaunch.");
  await page.getByLabel("Section title").fill("Discovery");
  await page.getByLabel("Section default content").fill("Audit and kickoff work.");
  await page.getByLabel("Line item name").fill("Site audit");
  await page.getByLabel("Line item default content").fill(
    "Audit current pages and conversion gaps.",
  );
  await page.getByLabel("Quantity").fill("1");
  await page.getByLabel("Unit label").fill("audit");
  await page.getByLabel("Unit price").fill("750");

  await expect(page.getByText("$750", { exact: true }).first()).toBeVisible();

  await page.getByRole("button", { name: "Create service package" }).click();

  await expect(page).not.toHaveURL(/\/service-packages\/new$/);
  await expect(page).toHaveURL(/\/service-packages\/[^/?]+(?:\?.*)?$/);
  await expect(page.getByRole("status")).toContainText("Service package created");
  await expect(page.getByLabel("Service package name")).toHaveValue(packageName);
  await expect(page.getByLabel("Section title").first()).toHaveValue("Discovery");
  await expect(page.getByLabel("Line item name").first()).toHaveValue("Site audit");
  await expect(page.getByText("$750", { exact: true }).first()).toBeVisible();
});

test("edits an existing structured service package and persists the latest saved values", async ({
  page,
}) => {
  const packageName = `Editable Package ${Date.now()}`;

  await signIn(page, "/service-packages/new");
  await expect(page).toHaveURL(/\/service-packages\/new$/);

  await page.getByLabel("Service package name").fill(packageName);
  await page.getByLabel("Category").fill("Branding");
  await page.getByLabel("Short summary").fill("Reusable launch support.");
  await page.getByLabel("Section title").fill("Discovery");
  await page.getByLabel("Section default content").fill("Audit and kickoff work.");
  await page.getByLabel("Line item name").fill("Discovery workshop");
  await page.getByLabel("Line item default content").fill("Half-day alignment session.");
  await page.getByLabel("Quantity").fill("1");
  await page.getByLabel("Unit label").fill("session");
  await page.getByLabel("Unit price").fill("1200");
  await page.getByRole("button", { name: "Create service package" }).click();

  await expect(page).not.toHaveURL(/\/service-packages\/new$/);
  await expect(page).toHaveURL(/\/service-packages\/[^/?]+(?:\?.*)?$/);
  const detailUrl = page.url();
  await page.goto(detailUrl);

  await page.getByLabel("Category").fill("Brand Strategy");
  await page.getByLabel("Section title").first().fill("Strategic foundation");
  await page.getByLabel("Line item name").first().fill("Discovery workshop");
  await page.getByLabel("Unit price").first().fill("1400");
  await expect(page.getByLabel("Category")).toHaveValue("Brand Strategy");
  await expect(page.getByLabel("Section title").first()).toHaveValue("Strategic foundation");
  await expect(page.getByLabel("Unit price").first()).toHaveValue("1400");
  await page.getByRole("button", { name: "Save service package changes" }).click();

  await expect(page.getByRole("status")).toContainText("Service package saved");
  await expect(page.getByText("$1,400", { exact: true }).first()).toBeVisible();
  await expect(page.getByLabel("Service package name")).toHaveValue(packageName);
});

test("preserves entered values on invalid structured submission", async ({ page }) => {
  await signIn(page, "/service-packages/package-brand-launch?backTo=/service-packages");
  await expect(page).toHaveURL(/\/service-packages\/package-brand-launch/);

  await page.getByLabel("Service package name").fill("Brand Launch Draft");
  await page.getByLabel("Section title").first().fill("");
  await page.getByLabel("Line item name").first().fill("");
  await page.getByRole("button", { name: "Save service package changes" }).click();

  await expect(page.locator("form").getByRole("alert")).toContainText(
    "Please correct the highlighted fields.",
  );
  await expect(page.getByLabel("Service package name")).toHaveValue("Brand Launch Draft");
  await expect(page.getByText("Section title is required.")).toBeVisible();
  await expect(page.getByText("Line item name is required.")).toBeVisible();
});

test("supports keyboard-only completion in the structured service package form", async ({ page }) => {
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
  await expect(page.getByLabel("Short summary")).toBeFocused();
  await page.keyboard.type("A reusable content sprint package.");

  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Add section" })).toBeFocused();

  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: /remove section 1/i })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Section title").first()).toBeFocused();
  await page.keyboard.type("Planning");

  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Section default content").first()).toBeFocused();
  await page.keyboard.type("Sprint planning and messaging alignment.");

  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: /remove line item 1/i })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Line item name").first()).toBeFocused();
  await page.keyboard.type("Content brief");
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Line item default content").first()).toBeFocused();
  await page.keyboard.type("Sprint brief and production plan.");

  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Quantity").first()).toBeFocused();
  await page.keyboard.press("Meta+A");
  await page.keyboard.type("1");

  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Unit label").first()).toBeFocused();
  await page.keyboard.type("brief");

  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Unit price").first()).toBeFocused();
  await page.keyboard.press("Meta+A");
  await page.keyboard.type("500");

  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Add line item" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Create service package" })).toBeFocused();
  await page.keyboard.press("Enter");

  await expect(page).not.toHaveURL(/\/service-packages\/new$/);
  await expect(page).toHaveURL(/\/service-packages\/[^/?]+(?:\?.*)?$/);
  await expect(page.getByRole("status")).toContainText("Service package created");
  await expect(page.getByLabel("Service package name")).toHaveValue(packageName);
});

test("keeps the structured editor usable at a tablet viewport", async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 820, height: 1180 } });

  await signIn(page, "/service-packages/package-brand-launch?backTo=/service-packages");
  await expect(page).toHaveURL(/\/service-packages\/package-brand-launch/);

  await expect(page.getByText("Sections and line items")).toBeVisible();
  await expect(page.getByLabel("Section title").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Save service package changes" })).toBeVisible();

  await page.close();
});
