import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EmptyState } from "@/components/feedback/empty-state";

describe("empty state", () => {
  it("renders title, description, and primary action", () => {
    render(
      <EmptyState
        title="No records"
        description="Create your first record."
        action={<button type="button">Create</button>}
      />,
    );

    expect(screen.getByRole("heading", { name: "No records" })).toBeVisible();
    expect(screen.getByText("Create your first record.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Create" })).toBeVisible();
  });
});
