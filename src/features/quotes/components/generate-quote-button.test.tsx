import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

vi.mock("@/features/quotes/server/actions/generate-quote-content", () => ({
  generateQuoteContent: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("GenerateQuoteButton", () => {
  it("renders the generate button", async () => {
    const { GenerateQuoteButton } = await import(
      "@/features/quotes/components/generate-quote-button"
    );

    render(<GenerateQuoteButton quoteId="q-1" />);

    expect(
      screen.getByRole("button", { name: /generate quote content/i })
    ).toBeInTheDocument();
  });

  it("shows loading state during generation", async () => {
    const { generateQuoteContent } = await import(
      "@/features/quotes/server/actions/generate-quote-content"
    );
    const { GenerateQuoteButton } = await import(
      "@/features/quotes/components/generate-quote-button"
    );

    vi.mocked(generateQuoteContent).mockImplementation(
      () => new Promise(() => {})
    );

    render(<GenerateQuoteButton quoteId="q-1" />);

    const button = screen.getByRole("button", {
      name: /generate quote content/i,
    });
    fireEvent.click(button);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /generating/i })
      ).toBeDisabled();
    });
  });

  it("shows error message on generation failure", async () => {
    const { generateQuoteContent } = await import(
      "@/features/quotes/server/actions/generate-quote-content"
    );
    const { GenerateQuoteButton } = await import(
      "@/features/quotes/components/generate-quote-button"
    );

    vi.mocked(generateQuoteContent).mockResolvedValue({
      ok: false,
      error: { code: "VALIDATION_ERROR", message: "No packages selected." },
    });

    render(<GenerateQuoteButton quoteId="q-1" />);

    const button = screen.getByRole("button", {
      name: /generate quote content/i,
    });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
    expect(screen.getByText(/no packages selected/i)).toBeInTheDocument();
  });
});
