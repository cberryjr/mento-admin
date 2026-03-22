import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: mockPush,
    refresh: mockRefresh,
  })),
}));

vi.mock("@/features/invoices/server/actions/create-invoice-from-quote", () => ({
  createInvoiceFromQuoteAction: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ConvertToInvoiceButton", () => {
  it("pushes invoice detail with preserved linked backTo context", async () => {
    const { createInvoiceFromQuoteAction } = await import(
      "@/features/invoices/server/actions/create-invoice-from-quote"
    );

    vi.mocked(createInvoiceFromQuoteAction).mockResolvedValue({
      ok: true,
      data: { invoice: { id: "invoice-1" } as never },
    });

    const { ConvertToInvoiceButton } = await import(
      "@/features/invoices/components/convert-to-invoice-button"
    );

    render(
      <ConvertToInvoiceButton
        quoteId="quote-1"
        backTo="/quotes/quote-1?backTo=/quotes"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /convert to invoice/i }));

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith(
        "/invoices/invoice-1?backTo=%2Fquotes%2Fquote-1%3FbackTo%3D%252Fquotes",
      );
    });
  });
});
