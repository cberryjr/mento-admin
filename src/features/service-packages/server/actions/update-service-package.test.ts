import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/features/auth/require-session", () => ({
  requireSession: vi.fn(),
}));

describe("updateServicePackage", () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    const { __resetServicePackagesStore } = await import(
      "@/features/service-packages/server/service-packages-repository"
    );
    __resetServicePackagesStore();
  });

  it("returns field errors for invalid payloads (auth first, then validation)", async () => {
    const { requireSession } = await import("@/features/auth/require-session");

    vi.mocked(requireSession).mockResolvedValue({
      user: {
        id: "owner-1",
        email: "owner@example.com",
        role: "owner",
        studioId: "default-studio",
      },
      expires: new Date(Date.now() + 360000).toISOString(),
    });

    const { updateServicePackage } = await import(
      "@/features/service-packages/server/actions/update-service-package"
    );

    const result = await updateServicePackage("package-brand-launch", {
      name: "",
      category: "",
      shortDescription: "",
      sections: [],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
      expect(result.error.fieldErrors?.name).toBeDefined();
      expect(result.error.fieldErrors?.category).toBeDefined();
      expect(result.error.fieldErrors?.sections).toBeDefined();
    }
  });

  it("updates a studio-owned service package and revalidates affected paths", async () => {
    const { requireSession } = await import("@/features/auth/require-session");
    const { revalidatePath } = await import("next/cache");

    vi.mocked(requireSession).mockResolvedValue({
      user: {
        id: "owner-1",
        email: "owner@example.com",
        role: "owner",
        studioId: "default-studio",
      },
      expires: new Date(Date.now() + 360000).toISOString(),
    });

    const { updateServicePackage } = await import(
      "@/features/service-packages/server/actions/update-service-package"
    );

    const result = await updateServicePackage("package-brand-launch", {
      name: "Brand Launch Package",
      category: "Brand Strategy",
      shortDescription: "Updated launch support summary.",
      sections: [
        {
          id: "section-strategy",
          title: "Strategy",
          defaultContent: "Audience and positioning updates.",
          position: 1,
          lineItems: [
            {
              id: "line-item-workshop",
              sectionId: "section-strategy",
              name: "Discovery workshop",
              defaultContent: "Updated discovery session.",
              quantity: 1,
              unitLabel: "session",
              unitPriceCents: 140000,
              position: 1,
            },
          ],
        },
      ],
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.servicePackage.category).toBe("Brand Strategy");
      expect(result.data.servicePackage.packageTotalCents).toBe(140000);
      expect(result.data.servicePackage.startingPriceLabel).toBe("$1,400");
      expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith("/service-packages");
      expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith(
        "/service-packages/package-brand-launch",
      );
    }
  });

  it("returns a normalized not-found error when the service package belongs to a different studio", async () => {
    const { requireSession } = await import("@/features/auth/require-session");

    vi.mocked(requireSession).mockResolvedValue({
      user: {
        id: "owner-1",
        email: "owner@example.com",
        role: "owner",
        studioId: "default-studio",
      },
      expires: new Date(Date.now() + 360000).toISOString(),
    });

    const { updateServicePackage } = await import(
      "@/features/service-packages/server/actions/update-service-package"
    );

    const result = await updateServicePackage("package-other-studio", {
      name: "Hidden Orchard Package",
      category: "Campaign",
      shortDescription: "Other studio package.",
      sections: [
        {
          id: "section-campaign",
          title: "Campaign",
          defaultContent: "Other studio package details.",
          position: 1,
          lineItems: [
            {
              id: "line-item-campaign",
              sectionId: "section-campaign",
              name: "Campaign package",
              defaultContent: "Other studio package used for auth coverage.",
              quantity: 1,
              unitLabel: "package",
              unitPriceCents: 190000,
              position: 1,
            },
          ],
        },
      ],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UNKNOWN");
      expect(result.error.message).toBe("Service package not found.");
    }
  });
});
