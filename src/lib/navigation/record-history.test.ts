import { describe, expect, it } from "vitest";

import {
  buildRecordHistoryHref,
  sanitizeRecordHistoryHref,
} from "@/lib/navigation/record-history";

describe("record history navigation", () => {
  it("builds record history hrefs with nested back navigation", () => {
    expect(
      buildRecordHistoryHref({
        entityType: "quote",
        entityId: "quote-1",
        backTo: "/quotes?search=Sunrise",
      }),
    ).toBe("/records/history?type=quote&id=quote-1&backTo=%2Fquotes%3Fsearch%3DSunrise");
  });

  it("preserves valid record history destinations", () => {
    expect(
      sanitizeRecordHistoryHref("/records/history?type=invoice&id=invoice-1&backTo=%2Finvoices"),
    ).toBe("/records/history?type=invoice&id=invoice-1&backTo=%2Finvoices");
  });

  it("rejects invalid entity types and unsafe destinations", () => {
    expect(
      sanitizeRecordHistoryHref("/records/history?type=oops&id=invoice-1&backTo=%2Finvoices"),
    ).toBeNull();
    expect(sanitizeRecordHistoryHref("//evil.example")).toBeNull();
  });
});
