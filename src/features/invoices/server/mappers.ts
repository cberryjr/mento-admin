import type {
  InvoiceClientRecord,
  InvoiceDetailRecord,
  InvoiceLineItemRecord,
  InvoiceRecord,
  InvoiceSectionRecord,
} from "@/features/invoices/types";

type InvoiceRow = {
  id: string;
  studioId: string;
  clientId: string;
  sourceQuoteId: string;
  invoiceNumber: string;
  title: string;
  status: string;
  issueDate: Date | null;
  dueDate: Date | null;
  paymentInstructions: string;
  terms: string;
  createdAt: Date;
  updatedAt: Date;
};

type InvoiceSectionRow = {
  id: string;
  invoiceId: string;
  studioId: string;
  title: string;
  content: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;
};

type InvoiceLineItemRow = {
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
  createdAt: Date;
  updatedAt: Date;
};

type SourceQuoteRow = {
  id: string;
  quoteNumber: string;
  title: string;
};

type ClientRow = {
  id: string;
  name: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
};

export function mapClientRowToInvoiceClient(
  row: ClientRow,
): InvoiceClientRecord {
  return {
    id: row.id,
    name: row.name,
    contactName: row.contactName,
    contactEmail: row.contactEmail,
    contactPhone: row.contactPhone,
  };
}

export function mapInvoiceRowToRecord(row: InvoiceRow): InvoiceRecord {
  return {
    id: row.id,
    studioId: row.studioId,
    clientId: row.clientId,
    sourceQuoteId: row.sourceQuoteId,
    invoiceNumber: row.invoiceNumber,
    title: row.title,
    status: row.status as InvoiceRecord["status"],
    issueDate: row.issueDate ? row.issueDate.toISOString() : null,
    dueDate: row.dueDate ? row.dueDate.toISOString() : null,
    paymentInstructions: row.paymentInstructions,
    terms: row.terms,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function mapInvoiceLineItemRowToRecord(
  row: InvoiceLineItemRow,
): InvoiceLineItemRecord {
  return {
    id: row.id,
    invoiceId: row.invoiceId,
    invoiceSectionId: row.invoiceSectionId,
    studioId: row.studioId,
    name: row.name,
    content: row.content,
    quantity: row.quantity,
    unitLabel: row.unitLabel,
    unitPriceCents: row.unitPriceCents,
    lineTotalCents: row.lineTotalCents,
    position: row.position,
  };
}

function buildInvoiceSections(
  sectionRows: InvoiceSectionRow[],
  lineItemRows: InvoiceLineItemRow[],
): InvoiceSectionRecord[] {
  const lineItemsBySectionId = new Map<string, InvoiceLineItemRecord[]>();

  for (const row of lineItemRows) {
    const list = lineItemsBySectionId.get(row.invoiceSectionId) ?? [];
    list.push(mapInvoiceLineItemRowToRecord(row));
    lineItemsBySectionId.set(row.invoiceSectionId, list);
  }

  return [...sectionRows]
    .sort((left, right) => left.position - right.position)
    .map((sectionRow) => ({
      id: sectionRow.id,
      invoiceId: sectionRow.invoiceId,
      studioId: sectionRow.studioId,
      title: sectionRow.title,
      content: sectionRow.content,
      position: sectionRow.position,
      lineItems: [...(lineItemsBySectionId.get(sectionRow.id) ?? [])].sort(
        (left, right) => left.position - right.position,
      ),
    }));
}

export function mapInvoiceToDetail(
  row: InvoiceRow,
  sectionRows: InvoiceSectionRow[],
  lineItems: InvoiceLineItemRow[],
  client: ClientRow | null,
  sourceQuote: SourceQuoteRow | null,
): InvoiceDetailRecord {
  const sections = buildInvoiceSections(sectionRows, lineItems);

  return {
    ...mapInvoiceRowToRecord(row),
    client: client ? mapClientRowToInvoiceClient(client) : null,
    sections,
    lineItems: sections.flatMap((section) => section.lineItems),
    sourceQuote: sourceQuote
      ? {
          id: sourceQuote.id,
          quoteNumber: sourceQuote.quoteNumber,
          title: sourceQuote.title,
        }
      : null,
  };
}
