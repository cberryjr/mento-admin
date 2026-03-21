import type { InvoiceSummary } from "@/features/invoices/server/queries/list-invoices";
import type { QuoteSummary } from "@/features/quotes/types";

export type ClientInput = {
  name: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
};

export type ClientRecord = ClientInput & {
  id: string;
  studioId: string;
  createdAt: string;
  updatedAt: string;
};

export type ClientSummary = {
  id: string;
  name: string;
  contactEmail: string;
  updatedAt: string;
};

// Re-export canonical summary types from their feature homes so the client
// feature can use them without duplicating the shape.  If these types ever
// diverge for context-specific reasons, create explicit wrappers here and
// document the intentional difference.
export type RelatedQuoteSummary = QuoteSummary;
export type RelatedInvoiceSummary = InvoiceSummary;

export type ClientDetailRecord = {
  client: ClientRecord;
  relatedQuotes: RelatedQuoteSummary[];
  relatedInvoices: RelatedInvoiceSummary[];
};

export function toClientSummary(client: ClientRecord): ClientSummary {
  return {
    id: client.id,
    name: client.name,
    contactEmail: client.contactEmail,
    updatedAt: client.updatedAt,
  };
}
