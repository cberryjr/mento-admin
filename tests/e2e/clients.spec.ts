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

test("creates a client and shows explicit confirmation", async ({ page }) => {
  const clientName = `Northwind Creative ${Date.now()}`;

  await signIn(page, "/clients/new");
  await expect(page).toHaveURL(/\/clients\/new$/);

  await page.getByLabel("Client name").fill(clientName);
  await page.getByLabel("Contact name").fill("Casey Jones");
  await page.getByLabel("Contact email").fill("casey@example.com");
  await page.getByLabel("Contact phone").fill("+1 555 0100");
  await page.getByRole("button", { name: "Create client" }).click();

  await expect(page).toHaveURL(/\/clients\/[^/?]+/);
  await expect(page.getByRole("status")).toContainText("Client created");
  await expect(page.getByLabel("Client name")).toHaveValue(clientName);
});

test("edits an existing client and persists the latest saved values", async ({ page }) => {
  await signIn(page, "/clients/client-sunrise-yoga?backTo=/clients");
  await expect(page).toHaveURL(/\/clients\/client-sunrise-yoga/);

  await page.getByLabel("Contact phone").fill("+1 555 0198");
  await page.getByRole("button", { name: "Save client changes" }).click();

  await expect(page.getByRole("status")).toContainText("Client saved");

  await page.reload();
  await expect(page.getByLabel("Contact phone")).toHaveValue("+1 555 0198");
});

test("preserves entered values on invalid submission", async ({ page }) => {
  await signIn(page, "/clients/new");
  await expect(page).toHaveURL(/\/clients\/new$/);

  await page.getByLabel("Client name").fill("Northwind Drafts");
  await page.getByLabel("Contact email").fill("not-an-email");
  await page.getByRole("button", { name: "Create client" }).click();

  await expect(page.locator("form").getByRole("alert")).toContainText(
    "Please correct the highlighted fields.",
  );
  await expect(page.getByLabel("Client name")).toHaveValue("Northwind Drafts");
  await expect(page.getByLabel("Contact email")).toHaveValue("not-an-email");
  await expect(page.getByText("Contact email must be a valid email address.")).toBeVisible();
});

test("supports keyboard-only completion in the client form", async ({ page }) => {
  const clientName = `Keyboard Studio ${Date.now()}`;

  await signIn(page, "/clients/new");
  await expect(page).toHaveURL(/\/clients\/new$/);

  await page.getByRole("link", { name: "Back to clients" }).focus();
  await expect(page.getByRole("link", { name: "Back to clients" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Client name")).toBeFocused();
  await page.keyboard.type(clientName);
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Contact name")).toBeFocused();
  await page.keyboard.type("Avery Patel");
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Contact email")).toBeFocused();
  await page.keyboard.type("avery@example.com");
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Contact phone")).toBeFocused();
  await page.keyboard.type("+1 555 0144");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Create client" })).toBeFocused();
  await page.keyboard.press("Enter");

  await expect(page).toHaveURL(/\/clients\/[^/?]+/);
  await expect(page.getByRole("status")).toContainText("Client created");
  await expect(page.getByLabel("Client name")).toHaveValue(clientName);
});
