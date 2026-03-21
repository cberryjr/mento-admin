import { describe, expect, it } from "vitest";

import {
  createQuoteSchema,
  getCreateQuoteFieldErrors,
} from "@/features/quotes/schemas/create-quote-schema";

describe("createQuoteSchema", () => {
  it("accepts valid input", () => {
    const result = createQuoteSchema.safeParse({
      clientId: "client-1",
      title: "My Quote",
      selectedServicePackageIds: ["sp-1", "sp-2"],
      terms: "Net 30",
    });

    expect(result.success).toBe(true);
  });

  it("accepts empty terms", () => {
    const result = createQuoteSchema.safeParse({
      clientId: "client-1",
      title: "My Quote",
      selectedServicePackageIds: ["sp-1"],
      terms: "",
    });

    expect(result.success).toBe(true);
  });

  it("accepts missing terms", () => {
    const result = createQuoteSchema.safeParse({
      clientId: "client-1",
      title: "My Quote",
      selectedServicePackageIds: ["sp-1"],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.terms).toBe("");
    }
  });

  it("rejects empty clientId", () => {
    const result = createQuoteSchema.safeParse({
      clientId: "",
      title: "My Quote",
      selectedServicePackageIds: ["sp-1"],
      terms: "",
    });

    expect(result.success).toBe(false);
  });

  it("rejects empty title", () => {
    const result = createQuoteSchema.safeParse({
      clientId: "client-1",
      title: "",
      selectedServicePackageIds: ["sp-1"],
      terms: "",
    });

    expect(result.success).toBe(false);
  });

  it("rejects empty selectedServicePackageIds", () => {
    const result = createQuoteSchema.safeParse({
      clientId: "client-1",
      title: "My Quote",
      selectedServicePackageIds: [],
      terms: "",
    });

    expect(result.success).toBe(false);
  });

  it("rejects title exceeding 160 characters", () => {
    const result = createQuoteSchema.safeParse({
      clientId: "client-1",
      title: "x".repeat(161),
      selectedServicePackageIds: ["sp-1"],
      terms: "",
    });

    expect(result.success).toBe(false);
  });

  it("getCreateQuoteFieldErrors maps path to field keys", () => {
    const result = createQuoteSchema.safeParse({
      clientId: "",
      title: "",
      selectedServicePackageIds: [],
      terms: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = getCreateQuoteFieldErrors(result.error);
      expect(errors.clientId).toBeDefined();
      expect(errors.title).toBeDefined();
      expect(errors.selectedServicePackageIds).toBeDefined();
    }
  });
});
