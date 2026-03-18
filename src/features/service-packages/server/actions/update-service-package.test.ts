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
      startingPriceLabel: "",
      shortDescription: "",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
      expect(result.error.fieldErrors?.name).toBeDefined();
      expect(result.error.fieldErrors?.category).toBeDefined();
      expect(result.error.fieldErrors?.startingPriceLabel).toBeDefined();
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
      startingPriceLabel: "$2,750",
      shortDescription: "Updated launch support summary.",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.servicePackage.category).toBe("Brand Strategy");
      expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith("/service-packages");
      expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith(
        "/service-packages/package-brand-launch",
      );
    }
  });

  it("returns forbidden when the service package belongs to a different studio", async () => {
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
      startingPriceLabel: "$1,900",
      shortDescription: "Other studio package.",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("FORBIDDEN");
    }
  });
});
