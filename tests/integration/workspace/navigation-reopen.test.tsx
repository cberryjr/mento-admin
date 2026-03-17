import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import ClientDetailPage from "@/app/(workspace)/clients/[clientId]/page";
import ClientsPage from "@/app/(workspace)/clients/page";
import ServicePackageDetailPage from "@/app/(workspace)/service-packages/[servicePackageId]/page";
import ServicePackagesPage from "@/app/(workspace)/service-packages/page";

describe("workspace list and reopen behavior", () => {
  it("shows client list navigation targets", async () => {
    const ui = await ClientsPage();
    render(ui);

    expect(
      screen.getByRole("link", { name: /sunrise yoga studio/i }),
    ).toHaveAttribute(
      "href",
      "/clients/client-sunrise-yoga?backTo=%2Fclients",
    );
  });

  it("shows service package list navigation targets", async () => {
    const ui = await ServicePackagesPage();
    render(ui);

    expect(
      screen.getByRole("link", { name: /brand launch package/i }),
    ).toHaveAttribute(
      "href",
      "/service-packages/package-brand-launch?backTo=%2Fservice-packages",
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
