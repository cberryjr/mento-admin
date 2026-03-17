import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StudioDefaultsForm } from "@/features/studio-defaults/components/studio-defaults-form";

describe("StudioDefaultsForm", () => {
  it("renders required labels and submit action", () => {
    render(
      <StudioDefaultsForm
        initialValues={null}
        submitAction={async () => ({
          ok: true,
          data: {
            studioDefaults: {
              studioId: "default-studio",
              studioName: "Northwind Creative",
              studioContactName: "",
              studioContactEmail: "",
              studioContactPhone: "",
              defaultQuoteTerms: "Net 15",
              defaultInvoicePaymentInstructions: "ACH",
              createdAt: "2026-01-01T00:00:00.000Z",
              updatedAt: "2026-01-01T00:00:00.000Z",
              prefill: {
                studioName: "Northwind Creative",
                studioContactDetails: {
                  name: "",
                  email: "",
                  phone: "",
                },
                defaultQuoteTerms: "Net 15",
                defaultInvoicePaymentInstructions: "ACH",
              },
            },
          },
        })}
      />,
    );

    expect(screen.getByLabelText("Studio name")).toBeVisible();
    expect(screen.getByLabelText("Studio contact name")).toBeVisible();
    expect(screen.getByLabelText("Studio contact email")).toBeVisible();
    expect(screen.getByLabelText("Studio contact phone")).toBeVisible();
    expect(screen.getByLabelText("Default quote terms")).toBeVisible();
    expect(screen.getByLabelText("Default invoice payment instructions")).toBeVisible();
    expect(screen.getByRole("button", { name: "Save defaults" })).toBeVisible();
  });
});
