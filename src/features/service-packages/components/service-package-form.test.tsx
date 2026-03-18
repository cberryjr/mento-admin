import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

import { ServicePackageForm } from "@/features/service-packages/components/service-package-form";
import type { ServicePackageRecord } from "@/features/service-packages/types";

afterEach(() => {
  cleanup();
});

const EXISTING_SERVICE_PACKAGE: ServicePackageRecord = {
  id: "package-brand-launch",
  studioId: "default-studio",
  name: "Brand Launch Package",
  category: "Branding",
  startingPriceLabel: "$2,400",
  shortDescription: "Launch-ready brand deliverables.",
  createdAt: "2026-03-01T09:00:00.000Z",
  updatedAt: "2026-03-10T15:30:00.000Z",
};

describe("ServicePackageForm", () => {
  it("renders create-mode labels and submit action", () => {
    render(
      <ServicePackageForm
        mode="create"
        initialValues={null}
        submitAction={async () => ({
          ok: true,
          data: {
            servicePackage: EXISTING_SERVICE_PACKAGE,
          },
        })}
      />,
    );

    expect(screen.getByLabelText("Service package name")).toBeVisible();
    expect(screen.getByLabelText("Category")).toBeVisible();
    expect(screen.getByLabelText("Starting price guidance")).toBeVisible();
    expect(screen.getByLabelText("Short summary")).toBeVisible();
    expect(screen.getByRole("button", { name: "Create service package" })).toBeVisible();
  });

  it("adds visible focus styling and source-record messaging", () => {
    render(
      <ServicePackageForm mode="create" initialValues={null} submitAction={vi.fn()} />,
    );

    expect(screen.getByLabelText("Service package name")).toHaveClass(
      "focus-visible:outline-zinc-900",
    );
    expect(screen.getByRole("button", { name: "Create service package" })).toHaveClass(
      "focus-visible:outline-zinc-900",
    );
    expect(screen.getAllByText(/reusable source content/i).length).toBeGreaterThan(0);
  });

  it("preserves entered values when validation fails", async () => {
    const submitAction = vi.fn().mockResolvedValue({
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Please correct the highlighted fields.",
        fieldErrors: {
          name: ["Service package name is required."],
        },
      },
    });

    render(
      <ServicePackageForm mode="create" initialValues={null} submitAction={submitAction} />,
    );

    const nameField = screen.getByLabelText("Service package name");
    const priceField = screen.getByLabelText("Starting price guidance");

    expect(nameField).not.toHaveAttribute("aria-invalid");

    fireEvent.change(nameField, { target: { value: "Website Refresh Package" } });
    fireEvent.change(priceField, { target: { value: "$3,200" } });
    fireEvent.submit(screen.getByRole("button", { name: "Create service package" }).closest("form")!);

    await waitFor(() => {
      expect(screen.getByText("Please correct the highlighted fields.")).toBeVisible();
    });

    expect(nameField).toHaveValue("Website Refresh Package");
    expect(priceField).toHaveValue("$3,200");
    expect(nameField).toHaveAttribute("aria-invalid", "true");
  });
});
