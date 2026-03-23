type CorrectionEvent = {
  type: "quote.corrected" | "invoice.corrected";
  recordId: string;
  studioId: string;
  occurredAt: string;
};

type CorrectionEventsGlobal = typeof globalThis & {
  __mentoCorrectionEvents?: CorrectionEvent[];
};

function getCorrectionEventsStore() {
  const storeGlobal = globalThis as CorrectionEventsGlobal;

  if (!storeGlobal.__mentoCorrectionEvents) {
    storeGlobal.__mentoCorrectionEvents = [];
  }

  return storeGlobal.__mentoCorrectionEvents;
}

export async function emitCorrectionEvent(
  event: Omit<CorrectionEvent, "occurredAt">,
): Promise<void> {
  getCorrectionEventsStore().push({
    ...event,
    occurredAt: new Date().toISOString(),
  });
}

export function readCorrectionEvents(): CorrectionEvent[] {
  return structuredClone(getCorrectionEventsStore());
}

export function readLatestCorrectionEventForRecord(input: {
  type: CorrectionEvent["type"];
  recordId: string;
  studioId: string;
}): CorrectionEvent | null {
  const events = getCorrectionEventsStore();

  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];

    if (
      event.type === input.type &&
      event.recordId === input.recordId &&
      event.studioId === input.studioId
    ) {
      return structuredClone(event);
    }
  }

  return null;
}

export function __resetCorrectionEvents() {
  const storeGlobal = globalThis as CorrectionEventsGlobal;
  storeGlobal.__mentoCorrectionEvents = [];
}
