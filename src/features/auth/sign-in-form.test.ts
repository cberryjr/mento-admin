import { describe, expect, it } from "vitest";

import { resolveSafeRedirectPath } from "@/features/auth/sign-in-form";

describe("resolveSafeRedirectPath", () => {
  it("returns fallback for missing response url", () => {
    expect(resolveSafeRedirectPath(undefined, "/workspace")).toBe("/workspace");
    expect(resolveSafeRedirectPath(null, "/workspace")).toBe("/workspace");
  });

  it("returns relative urls unchanged", () => {
    expect(resolveSafeRedirectPath("/clients?tab=active", "/workspace")).toBe(
      "/clients?tab=active",
    );
  });

  it("converts same-origin absolute urls to app-relative paths", () => {
    expect(
      resolveSafeRedirectPath(
        "http://localhost:3000/service-packages?id=123#top",
        "/workspace",
      ),
    ).toBe("/service-packages?id=123#top");
  });

  it("falls back for cross-origin absolute urls", () => {
    expect(
      resolveSafeRedirectPath("http://localhost:4000/clients", "/workspace"),
    ).toBe("/workspace");
  });

  it("falls back for invalid urls", () => {
    expect(resolveSafeRedirectPath("not a url", "/workspace")).toBe(
      "/workspace",
    );
  });
});
