import { describe, expect, it } from "vitest";

import {
  servicePackageSchema,
  toServicePackageInput,
} from "@/features/service-packages/schemas/service-package-schema";

describe("servicePackageSchema", () => {
  it("accepts a valid service package payload", () => {
    const parsed = servicePackageSchema.parse({
      name: "Brand Launch Package",
      category: "Branding",
      startingPriceLabel: "$2,400",
      shortDescription: "A reusable package for launch-ready brand work.",
    });

    expect(parsed.name).toBe("Brand Launch Package");
    expect(parsed.category).toBe("Branding");
    expect(parsed.startingPriceLabel).toBe("$2,400");
    expect(parsed.shortDescription).toContain("launch-ready");
  });

  it("returns field errors for missing required values", () => {
    const result = servicePackageSchema.safeParse({
      name: "",
      category: "",
      startingPriceLabel: "",
      shortDescription:
        "This description is intentionally much longer than the schema should allow when summary text becomes too verbose for the library and picker surfaces.",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      expect(fieldErrors.name?.length).toBeGreaterThan(0);
      expect(fieldErrors.category?.length).toBeGreaterThan(0);
      expect(fieldErrors.startingPriceLabel?.length).toBeGreaterThan(0);
      expect(fieldErrors.shortDescription?.length).toBeGreaterThan(0);
    }
  });

  it("maps FormData values into normalized schema input", () => {
    const formData = new FormData();
    formData.set("name", "  Brand Launch Package  ");
    formData.set("category", "  Branding  ");
    formData.set("startingPriceLabel", "  $2,400  ");
    formData.set("shortDescription", "  Launch assets and rollout support.  ");

    expect(toServicePackageInput(formData)).toEqual({
      name: "Brand Launch Package",
      category: "Branding",
      startingPriceLabel: "$2,400",
      shortDescription: "Launch assets and rollout support.",
    });
  });
});
