import { describe, expect, it } from "vitest";

import {
  buildQuoteDetailHref,
  buildQuotePreviewHref,
  buildQuoteRevisionReadyHref,
  sanitizeQuoteBackTo,
} from "@/features/quotes/lib/navigation";

describe("sanitizeQuoteBackTo", () => {
  it("returns default for undefined", () => {
    expect(sanitizeQuoteBackTo(undefined)).toBe("/quotes");
  });

  it("returns default for non-slash start", () => {
    expect(sanitizeQuoteBackTo("quotes")).toBe("/quotes");
  });

  it("returns default for protocol-relative paths", () => {
    expect(sanitizeQuoteBackTo("//evil.com")).toBe("/quotes");
  });
});

describe("buildQuoteDetailHref", () => {
  it("builds href with backTo param", () => {
    expect(buildQuoteDetailHref("q-1")).toBe("/quotes/q-1?backTo=%2Fquotes");
  });

  it("includes saved param when provided", () => {
    expect(buildQuoteDetailHref("q-1", undefined, "revised")).toBe(
      "/quotes/q-1?backTo=%2Fquotes&saved=revised",
    );
  });

  it("omits saved param when not provided", () => {
    const href = buildQuoteDetailHref("q-1");
    expect(href).not.toContain("saved=");
  });
});

describe("buildQuoteRevisionReadyHref", () => {
  it("builds href with saved=revised", () => {
    const href = buildQuoteRevisionReadyHref("q-1");
    expect(href).toContain("saved=revised");
    expect(href).toContain("/quotes/q-1?");
  });

  it("preserves backTo param", () => {
    const href = buildQuoteRevisionReadyHref("q-1");
    expect(href).toContain("backTo=%2Fquotes");
  });
});

describe("buildQuotePreviewHref", () => {
  it("builds preview href with backTo", () => {
    expect(buildQuotePreviewHref("q-1")).toBe(
      "/quotes/q-1/preview?backTo=%2Fquotes",
    );
  });

  it("includes saved param when provided", () => {
    expect(buildQuotePreviewHref("q-1", undefined, "revised")).toBe(
      "/quotes/q-1/preview?backTo=%2Fquotes&saved=revised",
    );
  });
});
