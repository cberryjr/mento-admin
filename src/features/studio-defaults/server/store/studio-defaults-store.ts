import type { StudioDefaultsInput, StudioDefaultsRecord } from "@/features/studio-defaults/types";
import { buildStudioDefaultsPrefill } from "@/features/studio-defaults/types";

const studioDefaultsStore = new Map<string, StudioDefaultsRecord>();

function toStudioDefaultsRecord(studioId: string, input: StudioDefaultsInput): StudioDefaultsRecord {
  const now = new Date().toISOString();
  const existing = studioDefaultsStore.get(studioId);

  return {
    studioId,
    studioName: input.studioName,
    studioContactName: input.studioContactName,
    studioContactEmail: input.studioContactEmail,
    studioContactPhone: input.studioContactPhone,
    defaultQuoteTerms: input.defaultQuoteTerms,
    defaultInvoicePaymentInstructions: input.defaultInvoicePaymentInstructions,
    prefill: buildStudioDefaultsPrefill(input),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}

export function readStudioDefaultsFromStore(studioId: string): StudioDefaultsRecord | null {
  return studioDefaultsStore.get(studioId) ?? null;
}

export function writeStudioDefaultsToStore(
  studioId: string,
  input: StudioDefaultsInput,
): StudioDefaultsRecord {
  const record = toStudioDefaultsRecord(studioId, input);
  studioDefaultsStore.set(studioId, record);
  return record;
}

export function __resetStudioDefaultsStore() {
  studioDefaultsStore.clear();
}
