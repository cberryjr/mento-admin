import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

import { QuoteSetupForm } from "@/features/quotes/components/quote-setup-form";

const pushSpy = vi.fn();
const refreshSpy = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushSpy,
    refresh: refreshSpy,
    replace: vi.fn(),
  }),
}));

afterEach(() => {
  cleanup();
  pushSpy.mockReset();
  refreshSpy.mockReset();
});

function createClients(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `client-${i + 1}`,
    name: `Client ${i + 1}`,
    contactEmail: `client${i + 1}@example.com`,
    updatedAt: "2026-03-19T00:00:00.000Z",
  }));
}

function createServicePackages(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `sp-${i + 1}`,
    name: `Package ${i + 1}`,
    category: "AI Print Campaigns",
    startingPriceLabel: "$1,000",
    shortDescription: `Description for package ${i + 1}`,
    updatedAt: "2026-03-19T00:00:00.000Z",
    packageTotalCents: 100000,
  }));
}

describe("QuoteSetupForm", () => {
  const submitAction = vi.fn();

  afterEach(() => {
    submitAction.mockReset();
  });

  it("renders client selection stage by default", () => {
    render(
      <QuoteSetupForm
        clients={createClients(2)}
        servicePackages={createServicePackages(1)}
        submitAction={submitAction}
      />,
    );

    expect(screen.getByText("Select client")).toBeInTheDocument();
    expect(screen.getByText("Client 1")).toBeInTheDocument();
    expect(screen.getByText("Client 2")).toBeInTheDocument();
  });

  it("shows empty state when no clients exist", () => {
    render(
      <QuoteSetupForm
        clients={[]}
        servicePackages={createServicePackages(1)}
        submitAction={submitAction}
      />,
    );

    expect(screen.getByText(/No clients exist yet/)).toBeInTheDocument();
    expect(screen.getByText("Create client")).toBeInTheDocument();
  });

  it("shows inline error when continuing without client selection", () => {
    render(
      <QuoteSetupForm
        clients={createClients(2)}
        servicePackages={createServicePackages(1)}
        submitAction={submitAction}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Continue to service packages" }));

    expect(
      screen.getByText("Select a client before continuing."),
    ).toBeInTheDocument();
  });

  it("moves to package stage after selecting a client", () => {
    render(
      <QuoteSetupForm
        clients={createClients(1)}
        servicePackages={createServicePackages(2)}
        submitAction={submitAction}
      />,
    );

    fireEvent.click(screen.getByRole("radio", { name: /Client 1/i }));
    fireEvent.click(screen.getByRole("button", { name: "Continue to service packages" }));

    expect(screen.getByText("Select service packages")).toBeInTheDocument();
    expect(screen.getByLabelText("Quote title")).toBeInTheDocument();
    expect(screen.getByLabelText("Search packages")).toBeInTheDocument();
  });

  it("shows empty state when no service packages exist", () => {
    render(
      <QuoteSetupForm
        clients={createClients(1)}
        servicePackages={[]}
        submitAction={submitAction}
      />,
    );

    fireEvent.click(screen.getByRole("radio", { name: /Client 1/i }));
    fireEvent.click(screen.getByRole("button", { name: "Continue to service packages" }));

    expect(screen.getByText(/No service packages exist yet/)).toBeInTheDocument();
    expect(screen.getByText("Create service package")).toBeInTheDocument();
  });

  it("submits selected client and packages and navigates on success", async () => {
    submitAction.mockResolvedValue({
      ok: true,
      data: {
        quote: {
          id: "quote-123",
          studioId: "default-studio",
          clientId: "client-1",
          quoteNumber: "Q-20260319-ABC12345",
          title: "Quote title",
          status: "draft",
          terms: "",
          selectedServicePackageIds: ["sp-1"],
          createdAt: "2026-03-19T00:00:00.000Z",
          updatedAt: "2026-03-19T00:00:00.000Z",
        },
      },
    });

    render(
      <QuoteSetupForm
        clients={createClients(1)}
        servicePackages={createServicePackages(2)}
        submitAction={submitAction}
      />,
    );

    fireEvent.click(screen.getByRole("radio", { name: /Client 1/i }));
    fireEvent.click(screen.getByRole("button", { name: "Continue to service packages" }));
    fireEvent.change(screen.getByLabelText("Quote title"), {
      target: { value: "Quote title" },
    });
    fireEvent.click(screen.getByRole("checkbox", { name: /Package 1/i }));
    fireEvent.click(screen.getByRole("button", { name: "Create quote draft" }));

    await waitFor(() => {
      expect(submitAction).toHaveBeenCalledWith({
        clientId: "client-1",
        title: "Quote title",
        selectedServicePackageIds: ["sp-1"],
        terms: "",
      });
    });
    expect(pushSpy).toHaveBeenCalledWith(
      "/quotes/quote-123?backTo=/quotes&saved=created",
    );
    expect(refreshSpy).toHaveBeenCalled();
  });

  it("shows submit error and preserves entered state", async () => {
    submitAction.mockResolvedValue({
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "One or more selected service packages are no longer available.",
        fieldErrors: {
          selectedServicePackageIds: ["Select valid service packages."],
        },
      },
    });

    render(
      <QuoteSetupForm
        clients={createClients(1)}
        servicePackages={createServicePackages(1)}
        submitAction={submitAction}
      />,
    );

    fireEvent.click(screen.getByRole("radio", { name: /Client 1/i }));
    fireEvent.click(screen.getByRole("button", { name: "Continue to service packages" }));
    fireEvent.change(screen.getByLabelText("Quote title"), {
      target: { value: "My quote" },
    });
    fireEvent.click(screen.getByRole("checkbox", { name: /Package 1/i }));
    fireEvent.click(screen.getByRole("button", { name: "Create quote draft" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
    expect(
      screen.getByText("One or more selected service packages are no longer available."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Quote title")).toHaveValue("My quote");
    expect(screen.getByRole("checkbox", { name: /Package 1/i })).toBeChecked();
  });
});
