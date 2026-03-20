import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/auth/require-session", () => ({
  requireSession: vi.fn(),
}));

describe("listServicePackages", () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    const { __resetServicePackagesStore } = await import(
      "@/features/service-packages/server/service-packages-repository"
    );
    __resetServicePackagesStore();
  });

  it("returns studio-scoped service packages for an authenticated owner", async () => {
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

    const { listServicePackages } = await import(
      "@/features/service-packages/server/queries/list-service-packages"
    );

    const result = await listServicePackages();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.servicePackages.length).toBeGreaterThan(0);
      expect(result.data.servicePackages.every((servicePackage) => servicePackage.id)).toBe(true);
      expect(
        result.data.servicePackages.every(
          (servicePackage) => typeof servicePackage.packageTotalCents === "number",
        ),
      ).toBe(true);
      expect(
        result.data.servicePackages.every((servicePackage) => !servicePackage.id.includes("other-studio")),
      ).toBe(true);
    }
  });

  it("returns an unauthorized error when there is no active session", async () => {
    const { requireSession } = await import("@/features/auth/require-session");
    const { AppError } = await import("@/lib/errors/app-error");

    vi.mocked(requireSession).mockRejectedValueOnce(
      new AppError("UNAUTHORIZED", "You must sign in to continue."),
    );

    const { listServicePackages } = await import(
      "@/features/service-packages/server/queries/list-service-packages"
    );

    const result = await listServicePackages();

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UNAUTHORIZED");
    }
  });
});
