import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/features/auth/require-session", () => ({
  requireSession: vi.fn(),
}));

describe("createServicePackage", () => {
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

    const { createServicePackage } = await import(
      "@/features/service-packages/server/actions/create-service-package"
    );

    const result = await createServicePackage({
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

  it("creates a service package for an authenticated studio owner and revalidates affected paths", async () => {
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

    const { createServicePackage } = await import(
      "@/features/service-packages/server/actions/create-service-package"
    );

    const result = await createServicePackage({
      name: "Website Refresh Package",
      category: "Web",
      startingPriceLabel: "$3,200",
      shortDescription: "Refresh a marketing site for relaunch.",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.servicePackage.name).toBe("Website Refresh Package");
      expect(result.data.servicePackage.studioId).toBe("default-studio");
      expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith("/service-packages");
      expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith(
        `/service-packages/${result.data.servicePackage.id}`,
      );
    }
  });

  it("returns unauthorized when there is no active session", async () => {
    const { requireSession } = await import("@/features/auth/require-session");
    const { AppError } = await import("@/lib/errors/app-error");

    vi.mocked(requireSession).mockRejectedValueOnce(
      new AppError("UNAUTHORIZED", "You must sign in to continue."),
    );

    const { createServicePackage } = await import(
      "@/features/service-packages/server/actions/create-service-package"
    );

    const result = await createServicePackage({
      name: "Website Refresh Package",
      category: "Web",
      startingPriceLabel: "$3,200",
      shortDescription: "Refresh a marketing site for relaunch.",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UNAUTHORIZED");
    }
  });
});
