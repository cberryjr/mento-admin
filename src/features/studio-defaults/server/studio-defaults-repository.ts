import { randomUUID } from "node:crypto";

import { env } from "@/lib/env";
import type { StudioDefaultsInput, StudioDefaultsRecord } from "@/features/studio-defaults/types";
import { buildStudioDefaultsPrefill } from "@/features/studio-defaults/types";
import {
  readStudioDefaultsFromStore,
  writeStudioDefaultsToStore,
} from "@/features/studio-defaults/server/store/studio-defaults-store";

function mapRowToRecord(row: {
  studioId: string;
  studioName: string;
  studioContactName: string;
  studioContactEmail: string;
  studioContactPhone: string;
  defaultQuoteTerms: string;
  defaultInvoicePaymentInstructions: string;
  createdAt: Date;
  updatedAt: Date;
}): StudioDefaultsRecord {
  return {
    studioId: row.studioId,
    studioName: row.studioName,
    studioContactName: row.studioContactName,
    studioContactEmail: row.studioContactEmail,
    studioContactPhone: row.studioContactPhone,
    defaultQuoteTerms: row.defaultQuoteTerms,
    defaultInvoicePaymentInstructions: row.defaultInvoicePaymentInstructions,
    prefill: buildStudioDefaultsPrefill({
      studioName: row.studioName,
      studioContactName: row.studioContactName,
      studioContactEmail: row.studioContactEmail,
      studioContactPhone: row.studioContactPhone,
      defaultQuoteTerms: row.defaultQuoteTerms,
      defaultInvoicePaymentInstructions: row.defaultInvoicePaymentInstructions,
    }),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function loadStudioDefaults(studioId: string): Promise<StudioDefaultsRecord | null> {
  if (!env.DATABASE_URL) {
    return readStudioDefaultsFromStore(studioId);
  }

  try {
    const [{ db }, { eq }, { studioDefaults }] = await Promise.all([
      import("@/server/db"),
      import("drizzle-orm"),
      import("@/server/db/schema/studio-defaults"),
    ]);

    const rows = await db
      .select()
      .from(studioDefaults)
      .where(eq(studioDefaults.studioId, studioId))
      .limit(1);

    if (!rows.length) {
      return null;
    }

    const row = rows[0];
    return mapRowToRecord({
      studioId: row.studioId,
      studioName: row.studioName,
      studioContactName: row.studioContactName,
      studioContactEmail: row.studioContactEmail,
      studioContactPhone: row.studioContactPhone,
      defaultQuoteTerms: row.defaultQuoteTerms,
      defaultInvoicePaymentInstructions: row.defaultInvoicePaymentInstructions,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  } catch {
    return readStudioDefaultsFromStore(studioId);
  }
}

export async function saveStudioDefaults(
  studioId: string,
  input: StudioDefaultsInput,
): Promise<StudioDefaultsRecord> {
  if (!env.DATABASE_URL) {
    return writeStudioDefaultsToStore(studioId, input);
  }

  try {
    const [{ db }, { eq }, { studioDefaults }] = await Promise.all([
      import("@/server/db"),
      import("drizzle-orm"),
      import("@/server/db/schema/studio-defaults"),
    ]);

    await db
      .insert(studioDefaults)
      .values({
        id: randomUUID(),
        studioId,
        studioName: input.studioName,
        studioContactName: input.studioContactName,
        studioContactEmail: input.studioContactEmail,
        studioContactPhone: input.studioContactPhone,
        defaultQuoteTerms: input.defaultQuoteTerms,
        defaultInvoicePaymentInstructions: input.defaultInvoicePaymentInstructions,
      })
      .onConflictDoUpdate({
        target: studioDefaults.studioId,
        set: {
          studioName: input.studioName,
          studioContactName: input.studioContactName,
          studioContactEmail: input.studioContactEmail,
          studioContactPhone: input.studioContactPhone,
          defaultQuoteTerms: input.defaultQuoteTerms,
          defaultInvoicePaymentInstructions: input.defaultInvoicePaymentInstructions,
          updatedAt: new Date(),
        },
      });

    const rows = await db
      .select()
      .from(studioDefaults)
      .where(eq(studioDefaults.studioId, studioId))
      .limit(1);

    if (!rows.length) {
      return writeStudioDefaultsToStore(studioId, input);
    }

    const row = rows[0];

    return mapRowToRecord({
      studioId: row.studioId,
      studioName: row.studioName,
      studioContactName: row.studioContactName,
      studioContactEmail: row.studioContactEmail,
      studioContactPhone: row.studioContactPhone,
      defaultQuoteTerms: row.defaultQuoteTerms,
      defaultInvoicePaymentInstructions: row.defaultInvoicePaymentInstructions,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  } catch {
    return writeStudioDefaultsToStore(studioId, input);
  }
}
