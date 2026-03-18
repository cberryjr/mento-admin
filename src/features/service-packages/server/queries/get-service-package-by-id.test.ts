import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/auth/require-session", () => ({
  requireSession: vi.fn(),
}));

describe("getServicePackageById (query)", () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    const { __resetServicePackagesStore } = await import(
      "@/features/service-packages/server/service-packages-repository"
    );
    __resetServicePackagesStore();
  });

  it("returns the service package for an authenticated studio owner", async () => {
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

    const { getServicePackageById } = await import(
      "@/features/service-packages/server/queries/get-service-package-by-id"
    );

    const result = await getServicePackageById("package-brand-launch");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.servicePackage.id).toBe("package-brand-launch");
      expect(result.data.servicePackage.name).toBe("Brand Launch Package");
      expect(result.data.servicePackage.category).toBe("Branding");
      expect(result.data.servicePackage.startingPriceLabel).toBe("$2,400");
    }
  });

  it("returns the latest persisted data when the detail view is reopened", async () => {
    const { requireSession } = await import("@/features/auth/require-session");
    const { updateServicePackageRecord } = await import(
      "@/features/service-packages/server/service-packages-repository"
    );

    vi.mocked(requireSession).mockResolvedValue({
      user: {
        id: "owner-1",
        email: "owner@example.com",
        role: "owner",
        studioId: "default-studio",
      },
      expires: new Date(Date.now() + 360000).toISOString(),
    });

    await updateServicePackageRecord("default-studio", "package-brand-launch", {
      name: "Brand Launch Package",
      category: "Brand Strategy",
      startingPriceLabel: "$2,750",
      shortDescription: "Updated launch support summary.",
    });

    const { getServicePackageById } = await import(
      "@/features/service-packages/server/queries/get-service-package-by-id"
    );

    const result = await getServicePackageById("package-brand-launch");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.servicePackage.category).toBe("Brand Strategy");
      expect(result.data.servicePackage.startingPriceLabel).toBe("$2,750");
      expect(result.data.servicePackage.shortDescription).toBe(
        "Updated launch support summary.",
      );
    }
  });

  it("returns an error envelope when the service package does not exist", async () => {
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

    const { getServicePackageById } = await import(
      "@/features/service-packages/server/queries/get-service-package-by-id"
    );

    const result = await getServicePackageById("package-nonexistent");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UNKNOWN");
    }
  });

  it("returns a FORBIDDEN error when the service package belongs to a different studio", async () => {
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

    const { getServicePackageById } = await import(
      "@/features/service-packages/server/queries/get-service-package-by-id"
    );

    const result = await getServicePackageById("package-other-studio");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("FORBIDDEN");
    }
  });

  it("returns an UNAUTHORIZED error when there is no active session", async () => {
    const { requireSession } = await import("@/features/auth/require-session");
    const { AppError } = await import("@/lib/errors/app-error");

    vi.mocked(requireSession).mockRejectedValueOnce(
      new AppError("UNAUTHORIZED", "You must sign in to continue."),
    );

    const { getServicePackageById } = await import(
      "@/features/service-packages/server/queries/get-service-package-by-id"
    );

    const result = await getServicePackageById("package-brand-launch");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UNAUTHORIZED");
    }
  });
});
