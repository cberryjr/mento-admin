import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { StudioDefaultsForm } from "@/features/studio-defaults/components/studio-defaults-form";
import type { ActionResult } from "@/lib/validation/action-result";
import type { StudioDefaultsRecord } from "@/features/studio-defaults/types";

const MOCK_RECORD: StudioDefaultsRecord = {
  studioId: "default-studio",
  studioName: "Northwind Creative",
  studioContactName: "Casey Jones",
  studioContactEmail: "casey@example.com",
  studioContactPhone: "+1 555 0100",
  defaultQuoteTerms: "Net 15",
  defaultInvoicePaymentInstructions: "ACH",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  prefill: {
    studioName: "Northwind Creative",
    studioContactDetails: { name: "Casey Jones", email: "casey@example.com", phone: "+1 555 0100" },
    defaultQuoteTerms: "Net 15",
    defaultInvoicePaymentInstructions: "ACH",
  },
};

function successAction(): ActionResult<{ studioDefaults: StudioDefaultsRecord }> {
  return { ok: true, data: { studioDefaults: MOCK_RECORD } };
}

function errorAction(
  fieldErrors: Record<string, string[]> = {},
): ActionResult<{ studioDefaults: StudioDefaultsRecord }> {
  return {
    ok: false,
    error: { code: "VALIDATION_ERROR", message: "Please correct the highlighted fields.", fieldErrors },
  };
}

describe("StudioDefaultsForm", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders required labels and submit action", () => {
    render(<StudioDefaultsForm initialValues={null} submitAction={async () => successAction()} />);

    expect(screen.getByLabelText("Studio name")).toBeVisible();
    expect(screen.getByLabelText("Studio contact name")).toBeVisible();
    expect(screen.getByLabelText("Studio contact email")).toBeVisible();
    expect(screen.getByLabelText("Studio contact phone")).toBeVisible();
    expect(screen.getByLabelText("Default quote terms")).toBeVisible();
    expect(screen.getByLabelText("Default invoice payment instructions")).toBeVisible();
    expect(screen.getByRole("button", { name: "Save defaults" })).toBeVisible();
  });

  it("uses readable text and focus styling on form controls", () => {
    render(<StudioDefaultsForm initialValues={null} submitAction={async () => successAction()} />);

    expect(screen.getByLabelText("Studio name")).toHaveClass("text-zinc-900");
    expect(screen.getByLabelText("Studio name")).toHaveClass("focus-visible:outline-zinc-900");
    expect(screen.getByLabelText("Default quote terms")).toHaveClass("text-zinc-900");
    expect(screen.getByLabelText("Default quote terms")).toHaveClass(
      "focus-visible:outline-zinc-900",
    );
  });

  it("shows success message after successful save", async () => {
    render(
      <StudioDefaultsForm initialValues={MOCK_RECORD} submitAction={async () => successAction()} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Save defaults" }));

    await waitFor(() => {
      expect(screen.getByText("Defaults saved")).toBeVisible();
    });

    expect(
      screen.getByText("Studio defaults saved. New quotes and invoices will use these prefills."),
    ).toBeVisible();
  });

  it("shows error message and field errors on failed save", async () => {
    render(
      <StudioDefaultsForm
        initialValues={MOCK_RECORD}
        submitAction={async () =>
          errorAction({ studioName: ["Studio name is required."] })
        }
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Save defaults" }));

    await waitFor(() => {
      expect(screen.getByText("Could not save defaults")).toBeVisible();
    });

    expect(screen.getByText("Studio name is required.")).toBeVisible();
  });

  it("preserves user-entered values on failed save", async () => {
    render(
      <StudioDefaultsForm
        initialValues={null}
        submitAction={async () => errorAction({ defaultQuoteTerms: ["Required."] })}
      />,
    );

    const nameInput = screen.getByLabelText("Studio name");
    fireEvent.change(nameInput, { target: { value: "Custom Name" } });

    fireEvent.click(screen.getByRole("button", { name: "Save defaults" }));

    await waitFor(() => {
      expect(screen.getByText("Could not save defaults")).toBeVisible();
    });

    expect(nameInput).toHaveValue("Custom Name");
  });

  it("prefills form from initialValues", () => {
    render(<StudioDefaultsForm initialValues={MOCK_RECORD} submitAction={async () => successAction()} />);

    expect(screen.getByLabelText("Studio name")).toHaveValue("Northwind Creative");
    expect(screen.getByLabelText("Studio contact email")).toHaveValue("casey@example.com");
    expect(screen.getByLabelText("Default quote terms")).toHaveValue("Net 15");
  });
});
