import { describe, expect, it, vi } from "vitest";

vi.mock("next-auth/jwt", () => ({
  getToken: vi.fn(),
}));

describe("proxy", () => {
  it("redirects unauthenticated users away from protected workspace routes", async () => {
    const { getToken } = await import("next-auth/jwt");
    vi.mocked(getToken).mockResolvedValueOnce(null);

    const { proxy } = await import("@/proxy");
    const request = new Request("http://localhost:3000/workspace", {
      headers: {
        cookie: "",
      },
    });

    const response = await proxy(request as never);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/sign-in");
  });

  it("redirects unauthenticated users away from protected record routes", async () => {
    const { getToken } = await import("next-auth/jwt");
    vi.mocked(getToken).mockResolvedValueOnce(null);

    const { proxy } = await import("@/proxy");
    const request = new Request("http://localhost:3000/clients", {
      headers: {
        cookie: "",
      },
    });

    const response = await proxy(request as never);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/sign-in");
  });

  it("redirects authenticated users away from sign-in", async () => {
    const { getToken } = await import("next-auth/jwt");
    vi.mocked(getToken).mockResolvedValueOnce({ sub: "owner-1" } as never);

    const { proxy } = await import("@/proxy");
    const request = new Request("http://localhost:3000/sign-in", {
      headers: {
        cookie: "next-auth.session-token=token",
      },
    });

    const response = await proxy(request as never);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/workspace");
  });
});
