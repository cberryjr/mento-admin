import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const replace = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace,
    refresh,
  }),
}));

import { ServicePackageForm } from "@/features/service-packages/components/service-package-form";
import {
  createDefaultComplexityTiers,
  type ServicePackageDetailRecord,
} from "@/features/service-packages/types";

afterEach(() => {
  cleanup();
  replace.mockReset();
  refresh.mockReset();
});

const EXISTING_SERVICE_PACKAGE: ServicePackageDetailRecord = {
  id: "package-brand-launch",
  studioId: "default-studio",
  name: "Brand Launch Package",
  categoryKey: "ai-print-campaigns",
  categoryLabel: "AI Print Campaigns",
  categoryShortLabel: "Print",
  category: "Branding",
  startingPriceLabel: "$2,400",
  shortDescription: "Launch-ready brand deliverables.",
  packageTotalCents: 240000,
  complexityTiers: createDefaultComplexityTiers("ai-print-campaigns"),
  sections: [
    {
      id: "section-strategy",
      title: "Strategy",
      defaultContent: "Audience and positioning work.",
      position: 1,
      lineItems: [
        {
          id: "line-item-workshop",
          sectionId: "section-strategy",
          name: "Discovery workshop",
          defaultContent: "Half-day alignment session.",
          quantity: 1,
          unitLabel: "session",
          unitPriceCents: 120000,
          position: 1,
        },
      ],
    },
    {
      id: "section-delivery",
      title: "Delivery",
      defaultContent: "Core identity deliverables.",
      position: 2,
      lineItems: [
        {
          id: "line-item-identity",
          sectionId: "section-delivery",
          name: "Brand identity system",
          defaultContent: "Logo, palette, and usage guidance.",
          quantity: 1,
          unitLabel: "package",
          unitPriceCents: 120000,
          position: 1,
        },
      ],
    },
  ],
  createdAt: "2026-03-01T09:00:00.000Z",
  updatedAt: "2026-03-10T15:30:00.000Z",
};

describe("ServicePackageForm", () => {
  it("renders create-mode metadata fields, nested editor controls, and pricing summary", () => {
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
    expect(screen.getByLabelText("Short summary")).toBeVisible();
    expect(screen.getByLabelText("Section title")).toBeVisible();
    expect(screen.getByLabelText("Line item name")).toBeVisible();
    expect(screen.getByLabelText("Unit price")).toBeVisible();
    expect(screen.getByRole("button", { name: "Add section" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Create service package" })).toBeVisible();
    expect(screen.getByText(/package total/i)).toBeVisible();
  });

  it("adds, reorders, and removes nested rows while keeping the pricing summary current", () => {
    render(
      <ServicePackageForm mode="create" initialValues={null} submitAction={vi.fn()} />,
    );

    fireEvent.change(screen.getByLabelText("Unit price"), { target: { value: "1200" } });

    fireEvent.click(screen.getByRole("button", { name: "Add line item" }));

    const lineItemNames = screen.getAllByLabelText("Line item name");
    fireEvent.change(lineItemNames[0], { target: { value: "Discovery workshop" } });
    fireEvent.change(lineItemNames[1], { target: { value: "Rollout guidance" } });

    const lineItemPrices = screen.getAllByLabelText("Unit price");
    fireEvent.change(lineItemPrices[1], { target: { value: "300" } });

    fireEvent.click(screen.getByRole("button", { name: /move line item 2 up/i }));

    expect(screen.getAllByLabelText("Line item name")[0]).toHaveValue("Rollout guidance");
    expect(screen.getByText("Package total")).toBeVisible();
    expect(screen.getByText("$1,500")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: /remove line item 2/i }));

    expect(screen.getAllByLabelText("Line item name")).toHaveLength(1);
    expect(screen.getByText("$300")).toBeVisible();
  });

  it("preserves entered values and shows nested validation errors when save fails", async () => {
    const submitAction = vi.fn().mockResolvedValue({
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Please correct the highlighted fields.",
        fieldErrors: {
          name: ["Service package name is required."],
          "sectionsById.section-strategy.title": ["Section title is required."],
          "lineItemsById.line-item-workshop.name": ["Line item name is required."],
        },
      },
    });

    render(
      <ServicePackageForm
        mode="edit"
        initialValues={EXISTING_SERVICE_PACKAGE}
        submitAction={submitAction}
      />,
    );

    fireEvent.change(screen.getByLabelText("Service package name"), {
      target: { value: "Updated Brand Launch Package" },
    });
    fireEvent.change(screen.getAllByLabelText("Section title")[0], { target: { value: "" } });
    fireEvent.change(screen.getAllByLabelText("Line item name")[0], { target: { value: "" } });
    fireEvent.submit(screen.getByRole("button", { name: "Save service package changes" }).closest("form")!);

    await waitFor(() => {
      expect(screen.getByText("Please correct the highlighted fields.")).toBeVisible();
    });

    expect(screen.getByLabelText("Service package name")).toHaveValue(
      "Updated Brand Launch Package",
    );
    expect(screen.getByText("Section title is required.")).toBeVisible();
    expect(screen.getByText("Line item name is required.")).toBeVisible();
  });

  it("sets aria-invalid on fields after a failed submission attempt", async () => {
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
    expect(nameField).not.toHaveAttribute("aria-invalid");

    fireEvent.submit(screen.getByRole("button", { name: "Create service package" }).closest("form")!);

    await waitFor(() => {
      expect(screen.getByText("Please correct the highlighted fields.")).toBeVisible();
    });

    expect(nameField).toHaveAttribute("aria-invalid", "true");
  });

  it("shows a validation error when all sections are removed and submit is attempted", async () => {
    const submitAction = vi.fn().mockResolvedValue({
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Please correct the highlighted fields.",
        fieldErrors: {
          sections: ["Add at least one section."],
        },
      },
    });

    render(
      <ServicePackageForm mode="create" initialValues={null} submitAction={submitAction} />,
    );

    fireEvent.click(screen.getByRole("button", { name: /remove section 1/i }));
    expect(screen.queryByLabelText("Section title")).not.toBeInTheDocument();

    fireEvent.submit(screen.getByRole("button", { name: "Create service package" }).closest("form")!);

    await waitFor(() => {
      expect(screen.getByText("Please correct the highlighted fields.")).toBeVisible();
    });

    expect(screen.getByText("Add at least one section.")).toBeVisible();
  });

  it("keeps source-record messaging and focus-visible styling in the structured editor", () => {
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
});
