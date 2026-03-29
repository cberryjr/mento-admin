import { randomUUID } from "node:crypto";

import { asc, desc, eq, inArray } from "drizzle-orm";

import { env } from "@/lib/env";
import type {
  InvoiceClientRecord,
  InvoiceDetailRecord,
  InvoiceRecord,
  InvoiceStatus,
} from "@/features/invoices/types";
import { isDatabaseConfiguredForRuntime } from "@/server/db/get-database-url";
import {
  mapInvoiceRowToRecord,
  mapInvoiceToDetail,
} from "@/features/invoices/server/mappers";
import {
  createInvoiceInStore,
  readInvoiceByIdFromStore,
  readInvoicesByQuoteIdsFromStore,
  readInvoicesFromStore,
  setInvoiceStatusInStore,
  updateInvoiceInStore,
} from "@/features/invoices/server/store/invoices-store";
import { readClientByIdFromStore } from "@/features/clients/server/store/clients-store";
import { readQuoteByIdFromStore } from "@/features/quotes/server/store/quotes-store";

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

function isDatabaseConfigured() {
  return isDatabaseConfiguredForRuntime(env);
}

function generateInvoiceNumber(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const suffix = randomUUID().slice(0, 8).toUpperCase();
  return `INV-${y}${m}${d}-${suffix}`;
}

function shouldUseStoreFallback(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const cause =
    typeof error === "object" && error !== null && "cause" in error
      ? (error as { cause?: { code?: string; message?: string } }).cause
      : undefined;

  const candidateText = [error.message, cause?.message].filter(Boolean).join(" ");

  return (
    cause?.code === "28P01" ||
    cause?.code === "ECONNREFUSED" ||
    cause?.code === "ENOTFOUND" ||
    /password authentication failed/i.test(candidateText) ||
    /connect/i.test(candidateText)
  );
}

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

function buildInvoiceSectionsFromQuoteStore(
  quote: NonNullable<ReturnType<typeof readQuoteByIdFromStore>>,
) {
  return quote.sections.map((section) => ({
    title: section.title,
    content: section.content,
    position: section.position,
    lineItems: section.lineItems.map((lineItem) => ({
      name: lineItem.name,
      content: lineItem.content,
      quantity: lineItem.quantity,
      unitLabel: lineItem.unitLabel,
      unitPriceCents: lineItem.unitPriceCents,
      lineTotalCents: lineItem.lineTotalCents,
      position: lineItem.position,
    })),
  }));
}

async function createInvoiceFromStore(
  studioId: string,
  quoteId: string,
): Promise<InvoiceDetailRecord> {
  const sourceQuote = readQuoteByIdFromStore(quoteId);

  if (!sourceQuote) {
    throw new Error("Quote not found");
  }

  const sourceClient = readClientByIdFromStore(sourceQuote.clientId);

  return createInvoiceInStore(
    studioId,
    {
      clientId: sourceQuote.clientId,
      sourceQuoteId: quoteId,
      invoiceNumber: generateInvoiceNumber(),
      title: sourceQuote.title,
      terms: sourceQuote.terms,
      sections: buildInvoiceSectionsFromQuoteStore(sourceQuote),
    },
    {
      id: sourceQuote.id,
      quoteNumber: sourceQuote.quoteNumber,
      title: sourceQuote.title,
    },
    toInvoiceClient(sourceClient),
  );
}

async function loadInvoiceRows(invoiceId: string) {
  const [{ db }, schema] = await Promise.all([
    import("@/server/db"),
    import("@/server/db/schema/invoices"),
  ]);

  const [invoiceRows, sectionRows, lineItemRows] = await Promise.all([
    db.select().from(schema.invoices).where(eq(schema.invoices.id, invoiceId)).limit(1),
    db
      .select()
      .from(schema.invoiceSections)
      .where(eq(schema.invoiceSections.invoiceId, invoiceId))
      .orderBy(asc(schema.invoiceSections.position)),
    db
      .select()
      .from(schema.invoiceLineItems)
      .where(eq(schema.invoiceLineItems.invoiceId, invoiceId))
      .orderBy(
        asc(schema.invoiceLineItems.invoiceSectionId),
        asc(schema.invoiceLineItems.position),
      ),
  ]);

  return {
    invoiceRow: invoiceRows[0] ?? null,
    sectionRows,
    lineItemRows,
  };
}

async function loadSourceQuote(quoteId: string): Promise<SourceQuoteRow | null> {
  const [{ db }, schema] = await Promise.all([
    import("@/server/db"),
    import("@/server/db/schema/quotes"),
  ]);

  const rows = await db
    .select({
      id: schema.quotes.id,
      quoteNumber: schema.quotes.quoteNumber,
      title: schema.quotes.title,
    })
    .from(schema.quotes)
    .where(eq(schema.quotes.id, quoteId))
    .limit(1);

  return rows[0] ?? null;
}

async function loadClient(clientId: string): Promise<ClientRow | null> {
  const [{ db }, schema] = await Promise.all([
    import("@/server/db"),
    import("@/server/db/schema/clients"),
  ]);

  const rows = await db
    .select({
      id: schema.clients.id,
      name: schema.clients.name,
      contactName: schema.clients.contactName,
      contactEmail: schema.clients.contactEmail,
      contactPhone: schema.clients.contactPhone,
    })
    .from(schema.clients)
    .where(eq(schema.clients.id, clientId))
    .limit(1);

  return rows[0] ?? null;
}

export async function createInvoiceFromQuote(
  studioId: string,
  quoteId: string,
): Promise<InvoiceDetailRecord> {
  if (!isDatabaseConfigured()) {
    return createInvoiceFromStore(studioId, quoteId);
  }

  try {
    const [{ db }, invoiceSchema, quoteSchema, quoteSectionSchema] =
      await Promise.all([
        import("@/server/db"),
        import("@/server/db/schema/invoices"),
        import("@/server/db/schema/quotes"),
        import("@/server/db/schema/quote-sections"),
      ]);

    const sourceQuoteRows = await db
      .select()
      .from(quoteSchema.quotes)
      .where(eq(quoteSchema.quotes.id, quoteId))
      .limit(1);

    const sourceQuote = sourceQuoteRows[0] ?? null;

    if (!sourceQuote) {
      throw new Error("Quote not found");
    }

    const [sectionRows, lineItemRows] = await Promise.all([
      db
        .select()
        .from(quoteSectionSchema.quoteSections)
        .where(eq(quoteSectionSchema.quoteSections.quoteId, quoteId))
        .orderBy(asc(quoteSectionSchema.quoteSections.position)),
      db
        .select()
        .from(quoteSectionSchema.quoteLineItems)
        .where(eq(quoteSectionSchema.quoteLineItems.quoteId, quoteId))
        .orderBy(
          asc(quoteSectionSchema.quoteLineItems.quoteSectionId),
          asc(quoteSectionSchema.quoteLineItems.position),
        ),
    ]);

    const invoiceId = randomUUID();
    const invoiceNumber = generateInvoiceNumber();
    const invoiceSectionIds = new Map(
      sectionRows.map((section) => [section.id, randomUUID()]),
    );

    await db.transaction(async (tx) => {
      await tx.insert(invoiceSchema.invoices).values({
        id: invoiceId,
        studioId,
        clientId: sourceQuote.clientId,
        sourceQuoteId: quoteId,
        invoiceNumber,
        title: sourceQuote.title,
        status: "draft",
        terms: sourceQuote.terms,
        paymentInstructions: "",
      });

      if (sectionRows.length > 0) {
        await tx.insert(invoiceSchema.invoiceSections).values(
          sectionRows.map((section) => ({
            id: invoiceSectionIds.get(section.id) ?? randomUUID(),
            invoiceId,
            studioId,
            title: section.title,
            content: section.content,
            position: section.position,
          })),
        );
      }

      if (lineItemRows.length > 0) {
        await tx.insert(invoiceSchema.invoiceLineItems).values(
          lineItemRows.map((lineItem) => {
            const invoiceSectionId = invoiceSectionIds.get(
              lineItem.quoteSectionId,
            );

            if (!invoiceSectionId) {
              throw new Error("Quote line item is missing its source section");
            }

            return {
              id: randomUUID(),
              invoiceId,
              invoiceSectionId,
              studioId,
              name: lineItem.name,
              content: lineItem.content,
              quantity: lineItem.quantity,
              unitLabel: lineItem.unitLabel,
              unitPriceCents: lineItem.unitPriceCents,
              lineTotalCents: lineItem.lineTotalCents,
              position: lineItem.position,
            };
          }),
        );
      }
    });

    const created = await getInvoiceById(invoiceId);

    if (!created) {
      throw new Error("Invoice could not be loaded after creation");
    }

    return created;
  } catch (error) {
    if (shouldUseStoreFallback(error)) {
      return createInvoiceFromStore(studioId, quoteId);
    }

    throw error;
  }
}

export async function getInvoiceById(
  invoiceId: string,
): Promise<InvoiceDetailRecord | null> {
  if (!isDatabaseConfigured()) {
    return readInvoiceByIdFromStore(invoiceId);
  }

  try {
    const { invoiceRow, sectionRows, lineItemRows } = await loadInvoiceRows(invoiceId);

    if (!invoiceRow) {
      return null;
    }

    const [sourceQuote, client] = await Promise.all([
      loadSourceQuote(invoiceRow.sourceQuoteId),
      loadClient(invoiceRow.clientId),
    ]);

    return mapInvoiceToDetail(
      invoiceRow as InvoiceRow,
      sectionRows as InvoiceSectionRow[],
      lineItemRows as InvoiceLineItemRow[],
      client,
      sourceQuote,
    );
  } catch (error) {
    if (shouldUseStoreFallback(error)) {
      return readInvoiceByIdFromStore(invoiceId);
    }

    throw error;
  }
}

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

async function updateInvoiceInDatabase(
  invoiceId: string,
  studioId: string,
  input: InvoiceUpdateInput,
): Promise<InvoiceDetailRecord> {
  const [{ db }, schema] = await Promise.all([
    import("@/server/db"),
    import("@/server/db/schema/invoices"),
  ]);

  await db.transaction(async (tx) => {
    const updateData: Record<string, unknown> = {};

    if (input.clientId !== undefined) {
      updateData.clientId = input.clientId;
    }

    if (input.title !== undefined) {
      updateData.title = input.title;
    }

    if (input.issueDate !== undefined) {
      updateData.issueDate = input.issueDate ? new Date(input.issueDate) : null;
    }

    if (input.dueDate !== undefined) {
      updateData.dueDate = input.dueDate ? new Date(input.dueDate) : null;
    }

    if (input.terms !== undefined) {
      updateData.terms = input.terms;
    }

    if (input.paymentInstructions !== undefined) {
      updateData.paymentInstructions = input.paymentInstructions;
    }

    if (Object.keys(updateData).length > 0) {
      await tx
        .update(schema.invoices)
        .set(updateData)
        .where(eq(schema.invoices.id, invoiceId));
    }

    if (input.sections !== undefined) {
      const existingSectionRows = await tx
        .select({ id: schema.invoiceSections.id })
        .from(schema.invoiceSections)
        .where(eq(schema.invoiceSections.invoiceId, invoiceId));

      const existingSectionIds = new Set(
        existingSectionRows.map((row) => row.id),
      );
      const incomingSectionIds = new Set(
        input.sections.filter((s) => s.id).map((s) => s.id as string),
      );

      for (const sectionId of existingSectionIds) {
        if (!incomingSectionIds.has(sectionId)) {
          await tx
            .delete(schema.invoiceLineItems)
            .where(eq(schema.invoiceLineItems.invoiceSectionId, sectionId));
          await tx
            .delete(schema.invoiceSections)
            .where(eq(schema.invoiceSections.id, sectionId));
        }
      }

      for (const sectionInput of input.sections) {
        let sectionId = sectionInput.id;

        if (sectionId && existingSectionIds.has(sectionId)) {
          await tx
            .update(schema.invoiceSections)
            .set({
              title: sectionInput.title,
              content: sectionInput.content ?? "",
              position: sectionInput.position,
            })
            .where(eq(schema.invoiceSections.id, sectionId));
        } else {
          sectionId = randomUUID();
          await tx.insert(schema.invoiceSections).values({
            id: sectionId,
            invoiceId,
            studioId,
            title: sectionInput.title,
            content: sectionInput.content ?? "",
            position: sectionInput.position,
          });
        }

        if (sectionInput.lineItems) {
          const existingLineItemRows = await tx
            .select({ id: schema.invoiceLineItems.id })
            .from(schema.invoiceLineItems)
            .where(eq(schema.invoiceLineItems.invoiceSectionId, sectionId));

          const existingLineItemIds = new Set(
            existingLineItemRows.map((row) => row.id),
          );
          const incomingLineItemIds = new Set(
            sectionInput.lineItems
              .filter((li) => li.id)
              .map((li) => li.id as string),
          );

          for (const lineItemId of existingLineItemIds) {
            if (!incomingLineItemIds.has(lineItemId)) {
              await tx
                .delete(schema.invoiceLineItems)
                .where(eq(schema.invoiceLineItems.id, lineItemId));
            }
          }

          for (const lineItemInput of sectionInput.lineItems) {
            const lineTotalCents =
              lineItemInput.quantity * lineItemInput.unitPriceCents;

            if (
              lineItemInput.id &&
              existingLineItemIds.has(lineItemInput.id)
            ) {
              await tx
                .update(schema.invoiceLineItems)
                .set({
                  name: lineItemInput.name,
                  content: lineItemInput.content ?? "",
                  quantity: lineItemInput.quantity,
                  unitLabel: lineItemInput.unitLabel ?? "",
                  unitPriceCents: lineItemInput.unitPriceCents,
                  lineTotalCents,
                  position: lineItemInput.position,
                })
                .where(eq(schema.invoiceLineItems.id, lineItemInput.id));
            } else {
              await tx.insert(schema.invoiceLineItems).values({
                id: randomUUID(),
                invoiceId,
                invoiceSectionId: sectionId,
                studioId,
                name: lineItemInput.name,
                content: lineItemInput.content ?? "",
                quantity: lineItemInput.quantity,
                unitLabel: lineItemInput.unitLabel ?? "",
                unitPriceCents: lineItemInput.unitPriceCents,
                lineTotalCents,
                position: lineItemInput.position,
              });
            }
          }
        }
      }
    }
  });

  const updated = await getInvoiceById(invoiceId);

  if (!updated) {
    throw new Error("Invoice could not be loaded after update");
  }

  return updated;
}

export async function updateInvoice(
  invoiceId: string,
  studioId: string,
  input: InvoiceUpdateInput,
): Promise<InvoiceDetailRecord> {
  if (!isDatabaseConfigured()) {
    const updated = updateInvoiceInStore(invoiceId, input);

    if (!updated) {
      throw new Error("Invoice not found");
    }

    return updated;
  }

  try {
    return await updateInvoiceInDatabase(invoiceId, studioId, input);
  } catch (error) {
    if (shouldUseStoreFallback(error)) {
      const updated = updateInvoiceInStore(invoiceId, input);

      if (!updated) {
        throw new Error("Invoice not found");
      }

      return updated;
    }

    throw error;
  }
}

export async function updateInvoiceStatus(
  invoiceId: string,
  status: InvoiceStatus,
): Promise<InvoiceDetailRecord | null> {
  if (!isDatabaseConfigured()) {
    return setInvoiceStatusInStore(invoiceId, status);
  }

  try {
    const [{ db }, schema] = await Promise.all([
      import("@/server/db"),
      import("@/server/db/schema/invoices"),
    ]);

    await db
      .update(schema.invoices)
      .set({ status, updatedAt: new Date() })
      .where(eq(schema.invoices.id, invoiceId));

    return getInvoiceById(invoiceId);
  } catch (error) {
    if (shouldUseStoreFallback(error)) {
      return setInvoiceStatusInStore(invoiceId, status);
    }

    throw error;
  }
}

export async function listInvoicesForStudio(
  studioId: string,
): Promise<InvoiceRecord[]> {
  if (!isDatabaseConfigured()) {
    return readInvoicesFromStore(studioId).map((invoice) => ({
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

  try {
    const [{ db }, schema] = await Promise.all([
      import("@/server/db"),
      import("@/server/db/schema/invoices"),
    ]);

    const rows = await db
      .select()
      .from(schema.invoices)
      .where(eq(schema.invoices.studioId, studioId))
      .orderBy(desc(schema.invoices.updatedAt));

    return rows.map((row) => mapInvoiceRowToRecord(row as InvoiceRow));
  } catch (error) {
    if (shouldUseStoreFallback(error)) {
      return readInvoicesFromStore(studioId).map((invoice) => ({
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

    throw error;
  }
}

export async function listInvoicesByQuoteIds(
  quoteIds: string[],
  studioId: string,
): Promise<InvoiceRecord[]> {
  if (quoteIds.length === 0) {
    return [];
  }

  if (!isDatabaseConfigured()) {
    return readInvoicesByQuoteIdsFromStore(quoteIds, studioId);
  }

  try {
    const [{ db }, { and }, schema] = await Promise.all([
      import("@/server/db"),
      import("drizzle-orm"),
      import("@/server/db/schema/invoices"),
    ]);

    const rows = await db
      .select()
      .from(schema.invoices)
      .where(
        and(
          eq(schema.invoices.studioId, studioId),
          inArray(schema.invoices.sourceQuoteId, quoteIds),
        ),
      )
      .orderBy(desc(schema.invoices.updatedAt));

    return rows.map((row) => mapInvoiceRowToRecord(row as InvoiceRow));
  } catch (error) {
    if (shouldUseStoreFallback(error)) {
      return readInvoicesByQuoteIdsFromStore(quoteIds, studioId);
    }

    throw error;
  }
}

export { __resetInvoicesStore } from "@/features/invoices/server/store/invoices-store";
