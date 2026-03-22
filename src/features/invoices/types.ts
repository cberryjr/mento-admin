export type InvoiceStatus = "draft" | "sent" | "paid";

export type InvoiceClientRecord = {
  id: string;
  name: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
};

export type InvoiceRecord = {
  id: string;
  studioId: string;
  clientId: string;
  sourceQuoteId: string;
  invoiceNumber: string;
  title: string;
  status: InvoiceStatus;
  issueDate: string | null;
  dueDate: string | null;
  paymentInstructions: string;
  terms: string;
  createdAt: string;
  updatedAt: string;
};

export type InvoiceLineItemRecord = {
  id: string;
  invoiceId: string;
  invoiceSectionId: string;
  studioId: string;
  name: string;
  content: string;
  quantity: number;
  unitLabel: string;
  unitPriceCents: number;
  lineTotalCents: number;
  position: number;
};

export type InvoiceSectionRecord = {
  id: string;
  invoiceId: string;
  studioId: string;
  title: string;
  content: string;
  position: number;
  lineItems: InvoiceLineItemRecord[];
};

export type InvoiceDetailRecord = InvoiceRecord & {
  client: InvoiceClientRecord | null;
  sections: InvoiceSectionRecord[];
  lineItems: InvoiceLineItemRecord[];
  sourceQuote: {
    id: string;
    quoteNumber: string;
    title: string;
  } | null;
};

export type InvoiceInput = {
  clientId: string;
  title: string;
  terms?: string;
  paymentInstructions?: string;
};

export type InvoiceSummary = {
  id: string;
  invoiceNumber: string;
  title: string;
  status: InvoiceStatus;
  updatedAt: string;
};

export function toInvoiceSummary(invoice: InvoiceRecord): InvoiceSummary {
  return {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    title: invoice.title,
    status: invoice.status,
    updatedAt: invoice.updatedAt,
  };
}
