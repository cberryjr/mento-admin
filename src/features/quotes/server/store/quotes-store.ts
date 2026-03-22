import { randomUUID } from "node:crypto";

import {
  toQuoteSummary,
  type QuoteDetailRecord,
  type QuoteInput,
  type QuoteLineItemRecord,
  type QuoteRevisionRecord,
  type QuoteSectionRecord,
  type QuoteStatus,
  type QuoteSummary,
} from "@/features/quotes/types";

const SEEDED_QUOTES: QuoteDetailRecord[] = [];

function cloneQuote<T>(value: T): T {
  return structuredClone(value);
}

function createSeededStore() {
  return new Map(
    SEEDED_QUOTES.map((quote) => [quote.id, cloneQuote(quote)]),
  );
}

type SectionStoreEntry = Omit<QuoteSectionRecord, "lineItems">;

type QuotesStoreGlobal = typeof globalThis & {
  __mentoQuotesStore?: Map<string, QuoteDetailRecord>;
  __mentoQuoteSectionsStore?: Map<string, SectionStoreEntry[]>;
  __mentoQuoteLineItemsStore?: Map<string, QuoteLineItemRecord[]>;
  __mentoQuoteRevisionsStore?: Map<string, QuoteRevisionRecord[]>;
};

function getQuotesStore() {
  const storeGlobal = globalThis as QuotesStoreGlobal;

  if (!storeGlobal.__mentoQuotesStore) {
    storeGlobal.__mentoQuotesStore = createSeededStore();
  }

  return storeGlobal.__mentoQuotesStore;
}

function getQuoteSectionsStore() {
  const storeGlobal = globalThis as QuotesStoreGlobal;

  if (!storeGlobal.__mentoQuoteSectionsStore) {
    storeGlobal.__mentoQuoteSectionsStore = new Map<string, SectionStoreEntry[]>();
  }

  return storeGlobal.__mentoQuoteSectionsStore;
}

function getQuoteLineItemsStore() {
  const storeGlobal = globalThis as QuotesStoreGlobal;

  if (!storeGlobal.__mentoQuoteLineItemsStore) {
    storeGlobal.__mentoQuoteLineItemsStore = new Map();
  }

  return storeGlobal.__mentoQuoteLineItemsStore;
}

function getQuoteRevisionsStore() {
  const storeGlobal = globalThis as QuotesStoreGlobal;

  if (!storeGlobal.__mentoQuoteRevisionsStore) {
    storeGlobal.__mentoQuoteRevisionsStore = new Map();
  }

  return storeGlobal.__mentoQuoteRevisionsStore;
}

function generateQuoteNumber(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const suffix = randomUUID().slice(0, 8).toUpperCase();
  return `Q-${y}${m}${d}-${suffix}`;
}

function toStoredQuote(
  studioId: string,
  input: QuoteInput,
  options?: { id?: string; existing?: QuoteDetailRecord },
): QuoteDetailRecord {
  const now = new Date().toISOString();

  return {
    id: options?.id ?? options?.existing?.id ?? randomUUID(),
    studioId,
    clientId: input.clientId,
    quoteNumber: options?.existing?.quoteNumber ?? generateQuoteNumber(),
    title: input.title,
    status: options?.existing?.status ?? "draft",
    terms: input.terms ?? "",
    selectedServicePackageIds: [...input.selectedServicePackageIds],
    generatedAt: options?.existing?.generatedAt ?? null,
    createdAt: options?.existing?.createdAt ?? now,
    updatedAt: now,
    sections: options?.existing?.sections ?? [],
    estimateBreakdown: options?.existing?.estimateBreakdown ?? null,
  };
}

function getSectionsForQuote(quoteId: string): QuoteSectionRecord[] {
  const sections = getQuoteSectionsStore().get(quoteId);
  if (!sections) return [];

  return sections.map((section) => {
    const lineItems = getQuoteLineItemsStore().get(section.id) ?? [];
    return { ...section, lineItems: cloneQuote(lineItems) };
  });
}

export function readQuotesFromStore(studioId: string): QuoteDetailRecord[] {
  return Array.from(getQuotesStore().values())
    .filter((quote) => quote.studioId === studioId)
    .map((quote) => {
      const withSections = { ...quote, sections: getSectionsForQuote(quote.id) };
      return cloneQuote(withSections);
    });
}

export function readQuoteFromStore(
  studioId: string,
  quoteId: string,
): QuoteDetailRecord | null {
  const quote = getQuotesStore().get(quoteId);
  if (!quote || quote.studioId !== studioId) {
    return null;
  }

  const withSections = { ...quote, sections: getSectionsForQuote(quote.id) };
  return cloneQuote(withSections);
}

export function readQuoteByIdFromStore(
  quoteId: string,
): QuoteDetailRecord | null {
  const quote = getQuotesStore().get(quoteId);
  if (!quote) return null;

  const withSections = { ...quote, sections: getSectionsForQuote(quote.id) };
  return cloneQuote(withSections);
}

export function createQuoteInStore(
  studioId: string,
  input: QuoteInput,
): QuoteDetailRecord {
  const record = toStoredQuote(studioId, input);
  getQuotesStore().set(record.id, cloneQuote(record));
  return cloneQuote(record);
}

export function updateQuoteInStore(
  studioId: string,
  quoteId: string,
  input: QuoteInput,
): QuoteDetailRecord | null {
  const existing = getQuotesStore().get(quoteId);

  if (!existing || existing.studioId !== studioId) {
    return null;
  }

  const updated = toStoredQuote(studioId, input, { existing });
  getQuotesStore().set(quoteId, cloneQuote(updated));
  return cloneQuote(updated);
}

export function setQuoteGeneratedAtInStore(
  quoteId: string,
  generatedAt: string,
): void {
  const quote = getQuotesStore().get(quoteId);
  if (quote) {
    quote.generatedAt = generatedAt;
    quote.updatedAt = new Date().toISOString();
  }
}

export function setQuoteEstimateBreakdownInStore(
  quoteId: string,
  estimateBreakdown: QuoteDetailRecord["estimateBreakdown"],
): void {
  const quote = getQuotesStore().get(quoteId);
  if (quote) {
    quote.estimateBreakdown = cloneQuote(estimateBreakdown ?? null);
  }
}

export function touchQuoteInStore(quoteId: string): void {
  const quote = getQuotesStore().get(quoteId);
  if (quote) {
    quote.updatedAt = new Date().toISOString();
  }
}

export function setQuoteStatusInStore(
  quoteId: string,
  status: QuoteStatus,
): QuoteDetailRecord | null {
  const quote = getQuotesStore().get(quoteId);

  if (!quote) {
    return null;
  }

  quote.status = status;
  quote.updatedAt = new Date().toISOString();

  return cloneQuote({ ...quote, sections: getSectionsForQuote(quoteId) });
}

export function writeQuoteSectionsToStore(
  quoteId: string,
  sections: QuoteSectionRecord[],
): void {
  const sectionRecords: SectionStoreEntry[] = [];
  const lineItemsStore = getQuoteLineItemsStore();

  for (const section of sections) {
    const { lineItems, ...sectionWithoutLineItems } = section;
    sectionRecords.push(sectionWithoutLineItems);
    lineItemsStore.set(section.id, cloneQuote(lineItems));
  }

  getQuoteSectionsStore().set(quoteId, cloneQuote(sectionRecords));
}

export function readQuoteSectionsFromStore(
  quoteId: string,
): QuoteSectionRecord[] {
  return getSectionsForQuote(quoteId);
}

export function createQuoteRevisionInStore(
  quoteId: string,
  studioId: string,
): QuoteRevisionRecord | null {
  const quote = readQuoteByIdFromStore(quoteId);

  if (!quote || quote.studioId !== studioId) {
    return null;
  }

  const revisionsStore = getQuoteRevisionsStore();
  const existingRevisions = revisionsStore.get(quoteId) ?? [];
  const nextRevisionNumber =
    existingRevisions.reduce(
      (highestRevisionNumber, revision) =>
        Math.max(highestRevisionNumber, revision.revisionNumber),
      0,
    ) + 1;

  const revision: QuoteRevisionRecord = {
    id: randomUUID(),
    quoteId,
    studioId,
    revisionNumber: nextRevisionNumber,
    snapshotData: {
      sections: cloneQuote(quote.sections),
    },
    title: quote.title,
    terms: quote.terms,
    createdAt: new Date().toISOString(),
  };

  revisionsStore.set(quoteId, [...existingRevisions, cloneQuote(revision)]);

  return cloneQuote(revision);
}

export function listQuoteRevisionsFromStore(
  quoteId: string,
  studioId: string,
): QuoteRevisionRecord[] {
  const quote = getQuotesStore().get(quoteId);

  if (!quote || quote.studioId !== studioId) {
    return [];
  }

  return cloneQuote(
    [...(getQuoteRevisionsStore().get(quoteId) ?? [])].sort((left, right) => {
      return (
        right.revisionNumber - left.revisionNumber ||
        right.createdAt.localeCompare(left.createdAt)
      );
    }),
  );
}

export function deleteQuoteSectionsFromStore(quoteId: string): void {
  const sections = getQuoteSectionsStore().get(quoteId) ?? [];
  const lineItemsStore = getQuoteLineItemsStore();

  for (const section of sections) {
    lineItemsStore.delete(section.id);
  }

  getQuoteSectionsStore().delete(quoteId);
}

export function readQuoteSummariesForClientFromStore(
  studioId: string,
  clientId: string,
): QuoteSummary[] {
  return Array.from(getQuotesStore().values())
    .filter((quote) => quote.studioId === studioId && quote.clientId === clientId)
    .map((quote) => toQuoteSummary(cloneQuote(quote)));
}

export function __resetQuotesStore() {
  const storeGlobal = globalThis as QuotesStoreGlobal;
  storeGlobal.__mentoQuotesStore = createSeededStore();
  storeGlobal.__mentoQuoteSectionsStore = new Map();
  storeGlobal.__mentoQuoteLineItemsStore = new Map();
  storeGlobal.__mentoQuoteRevisionsStore = new Map();
}
