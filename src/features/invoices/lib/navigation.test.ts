import { describe, expect, it } from "vitest";

import {
  buildInvoiceDetailHref,
  buildInvoicePreviewHref,
  sanitizeInvoiceBackTo,
} from "@/features/invoices/lib/navigation";

describe("invoice navigation", () => {
  it("defaults to the invoices list when backTo is missing", () => {
    expect(sanitizeInvoiceBackTo()).toBe("/invoices");
  });

  it("preserves invoices search state", () => {
    expect(sanitizeInvoiceBackTo("/invoices?search=Sunrise")).toBe(
      "/invoices?search=Sunrise",
    );
  });

  it("preserves linked quote detail context", () => {
    expect(sanitizeInvoiceBackTo("/quotes/quote-1?backTo=/quotes&saved=revised")).toBe(
      "/quotes/quote-1?backTo=%2Fquotes&saved=revised",
    );
  });

  it("preserves validated record history context", () => {
    expect(
      sanitizeInvoiceBackTo("/records/history?type=invoice&id=invoice-1&backTo=%2Finvoices"),
    ).toBe("/records/history?type=invoice&id=invoice-1&backTo=%2Finvoices");
  });

  it("rejects unsafe destinations", () => {
    expect(sanitizeInvoiceBackTo("//evil.example")).toBe("/invoices");
    expect(sanitizeInvoiceBackTo("/clients/client-1")).toBe("/invoices");
  });

  it("builds invoice detail and preview hrefs with sanitized backTo", () => {
    expect(buildInvoiceDetailHref("invoice-1", "/quotes/quote-1?backTo=/quotes")).toBe(
      "/invoices/invoice-1?backTo=%2Fquotes%2Fquote-1%3FbackTo%3D%252Fquotes",
    );
    expect(buildInvoicePreviewHref("invoice-1", "/quotes/quote-1?backTo=/quotes")).toBe(
      "/invoices/invoice-1/preview?backTo=%2Fquotes%2Fquote-1%3FbackTo%3D%252Fquotes",
    );
  });
});
