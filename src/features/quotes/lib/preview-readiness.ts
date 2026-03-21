import type { QuoteSectionRecord } from "@/features/quotes/types";

export type ReadinessIssue = {
  message: string;
  targetId?: string;
  sectionId?: string;
  lineItemId?: string;
};

export function computeReadinessIssues(
  sections: QuoteSectionRecord[],
  clientId: string,
): ReadinessIssue[] {
  const issues: ReadinessIssue[] = [];

  if (!clientId?.trim()) {
    issues.push({
      message: "Quote must be associated with a client.",
      targetId: "quote-client-summary",
    });
  }

  if (sections.length === 0) {
    issues.push({
      message: "Quote must have at least one section.",
      targetId: "add-section-button",
    });
    return issues;
  }

  for (const section of sections) {
    if (section.lineItems.length === 0) {
      issues.push({
        message: `Section "${section.title || "Untitled"}" has no line items.`,
        sectionId: section.id,
        targetId: `section-title-${section.id}`,
      });
      continue;
    }

    for (const item of section.lineItems) {
      if (!item.name?.trim()) {
        issues.push({
          message: `Line item in "${section.title || "Untitled"}" is missing a name.`,
          sectionId: section.id,
          lineItemId: item.id,
          targetId: `line-item-name-${item.id}`,
        });
      }

      if (item.quantity < 1) {
        issues.push({
          message: `"${item.name || "Unnamed item"}" has quantity less than 1.`,
          sectionId: section.id,
          lineItemId: item.id,
          targetId: `line-item-quantity-${item.id}`,
        });
      }

      if (item.unitPriceCents < 0) {
        issues.push({
          message: `"${item.name || "Unnamed item"}" has a negative price.`,
          sectionId: section.id,
          lineItemId: item.id,
          targetId: `line-item-price-${item.id}`,
        });
      }
    }
  }

  return issues;
}
