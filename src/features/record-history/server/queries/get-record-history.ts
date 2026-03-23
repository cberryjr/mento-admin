import { requireSession } from "@/features/auth/require-session";
import {
  getClientById as getClientRecordById,
  getClientByIdForStudio,
} from "@/features/clients/server/clients-repository";
import { readLatestCorrectionEventForRecord } from "@/features/corrections/server/correction-events";
import {
  getInvoiceById as getInvoiceRecordById,
  listInvoicesByQuoteIds,
} from "@/features/invoices/server/invoices-repository";
import { buildInvoiceDetailHref } from "@/features/invoices/lib/navigation";
import type { InvoiceRecord } from "@/features/invoices/types";
import type {
  RecordChain,
  RecordChainNode,
  RecordChainNodeLink,
  RecordChainNodeMetadata,
  EntityType,
} from "@/features/record-history/types";
import { buildQuoteDetailHref, buildQuoteRevisionsHref } from "@/features/quotes/lib/navigation";
import {
  getQuoteById as getQuoteRecordById,
  listQuoteRevisionsByQuoteIds,
  listQuotesForStudio,
} from "@/features/quotes/server/quotes-repository";
import {
  calculateQuoteTotalCents,
  type QuoteDetailRecord,
  type QuoteRevisionRecord,
} from "@/features/quotes/types";
import { listServicePackagesForStudio } from "@/features/service-packages/server/service-packages-repository";
import { formatCurrencyFromCents } from "@/lib/format/currency";
import { formatDate } from "@/lib/format/dates";
import { AppError } from "@/lib/errors/app-error";
import { ERROR_CODES } from "@/lib/errors/error-codes";
import type { ActionResult } from "@/lib/validation/action-result";
import { ensureStudioAccess } from "@/server/auth/permissions";

type RecordHistoryInput = {
  entityType: EntityType;
  entityId: string;
  historyHref?: string;
};

type QuoteChainEntry = RecordChain["quoteChain"][number];

function buildClientNode(
  client: {
    id: string;
    name: string;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
  },
  isCurrent: boolean,
  historyHref?: string,
): RecordChainNode {
  const metadata = buildMetadata([
    ["Contact", client.contactName],
    ["Email", client.contactEmail],
    ["Phone", client.contactPhone],
  ]);

  return {
    entityType: "client",
    entityId: client.id,
    label: client.name,
    href: historyHref
      ? `/clients/${client.id}?backTo=${encodeURIComponent(historyHref)}`
      : `/clients/${client.id}`,
    isCurrent,
    metadata,
  };
}

function buildMetadata(entries: Array<[string, string | null | undefined]>): RecordChainNodeMetadata[] | undefined {
  const metadata = entries
    .filter(([, value]) => Boolean(value))
    .map(([label, value]) => ({ label, value: value as string }));

  return metadata.length > 0 ? metadata : undefined;
}

function summarizeQuoteSections(quote: QuoteDetailRecord): string | undefined {
  const titles = quote.sections.map((section) => section.title).filter(Boolean);

  return titles.length > 0 ? titles.join(", ") : undefined;
}

function summarizeQuoteLineItems(quote: QuoteDetailRecord): string | undefined {
  const lineItemNames = quote.sections
    .flatMap((section) => section.lineItems)
    .map((lineItem) => lineItem.name)
    .filter(Boolean);

  return lineItemNames.length > 0 ? lineItemNames.join(", ") : undefined;
}

function calculateInvoiceTotalCents(
  invoice: Pick<InvoiceRecord, "id"> & {
    lineItems?: Array<{ lineTotalCents: number }>;
    sections?: Array<{ lineItems: Array<{ lineTotalCents: number }> }>;
  },
): number {
  if (invoice.lineItems && invoice.lineItems.length > 0) {
    return invoice.lineItems.reduce((total, lineItem) => total + lineItem.lineTotalCents, 0);
  }

  if (invoice.sections && invoice.sections.length > 0) {
    return invoice.sections.reduce(
      (total, section) =>
        total + section.lineItems.reduce((sectionTotal, lineItem) => sectionTotal + lineItem.lineTotalCents, 0),
      0,
    );
  }

  return 0;
}

function summarizeInvoiceSections(
  invoice: Pick<InvoiceRecord, "id"> & { sections?: Array<{ title: string }> },
): string | undefined {
  const titles = invoice.sections?.map((section) => section.title).filter(Boolean) ?? [];

  return titles.length > 0 ? titles.join(", ") : undefined;
}

function summarizeInvoiceLineItems(
  invoice: Pick<InvoiceRecord, "id"> & {
    lineItems?: Array<{ name: string }>;
    sections?: Array<{ lineItems: Array<{ name: string }> }>;
  },
): string | undefined {
  const lineItemNames = invoice.lineItems?.length
    ? invoice.lineItems.map((lineItem) => lineItem.name)
    : invoice.sections?.flatMap((section) => section.lineItems.map((lineItem) => lineItem.name)) ?? [];

  const filteredNames = lineItemNames.filter(Boolean);
  return filteredNames.length > 0 ? filteredNames.join(", ") : undefined;
}

function buildQuoteNode(
  quote: Pick<
    QuoteDetailRecord,
    "id" | "quoteNumber" | "title" | "status" | "createdAt" | "sections" | "terms"
  >,
  isCurrent: boolean,
  sourcePackageNames: string[],
  lastCorrectionAt?: string,
  historyHref?: string,
): RecordChainNode {
  const metadata = buildMetadata([
    [
      "Source packages",
      sourcePackageNames.length > 0 ? sourcePackageNames.join(", ") : undefined,
    ],
    ["Quote sections", summarizeQuoteSections(quote as QuoteDetailRecord)],
    ["Line items", summarizeQuoteLineItems(quote as QuoteDetailRecord)],
    [
      "Quote total",
      quote.sections.length > 0
        ? formatCurrencyFromCents(calculateQuoteTotalCents(quote.sections))
        : undefined,
    ],
    ["Last correction", lastCorrectionAt ? formatDate(lastCorrectionAt) : undefined],
    ["Terms", quote.terms],
  ]);

  return {
    entityType: "quote",
    entityId: quote.id,
    label: `${quote.quoteNumber} - ${quote.title}`,
    status: quote.status,
    timestamp: quote.createdAt,
    href: buildQuoteDetailHref(quote.id, historyHref),
    isCurrent,
    metadata,
  };
}

function buildRevisionNode(
  revision: QuoteRevisionRecord,
  quoteId: string,
  historyHref?: string,
): RecordChainNode {
  const metadata = buildMetadata([
    ["Title", revision.title],
    [
      "Quote sections",
      revision.snapshotData.sections.length > 0
        ? revision.snapshotData.sections.map((section) => section.title).join(", ")
        : undefined,
    ],
    [
      "Snapshot total",
      revision.snapshotData.sections.length > 0
        ? formatCurrencyFromCents(calculateQuoteTotalCents(revision.snapshotData.sections))
        : undefined,
    ],
  ]);

  return {
    entityType: "quote_revision",
    entityId: revision.id,
    label: `Revision ${revision.revisionNumber}`,
    timestamp: revision.createdAt,
    href: buildQuoteRevisionsHref(quoteId, historyHref, revision.id),
    isCurrent: false,
    metadata,
  };
}

function buildInvoiceNode(
  invoice: Pick<
    InvoiceRecord,
    "id" | "invoiceNumber" | "title" | "status" | "createdAt" | "issueDate" | "dueDate" | "paymentInstructions" | "terms"
  >,
  isCurrent: boolean,
  historyHref?: string,
  sourceQuote?: { id: string; quoteNumber: string; title: string } | null,
  detailContext?: {
    sections: Array<{ title: string; lineItems: Array<{ name: string; lineTotalCents: number }> }>;
    lineItems: Array<{ name: string; lineTotalCents: number }>;
  },
  lastCorrectionAt?: string,
  ): RecordChainNode {
  const relatedLinks: RecordChainNodeLink[] = sourceQuote
    ? [
        {
          href: buildQuoteDetailHref(sourceQuote.id, historyHref),
          label: "Open source quote",
          ariaLabel: `Open source quote ${sourceQuote.quoteNumber} - ${sourceQuote.title}`,
        },
      ]
    : [];

  const metadata = buildMetadata([
    ["Source quote", sourceQuote ? `${sourceQuote.quoteNumber} - ${sourceQuote.title}` : undefined],
    ["Invoice sections", summarizeInvoiceSections({ ...invoice, sections: detailContext?.sections })],
    [
      "Line items",
      summarizeInvoiceLineItems({
        ...invoice,
        lineItems: detailContext?.lineItems,
        sections: detailContext?.sections,
      }),
    ],
    [
      "Invoice total",
      detailContext
        ? formatCurrencyFromCents(
            calculateInvoiceTotalCents({
              ...invoice,
              lineItems: detailContext.lineItems,
              sections: detailContext.sections,
            }),
          )
        : undefined,
    ],
    ["Last correction", lastCorrectionAt ? formatDate(lastCorrectionAt) : undefined],
    ["Issued", invoice.issueDate ? formatDate(invoice.issueDate) : undefined],
    ["Due", invoice.dueDate ? formatDate(invoice.dueDate) : undefined],
    ["Terms", invoice.terms],
    ["Payment instructions", invoice.paymentInstructions],
  ]);

  return {
    entityType: "invoice",
    entityId: invoice.id,
    label: `${invoice.invoiceNumber} - ${invoice.title}`,
    status: invoice.status,
    timestamp: invoice.createdAt,
    href: buildInvoiceDetailHref(invoice.id, historyHref),
    isCurrent,
    metadata,
    relatedLinks: relatedLinks.length > 0 ? relatedLinks : undefined,
  };
}

function buildUnknownQuoteNode(): RecordChainNode {
  return {
    entityType: "quote",
    entityId: "unknown-quote",
    label: "Unknown quote",
    href: "/quotes",
    isCurrent: false,
  };
}

function buildNotFoundResult(): ActionResult<RecordChain> {
  return {
    ok: false,
    error: {
      code: ERROR_CODES.UNKNOWN,
      message: "Record not found.",
    },
  };
}

function extractSourceServicePackageIds(quote: QuoteDetailRecord): string[] {
  const ids = new Set(quote.selectedServicePackageIds);

  for (const section of quote.sections) {
    if (section.sourceServicePackageId) {
      ids.add(section.sourceServicePackageId);
    }
  }

  return [...ids].filter(Boolean);
}

async function loadServicePackageNameMap(studioId: string) {
  const servicePackages = await listServicePackagesForStudio(studioId);

  return new Map(servicePackages.map((servicePackage) => [servicePackage.id, servicePackage.name]));
}

async function loadRevisionNodesByQuoteId(
  quoteIds: string[],
  studioId: string,
  historyHref?: string,
): Promise<Map<string, RecordChainNode[]>> {
  if (quoteIds.length === 0) {
    return new Map();
  }

  const revisionsByQuoteId = await listQuoteRevisionsByQuoteIds(quoteIds, studioId);
  const grouped = new Map<string, RecordChainNode[]>();

  for (const [quoteId, revisions] of revisionsByQuoteId) {
    grouped.set(
      quoteId,
      revisions.map((revision) => buildRevisionNode(revision, quoteId, historyHref)),
    );
  }

  return grouped;
}

async function loadInvoiceNodesByQuoteId(
  quoteIds: string[],
  studioId: string,
  currentInvoiceId?: string,
  historyHref?: string,
): Promise<Map<string, RecordChainNode[]>> {
  if (quoteIds.length === 0) {
    return new Map();
  }

  const invoiceSummaries = await listInvoicesByQuoteIds(quoteIds, studioId);
  const invoices = (
    await Promise.all(invoiceSummaries.map((invoice) => getInvoiceRecordById(invoice.id)))
  ).filter((invoice): invoice is NonNullable<Awaited<ReturnType<typeof getInvoiceRecordById>>> => {
    return Boolean(invoice && invoice.studioId === studioId);
  });
  const grouped = new Map<string, RecordChainNode[]>();

  for (const invoice of invoices) {
    const nodes = grouped.get(invoice.sourceQuoteId) ?? [];
    const lastCorrectionEvent = readLatestCorrectionEventForRecord({
      type: "invoice.corrected",
      recordId: invoice.id,
      studioId,
    });

    nodes.push(
      buildInvoiceNode(invoice, invoice.id === currentInvoiceId, historyHref, invoice.sourceQuote, {
        sections: invoice.sections,
        lineItems: invoice.lineItems,
      }, lastCorrectionEvent?.occurredAt),
    );
    grouped.set(invoice.sourceQuoteId, nodes);
  }

  return grouped;
}

async function buildQuoteChainEntries(
  quotes: QuoteDetailRecord[],
  studioId: string,
  currentEntity: { entityType: EntityType; entityId: string },
  historyHref?: string,
): Promise<QuoteChainEntry[]> {
  const quoteIds = quotes.map((quote) => quote.id);
  const servicePackageNameMap = await loadServicePackageNameMap(studioId);
  const [revisionsByQuoteId, invoicesByQuoteId] = await Promise.all([
    loadRevisionNodesByQuoteId(quoteIds, studioId, historyHref),
    loadInvoiceNodesByQuoteId(
      quoteIds,
      studioId,
      currentEntity.entityType === "invoice" ? currentEntity.entityId : undefined,
      historyHref,
    ),
  ]);

  return quotes.map((quote) => {
    const sourcePackageNames = extractSourceServicePackageIds(quote)
      .map((servicePackageId) => servicePackageNameMap.get(servicePackageId))
      .filter((servicePackageName): servicePackageName is string => Boolean(servicePackageName));
    const lastCorrectionEvent = readLatestCorrectionEventForRecord({
      type: "quote.corrected",
      recordId: quote.id,
      studioId,
    });

    return {
      quote: buildQuoteNode(
        quote,
        currentEntity.entityType === "quote" && currentEntity.entityId === quote.id,
        sourcePackageNames,
        lastCorrectionEvent?.occurredAt,
        historyHref,
      ),
      revisions: revisionsByQuoteId.get(quote.id) ?? [],
      invoices: invoicesByQuoteId.get(quote.id) ?? [],
    };
  });
}

export async function getRecordHistory(
  input: RecordHistoryInput,
): Promise<ActionResult<RecordChain>> {
  try {
    const session = await requireSession();

    if (input.entityType === "client") {
      const client = await getClientRecordById(input.entityId);

      if (!client) {
        return buildNotFoundResult();
      }

      try {
        ensureStudioAccess(session, client.studioId);
      } catch {
        return buildNotFoundResult();
      }

      const clientNode = buildClientNode(client, true, input.historyHref);
      const quoteSummaries = (await listQuotesForStudio(session.user.studioId)).filter(
        (quote) => quote.clientId === client.id,
      );
      const quotes = (
        await Promise.all(quoteSummaries.map((quote) => getQuoteRecordById(quote.id)))
      ).filter((quote): quote is QuoteDetailRecord => Boolean(quote));
      const quoteChain = await buildQuoteChainEntries(quotes, session.user.studioId, {
        entityType: "client",
        entityId: client.id,
      }, input.historyHref);

      return {
        ok: true,
        data: {
          client: clientNode,
          quoteChain,
          currentEntity: clientNode,
        },
      };
    }

    if (input.entityType === "quote") {
      const quote = await getQuoteRecordById(input.entityId);

      if (!quote) {
        return buildNotFoundResult();
      }

      try {
        ensureStudioAccess(session, quote.studioId);
      } catch {
        return buildNotFoundResult();
      }

      const client = await getClientByIdForStudio(session.user.studioId, quote.clientId);
      const clientNode = client
        ? buildClientNode(client, false, input.historyHref)
        : buildClientNode({ id: quote.clientId, name: "Unknown client" }, false, input.historyHref);
      const quoteChain = await buildQuoteChainEntries([quote], session.user.studioId, {
        entityType: "quote",
        entityId: quote.id,
      }, input.historyHref);

      return {
        ok: true,
        data: {
          client: clientNode,
          quoteChain,
          currentEntity: quoteChain[0].quote,
        },
      };
    }

    if (input.entityType === "invoice") {
      const invoice = await getInvoiceRecordById(input.entityId);

      if (!invoice) {
        return buildNotFoundResult();
      }

      try {
        ensureStudioAccess(session, invoice.studioId);
      } catch {
        return buildNotFoundResult();
      }

      const clientNode = invoice.client
        ? buildClientNode(invoice.client, false, input.historyHref)
        : buildClientNode({ id: invoice.clientId, name: "Unknown client" }, false, input.historyHref);
      const currentInvoiceNode = buildInvoiceNode(
        invoice,
        true,
        input.historyHref,
        invoice.sourceQuote,
        {
          sections: invoice.sections,
          lineItems: invoice.lineItems,
        },
        readLatestCorrectionEventForRecord({
          type: "invoice.corrected",
          recordId: invoice.id,
          studioId: invoice.studioId,
        })?.occurredAt,
      );

      if (invoice.sourceQuoteId) {
        const sourceQuote = await getQuoteRecordById(invoice.sourceQuoteId);

        if (sourceQuote && sourceQuote.studioId === session.user.studioId) {
          const quoteChain = await buildQuoteChainEntries([sourceQuote], session.user.studioId, {
            entityType: "invoice",
            entityId: invoice.id,
          }, input.historyHref);

          return {
            ok: true,
            data: {
              client: clientNode,
              quoteChain,
              currentEntity: currentInvoiceNode,
            },
          };
        }
      }

      return {
        ok: true,
        data: {
          client: clientNode,
          quoteChain: [
            {
              quote: buildUnknownQuoteNode(),
              revisions: [],
              invoices: [currentInvoiceNode],
            },
          ],
          currentEntity: currentInvoiceNode,
        },
      };
    }

    return {
      ok: false,
      error: {
        code: ERROR_CODES.UNKNOWN,
        message: "A valid record type is required.",
      },
    };
  } catch (error) {
    if (error instanceof AppError) {
      return {
        ok: false,
        error: {
          code: error.code,
          message: error.message,
        },
      };
    }

    return {
      ok: false,
      error: {
        code: ERROR_CODES.UNKNOWN,
        message: "Could not load record history.",
      },
    };
  }
}
