import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/features/auth/require-session", () => ({
  requireSession: vi.fn(),
}));

describe("service package integration flow", () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    const { __resetServicePackagesStore } = await import(
      "@/features/service-packages/server/service-packages-repository"
    );
    __resetServicePackagesStore();

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
  });

  it("creates a service package, reloads it in list/detail reads, and persists updates", async () => {
    const { createServicePackage } = await import(
      "@/features/service-packages/server/actions/create-service-package"
    );
    const { updateServicePackage } = await import(
      "@/features/service-packages/server/actions/update-service-package"
    );
    const { getServicePackageById } = await import(
      "@/features/service-packages/server/queries/get-service-package-by-id"
    );
    const { listServicePackages } = await import(
      "@/features/service-packages/server/queries/list-service-packages"
    );

    const createResult = await createServicePackage({
      name: "Website Refresh Package",
      category: "Web",
      startingPriceLabel: "$3,200",
      shortDescription: "Refresh a marketing site for relaunch.",
    });

    expect(createResult.ok).toBe(true);
    if (!createResult.ok) {
      return;
    }

    const listResult = await listServicePackages();
    expect(listResult.ok).toBe(true);
    if (listResult.ok) {
      expect(
        listResult.data.servicePackages.some(
          (servicePackage) => servicePackage.id === createResult.data.servicePackage.id,
        ),
      ).toBe(true);
    }

    const updateResult = await updateServicePackage(createResult.data.servicePackage.id, {
      name: "Website Refresh Package",
      category: "Web Strategy",
      startingPriceLabel: "$3,500",
      shortDescription: "Refresh and relaunch support.",
    });

    expect(updateResult.ok).toBe(true);

    const detailResult = await getServicePackageById(createResult.data.servicePackage.id);
    expect(detailResult.ok).toBe(true);
    if (detailResult.ok) {
      expect(detailResult.data.servicePackage.category).toBe("Web Strategy");
      expect(detailResult.data.servicePackage.startingPriceLabel).toBe("$3,500");
      expect(detailResult.data.servicePackage.shortDescription).toBe(
        "Refresh and relaunch support.",
      );
    }
  });

  it("returns standard error envelopes for validation and authz denials", async () => {
    const { updateServicePackage } = await import(
      "@/features/service-packages/server/actions/update-service-package"
    );

    const invalidResult = await updateServicePackage("package-brand-launch", {
      name: "",
      category: "",
      startingPriceLabel: "",
      shortDescription: "",
    });

    expect(invalidResult).toMatchObject({
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Please correct the highlighted fields.",
      },
    });

    const authzResult = await updateServicePackage("package-other-studio", {
      name: "Hidden Orchard Package",
      category: "Campaign",
      startingPriceLabel: "$1,900",
      shortDescription: "Other studio package.",
    });

    expect(authzResult).toEqual({
      ok: false,
      error: {
        code: "FORBIDDEN",
        message: "You are not allowed to access this workspace.",
      },
    });
  });
});
