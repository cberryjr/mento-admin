import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDefaultComplexityTiers } from "@/features/service-packages/types";

function buildValidInput() {
  return {
    name: "Website Refresh Package",
    categoryKey: "ai-print-campaigns" as const,
    categoryLabel: "AI Print Campaigns",
    categoryShortLabel: "Print",
    category: "AI Print Campaigns",
    shortDescription: "Refresh a marketing site for relaunch.",
    complexityTiers: createDefaultComplexityTiers("ai-print-campaigns"),
    sections: [
      {
        id: "section-web",
        title: "Website",
        defaultContent: "Core site refresh work.",
        position: 1,
        lineItems: [
          {
            id: "line-item-pages",
            sectionId: "section-web",
            name: "Page redesign",
            defaultContent: "Homepage and sales page refresh.",
            quantity: 2,
            unitLabel: "page",
            unitPriceCents: 125000,
            position: 1,
          },
        ],
      },
    ],
  };
}

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
      categoryKey: "ai-print-campaigns",
      categoryLabel: "AI Print Campaigns",
      categoryShortLabel: "Print",
      category: "",
      shortDescription: "",
      complexityTiers: [],
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

    const result = await createServicePackage(buildValidInput());

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.servicePackage.name).toBe("Website Refresh Package");
      expect(result.data.servicePackage.studioId).toBe("default-studio");
      expect(result.data.servicePackage.packageTotalCents).toBe(250000);
      expect(result.data.servicePackage.startingPriceLabel).toBe("$2,500");
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

    const result = await createServicePackage(buildValidInput());

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UNAUTHORIZED");
    }
  });
});
