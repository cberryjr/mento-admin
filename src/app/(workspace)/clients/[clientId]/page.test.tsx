import type { ReactNode } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ActionResult } from "@/lib/validation/action-result";
import type { ClientDetailRecord, ClientRecord } from "@/features/clients/types";

const notFound = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  notFound,
  useRouter: () => ({
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock("@/features/clients/server/queries/get-client-by-id", () => ({
  getClientById: vi.fn(),
}));

vi.mock("@/features/clients/server/actions/update-client", () => ({
  updateClient: vi.fn(async () => ({
    ok: true,
    data: {
      client: {
        id: "client-sunrise-yoga",
        studioId: "default-studio",
        name: "Sunrise Yoga Studio",
        contactName: "Avery Patel",
        contactEmail: "ops@sunriseyoga.example",
        contactPhone: "+1 555 0101",
        createdAt: "2026-03-01T09:00:00.000Z",
        updatedAt: "2026-03-10T15:30:00.000Z",
      },
    },
  })),
}));

const EXISTING_CLIENT: ClientRecord = {
  id: "client-sunrise-yoga",
  studioId: "default-studio",
  name: "Sunrise Yoga Studio",
  contactName: "Avery Patel",
  contactEmail: "ops@sunriseyoga.example",
  contactPhone: "+1 555 0101",
  createdAt: "2026-03-01T09:00:00.000Z",
  updatedAt: "2026-03-10T15:30:00.000Z",
};

const POPULATED_DETAIL_RESULT: ActionResult<ClientDetailRecord> = {
  ok: true,
  data: {
    client: EXISTING_CLIENT,
    relatedQuotes: [
      {
        id: "quote-sunrise-retainer",
        quoteNumber: "Q-2026-014",
        title: "Monthly brand retainer",
        status: "draft",
        updatedAt: "2026-03-14T09:15:00.000Z",
      },
    ],
    relatedInvoices: [
      {
        id: "invoice-sunrise-deposit",
        invoiceNumber: "INV-2026-006",
        title: "Kickoff deposit",
        status: "paid",
        updatedAt: "2026-03-12T18:20:00.000Z",
      },
    ],
  },
};

const EMPTY_DETAIL_RESULT: ActionResult<ClientDetailRecord> = {
  ok: true,
  data: {
    client: EXISTING_CLIENT,
    relatedQuotes: [],
    relatedInvoices: [],
  },
};

afterEach(() => {
  cleanup();
});

describe("ClientDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders saved client details with labeled related quote and invoice regions", async () => {
    const { getClientById } = await import("@/features/clients/server/queries/get-client-by-id");
    vi.mocked(getClientById).mockResolvedValue(POPULATED_DETAIL_RESULT);

    const Page = (await import("@/app/(workspace)/clients/[clientId]/page")).default;
    render(
      await Page({
        params: Promise.resolve({ clientId: "client-sunrise-yoga" }),
        searchParams: Promise.resolve({ backTo: "/clients" }),
      }),
    );

    expect(screen.getByText("Sunrise Yoga Studio")).toBeVisible();
    expect(screen.getByText("ops@sunriseyoga.example")).toBeVisible();
    expect(screen.getByRole("region", { name: "Related quotes" })).toBeVisible();
    expect(screen.getByRole("region", { name: "Related invoices" })).toBeVisible();
    expect(screen.getByText("Q-2026-014")).toBeVisible();
    expect(screen.getByText("INV-2026-006")).toBeVisible();
  });

  it("renders empty states with obvious related-record actions", async () => {
    const { getClientById } = await import("@/features/clients/server/queries/get-client-by-id");
    vi.mocked(getClientById).mockResolvedValue(EMPTY_DETAIL_RESULT);

    const Page = (await import("@/app/(workspace)/clients/[clientId]/page")).default;
    render(
      await Page({
        params: Promise.resolve({ clientId: "client-sunrise-yoga" }),
        searchParams: Promise.resolve({ backTo: "/clients" }),
      }),
    );

    const quotesLink = screen.getByRole("link", { name: "Open quotes workspace" });
    const invoicesLink = screen.getByRole("link", { name: "Open invoices workspace" });

    expect(screen.getByText("No quotes for this client yet")).toBeVisible();
    expect(screen.getByText("No invoices for this client yet")).toBeVisible();
    expect(quotesLink).toHaveAttribute("href", "/quotes");
    expect(invoicesLink).toHaveAttribute("href", "/invoices");
    expect(quotesLink).toHaveClass("focus-visible:outline-zinc-900");
    expect(invoicesLink).toHaveClass("focus-visible:outline-zinc-900");
  });

  it("resolves to notFound when the client cannot be loaded", async () => {
    const { getClientById } = await import("@/features/clients/server/queries/get-client-by-id");
    vi.mocked(getClientById).mockResolvedValue({
      ok: false,
      error: {
        code: "UNKNOWN",
        message: "Client not found.",
      },
    });

    const Page = (await import("@/app/(workspace)/clients/[clientId]/page")).default;

    await expect(
      Page({
        params: Promise.resolve({ clientId: "client-missing" }),
        searchParams: Promise.resolve({ backTo: "/clients" }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(notFound).toHaveBeenCalledTimes(1);
  });
});
