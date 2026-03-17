import { randomUUID } from "node:crypto";

import type {
  ClientInput,
  ClientRecord,
  RelatedInvoiceSummary,
  RelatedQuoteSummary,
} from "@/features/clients/types";

const SEEDED_CLIENTS: ClientRecord[] = [
  {
    id: "client-sunrise-yoga",
    studioId: "default-studio",
    name: "Sunrise Yoga Studio",
    contactName: "Avery Patel",
    contactEmail: "ops@sunriseyoga.example",
    contactPhone: "+1 555 0101",
    createdAt: "2026-03-01T09:00:00.000Z",
    updatedAt: "2026-03-10T15:30:00.000Z",
  },
  {
    id: "client-otter-coffee",
    studioId: "default-studio",
    name: "Otter Coffee Roasters",
    contactName: "Morgan Lee",
    contactEmail: "hello@ottercoffee.example",
    contactPhone: "+1 555 0102",
    createdAt: "2026-03-02T10:00:00.000Z",
    updatedAt: "2026-03-08T12:15:00.000Z",
  },
  {
    id: "client-other-studio",
    studioId: "other-studio",
    name: "Hidden Orchard Bakery",
    contactName: "Riley Chen",
    contactEmail: "owner@hiddenorchard.example",
    contactPhone: "+1 555 0199",
    createdAt: "2026-03-03T11:00:00.000Z",
    updatedAt: "2026-03-11T16:45:00.000Z",
  },
];

type StoredQuoteSummary = RelatedQuoteSummary & {
  clientId: string;
  studioId: string;
};

type StoredInvoiceSummary = RelatedInvoiceSummary & {
  clientId: string;
  studioId: string;
};

const SEEDED_QUOTES: StoredQuoteSummary[] = [
  {
    id: "quote-sunrise-retainer",
    clientId: "client-sunrise-yoga",
    studioId: "default-studio",
    quoteNumber: "Q-2026-014",
    title: "Monthly brand retainer",
    status: "draft",
    updatedAt: "2026-03-14T09:15:00.000Z",
  },
  {
    id: "quote-sunrise-kickoff",
    clientId: "client-sunrise-yoga",
    studioId: "default-studio",
    quoteNumber: "Q-2026-011",
    title: "Website kickoff package",
    status: "accepted",
    updatedAt: "2026-03-09T13:45:00.000Z",
  },
  {
    id: "quote-other-studio",
    clientId: "client-other-studio",
    studioId: "other-studio",
    quoteNumber: "Q-2026-021",
    title: "Seasonal menu refresh",
    status: "draft",
    updatedAt: "2026-03-11T08:30:00.000Z",
  },
];

const SEEDED_INVOICES: StoredInvoiceSummary[] = [
  {
    id: "invoice-sunrise-deposit",
    clientId: "client-sunrise-yoga",
    studioId: "default-studio",
    invoiceNumber: "INV-2026-006",
    title: "Kickoff deposit",
    status: "paid",
    updatedAt: "2026-03-12T18:20:00.000Z",
  },
  {
    id: "invoice-other-studio",
    clientId: "client-other-studio",
    studioId: "other-studio",
    invoiceNumber: "INV-2026-010",
    title: "Campaign deposit",
    status: "sent",
    updatedAt: "2026-03-10T10:00:00.000Z",
  },
];

function createSeededStore() {
  return new Map(SEEDED_CLIENTS.map((client) => [client.id, client]));
}

type ClientsStoreGlobal = typeof globalThis & {
  __mentoClientsStore?: Map<string, ClientRecord>;
};

function getClientsStore() {
  const storeGlobal = globalThis as ClientsStoreGlobal;

  if (!storeGlobal.__mentoClientsStore) {
    storeGlobal.__mentoClientsStore = createSeededStore();
  }

  return storeGlobal.__mentoClientsStore;
}

function toStoredClient(
  studioId: string,
  input: ClientInput,
  options?: { id?: string; existing?: ClientRecord },
): ClientRecord {
  const now = new Date().toISOString();

  return {
    id: options?.id ?? options?.existing?.id ?? randomUUID(),
    studioId,
    name: input.name,
    contactName: input.contactName,
    contactEmail: input.contactEmail,
    contactPhone: input.contactPhone,
    createdAt: options?.existing?.createdAt ?? now,
    updatedAt: now,
  };
}

export function readClientsFromStore(studioId: string): ClientRecord[] {
  return Array.from(getClientsStore().values()).filter((client) => client.studioId === studioId);
}

export function readClientFromStore(
  studioId: string,
  clientId: string,
): ClientRecord | null {
  const client = getClientsStore().get(clientId);
  if (!client || client.studioId !== studioId) {
    return null;
  }

  return client;
}

export function readClientByIdFromStore(clientId: string): ClientRecord | null {
  return getClientsStore().get(clientId) ?? null;
}

function sortRelatedRecords<T extends { updatedAt: string; title: string }>(records: T[]) {
  return [...records].sort((left, right) => {
    const updatedComparison = right.updatedAt.localeCompare(left.updatedAt);

    if (updatedComparison !== 0) {
      return updatedComparison;
    }

    return left.title.localeCompare(right.title, undefined, {
      sensitivity: "base",
    });
  });
}

function toQuoteSummary(record: StoredQuoteSummary): RelatedQuoteSummary {
  return {
    id: record.id,
    quoteNumber: record.quoteNumber,
    title: record.title,
    status: record.status,
    updatedAt: record.updatedAt,
  };
}

function toInvoiceSummary(record: StoredInvoiceSummary): RelatedInvoiceSummary {
  return {
    id: record.id,
    invoiceNumber: record.invoiceNumber,
    title: record.title,
    status: record.status,
    updatedAt: record.updatedAt,
  };
}

export function readQuoteSummariesForClientFromStore(
  studioId: string,
  clientId: string,
): RelatedQuoteSummary[] {
  return sortRelatedRecords(
    SEEDED_QUOTES.filter((quote) => quote.studioId === studioId && quote.clientId === clientId),
  ).map(toQuoteSummary);
}

export function readInvoiceSummariesForClientFromStore(
  studioId: string,
  clientId: string,
): RelatedInvoiceSummary[] {
  return sortRelatedRecords(
    SEEDED_INVOICES.filter(
      (invoice) => invoice.studioId === studioId && invoice.clientId === clientId,
    ),
  ).map(toInvoiceSummary);
}

export function createClientInStore(
  studioId: string,
  input: ClientInput,
): ClientRecord {
  const record = toStoredClient(studioId, input);
  getClientsStore().set(record.id, record);
  return record;
}

export function updateClientInStore(
  clientId: string,
  input: ClientInput,
): ClientRecord | null {
  const existing = getClientsStore().get(clientId);

  if (!existing) {
    return null;
  }

  const updated = toStoredClient(existing.studioId, input, { existing });
  getClientsStore().set(clientId, updated);
  return updated;
}

export function __resetClientsStore() {
  (globalThis as ClientsStoreGlobal).__mentoClientsStore = createSeededStore();
}
