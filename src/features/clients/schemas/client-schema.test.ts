import { describe, expect, it } from "vitest";

import {
  clientSchema,
  toClientInput,
} from "@/features/clients/schemas/client-schema";

describe("clientSchema", () => {
  it("accepts a valid client payload", () => {
    const parsed = clientSchema.parse({
      name: "Northwind Creative",
      contactName: "Casey Jones",
      contactEmail: "casey@example.com",
      contactPhone: "+1 555 0100",
    });

    expect(parsed.name).toBe("Northwind Creative");
    expect(parsed.contactEmail).toBe("casey@example.com");
  });

  it("returns field errors for missing required values", () => {
    const result = clientSchema.safeParse({
      name: "",
      contactName: "",
      contactEmail: "not-an-email",
      contactPhone: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.name?.length).toBeGreaterThan(0);
      expect(result.error.flatten().fieldErrors.contactEmail?.length).toBeGreaterThan(0);
    }
  });

  it("maps FormData values into normalized schema input", () => {
    const formData = new FormData();
    formData.set("name", "  Northwind Creative  ");
    formData.set("contactName", "  Casey Jones  ");
    // toClientInput trims only; email normalization (toLowerCase) happens in the Zod schema.
    formData.set("contactEmail", "  CASEY@EXAMPLE.COM  ");
    formData.set("contactPhone", "  +1 555 0100  ");

    expect(toClientInput(formData)).toEqual({
      name: "Northwind Creative",
      contactName: "Casey Jones",
      contactEmail: "CASEY@EXAMPLE.COM",
      contactPhone: "+1 555 0100",
    });
  });
});
