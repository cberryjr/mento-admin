import { Buffer } from "node:buffer";

import { expect, test, type Download, type Page } from "@playwright/test";

async function signIn(page: Page, path: string) {
  const email = process.env.STUDIO_OWNER_EMAIL ?? "owner@example.com";
  const password = process.env.STUDIO_OWNER_PASSWORD ?? "dev-password";

  await page.goto(path);
  await expect(page).toHaveURL(/\/sign-in/);

  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

async function createInvoiceFromQuote(page: Page) {
  await signIn(page, "/quotes/new");
  await expect(page).toHaveURL(/\/quotes\/new$/);

  await page.getByRole("radio", { name: /Sunrise Yoga Studio/i }).check();
  await page.getByRole("button", { name: "Continue to service packages" }).click();

  const quoteTitle = `InvoicePreviewFlow ${Date.now()}`;
  await page.getByLabel("Quote title").fill(quoteTitle);
  await page.getByRole("checkbox", { name: /Brand Launch Package/i }).check();
  await page.getByRole("button", { name: "Create quote draft" }).click();
  await page.getByRole("button", { name: "Generate quote content" }).click();

  await expect(page.getByText(/Quote editor/)).toBeVisible({ timeout: 10000 });
  await page.getByRole("button", { name: /mark as accepted/i }).click();
  await expect(
    page.getByText(
      "Quote marked as accepted. You can now convert this quote into an invoice.",
    ),
  ).toBeVisible();

  await page.reload();
  await expect(page.getByLabel("Quote status: accepted")).toBeVisible();
  await page.getByRole("button", { name: "Convert to invoice" }).click();

  await expect(page).toHaveURL(/\/invoices\/[^/?]+$/, { timeout: 15000 });
  await expect(page.getByRole("heading", { name: "Edit invoice", level: 2 })).toBeVisible();

  return quoteTitle;
}

async function readDownloadAsText(download: Download): Promise<string> {
  const stream = await download.createReadStream();

  if (!stream) {
    throw new Error("Could not read downloaded file.");
  }

  const chunks: Buffer[] = [];

  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString("utf8");
}

test("opens invoice preview and exports the invoice as a PDF", async ({ page }) => {
  const quoteTitle = await createInvoiceFromQuote(page);

  await expect(page.getByRole("link", { name: "Preview" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Export PDF" })).toBeVisible();

  const invoiceNumber = (await page.getByText(/^INV-/).first().textContent())?.trim();

  await page.getByRole("link", { name: "Preview" }).click();

  await expect(page).toHaveURL(/\/invoices\/[^/]+\/preview\?backTo=/, {
    timeout: 15000,
  });
  await expect(page.getByRole("heading", { name: "INVOICE" })).toBeVisible();
  await expect(page.getByText("Bill to")).toBeVisible();
  await expect(page.getByText("Sunrise Yoga Studio")).toBeVisible();
  await expect(page.getByText(quoteTitle)).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Payment instructions" }),
  ).toBeVisible();

  if (invoiceNumber) {
    await expect(page.getByText(invoiceNumber)).toBeVisible();
  }

  await page.getByRole("link", { name: /back to invoice/i }).click();
  await expect(page).toHaveURL(/\/invoices\/[^/?]+\?backTo=/, {
    timeout: 15000,
  });

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "Export PDF" }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(/^INV-.*\.pdf$/);

  const downloadText = await readDownloadAsText(download);

  expect(downloadText.startsWith("%PDF-")).toBe(true);
  expect(downloadText).toContain("INVOICE");
  expect(downloadText).toContain("Sunrise Yoga Studio");

  if (invoiceNumber) {
    expect(downloadText).toContain(invoiceNumber);
  }
});
