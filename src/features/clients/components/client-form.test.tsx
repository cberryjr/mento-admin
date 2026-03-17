import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

import { ClientForm } from "@/features/clients/components/client-form";
import type { ClientRecord } from "@/features/clients/types";

afterEach(() => {
  cleanup();
});

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

describe("ClientForm", () => {
  it("renders create-mode labels and submit action", () => {
    render(
      <ClientForm
        mode="create"
        initialValues={null}
        submitAction={async () => ({
          ok: true,
          data: {
            client: EXISTING_CLIENT,
          },
        })}
      />,
    );

    expect(screen.getByLabelText("Client name")).toBeVisible();
    expect(screen.getByLabelText("Contact name")).toBeVisible();
    expect(screen.getByLabelText("Contact email")).toBeVisible();
    expect(screen.getByLabelText("Contact phone")).toBeVisible();
    expect(screen.getByRole("button", { name: "Create client" })).toBeVisible();
  });

  it("adds visible focus styling to fields and submit actions", () => {
    render(
      <ClientForm mode="create" initialValues={null} submitAction={vi.fn()} />,
    );

    expect(screen.getByLabelText("Client name")).toHaveClass("focus-visible:outline-zinc-900");
    expect(screen.getByLabelText("Contact email")).toHaveClass("focus-visible:outline-zinc-900");
    expect(screen.getByRole("button", { name: "Create client" })).toHaveClass(
      "focus-visible:outline-zinc-900",
    );
  });

  it("preserves entered values when validation fails", async () => {
    const submitAction = vi.fn().mockResolvedValue({
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Please correct the highlighted fields.",
        fieldErrors: {
          name: ["Client name is required."],
        },
      },
    });

    render(
      <ClientForm mode="create" initialValues={null} submitAction={submitAction} />,
    );

    const clientName = screen.getByLabelText("Client name");
    const contactEmail = screen.getByLabelText("Contact email");

    // Before any submission attempt, aria-invalid should be absent.
    expect(clientName).not.toHaveAttribute("aria-invalid");

    fireEvent.change(clientName, { target: { value: "Northwind Creative" } });
    fireEvent.change(contactEmail, { target: { value: "casey@example.com" } });
    fireEvent.submit(screen.getByRole("button", { name: "Create client" }).closest("form")!);

    await waitFor(() => {
      expect(screen.getByText("Please correct the highlighted fields.")).toBeVisible();
    });

    expect(clientName).toHaveValue("Northwind Creative");
    expect(contactEmail).toHaveValue("casey@example.com");
    // After a failed submission attempt, aria-invalid should reflect error state.
    expect(clientName).toHaveAttribute("aria-invalid", "true");
  });
});
