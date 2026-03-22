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

test("blocks progression until a client is selected", async ({ page }) => {
  await signIn(page, "/quotes/new");
  await expect(page).toHaveURL(/\/quotes\/new$/);

  await page.getByRole("button", { name: "Continue to service packages" }).click();

  await expect(page.getByText("Select a client before continuing.")).toBeVisible();
});

test("creates a quote draft from selected client and service package", async ({ page }) => {
  await signIn(page, "/quotes/new");
  await expect(page).toHaveURL(/\/quotes\/new$/);

  await page.getByRole("radio", { name: /Sunrise Yoga Studio/i }).check();
  await page.getByRole("button", { name: "Continue to service packages" }).click();

  await expect(page.getByRole("heading", { name: "Select service packages" })).toBeVisible();
  await page.getByLabel("Quote title").fill(`Quote ${Date.now()}`);
  await page.getByRole("checkbox", { name: /Brand Launch Package/i }).check();
  await page.getByRole("button", { name: "Create quote draft" }).click();

  await expect(page).toHaveURL(/\/quotes\/[^/?]+\?backTo=\/quotes&saved=created$/);
  await expect(page.getByRole("heading", { name: "Quote details" })).toBeVisible();
  await expect(page.getByRole("status")).toContainText("Quote draft created");
  await expect(page.getByText(/Selected service packages \(1\)/)).toBeVisible();
});

test("generates quote content from selected service packages", async ({ page }) => {
  await signIn(page, "/quotes/new");
  await expect(page).toHaveURL(/\/quotes\/new$/);

  await page.getByRole("radio", { name: /Sunrise Yoga Studio/i }).check();
  await page.getByRole("button", { name: "Continue to service packages" }).click();

  await expect(page.getByRole("heading", { name: "Select service packages" })).toBeVisible();
  const quoteTitle = `Quote ${Date.now()}`;
  await page.getByLabel("Quote title").fill(quoteTitle);
  await page.getByRole("checkbox", { name: /Brand Launch Package/i }).check();
  await page.getByRole("button", { name: "Create quote draft" }).click();

  await expect(page).toHaveURL(/\/quotes\/[^/?]+\?backTo=\/quotes&saved=created$/);
  await expect(page.getByRole("heading", { name: "Quote details" })).toBeVisible();

  await page.getByRole("button", { name: "Generate quote content" }).click();

  await expect(page.getByRole("button", { name: /generating/i })).toBeVisible();

  await expect(page.getByText(/Quote editor/)).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole("button", { name: "Generate quote content" })).toHaveCount(0);
  await expect(page.getByText(/Generation failed/i)).toHaveCount(0);
  await expect(page.getByRole("link", { name: /preview quote/i })).toBeVisible();

  await expect(page.getByText("Grand total")).toBeVisible();
});

test("edits quote content and saves the draft", async ({ page }) => {
  await signIn(page, "/quotes/new");
  await expect(page).toHaveURL(/\/quotes\/new$/);

  await page.getByRole("radio", { name: /Sunrise Yoga Studio/i }).check();
  await page.getByRole("button", { name: "Continue to service packages" }).click();

  const quoteTitle = `Quote ${Date.now()}`;
  await page.getByLabel("Quote title").fill(quoteTitle);
  await page.getByRole("checkbox", { name: /Brand Launch Package/i }).check();
  await page.getByRole("button", { name: "Create quote draft" }).click();
  await page.getByRole("button", { name: "Generate quote content" }).click();

  await expect(page.getByText(/Quote editor/)).toBeVisible({ timeout: 10000 });

  await page.getByLabel("Section title").first().fill("Brand strategy sprint");
  await page.getByLabel("Quantity").first().fill("3");
  await page.getByRole("button", { name: /save draft/i }).click();
  await expect(page.getByText("Quote draft saved successfully.")).toBeVisible();

  await page.getByRole("button", { name: /add section/i }).click();

  await expect(page.getByLabel("Section title")).toHaveCount(3);
  await expect(page.getByLabel("Section title").nth(2)).toHaveValue("New Section");

  await page
    .getByRole("button", { name: /remove line item/i })
    .first()
    .click();
  await page.getByRole("button", { name: "Remove line item", exact: true }).click();

  await page.getByRole("button", { name: /save draft/i }).click();

  await expect(page.getByText("Quote draft saved successfully.")).toBeVisible();
  await expect(page.getByText("Unsaved changes are being tracked.")).toHaveCount(0);
});

test("reorders sections, auto-saves pricing changes, and preserves readiness", async ({ page }) => {
  await signIn(page, "/quotes/new");
  await expect(page).toHaveURL(/\/quotes\/new$/);

  await page.getByRole("radio", { name: /Sunrise Yoga Studio/i }).check();
  await page.getByRole("button", { name: "Continue to service packages" }).click();

  const quoteTitle = `Quote ${Date.now()}`;
  await page.getByLabel("Quote title").fill(quoteTitle);
  await page.getByRole("checkbox", { name: /Brand Launch Package/i }).check();
  await page.getByRole("button", { name: "Create quote draft" }).click();
  await page.getByRole("button", { name: "Generate quote content" }).click();

  await expect(page.getByText(/Quote editor/)).toBeVisible({ timeout: 10000 });

  const sectionTitles = page.getByLabel("Section title");
  await expect(sectionTitles).toHaveCount(2);
  await sectionTitles.nth(1).fill("Revision Notes");

  const unitPriceInput = page.getByLabel("Unit price in dollars").first();
  await unitPriceInput.fill("750");
  await unitPriceInput.blur();
  await expect(
    page.getByText(/Line item saved|Quote draft saved successfully/),
  ).toBeVisible();

  const lineItemName = page.getByLabel("Line item name").first();
  await lineItemName.fill("");
  await expect(page.getByText(/items? need attention/i)).toBeVisible();
  await lineItemName.fill("Logo Design");
  await expect(page.getByText("Ready for preview")).toBeVisible();

  const moveSectionUpButton = page.getByRole("button", { name: "Move section up" }).last();
  await expect(moveSectionUpButton).toBeEnabled();
  await moveSectionUpButton.click();
  await expect(
    page.locator('input[placeholder="Section title"][value="Revision Notes"]'),
  ).toHaveCount(1);

  await page.reload();
  await expect(
    page.locator('input[placeholder="Section title"][value="Revision Notes"]'),
  ).toHaveCount(1);
  await expect(page.getByLabel("Unit price in dollars").first()).toHaveValue("750");
});

test("opens preview from the editor with the latest saved draft state and returns", async ({ page }) => {
  await signIn(page, "/quotes/new");
  await expect(page).toHaveURL(/\/quotes\/new$/);

  await page.getByRole("radio", { name: /Sunrise Yoga Studio/i }).check();
  await page.getByRole("button", { name: "Continue to service packages" }).click();

  const quoteTitle = `Quote ${Date.now()}`;
  await page.getByLabel("Quote title").fill(quoteTitle);
  await page.getByRole("checkbox", { name: /Brand Launch Package/i }).check();
  await page.getByRole("button", { name: "Create quote draft" }).click();
  await page.getByRole("button", { name: "Generate quote content" }).click();

  await expect(page.getByText(/Quote editor/)).toBeVisible({ timeout: 10000 });

  await page.getByLabel("Line item name").first().fill("Strategy Intensive");
  await page.getByRole("button", { name: /save draft/i }).click();
  await expect(
    page.getByText(/Quote draft saved successfully|Line item saved/),
  ).toBeVisible();
  await page.getByRole("link", { name: /preview quote/i }).click();

  await expect(page).toHaveURL(/\/quotes\/[^/]+\/preview\?backTo=/, {
    timeout: 15000,
  });
  await expect(page.getByText("Strategy Intensive")).toBeVisible();

  await page.getByRole("link", { name: /back to editor/i }).click();

  await expect(page).toHaveURL(/\/quotes\/[^?]+\?backTo=/);
  await expect(page.getByLabel("Line item name").first()).toHaveValue(
    "Strategy Intensive",
  );
});

test("saves a draft, navigates to the quotes list, and reopens it with preserved content", async ({ page }) => {
  await signIn(page, "/quotes/new");
  await expect(page).toHaveURL(/\/quotes\/new$/);

  await page.getByRole("radio", { name: /Sunrise Yoga Studio/i }).check();
  await page.getByRole("button", { name: "Continue to service packages" }).click();

  const quoteTitle = `SaveReopen ${Date.now()}`;
  await page.getByLabel("Quote title").fill(quoteTitle);
  await page.getByRole("checkbox", { name: /Brand Launch Package/i }).check();
  await page.getByRole("button", { name: "Create quote draft" }).click();
  await page.getByRole("button", { name: "Generate quote content" }).click();

  await expect(page.getByText(/Quote editor/)).toBeVisible({ timeout: 10000 });

  const sectionTitleInput = page.getByLabel("Section title").first();
  await sectionTitleInput.fill("Reopened Section Title");
  await page.getByRole("button", { name: /save draft/i }).click();
  await expect(page.getByText("Quote draft saved successfully.")).toBeVisible();

  await page.getByLabel("Quantity").first().fill("2");
  await page.getByRole("button", { name: /save draft/i }).click();
  await expect(
    page.getByText(/Quote draft saved successfully\.|Line item saved\./),
  ).toBeVisible();

  await page.getByRole("link", { name: /back to quotes/i }).click();
  await expect(page).toHaveURL(/\/quotes$/);

  const quoteRow = page.getByRole("link", { name: `Open ${quoteTitle}` });
  await expect(quoteRow).toBeVisible();
  await expect(quoteRow.getByText(/^draft$/i)).toBeVisible();

  await quoteRow.click();
  await expect(page).toHaveURL(/\/quotes\/[^?]+/);
  await expect(page.getByText(/Quote editor/)).toBeVisible({ timeout: 10000 });

  await expect(page.getByLabel("Section title").first()).toHaveValue(
    "Reopened Section Title",
  );
  await expect(page.getByLabel("Quantity").first()).toHaveValue("2");
});

test("reopens a draft in revision mode and keeps revision orientation through preview return", async ({ page }) => {
  await signIn(page, "/quotes/new");
  await expect(page).toHaveURL(/\/quotes\/new$/);

  await page.getByRole("radio", { name: /Sunrise Yoga Studio/i }).check();
  await page.getByRole("button", { name: "Continue to service packages" }).click();

  const quoteTitle = `RevisionFlow ${Date.now()}`;
  await page.getByLabel("Quote title").fill(quoteTitle);
  await page.getByRole("checkbox", { name: /Brand Launch Package/i }).check();
  await page.getByRole("button", { name: "Create quote draft" }).click();
  await page.getByRole("button", { name: "Generate quote content" }).click();

  await expect(page.getByText(/Quote editor/)).toBeVisible({ timeout: 10000 });
  await page.getByRole("button", { name: /save draft/i }).click();
  await expect(page.getByText("Quote draft saved successfully.")).toBeVisible();

  await page.getByRole("link", { name: /back to quotes/i }).click();
  await expect(page).toHaveURL(/\/quotes$/);

  await page.getByRole("link", { name: `Revise ${quoteTitle}` }).click();
  await expect(page).toHaveURL(/\/quotes\/[^?]+\?backTo=%2Fquotes&saved=revised$/);
  await expect(page.getByText("Revising existing quote")).toBeVisible();

  await page.getByRole("link", { name: /preview quote/i }).click();
  await expect(page).toHaveURL(
    /\/quotes\/[^/]+\/preview\?backTo=%2Fquotes&saved=revised$/,
    { timeout: 15000 },
  );

  await page.getByRole("link", { name: /back to editor/i }).click();
  await expect(page).toHaveURL(/\/quotes\/[^?]+\?backTo=%2Fquotes&saved=revised$/);
  await expect(page.getByText("Revising existing quote")).toBeVisible();
});

test("saves a revised quote, preserves the prior version, and reopens with the latest content", async ({ page }) => {
  await signIn(page, "/quotes/new");
  await expect(page).toHaveURL(/\/quotes\/new$/);

  await page.getByRole("radio", { name: /Sunrise Yoga Studio/i }).check();
  await page.getByRole("button", { name: "Continue to service packages" }).click();

  const quoteTitle = `RevisionSave ${Date.now()}`;
  await page.getByLabel("Quote title").fill(quoteTitle);
  await page.getByRole("checkbox", { name: /Brand Launch Package/i }).check();
  await page.getByRole("button", { name: "Create quote draft" }).click();
  await page.getByRole("button", { name: "Generate quote content" }).click();

  await expect(page.getByText(/Quote editor/)).toBeVisible({ timeout: 10000 });
  await page.getByRole("button", { name: /save draft/i }).click();
  await expect(page.getByText("Quote draft saved successfully.")).toBeVisible();

  await page.getByRole("link", { name: /back to quotes/i }).click();
  await expect(page).toHaveURL(/\/quotes$/);

  await page.getByRole("link", { name: `Revise ${quoteTitle}` }).click();
  await expect(page).toHaveURL(/\/quotes\/[^?]+\?backTo=%2Fquotes&saved=revised$/);
  await expect(page.getByText("Revising existing quote")).toBeVisible();

  await page.getByLabel("Section title").first().fill("Revision Saved Scope");
  await page.getByRole("button", { name: /save revision/i }).click();

  await expect(
    page.getByText("Revision saved. Previous version preserved."),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /revision history/i })).toBeVisible();

  await page.getByRole("link", { name: /back to quotes/i }).click();
  await expect(page).toHaveURL(/\/quotes$/);

  await page.getByRole("link", { name: `Open ${quoteTitle}` }).click();
  await expect(page).toHaveURL(/\/quotes\/[^?]+/);
  await expect(page.getByText(/Quote editor/)).toBeVisible({ timeout: 10000 });
  await expect(page.getByLabel("Section title").first()).toHaveValue(
    "Revision Saved Scope",
  );
  await expect(page.getByRole("link", { name: /revision history/i })).toBeVisible();
});

test("navigates to dedicated revision history page and views prior version", async ({ page }) => {
  await signIn(page, "/quotes/new");
  await expect(page).toHaveURL(/\/quotes\/new$/);

  await page.getByRole("radio", { name: /Sunrise Yoga Studio/i }).check();
  await page.getByRole("button", { name: "Continue to service packages" }).click();

  const quoteTitle = `RevHistoryPage ${Date.now()}`;
  await page.getByLabel("Quote title").fill(quoteTitle);
  await page.getByRole("checkbox", { name: /Brand Launch Package/i }).check();
  await page.getByRole("button", { name: "Create quote draft" }).click();
  await page.getByRole("button", { name: "Generate quote content" }).click();

  await expect(page.getByText(/Quote editor/)).toBeVisible({ timeout: 10000 });
  await page.getByRole("button", { name: /save draft/i }).click();
  await expect(page.getByText("Quote draft saved successfully.")).toBeVisible();

  await page.getByRole("link", { name: /back to quotes/i }).click();
  await expect(page).toHaveURL(/\/quotes$/);

  await page.getByRole("link", { name: `Revise ${quoteTitle}` }).click();
  await expect(page).toHaveURL(/\/quotes\/[^?]+\?backTo=%2Fquotes&saved=revised$/);

  await page.getByLabel("Section title").first().fill("Revision Page Scope");
  await page.getByRole("button", { name: /save revision/i }).click();
  await expect(page.getByText("Revision saved. Previous version preserved.")).toBeVisible();

  await page.getByRole("link", { name: /revision history/i }).click();
  await expect(page).toHaveURL(/\/quotes\/[^/]+\/revisions/);
  await expect(
    page.getByRole("heading", { name: "Revision history", level: 2 }),
  ).toBeVisible();

  await expect(
    page.getByRole("button", { name: /Current version/ }),
  ).toBeVisible();
  await expect(page.getByText("Current working version")).toBeVisible();
  await expect(page.getByText(/^Revision 1$/)).toBeVisible();

  await page.getByLabel("View revision 1").click();
  await expect(page.getByText("Revision 1 detail")).toBeVisible();

  await page.getByText("Back to current version").click();
  await expect(page.getByText("Current version detail")).toBeVisible();

  await page.getByRole("link", { name: "Back to quote", exact: true }).click();
  await expect(page).toHaveURL(/\/quotes\/[^?]+/);
});
