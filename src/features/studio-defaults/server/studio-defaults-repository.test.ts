import { beforeEach, describe, expect, it } from "vitest";

import {
  loadStudioDefaults,
  saveStudioDefaults,
} from "@/features/studio-defaults/server/studio-defaults-repository";

const STUDIO_ID = "studio-1";

const VALID_INPUT = {
  studioName: "Northwind Creative",
  studioContactName: "Casey Jones",
  studioContactEmail: "casey@example.com",
  studioContactPhone: "+1 555 0100",
  defaultQuoteTerms: "50% upfront. Net 15 for remaining balance.",
  defaultInvoicePaymentInstructions: "Please pay by ACH within 15 days.",
};

describe("studio-defaults-repository (in-memory fallback)", () => {
  beforeEach(async () => {
    const mod = await import("@/features/studio-defaults/server/store/studio-defaults-store");
    mod.__resetStudioDefaultsStore();
  });

  it("returns null when no defaults have been saved", async () => {
    const result = await loadStudioDefaults(STUDIO_ID);
    expect(result).toBeNull();
  });

  it("saves and loads defaults", async () => {
    const saved = await saveStudioDefaults(STUDIO_ID, VALID_INPUT);
    expect(saved.studioName).toBe("Northwind Creative");
    expect(saved.studioId).toBe(STUDIO_ID);

    const loaded = await loadStudioDefaults(STUDIO_ID);
    expect(loaded).not.toBeNull();
    expect(loaded?.studioName).toBe("Northwind Creative");
  });

  it("overwrites defaults on subsequent save (upsert behavior)", async () => {
    await saveStudioDefaults(STUDIO_ID, VALID_INPUT);

    const updated = await saveStudioDefaults(STUDIO_ID, {
      ...VALID_INPUT,
      studioName: "Updated Studio",
      defaultQuoteTerms: "Net 30.",
    });

    expect(updated.studioName).toBe("Updated Studio");
    expect(updated.defaultQuoteTerms).toBe("Net 30.");

    const loaded = await loadStudioDefaults(STUDIO_ID);
    expect(loaded?.studioName).toBe("Updated Studio");
  });

  it("preserves createdAt across updates but updates updatedAt", async () => {
    const first = await saveStudioDefaults(STUDIO_ID, VALID_INPUT);
    const originalCreatedAt = first.createdAt;

    await new Promise((resolve) => setTimeout(resolve, 10));

    const second = await saveStudioDefaults(STUDIO_ID, {
      ...VALID_INPUT,
      studioName: "Changed",
    });

    expect(second.createdAt).toBe(originalCreatedAt);
    expect(second.updatedAt).not.toBe(first.updatedAt);
  });

  it("builds stable prefill contract in returned record", async () => {
    const saved = await saveStudioDefaults(STUDIO_ID, VALID_INPUT);

    expect(saved.prefill).toEqual({
      studioName: "Northwind Creative",
      studioContactDetails: {
        name: "Casey Jones",
        email: "casey@example.com",
        phone: "+1 555 0100",
      },
      defaultQuoteTerms: "50% upfront. Net 15 for remaining balance.",
      defaultInvoicePaymentInstructions: "Please pay by ACH within 15 days.",
    });
  });

  it("isolates defaults per studioId", async () => {
    await saveStudioDefaults("studio-a", { ...VALID_INPUT, studioName: "Studio A" });
    await saveStudioDefaults("studio-b", { ...VALID_INPUT, studioName: "Studio B" });

    const a = await loadStudioDefaults("studio-a");
    const b = await loadStudioDefaults("studio-b");

    expect(a?.studioName).toBe("Studio A");
    expect(b?.studioName).toBe("Studio B");
  });
});
