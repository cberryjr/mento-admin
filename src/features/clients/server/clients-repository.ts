import { randomUUID } from "node:crypto";

import { asc, eq } from "drizzle-orm";

import { env } from "@/lib/env";
import type { ClientDetailRecord, ClientInput, ClientRecord } from "@/features/clients/types";
import { isDatabaseConfiguredForRuntime } from "@/server/db/get-database-url";
import {
  __resetClientsStore as resetClientsStore,
  createClientInStore,
  readClientByIdFromStore,
  readClientFromStore,
  readClientsFromStore,
  readInvoiceSummariesForClientFromStore,
  readQuoteSummariesForClientFromStore,
  updateClientInStore,
} from "@/features/clients/server/store/clients-store";

function isDatabaseConfigured() {
  return isDatabaseConfiguredForRuntime(env);
}

type ClientRow = {
  id: string;
  studioId: string;
  name: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  createdAt: Date;
  updatedAt: Date;
};

function mapRowToRecord(row: ClientRow): ClientRecord {
  return {
    id: row.id,
    studioId: row.studioId,
    name: row.name,
    contactName: row.contactName,
    contactEmail: row.contactEmail,
    contactPhone: row.contactPhone,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function sortClients(clients: ClientRecord[]) {
  return [...clients].sort((left, right) => {
    const nameComparison = left.name.localeCompare(right.name, undefined, {
      sensitivity: "base",
    });

    if (nameComparison !== 0) {
      return nameComparison;
    }

    return left.createdAt.localeCompare(right.createdAt);
  });
}

export async function listClientsForStudio(studioId: string): Promise<ClientRecord[]> {
  if (!isDatabaseConfigured()) {
    return sortClients(readClientsFromStore(studioId));
  }

  try {
    const [{ db }, { clients }] = await Promise.all([
      import("@/server/db"),
      import("@/server/db/schema/clients"),
    ]);

    const rows = await db
      .select()
      .from(clients)
      .where(eq(clients.studioId, studioId))
      .orderBy(asc(clients.name), asc(clients.createdAt));

    return rows.map((row) => mapRowToRecord(row));
  } catch {
    return sortClients(readClientsFromStore(studioId));
  }
}

export async function getClientById(clientId: string): Promise<ClientRecord | null> {
  if (!isDatabaseConfigured()) {
    return readClientByIdFromStore(clientId);
  }

  try {
    const [{ db }, { clients }] = await Promise.all([
      import("@/server/db"),
      import("@/server/db/schema/clients"),
    ]);

    const rows = await db.select().from(clients).where(eq(clients.id, clientId)).limit(1);
    const row = rows[0];

    return row ? mapRowToRecord(row) : null;
  } catch {
    return readClientByIdFromStore(clientId);
  }
}

export async function getClientByIdForStudio(
  studioId: string,
  clientId: string,
): Promise<ClientRecord | null> {
  if (!isDatabaseConfigured()) {
    return readClientFromStore(studioId, clientId);
  }

  try {
    const [{ db }, { and }, { clients }] = await Promise.all([
      import("@/server/db"),
      import("drizzle-orm"),
      import("@/server/db/schema/clients"),
    ]);

    const rows = await db
      .select()
      .from(clients)
      .where(and(eq(clients.id, clientId), eq(clients.studioId, studioId)))
      .limit(1);

    const row = rows[0];
    return row ? mapRowToRecord(row) : null;
  } catch {
    return readClientFromStore(studioId, clientId);
  }
}

export async function buildClientDetailRecord(
  studioId: string,
  client: ClientRecord,
): Promise<ClientDetailRecord> {
  if (isDatabaseConfigured()) {
    try {
      const [{ db }, { and, asc, desc, eq }, quoteSchema, invoiceSchema] = await Promise.all([
        import("@/server/db"),
        import("drizzle-orm"),
        import("@/server/db/schema/quotes"),
        import("@/server/db/schema/invoices"),
      ]);

      const [quoteRows, invoiceRows] = await Promise.all([
        db
          .select({
            id: quoteSchema.quotes.id,
            quoteNumber: quoteSchema.quotes.quoteNumber,
            title: quoteSchema.quotes.title,
            status: quoteSchema.quotes.status,
            updatedAt: quoteSchema.quotes.updatedAt,
          })
          .from(quoteSchema.quotes)
          .where(
            and(
              eq(quoteSchema.quotes.studioId, studioId),
              eq(quoteSchema.quotes.clientId, client.id),
            ),
          )
          .orderBy(desc(quoteSchema.quotes.updatedAt), asc(quoteSchema.quotes.title)),
        db
          .select({
            id: invoiceSchema.invoices.id,
            invoiceNumber: invoiceSchema.invoices.invoiceNumber,
            title: invoiceSchema.invoices.title,
            status: invoiceSchema.invoices.status,
            updatedAt: invoiceSchema.invoices.updatedAt,
          })
          .from(invoiceSchema.invoices)
          .where(
            and(
              eq(invoiceSchema.invoices.studioId, studioId),
              eq(invoiceSchema.invoices.clientId, client.id),
            ),
          )
          .orderBy(desc(invoiceSchema.invoices.updatedAt), asc(invoiceSchema.invoices.title)),
      ]);

      return {
        client,
        relatedQuotes: quoteRows.map((row) => ({
          id: row.id,
          quoteNumber: row.quoteNumber,
          title: row.title,
          status: row.status as ClientDetailRecord["relatedQuotes"][number]["status"],
          updatedAt: row.updatedAt.toISOString(),
        })),
        relatedInvoices: invoiceRows.map((row) => ({
          id: row.id,
          invoiceNumber: row.invoiceNumber,
          title: row.title,
          status: row.status as ClientDetailRecord["relatedInvoices"][number]["status"],
          updatedAt: row.updatedAt.toISOString(),
        })),
      };
    } catch {
      return {
        client,
        relatedQuotes: readQuoteSummariesForClientFromStore(studioId, client.id),
        relatedInvoices: readInvoiceSummariesForClientFromStore(studioId, client.id),
      };
    }
  }

  return {
    client,
    relatedQuotes: readQuoteSummariesForClientFromStore(studioId, client.id),
    relatedInvoices: readInvoiceSummariesForClientFromStore(studioId, client.id),
  };
}

export async function createClientRecord(
  studioId: string,
  input: ClientInput,
): Promise<ClientRecord> {
  if (!isDatabaseConfigured()) {
    return createClientInStore(studioId, input);
  }

  try {
    const [{ db }, { clients }] = await Promise.all([
      import("@/server/db"),
      import("@/server/db/schema/clients"),
    ]);

    const rows = await db
      .insert(clients)
      .values({
        id: randomUUID(),
        studioId,
        name: input.name,
        contactName: input.contactName,
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone,
      })
      .returning();

    const row = rows[0];
    return row ? mapRowToRecord(row) : createClientInStore(studioId, input);
  } catch {
    return createClientInStore(studioId, input);
  }
}

export async function updateClientRecord(
  studioId: string,
  clientId: string,
  input: ClientInput,
): Promise<ClientRecord | null> {
  if (!isDatabaseConfigured()) {
    // Store enforces studio ownership internally via existing client lookup.
    return updateClientInStore(clientId, input);
  }

  try {
    const [{ db }, { and }, { clients }] = await Promise.all([
      import("@/server/db"),
      import("drizzle-orm"),
      import("@/server/db/schema/clients"),
    ]);

    // Include studio_id in the WHERE clause to prevent cross-studio writes.
    const rows = await db
      .update(clients)
      .set({
        name: input.name,
        contactName: input.contactName,
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone,
        updatedAt: new Date(),
      })
      .where(and(eq(clients.id, clientId), eq(clients.studioId, studioId)))
      .returning();

    const row = rows[0];
    return row ? mapRowToRecord(row) : null;
  } catch {
    return updateClientInStore(clientId, input);
  }
}

export function __resetClientsStore() {
  resetClientsStore();
}
