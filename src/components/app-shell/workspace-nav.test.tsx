import { describe, expect, it } from "vitest";
import { isNavItemActive } from "@/components/app-shell/workspace-nav";

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
