import { randomUUID } from "node:crypto";

import { asc, desc, eq } from "drizzle-orm";

import { estimateBreakdownPayloadSchema } from "@/features/quotes/schemas/estimate-breakdown-schema";
import { env } from "@/lib/env";
import type {
  EstimateBreakdownPayload,
  QuoteDetailRecord,
  QuoteInput,
  QuoteLineItemRecord,
  QuoteRecord,
  QuoteSectionRecord,
} from "@/features/quotes/types";
import {
  __resetQuotesStore as resetQuotesStore,
  createQuoteInStore,
  deleteQuoteSectionsFromStore,
  readQuoteByIdFromStore,
  readQuotesFromStore,
  setQuoteEstimateBreakdownInStore,
  setQuoteGeneratedAtInStore,
  updateQuoteInStore,
  writeQuoteSectionsToStore,
} from "@/features/quotes/server/store/quotes-store";

type QuoteRow = {
  id: string;
  studioId: string;
  clientId: string;
  quoteNumber: string;
  title: string;
  status: string;
  terms: string;
  estimateBreakdownSnapshot: string | null;
  generatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type QuoteServicePackageRow = {
  id: string;
  quoteId: string;
  servicePackageId: string;
  position: number;
};

type QuoteSectionRow = {
  id: string;
  quoteId: string;
  studioId: string;
  sourceServicePackageId: string;
  title: string;
  content: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;
};

type QuoteLineItemRow = {
  id: string;
  quoteId: string;
  quoteSectionId: string;
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

function mapRowToRecord(
  row: QuoteRow,
  servicePackageIds: string[],
  sections: QuoteSectionRecord[],
): QuoteDetailRecord {
  const estimateBreakdown = deserializeEstimateBreakdownSnapshot(
    row.estimateBreakdownSnapshot,
  );

  return {
    id: row.id,
    studioId: row.studioId,
    clientId: row.clientId,
    quoteNumber: row.quoteNumber,
    title: row.title,
    status: row.status as QuoteRecord["status"],
    terms: row.terms,
    selectedServicePackageIds: servicePackageIds,
    generatedAt: row.generatedAt ? row.generatedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    sections,
    estimateBreakdown,
  };
}

function mapSectionRowToRecord(
  row: QuoteSectionRow,
  lineItems: QuoteLineItemRecord[],
): QuoteSectionRecord {
  return {
    id: row.id,
    quoteId: row.quoteId,
    studioId: row.studioId,
    sourceServicePackageId: row.sourceServicePackageId,
    title: row.title,
    content: row.content,
    position: row.position,
    lineItems,
  };
}

function mapLineItemRowToRecord(row: QuoteLineItemRow): QuoteLineItemRecord {
  return {
    id: row.id,
    quoteId: row.quoteId,
    quoteSectionId: row.quoteSectionId,
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

function sortQuotes(quotes: QuoteDetailRecord[]) {
  return [...quotes].sort((left, right) => {
    return (
      right.updatedAt.localeCompare(left.updatedAt) ||
      right.createdAt.localeCompare(left.createdAt)
    );
  });
}

function deserializeEstimateBreakdownSnapshot(
  value: string | null | undefined,
): EstimateBreakdownPayload | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value);
    const result = estimateBreakdownPayloadSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

function serializeEstimateBreakdownSnapshot(
  value: EstimateBreakdownPayload | null | undefined,
): string | null {
  return value ? JSON.stringify(value) : null;
}

function generateQuoteNumber(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const suffix = randomUUID().slice(0, 8).toUpperCase();
  return `Q-${y}${m}${d}-${suffix}`;
}

async function loadQuoteRows(quoteId: string) {
  const [{ db }, schema] = await Promise.all([
    import("@/server/db"),
    import("@/server/db/schema/quotes"),
  ]);

  const [quoteRows, servicePackageRows] = await Promise.all([
    db
      .select()
      .from(schema.quotes)
      .where(eq(schema.quotes.id, quoteId))
      .limit(1),
    db
      .select()
      .from(schema.quoteServicePackages)
      .where(eq(schema.quoteServicePackages.quoteId, quoteId))
      .orderBy(asc(schema.quoteServicePackages.position)),
  ]);

  return {
    quoteRow: quoteRows[0] ?? null,
    servicePackageRows,
  };
}

async function loadQuoteSectionsAndLineItems(quoteId: string) {
  const [{ db }, schema] = await Promise.all([
    import("@/server/db"),
    import("@/server/db/schema/quote-sections"),
  ]);

  const [sectionRows, lineItemRows] = await Promise.all([
    db
      .select()
      .from(schema.quoteSections)
      .where(eq(schema.quoteSections.quoteId, quoteId))
      .orderBy(asc(schema.quoteSections.position)),
    db
      .select()
      .from(schema.quoteLineItems)
      .where(eq(schema.quoteLineItems.quoteId, quoteId))
      .orderBy(asc(schema.quoteLineItems.position)),
  ]);

  return { sectionRows, lineItemRows };
}

function buildSectionsFromRows(
  sectionRows: QuoteSectionRow[],
  lineItemRows: QuoteLineItemRow[],
): QuoteSectionRecord[] {
  return sectionRows.map((sectionRow) => {
    const lineItems = lineItemRows
      .filter((li) => li.quoteSectionId === sectionRow.id)
      .map(mapLineItemRowToRecord);
    return mapSectionRowToRecord(sectionRow, lineItems);
  });
}

export async function listQuotesForStudio(
  studioId: string,
): Promise<QuoteDetailRecord[]> {
  if (!env.DATABASE_URL) {
    return sortQuotes(readQuotesFromStore(studioId));
  }

  try {
    const [{ db }, { quotes: quotesTable, quoteServicePackages }] =
      await Promise.all([
        import("@/server/db"),
        import("@/server/db/schema/quotes"),
      ]);

    const rows = await db
      .select()
      .from(quotesTable)
      .where(eq(quotesTable.studioId, studioId))
      .orderBy(desc(quotesTable.updatedAt), desc(quotesTable.createdAt));

    const quoteIds = rows.map((row) => row.id);
    let spRows: QuoteServicePackageRow[] = [];

    if (quoteIds.length > 0) {
      const { inArray } = await import("drizzle-orm");
      spRows = await db
        .select()
        .from(quoteServicePackages)
        .where(inArray(quoteServicePackages.quoteId, quoteIds))
        .orderBy(asc(quoteServicePackages.position));
    }

    const spByQuoteId = new Map<string, string[]>();
    for (const sp of spRows) {
      const ids = spByQuoteId.get(sp.quoteId) ?? [];
      ids.push(sp.servicePackageId);
      spByQuoteId.set(sp.quoteId, ids);
    }

    return sortQuotes(
      rows.map((row) => mapRowToRecord(row, spByQuoteId.get(row.id) ?? [], [])),
    );
  } catch {
    return sortQuotes(readQuotesFromStore(studioId));
  }
}

export async function getQuoteById(
  quoteId: string,
): Promise<QuoteDetailRecord | null> {
  if (!env.DATABASE_URL) {
    return readQuoteByIdFromStore(quoteId);
  }

  try {
    const [quoteData, sectionsData] = await Promise.all([
      loadQuoteRows(quoteId),
      loadQuoteSectionsAndLineItems(quoteId),
    ]);

    const { quoteRow, servicePackageRows } = quoteData;
    const { sectionRows, lineItemRows } = sectionsData;

    if (!quoteRow) {
      return null;
    }

    const sections = buildSectionsFromRows(
      sectionRows as QuoteSectionRow[],
      lineItemRows as QuoteLineItemRow[],
    );

    return mapRowToRecord(
      quoteRow as QuoteRow,
      servicePackageRows.map((sp) => sp.servicePackageId),
      sections,
    );
  } catch {
    return readQuoteByIdFromStore(quoteId);
  }
}

export async function createQuoteRecord(
  studioId: string,
  input: QuoteInput,
): Promise<QuoteDetailRecord> {
  if (!env.DATABASE_URL) {
    return createQuoteInStore(studioId, input);
  }

  try {
    const quoteId = randomUUID();
    const [{ db }, schema] = await Promise.all([
      import("@/server/db"),
      import("@/server/db/schema/quotes"),
    ]);

    await db.transaction(async (tx) => {
      await tx.insert(schema.quotes).values({
        id: quoteId,
        studioId,
        clientId: input.clientId,
        quoteNumber: generateQuoteNumber(),
        title: input.title,
        status: "draft",
        terms: input.terms ?? "",
        estimateBreakdownSnapshot: null,
      });

      if (input.selectedServicePackageIds.length > 0) {
        await tx.insert(schema.quoteServicePackages).values(
          input.selectedServicePackageIds.map((spId, index) => ({
            id: randomUUID(),
            quoteId,
            servicePackageId: spId,
            position: index + 1,
          })),
        );
      }
    });

    const created = await getQuoteById(quoteId);
    return created ?? createQuoteInStore(studioId, input);
  } catch {
    return createQuoteInStore(studioId, input);
  }
}

export async function updateQuoteRecord(
  studioId: string,
  quoteId: string,
  input: QuoteInput,
): Promise<QuoteDetailRecord | null> {
  if (!env.DATABASE_URL) {
    return updateQuoteInStore(studioId, quoteId, input);
  }

  try {
    const [{ db }, { and }, schema] = await Promise.all([
      import("@/server/db"),
      import("drizzle-orm"),
      import("@/server/db/schema/quotes"),
    ]);

    let updatedRowCount = 0;

    await db.transaction(async (tx) => {
      const updateResult = await tx
        .update(schema.quotes)
        .set({
          clientId: input.clientId,
          title: input.title,
          terms: input.terms ?? "",
          estimateBreakdownSnapshot: null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.quotes.id, quoteId),
            eq(schema.quotes.studioId, studioId),
          ),
        )
        .returning();

      updatedRowCount = updateResult.length;

      if (updatedRowCount === 0) {
        return;
      }

      await tx
        .delete(schema.quoteServicePackages)
        .where(eq(schema.quoteServicePackages.quoteId, quoteId));

      if (input.selectedServicePackageIds.length > 0) {
        await tx.insert(schema.quoteServicePackages).values(
          input.selectedServicePackageIds.map((spId, index) => ({
            id: randomUUID(),
            quoteId,
            servicePackageId: spId,
            position: index + 1,
          })),
        );
      }
    });

    if (updatedRowCount === 0) {
      return null;
    }

    return getQuoteById(quoteId);
  } catch {
    return updateQuoteInStore(studioId, quoteId, input);
  }
}

export async function setQuoteGeneratedAt(
  quoteId: string,
  generatedAt: Date,
): Promise<void> {
  if (!env.DATABASE_URL) {
    setQuoteGeneratedAtInStore(quoteId, generatedAt.toISOString());
    return;
  }

  try {
    const [{ db }, schema] = await Promise.all([
      import("@/server/db"),
      import("@/server/db/schema/quotes"),
    ]);

    await db
      .update(schema.quotes)
      .set({ generatedAt, updatedAt: new Date() })
      .where(eq(schema.quotes.id, quoteId));
  } catch {
    setQuoteGeneratedAtInStore(quoteId, generatedAt.toISOString());
  }
}

export async function setQuoteEstimateBreakdownSnapshot(
  quoteId: string,
  estimateBreakdown: EstimateBreakdownPayload | null,
): Promise<void> {
  if (!env.DATABASE_URL) {
    setQuoteEstimateBreakdownInStore(quoteId, estimateBreakdown);
    return;
  }

  try {
    const [{ db }, schema] = await Promise.all([
      import("@/server/db"),
      import("@/server/db/schema/quotes"),
    ]);

    await db
      .update(schema.quotes)
      .set({
        estimateBreakdownSnapshot: serializeEstimateBreakdownSnapshot(
          estimateBreakdown,
        ),
      })
      .where(eq(schema.quotes.id, quoteId));
  } catch {
    setQuoteEstimateBreakdownInStore(quoteId, estimateBreakdown);
  }
}

export async function saveQuoteSections(
  quoteId: string,
  studioId: string,
  sections: QuoteSectionRecord[],
): Promise<void> {
  if (!env.DATABASE_URL) {
    writeQuoteSectionsToStore(quoteId, sections);
    return;
  }

  try {
    const [{ db }, schema] = await Promise.all([
      import("@/server/db"),
      import("@/server/db/schema/quote-sections"),
    ]);

    await db.transaction(async (tx) => {
      await tx
        .delete(schema.quoteLineItems)
        .where(eq(schema.quoteLineItems.quoteId, quoteId));
      await tx
        .delete(schema.quoteSections)
        .where(eq(schema.quoteSections.quoteId, quoteId));

      for (const section of sections) {
        await tx.insert(schema.quoteSections).values({
          id: section.id,
          quoteId: section.quoteId,
          studioId,
          sourceServicePackageId: section.sourceServicePackageId,
          title: section.title,
          content: section.content,
          position: section.position,
        });

        if (section.lineItems.length > 0) {
          await tx.insert(schema.quoteLineItems).values(
            section.lineItems.map((li) => ({
              id: li.id,
              quoteId: li.quoteId,
              quoteSectionId: li.quoteSectionId,
              studioId,
              name: li.name,
              content: li.content,
              quantity: li.quantity,
              unitLabel: li.unitLabel,
              unitPriceCents: li.unitPriceCents,
              lineTotalCents: li.lineTotalCents,
              position: li.position,
            })),
          );
        }
      }
    });
  } catch {
    writeQuoteSectionsToStore(quoteId, sections);
  }
}

export async function deleteQuoteSections(quoteId: string): Promise<void> {
  if (!env.DATABASE_URL) {
    deleteQuoteSectionsFromStore(quoteId);
    return;
  }

  try {
    const [{ db }, schema] = await Promise.all([
      import("@/server/db"),
      import("@/server/db/schema/quote-sections"),
    ]);

    await db.transaction(async (tx) => {
      await tx
        .delete(schema.quoteLineItems)
        .where(eq(schema.quoteLineItems.quoteId, quoteId));
      await tx
        .delete(schema.quoteSections)
        .where(eq(schema.quoteSections.quoteId, quoteId));
    });
  } catch {
    deleteQuoteSectionsFromStore(quoteId);
  }
}

export function __resetQuotesStore() {
  resetQuotesStore();
}

export async function loadQuoteSectionsFromStore(
  quoteId: string,
): Promise<QuoteSectionRecord[]> {
  return readQuoteByIdFromStore(quoteId)?.sections ?? [];
}

export async function loadQuoteSectionsForEditing(
  quoteId: string,
): Promise<QuoteSectionRecord[]> {
  if (!env.DATABASE_URL) {
    return loadQuoteSectionsFromStore(quoteId);
  }

  try {
    const sectionsData = await loadQuoteSectionsAndLineItems(quoteId);
    return buildSectionsFromRows(
      sectionsData.sectionRows as QuoteSectionRow[],
      sectionsData.lineItemRows as QuoteLineItemRow[],
    );
  } catch {
    return loadQuoteSectionsFromStore(quoteId);
  }
}

export async function updateQuoteTimestamp(
  quoteId: string,
): Promise<void> {
  if (!env.DATABASE_URL) {
    const quote = readQuoteByIdFromStore(quoteId);
    if (quote) {
      quote.updatedAt = new Date().toISOString();
    }
    return;
  }

  try {
    const [{ db }, schema] = await Promise.all([
      import("@/server/db"),
      import("@/server/db/schema/quotes"),
    ]);

    await db
      .update(schema.quotes)
      .set({ updatedAt: new Date() })
      .where(eq(schema.quotes.id, quoteId));
  } catch {
    // Fallback handled by store path
  }
}
