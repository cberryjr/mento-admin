import { describe, expect, it } from "vitest";

import {
  studioDefaultsSchema,
  toStudioDefaultsInput,
} from "@/features/studio-defaults/schemas/studio-defaults-schema";

describe("studioDefaultsSchema", () => {
  it("accepts valid defaults payload", () => {
    const parsed = studioDefaultsSchema.parse({
      studioName: "Northwind Creative",
      studioContactName: "Casey Jones",
      studioContactEmail: "casey@example.com",
      studioContactPhone: "+1 555 0100",
      defaultQuoteTerms: "50% due at project start. Net 15 for remainder.",
      defaultInvoicePaymentInstructions:
        "Please pay by ACH transfer within 15 days.",
    });

    expect(parsed.studioName).toBe("Northwind Creative");
  });

  it("returns field errors for missing required values", () => {
    const result = studioDefaultsSchema.safeParse({
      studioName: "",
      studioContactName: "",
      studioContactEmail: "",
      studioContactPhone: "",
      defaultQuoteTerms: "",
      defaultInvoicePaymentInstructions: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.studioName?.length).toBeGreaterThan(0);
      expect(result.error.flatten().fieldErrors.studioContactName?.length).toBeGreaterThan(0);
      expect(result.error.flatten().fieldErrors.defaultQuoteTerms?.length).toBeGreaterThan(0);
      expect(
        result.error.flatten().fieldErrors.defaultInvoicePaymentInstructions?.length,
      ).toBeGreaterThan(0);
    }
  });

  it("maps FormData values into normalized schema input", () => {
    const formData = new FormData();
    formData.set("studioName", "  Northwind Creative  ");
    formData.set("studioContactName", "  Casey Jones  ");
    formData.set("studioContactEmail", "  CASEY@EXAMPLE.COM  ");
    formData.set("studioContactPhone", "  +1 555 0100  ");
    formData.set("defaultQuoteTerms", "  Net 15  ");
    formData.set("defaultInvoicePaymentInstructions", "  ACH only  ");

    const mapped = toStudioDefaultsInput(formData);

    expect(mapped).toEqual({
      studioName: "Northwind Creative",
      studioContactName: "Casey Jones",
      studioContactEmail: "casey@example.com",
      studioContactPhone: "+1 555 0100",
      defaultQuoteTerms: "Net 15",
      defaultInvoicePaymentInstructions: "ACH only",
    });
  });
});
