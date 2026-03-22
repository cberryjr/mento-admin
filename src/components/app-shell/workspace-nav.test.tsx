import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

import { usePathname } from "next/navigation";
import { WorkspaceNav, isNavItemActive } from "@/components/app-shell/workspace-nav";

describe("workspace nav active state", () => {
  it("matches exact routes", () => {
    expect(isNavItemActive("/clients", "/clients")).toBe(true);
    expect(isNavItemActive("/workspace", "/workspace")).toBe(true);
  });

  it("matches child detail routes", () => {
    expect(isNavItemActive("/clients/client-1", "/clients")).toBe(true);
    expect(
      isNavItemActive("/service-packages/package-1", "/service-packages"),
    ).toBe(true);
  });

  it("does not match unrelated routes", () => {
    expect(isNavItemActive("/quotes", "/clients")).toBe(false);
    expect(isNavItemActive("/clientship", "/clients")).toBe(false);
  });
});

describe("WorkspaceNav component", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders all navigation links", () => {
    vi.mocked(usePathname).mockReturnValue("/clients");
    render(<WorkspaceNav />);

    expect(screen.getByRole("link", { name: "Clients" })).toHaveAttribute("href", "/clients");
    expect(screen.getByRole("link", { name: "Service Packages" })).toHaveAttribute(
      "href",
      "/service-packages",
    );
    expect(screen.getByRole("link", { name: "Quotes" })).toHaveAttribute("href", "/quotes");
    expect(screen.getByRole("link", { name: "Invoices" })).toHaveAttribute("href", "/invoices");
    expect(screen.getByRole("link", { name: "Settings & Defaults" })).toHaveAttribute(
      "href",
      "/settings",
    );
  });

  it("marks the active link with aria-current='page'", () => {
    vi.mocked(usePathname).mockReturnValue("/clients");
    render(<WorkspaceNav />);

    expect(screen.getByRole("link", { name: "Clients" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Quotes" })).not.toHaveAttribute("aria-current");
  });

  it("marks child route parent as active", () => {
    vi.mocked(usePathname).mockReturnValue("/clients/client-1");
    render(<WorkspaceNav />);

    expect(screen.getByRole("link", { name: "Clients" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Service Packages" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("provides accessible nav landmark", () => {
    vi.mocked(usePathname).mockReturnValue("/quotes");
    render(<WorkspaceNav />);

    expect(screen.getByRole("navigation", { name: "Workspace sections" })).toBeVisible();
  });
});
