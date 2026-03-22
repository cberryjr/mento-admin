import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    refresh: vi.fn(),
  })),
}));

vi.mock("@/features/invoices/server/actions/reopen-invoice", () => ({
  reopenInvoiceAction: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ReopenInvoiceButton", () => {
  it("renders button with correct label", async () => {
    const { ReopenInvoiceButton } = await import(
      "@/features/invoices/components/reopen-invoice-button"
    );

    render(<ReopenInvoiceButton invoiceId="invoice-1" />);

    expect(screen.getByRole("button", { name: "Reopen for Editing" })).toBeInTheDocument();
  });

  it("shows loading state during submission", async () => {
    const { reopenInvoiceAction } = await import(
      "@/features/invoices/server/actions/reopen-invoice"
    );

    let resolveAction!: () => void;
    vi.mocked(reopenInvoiceAction).mockReturnValue(
      new Promise((resolve) => {
        resolveAction = () =>
          resolve({ ok: true, data: { invoice: { id: "invoice-1", status: "draft" } as never } });
      }),
    );

    const { ReopenInvoiceButton } = await import(
      "@/features/invoices/components/reopen-invoice-button"
    );

    render(<ReopenInvoiceButton invoiceId="invoice-1" />);

    fireEvent.click(screen.getByRole("button", { name: "Reopen for Editing" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Reopening..." })).toBeDisabled();
    });

    resolveAction();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Reopen for Editing" })).not.toBeDisabled();
    });
  });

  it("handles success response and calls onReopened", async () => {
    const { reopenInvoiceAction } = await import(
      "@/features/invoices/server/actions/reopen-invoice"
    );
    const { useRouter } = await import("next/navigation");

    const mockRefresh = vi.fn();
    vi.mocked(useRouter).mockReturnValue({ refresh: mockRefresh } as never);

    vi.mocked(reopenInvoiceAction).mockResolvedValue({
      ok: true,
      data: { invoice: { id: "invoice-1", status: "draft" } as never },
    });

    const { ReopenInvoiceButton } = await import(
      "@/features/invoices/components/reopen-invoice-button"
    );

    const onReopened = vi.fn();

    render(<ReopenInvoiceButton invoiceId="invoice-1" onReopened={onReopened} />);

    fireEvent.click(screen.getByRole("button", { name: "Reopen for Editing" }));

    await waitFor(() => {
      expect(onReopened).toHaveBeenCalled();
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it("handles failure response and shows error", async () => {
    const { reopenInvoiceAction } = await import(
      "@/features/invoices/server/actions/reopen-invoice"
    );

    vi.mocked(reopenInvoiceAction).mockResolvedValue({
      ok: false,
      error: { code: "UNKNOWN", message: "Invoice not found." },
    });

    const { ReopenInvoiceButton } = await import(
      "@/features/invoices/components/reopen-invoice-button"
    );

    render(<ReopenInvoiceButton invoiceId="invoice-1" />);

    fireEvent.click(screen.getByRole("button", { name: "Reopen for Editing" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText("Invoice not found.")).toBeInTheDocument();
    });
  });

  it("shows a safe fallback error when the action rejects", async () => {
    const { reopenInvoiceAction } = await import(
      "@/features/invoices/server/actions/reopen-invoice"
    );

    vi.mocked(reopenInvoiceAction).mockRejectedValue(new Error("network down"));

    const { ReopenInvoiceButton } = await import(
      "@/features/invoices/components/reopen-invoice-button"
    );

    render(<ReopenInvoiceButton invoiceId="invoice-1" />);

    fireEvent.click(screen.getByRole("button", { name: "Reopen for Editing" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(
        screen.getByText("The invoice could not be reopened. Please try again."),
      ).toBeInTheDocument();
    });
  });
});
