import { describe, expect, it } from "vitest";

import { GET } from "@/app/api/health/route";

describe("GET /api/health", () => {
  it("returns the standard success envelope", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.status).toBe("healthy");
    expect(new Date(body.data.timestamp).toISOString()).toBe(body.data.timestamp);
  });
});
