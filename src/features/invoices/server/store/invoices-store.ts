import { randomUUID } from "node:crypto";

import type {
  InvoiceClientRecord,
  InvoiceDetailRecord,
  InvoiceLineItemRecord,
  InvoiceRecord,
  InvoiceSectionRecord,
} from "@/features/invoices/types";
import { readClientByIdFromStore } from "@/features/clients/server/store/clients-store";

type SectionUpdateInput = {
  id?: string;
  title: string;
  content?: string;
  position: number;
  lineItems?: LineItemUpdateInput[];
};

type LineItemUpdateInput = {
  id?: string;
  name: string;
  content?: string;
  quantity: number;
  unitLabel?: string;
  unitPriceCents: number;
  position: number;
};

type InvoiceUpdateInput = {
  clientId?: string;
  title?: string;
  issueDate?: string | null;
  dueDate?: string | null;
  terms?: string;
  paymentInstructions?: string;
  sections?: SectionUpdateInput[];
};

function toInvoiceClient(
  client:
    | {
        id: string;
        name: string;
        contactName: string;
        contactEmail: string;
        contactPhone: string;
      }
    | null,
): InvoiceClientRecord | null {
  return client
    ? {
        id: client.id,
        name: client.name,
        contactName: client.contactName,
        contactEmail: client.contactEmail,
        contactPhone: client.contactPhone,
      }
    : null;
}

const SEEDED_INVOICES: InvoiceDetailRecord[] = [];

function cloneInvoice<T>(value: T): T {
  return structuredClone(value);
}

function createSeededStore() {
  return new Map(
    SEEDED_INVOICES.map((invoice) => [invoice.id, cloneInvoice(invoice)]),
  );
}

type InvoicesStoreGlobal = typeof globalThis & {
  __mentoInvoicesStore?: Map<string, InvoiceDetailRecord>;
};

function getInvoicesStore() {
  const storeGlobal = globalThis as InvoicesStoreGlobal;

  if (!storeGlobal.__mentoInvoicesStore) {
    storeGlobal.__mentoInvoicesStore = createSeededStore();
  }

  return storeGlobal.__mentoInvoicesStore;
}

export function readInvoicesFromStore(
  studioId: string,
): InvoiceDetailRecord[] {
  return Array.from(getInvoicesStore().values())
    .filter((invoice) => invoice.studioId === studioId)
    .map((invoice) => cloneInvoice(invoice));
}

export function readInvoiceByIdFromStore(
  invoiceId: string,
): InvoiceDetailRecord | null {
  const invoice = getInvoicesStore().get(invoiceId);
  return invoice ? cloneInvoice(invoice) : null;
}

export function createInvoiceInStore(
  studioId: string,
  input: {
    clientId: string;
    sourceQuoteId: string;
    invoiceNumber: string;
    title: string;
    terms?: string;
    paymentInstructions?: string;
    sections: Array<{
      title: string;
      content: string;
      position: number;
      lineItems: Omit<
        InvoiceLineItemRecord,
        "id" | "invoiceId" | "invoiceSectionId" | "studioId"
      >[];
    }>;
  },
  sourceQuote: { id: string; quoteNumber: string; title: string } | null,
  client: InvoiceClientRecord | null,
): InvoiceDetailRecord {
  const now = new Date().toISOString();
  const invoiceId = randomUUID();

  const sections: InvoiceSectionRecord[] = input.sections.map((section) => {
    const sectionId = randomUUID();

    return {
      id: sectionId,
      invoiceId,
      studioId,
      title: section.title,
      content: section.content,
      position: section.position,
      lineItems: section.lineItems.map((lineItem) => ({
        ...lineItem,
        id: randomUUID(),
        invoiceId,
        invoiceSectionId: sectionId,
        studioId,
      })),
    };
  });

  const lineItems = sections.flatMap((section) => section.lineItems);

  const record: InvoiceDetailRecord = {
    id: invoiceId,
    studioId,
    clientId: input.clientId,
    sourceQuoteId: input.sourceQuoteId,
    invoiceNumber: input.invoiceNumber,
    title: input.title,
    status: "draft",
    issueDate: null,
    dueDate: null,
    paymentInstructions: input.paymentInstructions ?? "",
    terms: input.terms ?? "",
    createdAt: now,
    updatedAt: now,
    client,
    sections,
    lineItems,
    sourceQuote,
  };

  getInvoicesStore().set(invoiceId, cloneInvoice(record));
  return cloneInvoice(record);
}

export function setInvoiceStatusInStore(
  invoiceId: string,
  status: InvoiceRecord["status"],
): InvoiceDetailRecord | null {
  const invoice = getInvoicesStore().get(invoiceId);

  if (!invoice) {
    return null;
  }

  invoice.status = status;
  invoice.updatedAt = new Date().toISOString();

  return cloneInvoice(invoice);
}

export function updateInvoiceInStore(
  invoiceId: string,
  input: InvoiceUpdateInput,
): InvoiceDetailRecord | null {
  const invoice = getInvoicesStore().get(invoiceId);

  if (!invoice) {
    return null;
  }

  if (input.title !== undefined) {
    invoice.title = input.title;
  }

  if (input.clientId !== undefined) {
    invoice.clientId = input.clientId;
    invoice.client = toInvoiceClient(readClientByIdFromStore(input.clientId));
  }

  if (input.issueDate !== undefined) {
    invoice.issueDate = input.issueDate;
  }

  if (input.dueDate !== undefined) {
    invoice.dueDate = input.dueDate;
  }

  if (input.terms !== undefined) {
    invoice.terms = input.terms;
  }

  if (input.paymentInstructions !== undefined) {
    invoice.paymentInstructions = input.paymentInstructions;
  }

  if (input.sections !== undefined) {
    const incomingSectionIds = new Set(
      input.sections.filter((s) => s.id).map((s) => s.id as string),
    );

    for (const deleted of invoice.sections.filter(
      (s) => !incomingSectionIds.has(s.id),
    )) {
      invoice.lineItems = invoice.lineItems.filter(
        (li) => li.invoiceSectionId !== deleted.id,
      );
    }

    invoice.sections = input.sections.map((sectionInput) => {
      const existing = sectionInput.id
        ? invoice.sections.find((s) => s.id === sectionInput.id)
        : null;

      const sectionId = existing?.id ?? randomUUID();

      const incomingLineItemIds = new Set(
        (sectionInput.lineItems ?? [])
          .filter((li) => li.id)
          .map((li) => li.id as string),
      );

      for (const deleted of (existing?.lineItems ?? []).filter(
        (li) => !incomingLineItemIds.has(li.id),
      )) {
        invoice.lineItems = invoice.lineItems.filter(
          (li) => li.id !== deleted.id,
        );
      }

      const lineItems: InvoiceLineItemRecord[] = (
        sectionInput.lineItems ?? []
      ).map((lineItemInput) => {
        const existingLine = lineItemInput.id
          ? existing?.lineItems.find((li) => li.id === lineItemInput.id)
          : null;

        const lineId = existingLine?.id ?? randomUUID();
        const lineTotalCents = lineItemInput.quantity * lineItemInput.unitPriceCents;

        const lineRecord: InvoiceLineItemRecord = {
          id: lineId,
          invoiceId,
          invoiceSectionId: sectionId,
          studioId: invoice.studioId,
          name: lineItemInput.name,
          content: lineItemInput.content ?? "",
          quantity: lineItemInput.quantity,
          unitLabel: lineItemInput.unitLabel ?? "",
          unitPriceCents: lineItemInput.unitPriceCents,
          lineTotalCents,
          position: lineItemInput.position,
        };

        const existingIndex = invoice.lineItems.findIndex(
          (li) => li.id === lineId,
        );
        if (existingIndex >= 0) {
          invoice.lineItems[existingIndex] = lineRecord;
        } else {
          invoice.lineItems.push(lineRecord);
        }

        return lineRecord;
      });

      return {
        id: sectionId,
        invoiceId,
        studioId: invoice.studioId,
        title: sectionInput.title,
        content: sectionInput.content ?? "",
        position: sectionInput.position,
        lineItems,
      };
    });
  }

  invoice.updatedAt = new Date().toISOString();

  return cloneInvoice(invoice);
}

export function readInvoicesByQuoteIdsFromStore(
  quoteIds: string[],
  studioId: string,
): InvoiceRecord[] {
  const visibleQuoteIds = new Set(quoteIds);

  return Array.from(getInvoicesStore().values())
    .filter(
      (invoice) =>
        invoice.studioId === studioId &&
        visibleQuoteIds.has(invoice.sourceQuoteId),
    )
    .map((invoice) => ({
      id: invoice.id,
      studioId: invoice.studioId,
      clientId: invoice.clientId,
      sourceQuoteId: invoice.sourceQuoteId,
      invoiceNumber: invoice.invoiceNumber,
      title: invoice.title,
      status: invoice.status,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      paymentInstructions: invoice.paymentInstructions,
      terms: invoice.terms,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
    }));
}

export function __resetInvoicesStore() {
  const storeGlobal = globalThis as InvoicesStoreGlobal;
  storeGlobal.__mentoInvoicesStore = createSeededStore();
}
