import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/features/auth/require-session", () => ({
  requireSession: vi.fn(),
}));

import ClientDetailPage from "@/app/(workspace)/clients/[clientId]/page";
import ClientsPage from "@/app/(workspace)/clients/page";
import ServicePackageDetailPage from "@/app/(workspace)/service-packages/[servicePackageId]/page";
import ServicePackagesPage from "@/app/(workspace)/service-packages/page";

afterEach(() => {
  cleanup();
});

describe("workspace list and reopen behavior", () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    const { __resetClientsStore } = await import(
      "@/features/clients/server/clients-repository"
    );
    __resetClientsStore();

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

  it("shows client list navigation targets", async () => {
    const ui = await ClientsPage();
    render(ui);

    expect(
      screen.getByRole("link", { name: /sunrise yoga studio/i }),
    ).toHaveAttribute(
      "href",
      "/clients/client-sunrise-yoga?backTo=/clients",
    );
  });

  it("shows service package list navigation targets", async () => {
    const ui = await ServicePackagesPage();
    render(ui);

    expect(
      screen.getByRole("link", { name: /brand launch package/i }),
    ).toHaveAttribute(
      "href",
      "/service-packages/package-brand-launch?backTo=/service-packages",
    );
  });

  it("shows explicit back links in detail pages", async () => {
    const clientUi = await ClientDetailPage({
      params: Promise.resolve({ clientId: "client-sunrise-yoga" }),
      searchParams: Promise.resolve({ backTo: "/clients" }),
    });
    render(clientUi);

    expect(screen.getByRole("link", { name: /back to clients/i })).toHaveAttribute(
      "href",
      "/clients",
    );

    const serviceUi = await ServicePackageDetailPage({
      params: Promise.resolve({ servicePackageId: "package-brand-launch" }),
      searchParams: Promise.resolve({ backTo: "/service-packages" }),
    });
    render(serviceUi);

    expect(
      screen.getByRole("link", { name: /back to service packages/i }),
    ).toHaveAttribute("href", "/service-packages");
  });
});
