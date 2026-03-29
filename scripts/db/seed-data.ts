import { inArray } from "drizzle-orm";

import { calculateLineTotalCents, type QuoteSectionRecord } from "@/features/quotes/types";
import {
  calculateServicePackageTotalCents,
  createDefaultComplexityTiers,
  formatServicePackageStartingPriceLabel,
} from "@/features/service-packages/types";
import {
  clients,
  invoiceLineItems,
  invoiceSections,
  invoices,
  quoteLineItems,
  quoteRevisions,
  quoteSections,
  quoteServicePackages,
  quotes,
  servicePackageComplexityTiers,
  servicePackageLineItems,
  servicePackageSections,
  servicePackageTierDeliverables,
  servicePackageTierProcessNotes,
  servicePackages,
  studioDefaults,
} from "@/server/db/schema";

export const DEFAULT_STUDIO_ID = "default-studio";
export const OTHER_STUDIO_ID = "other-studio";

type ServicePackageSectionSeed = {
  id: string;
  title: string;
  defaultContent: string;
  position: number;
  lineItems: Array<{
    id: string;
    sectionId: string;
    name: string;
    defaultContent: string;
    quantity: number;
    unitLabel: string;
    unitPriceCents: number;
    position: number;
  }>;
};

type ServicePackageSeed = {
  id: string;
  studioId: string;
  name: string;
  categoryKey: Parameters<typeof createDefaultComplexityTiers>[0];
  categoryLabel: string;
  categoryShortLabel: string;
  category: string;
  shortDescription: string;
  sections: ServicePackageSectionSeed[];
  createdAt: string;
  updatedAt: string;
};

type QuoteSeed = {
  id: string;
  studioId: string;
  clientId: string;
  quoteNumber: string;
  title: string;
  status: "draft" | "accepted" | "invoiced";
  terms: string;
  selectedServicePackageIds: string[];
  generatedAt: string | null;
  createdAt: string;
  updatedAt: string;
  sections: QuoteSectionRecord[];
};

type QuoteRevisionSeed = {
  id: string;
  quoteId: string;
  studioId: string;
  revisionNumber: number;
  title: string;
  terms: string;
  createdAt: string;
  snapshotData: {
    sections: QuoteSectionRecord[];
  };
};

type InvoiceSeed = {
  id: string;
  studioId: string;
  clientId: string;
  sourceQuoteId: string;
  invoiceNumber: string;
  title: string;
  status: "draft" | "sent" | "paid";
  issueDate: string | null;
  dueDate: string | null;
  paymentInstructions: string;
  terms: string;
  createdAt: string;
  updatedAt: string;
  sections: Array<{
    id: string;
    title: string;
    content: string;
    position: number;
    lineItems: Array<{
      id: string;
      name: string;
      content: string;
      quantity: number;
      unitLabel: string;
      unitPriceCents: number;
      lineTotalCents: number;
      position: number;
    }>;
  }>;
};

const seededStudioDefaults = [
  {
    id: "studio-defaults-default",
    studioId: DEFAULT_STUDIO_ID,
    studioName: "Mento Studio",
    studioContactName: "Avery Patel",
    studioContactEmail: "owner@example.com",
    studioContactPhone: "+1 555 0100",
    defaultQuoteTerms:
      "Projects include one consolidated feedback round per revision milestone. Additional revisions are scoped separately.",
    defaultInvoicePaymentInstructions:
      "ACH transfer preferred. Payment is due within 14 calendar days of issue unless otherwise noted.",
    createdAt: "2026-03-01T08:00:00.000Z",
    updatedAt: "2026-03-12T09:30:00.000Z",
  },
] as const;

const seededClients = [
  {
    id: "client-sunrise-yoga",
    studioId: DEFAULT_STUDIO_ID,
    name: "Sunrise Yoga Studio",
    contactName: "Avery Patel",
    contactEmail: "ops@sunriseyoga.example",
    contactPhone: "+1 555 0101",
    createdAt: "2026-03-01T09:00:00.000Z",
    updatedAt: "2026-03-10T15:30:00.000Z",
  },
  {
    id: "client-otter-coffee",
    studioId: DEFAULT_STUDIO_ID,
    name: "Otter Coffee Roasters",
    contactName: "Morgan Lee",
    contactEmail: "hello@ottercoffee.example",
    contactPhone: "+1 555 0102",
    createdAt: "2026-03-02T10:00:00.000Z",
    updatedAt: "2026-03-08T12:15:00.000Z",
  },
  {
    id: "client-other-studio",
    studioId: OTHER_STUDIO_ID,
    name: "Hidden Orchard Bakery",
    contactName: "Riley Chen",
    contactEmail: "owner@hiddenorchard.example",
    contactPhone: "+1 555 0199",
    createdAt: "2026-03-03T11:00:00.000Z",
    updatedAt: "2026-03-11T16:45:00.000Z",
  },
] as const;

function createSeededServicePackage(seed: ServicePackageSeed) {
  const complexityTiers = createDefaultComplexityTiers(seed.categoryKey);
  const packageTotalCents = calculateServicePackageTotalCents(seed.sections);

  return {
    ...seed,
    complexityTiers,
    packageTotalCents,
    startingPriceLabel: formatServicePackageStartingPriceLabel(packageTotalCents),
  };
}

const seededServicePackages = [
  createSeededServicePackage({
    id: "package-brand-launch",
    studioId: DEFAULT_STUDIO_ID,
    name: "Brand Launch Package",
    categoryKey: "ai-print-campaigns",
    categoryLabel: "AI Print Campaigns",
    categoryShortLabel: "Print",
    category: "Branding",
    shortDescription: "Launch-ready brand deliverables for a new client rollout.",
    sections: [
      {
        id: "section-strategy",
        title: "Strategy",
        defaultContent: "Audience, positioning, and rollout alignment.",
        position: 1,
        lineItems: [
          {
            id: "line-item-workshop",
            sectionId: "section-strategy",
            name: "Discovery workshop",
            defaultContent: "Half-day alignment session with decision makers.",
            quantity: 1,
            unitLabel: "session",
            unitPriceCents: 120000,
            position: 1,
          },
        ],
      },
      {
        id: "section-delivery",
        title: "Delivery",
        defaultContent: "Core brand system deliverables.",
        position: 2,
        lineItems: [
          {
            id: "line-item-identity",
            sectionId: "section-delivery",
            name: "Brand identity system",
            defaultContent: "Logo, palette, typography, and usage guidance.",
            quantity: 1,
            unitLabel: "package",
            unitPriceCents: 120000,
            position: 1,
          },
        ],
      },
    ],
    createdAt: "2026-03-01T09:00:00.000Z",
    updatedAt: "2026-03-10T15:30:00.000Z",
  }),
  createSeededServicePackage({
    id: "package-content-sprint",
    studioId: DEFAULT_STUDIO_ID,
    name: "Content Sprint Package",
    categoryKey: "social-media-animation",
    categoryLabel: "Social Media Animation",
    categoryShortLabel: "Social Animation",
    category: "Content",
    shortDescription: "Focused content production support for a campaign push.",
    sections: [
      {
        id: "section-planning",
        title: "Planning",
        defaultContent: "Sprint planning and messaging alignment.",
        position: 1,
        lineItems: [
          {
            id: "line-item-brief",
            sectionId: "section-planning",
            name: "Content brief",
            defaultContent: "Sprint brief and production plan.",
            quantity: 1,
            unitLabel: "brief",
            unitPriceCents: 40000,
            position: 1,
          },
        ],
      },
      {
        id: "section-production",
        title: "Production",
        defaultContent: "Drafting and revision support.",
        position: 2,
        lineItems: [
          {
            id: "line-item-assets",
            sectionId: "section-production",
            name: "Content assets",
            defaultContent: "Three campaign-ready deliverables.",
            quantity: 1,
            unitLabel: "set",
            unitPriceCents: 80000,
            position: 1,
          },
        ],
      },
    ],
    createdAt: "2026-03-02T10:00:00.000Z",
    updatedAt: "2026-03-08T12:15:00.000Z",
  }),
  createSeededServicePackage({
    id: "package-other-studio",
    studioId: OTHER_STUDIO_ID,
    name: "Hidden Orchard Package",
    categoryKey: "ai-animation-ads",
    categoryLabel: "AI Animation Ads",
    categoryShortLabel: "Animation Ads",
    category: "Campaign",
    shortDescription: "Other studio package used for authorization coverage.",
    sections: [
      {
        id: "section-campaign",
        title: "Campaign",
        defaultContent: "Other studio package details.",
        position: 1,
        lineItems: [
          {
            id: "line-item-campaign",
            sectionId: "section-campaign",
            name: "Campaign package",
            defaultContent: "Other studio package used for auth coverage.",
            quantity: 1,
            unitLabel: "package",
            unitPriceCents: 190000,
            position: 1,
          },
        ],
      },
    ],
    createdAt: "2026-03-03T11:00:00.000Z",
    updatedAt: "2026-03-11T16:45:00.000Z",
  }),
];

const servicePackageMap = new Map(
  seededServicePackages.map((servicePackage) => [servicePackage.id, servicePackage]),
);

function cloneSections(sections: QuoteSectionRecord[]) {
  return structuredClone(sections);
}

function buildQuoteSections(
  quoteId: string,
  studioId: string,
  selectedServicePackageIds: string[],
) {
  let sectionPosition = 1;

  return selectedServicePackageIds.flatMap((servicePackageId) => {
    const servicePackage = servicePackageMap.get(servicePackageId);

    if (!servicePackage) {
      throw new Error(`Missing seeded service package ${servicePackageId}.`);
    }

    return servicePackage.sections.map((section) => {
      const quoteSectionId = `${quoteId}-${section.id}`;

      return {
        id: quoteSectionId,
        quoteId,
        studioId,
        sourceServicePackageId: servicePackageId,
        title: section.title,
        content: section.defaultContent,
        position: sectionPosition++,
        lineItems: section.lineItems.map((lineItem) => ({
          id: `${quoteId}-${lineItem.id}`,
          quoteId,
          quoteSectionId,
          studioId,
          name: lineItem.name,
          content: lineItem.defaultContent,
          quantity: lineItem.quantity,
          unitLabel: lineItem.unitLabel,
          unitPriceCents: lineItem.unitPriceCents,
          lineTotalCents: calculateLineTotalCents(
            lineItem.quantity,
            lineItem.unitPriceCents,
          ),
          position: lineItem.position,
        })),
      };
    });
  });
}

function createQuote(seed: Omit<QuoteSeed, "sections">) {
  return {
    ...seed,
    sections: buildQuoteSections(seed.id, seed.studioId, seed.selectedServicePackageIds),
  };
}

const seededQuotes = [
  createQuote({
    id: "quote-sunrise-retainer",
    studioId: DEFAULT_STUDIO_ID,
    clientId: "client-sunrise-yoga",
    quoteNumber: "Q-2026-014",
    title: "Monthly brand retainer",
    status: "draft",
    terms:
      "Monthly advisory support includes async review, a weekly checkpoint, and one bundled revision pass.",
    selectedServicePackageIds: ["package-content-sprint"],
    generatedAt: "2026-03-14T09:10:00.000Z",
    createdAt: "2026-03-14T09:00:00.000Z",
    updatedAt: "2026-03-14T09:15:00.000Z",
  }),
  createQuote({
    id: "quote-sunrise-kickoff",
    studioId: DEFAULT_STUDIO_ID,
    clientId: "client-sunrise-yoga",
    quoteNumber: "Q-2026-011",
    title: "Website kickoff package",
    status: "invoiced",
    terms:
      "Kickoff work begins after deposit receipt. Final files are delivered within five business days of approval.",
    selectedServicePackageIds: ["package-brand-launch"],
    generatedAt: "2026-03-09T13:20:00.000Z",
    createdAt: "2026-03-09T13:00:00.000Z",
    updatedAt: "2026-03-12T18:20:00.000Z",
  }),
  createQuote({
    id: "quote-otter-launch",
    studioId: DEFAULT_STUDIO_ID,
    clientId: "client-otter-coffee",
    quoteNumber: "Q-2026-018",
    title: "Seasonal launch sprint",
    status: "accepted",
    terms:
      "Creative direction is locked after approval. Additional channels can be scoped as follow-on work.",
    selectedServicePackageIds: ["package-brand-launch", "package-content-sprint"],
    generatedAt: "2026-03-17T10:15:00.000Z",
    createdAt: "2026-03-17T10:00:00.000Z",
    updatedAt: "2026-03-18T11:30:00.000Z",
  }),
  createQuote({
    id: "quote-sunrise-social-boost",
    studioId: DEFAULT_STUDIO_ID,
    clientId: "client-sunrise-yoga",
    quoteNumber: "Q-2026-020",
    title: "Spring membership campaign",
    status: "invoiced",
    terms:
      "Campaign assets are delivered in approved platform formats with one fast-turn revision round.",
    selectedServicePackageIds: ["package-content-sprint"],
    generatedAt: "2026-03-19T08:30:00.000Z",
    createdAt: "2026-03-19T08:00:00.000Z",
    updatedAt: "2026-03-20T14:45:00.000Z",
  }),
  createQuote({
    id: "quote-otter-refresh",
    studioId: DEFAULT_STUDIO_ID,
    clientId: "client-otter-coffee",
    quoteNumber: "Q-2026-022",
    title: "Cafe menu refresh",
    status: "invoiced",
    terms:
      "Production begins after sign-off. Print-ready assets are delivered with organized source exports.",
    selectedServicePackageIds: ["package-brand-launch"],
    generatedAt: "2026-03-20T09:10:00.000Z",
    createdAt: "2026-03-20T09:00:00.000Z",
    updatedAt: "2026-03-21T12:00:00.000Z",
  }),
  createQuote({
    id: "quote-other-studio",
    studioId: OTHER_STUDIO_ID,
    clientId: "client-other-studio",
    quoteNumber: "Q-2026-021",
    title: "Seasonal menu refresh",
    status: "draft",
    terms: "Other studio draft quote used for authorization coverage.",
    selectedServicePackageIds: ["package-other-studio"],
    generatedAt: null,
    createdAt: "2026-03-11T08:00:00.000Z",
    updatedAt: "2026-03-11T08:30:00.000Z",
  }),
];

const quoteMap = new Map(seededQuotes.map((quote) => [quote.id, quote]));

function getQuoteOrThrow(quoteId: string) {
  const quote = quoteMap.get(quoteId);

  if (!quote) {
    throw new Error(`Missing seeded quote ${quoteId}.`);
  }

  return quote;
}

const seededQuoteRevisions: QuoteRevisionSeed[] = [
  {
    id: "quote-sunrise-kickoff-revision-1",
    quoteId: "quote-sunrise-kickoff",
    studioId: DEFAULT_STUDIO_ID,
    revisionNumber: 1,
    title: "Website kickoff package",
    terms:
      "Kickoff work begins after deposit receipt. Final files are delivered within five business days of approval.",
    createdAt: "2026-03-09T14:00:00.000Z",
    snapshotData: {
      sections: cloneSections(getQuoteOrThrow("quote-sunrise-kickoff").sections),
    },
  },
  {
    id: "quote-sunrise-kickoff-revision-2",
    quoteId: "quote-sunrise-kickoff",
    studioId: DEFAULT_STUDIO_ID,
    revisionNumber: 2,
    title: "Website kickoff package",
    terms:
      "Kickoff work begins after deposit receipt. Final files are delivered within five business days of approval.",
    createdAt: "2026-03-10T11:30:00.000Z",
    snapshotData: {
      sections: cloneSections(getQuoteOrThrow("quote-sunrise-kickoff").sections),
    },
  },
  {
    id: "quote-otter-launch-revision-1",
    quoteId: "quote-otter-launch",
    studioId: DEFAULT_STUDIO_ID,
    revisionNumber: 1,
    title: "Seasonal launch sprint",
    terms:
      "Creative direction is locked after approval. Additional channels can be scoped as follow-on work.",
    createdAt: "2026-03-17T15:00:00.000Z",
    snapshotData: {
      sections: cloneSections(getQuoteOrThrow("quote-otter-launch").sections),
    },
  },
];

function buildInvoiceSections(invoiceId: string, quote: QuoteSeed) {
  return quote.sections.map((section) => {
    const invoiceSectionId = `${invoiceId}-${section.id}`;

    return {
      id: invoiceSectionId,
      title: section.title,
      content: section.content,
      position: section.position,
      lineItems: section.lineItems.map((lineItem) => ({
        id: `${invoiceId}-${lineItem.id}`,
        name: lineItem.name,
        content: lineItem.content,
        quantity: lineItem.quantity,
        unitLabel: lineItem.unitLabel,
        unitPriceCents: lineItem.unitPriceCents,
        lineTotalCents: lineItem.lineTotalCents,
        position: lineItem.position,
      })),
    };
  });
}

function createInvoice(
  seed: Omit<InvoiceSeed, "clientId" | "sections"> & { sourceQuoteId: string },
) {
  const quote = getQuoteOrThrow(seed.sourceQuoteId);

  return {
    ...seed,
    clientId: quote.clientId,
    sections: buildInvoiceSections(seed.id, quote),
  };
}

const seededInvoices = [
  createInvoice({
    id: "invoice-sunrise-deposit",
    studioId: DEFAULT_STUDIO_ID,
    sourceQuoteId: "quote-sunrise-kickoff",
    invoiceNumber: "INV-2026-006",
    title: "Kickoff deposit",
    status: "paid",
    issueDate: "2026-03-10T09:00:00.000Z",
    dueDate: "2026-03-24T09:00:00.000Z",
    paymentInstructions:
      "ACH transfer preferred. Reference Sunrise Yoga kickoff deposit on payment.",
    terms: "Deposit secures production time and is non-refundable once kickoff is scheduled.",
    createdAt: "2026-03-10T09:00:00.000Z",
    updatedAt: "2026-03-12T18:20:00.000Z",
  }),
  createInvoice({
    id: "invoice-sunrise-social",
    studioId: DEFAULT_STUDIO_ID,
    sourceQuoteId: "quote-sunrise-social-boost",
    invoiceNumber: "INV-2026-009",
    title: "Spring campaign production",
    status: "sent",
    issueDate: "2026-03-20T09:00:00.000Z",
    dueDate: "2026-04-03T09:00:00.000Z",
    paymentInstructions:
      "ACH transfer preferred. Send remittance note to billing@mentostudio.example.",
    terms: "Payment is due within 14 calendar days of issue.",
    createdAt: "2026-03-20T09:00:00.000Z",
    updatedAt: "2026-03-20T15:00:00.000Z",
  }),
  createInvoice({
    id: "invoice-otter-refresh",
    studioId: DEFAULT_STUDIO_ID,
    sourceQuoteId: "quote-otter-refresh",
    invoiceNumber: "INV-2026-010",
    title: "Menu refresh kickoff",
    status: "draft",
    issueDate: null,
    dueDate: null,
    paymentInstructions:
      "Draft invoice. Final payment instructions are added before sending.",
    terms: "Draft invoice for internal review before client send.",
    createdAt: "2026-03-21T11:30:00.000Z",
    updatedAt: "2026-03-21T12:00:00.000Z",
  }),
];

function toDate(value: string | null) {
  return value ? new Date(value) : null;
}

function serializeSnapshotData(snapshotData: QuoteRevisionSeed["snapshotData"]) {
  return JSON.stringify(snapshotData);
}

export async function seedLocalDatabase(db: any) {
  const seededServicePackageIds = seededServicePackages.map((servicePackage) => servicePackage.id);
  const seededQuoteIds = seededQuotes.map((quote) => quote.id);
  const seededInvoiceIds = seededInvoices.map((invoice) => invoice.id);

  await db.transaction(async (tx: any) => {
    for (const record of seededStudioDefaults) {
      await tx
        .insert(studioDefaults)
        .values({
          ...record,
          createdAt: new Date(record.createdAt),
          updatedAt: new Date(record.updatedAt),
        })
        .onConflictDoUpdate({
          target: studioDefaults.studioId,
          set: {
            studioName: record.studioName,
            studioContactName: record.studioContactName,
            studioContactEmail: record.studioContactEmail,
            studioContactPhone: record.studioContactPhone,
            defaultQuoteTerms: record.defaultQuoteTerms,
            defaultInvoicePaymentInstructions: record.defaultInvoicePaymentInstructions,
            updatedAt: new Date(record.updatedAt),
          },
        });
    }

    for (const clientRecord of seededClients) {
      await tx
        .insert(clients)
        .values({
          ...clientRecord,
          createdAt: new Date(clientRecord.createdAt),
          updatedAt: new Date(clientRecord.updatedAt),
        })
        .onConflictDoUpdate({
          target: clients.id,
          set: {
            studioId: clientRecord.studioId,
            name: clientRecord.name,
            contactName: clientRecord.contactName,
            contactEmail: clientRecord.contactEmail,
            contactPhone: clientRecord.contactPhone,
            updatedAt: new Date(clientRecord.updatedAt),
          },
        });
    }

    await tx
      .delete(servicePackageTierDeliverables)
      .where(inArray(servicePackageTierDeliverables.servicePackageId, seededServicePackageIds));
    await tx
      .delete(servicePackageTierProcessNotes)
      .where(inArray(servicePackageTierProcessNotes.servicePackageId, seededServicePackageIds));
    await tx
      .delete(servicePackageLineItems)
      .where(inArray(servicePackageLineItems.servicePackageId, seededServicePackageIds));
    await tx
      .delete(servicePackageSections)
      .where(inArray(servicePackageSections.servicePackageId, seededServicePackageIds));
    await tx
      .delete(servicePackageComplexityTiers)
      .where(inArray(servicePackageComplexityTiers.servicePackageId, seededServicePackageIds));

    for (const servicePackage of seededServicePackages) {
      await tx
        .insert(servicePackages)
        .values({
          id: servicePackage.id,
          studioId: servicePackage.studioId,
          name: servicePackage.name,
          categoryKey: servicePackage.categoryKey,
          categoryLabel: servicePackage.categoryLabel,
          categoryShortLabel: servicePackage.categoryShortLabel,
          category: servicePackage.category,
          startingPriceLabel: servicePackage.startingPriceLabel,
          shortDescription: servicePackage.shortDescription,
          packageTotalCents: servicePackage.packageTotalCents,
          createdAt: new Date(servicePackage.createdAt),
          updatedAt: new Date(servicePackage.updatedAt),
        })
        .onConflictDoUpdate({
          target: servicePackages.id,
          set: {
            studioId: servicePackage.studioId,
            name: servicePackage.name,
            categoryKey: servicePackage.categoryKey,
            categoryLabel: servicePackage.categoryLabel,
            categoryShortLabel: servicePackage.categoryShortLabel,
            category: servicePackage.category,
            startingPriceLabel: servicePackage.startingPriceLabel,
            shortDescription: servicePackage.shortDescription,
            packageTotalCents: servicePackage.packageTotalCents,
            updatedAt: new Date(servicePackage.updatedAt),
          },
        });
    }

    await tx.insert(servicePackageSections).values(
      seededServicePackages.flatMap((servicePackage) =>
        servicePackage.sections.map((section) => ({
          id: section.id,
          servicePackageId: servicePackage.id,
          studioId: servicePackage.studioId,
          title: section.title,
          defaultContent: section.defaultContent,
          position: section.position,
          createdAt: new Date(servicePackage.createdAt),
          updatedAt: new Date(servicePackage.updatedAt),
        })),
      ),
    );

    await tx.insert(servicePackageLineItems).values(
      seededServicePackages.flatMap((servicePackage) =>
        servicePackage.sections.flatMap((section) =>
          section.lineItems.map((lineItem) => ({
            id: lineItem.id,
            servicePackageId: servicePackage.id,
            servicePackageSectionId: section.id,
            studioId: servicePackage.studioId,
            name: lineItem.name,
            defaultContent: lineItem.defaultContent,
            quantity: lineItem.quantity,
            unitLabel: lineItem.unitLabel,
            unitPriceCents: lineItem.unitPriceCents,
            position: lineItem.position,
            createdAt: new Date(servicePackage.createdAt),
            updatedAt: new Date(servicePackage.updatedAt),
          })),
        ),
      ),
    );

    await tx.insert(servicePackageComplexityTiers).values(
      seededServicePackages.flatMap((servicePackage) =>
        servicePackage.complexityTiers.map((tier) => ({
          id: tier.id,
          servicePackageId: servicePackage.id,
          studioId: servicePackage.studioId,
          tierKey: tier.tier,
          tierTitle: tier.title,
          descriptor: tier.descriptor,
          timeMinValue: tier.timeGuidance.minValue,
          timeMaxValue: tier.timeGuidance.maxValue,
          timeUnit: tier.timeGuidance.unit,
          quantityDefault: tier.variableDefaults.quantity,
          durationValueDefault: tier.variableDefaults.durationValue,
          durationUnitDefault: tier.variableDefaults.durationUnit,
          resolutionDefault: tier.variableDefaults.resolution,
          revisionsDefault: tier.variableDefaults.revisions,
          urgencyDefault: tier.variableDefaults.urgency,
          position: tier.position,
        })),
      ),
    );

    await tx.insert(servicePackageTierDeliverables).values(
      seededServicePackages.flatMap((servicePackage) =>
        servicePackage.complexityTiers.flatMap((tier) =>
          tier.deliverables.map((deliverable, index) => ({
            id: `${tier.id}-deliverable-${index + 1}`,
            servicePackageId: servicePackage.id,
            servicePackageComplexityTierId: tier.id,
            studioId: servicePackage.studioId,
            value: deliverable,
            position: index + 1,
          })),
        ),
      ),
    );

    await tx.insert(servicePackageTierProcessNotes).values(
      seededServicePackages.flatMap((servicePackage) =>
        servicePackage.complexityTiers.flatMap((tier) =>
          tier.processNotes.map((processNote, index) => ({
            id: `${tier.id}-process-note-${index + 1}`,
            servicePackageId: servicePackage.id,
            servicePackageComplexityTierId: tier.id,
            studioId: servicePackage.studioId,
            value: processNote,
            position: index + 1,
          })),
        ),
      ),
    );

    await tx.delete(quoteLineItems).where(inArray(quoteLineItems.quoteId, seededQuoteIds));
    await tx.delete(quoteSections).where(inArray(quoteSections.quoteId, seededQuoteIds));
    await tx
      .delete(quoteServicePackages)
      .where(inArray(quoteServicePackages.quoteId, seededQuoteIds));
    await tx.delete(quoteRevisions).where(inArray(quoteRevisions.quoteId, seededQuoteIds));

    for (const quote of seededQuotes) {
      await tx
        .insert(quotes)
        .values({
          id: quote.id,
          studioId: quote.studioId,
          clientId: quote.clientId,
          quoteNumber: quote.quoteNumber,
          title: quote.title,
          status: quote.status,
          terms: quote.terms,
          estimateBreakdownSnapshot: null,
          generatedAt: toDate(quote.generatedAt),
          createdAt: new Date(quote.createdAt),
          updatedAt: new Date(quote.updatedAt),
        })
        .onConflictDoUpdate({
          target: quotes.id,
          set: {
            studioId: quote.studioId,
            clientId: quote.clientId,
            quoteNumber: quote.quoteNumber,
            title: quote.title,
            status: quote.status,
            terms: quote.terms,
            estimateBreakdownSnapshot: null,
            generatedAt: toDate(quote.generatedAt),
            updatedAt: new Date(quote.updatedAt),
          },
        });
    }

    await tx.insert(quoteServicePackages).values(
      seededQuotes.flatMap((quote) =>
        quote.selectedServicePackageIds.map((servicePackageId, index) => ({
          id: `${quote.id}-${servicePackageId}`,
          quoteId: quote.id,
          servicePackageId,
          position: index + 1,
          createdAt: new Date(quote.createdAt),
        })),
      ),
    );

    await tx.insert(quoteSections).values(
      seededQuotes.flatMap((quote) =>
        quote.sections.map((section) => ({
          id: section.id,
          quoteId: quote.id,
          studioId: quote.studioId,
          sourceServicePackageId: section.sourceServicePackageId,
          title: section.title,
          content: section.content,
          position: section.position,
          createdAt: new Date(quote.createdAt),
          updatedAt: new Date(quote.updatedAt),
        })),
      ),
    );

    await tx.insert(quoteLineItems).values(
      seededQuotes.flatMap((quote) =>
        quote.sections.flatMap((section) =>
          section.lineItems.map((lineItem) => ({
            id: lineItem.id,
            quoteId: quote.id,
            quoteSectionId: section.id,
            studioId: quote.studioId,
            name: lineItem.name,
            content: lineItem.content,
            quantity: lineItem.quantity,
            unitLabel: lineItem.unitLabel,
            unitPriceCents: lineItem.unitPriceCents,
            lineTotalCents: lineItem.lineTotalCents,
            position: lineItem.position,
            createdAt: new Date(quote.createdAt),
            updatedAt: new Date(quote.updatedAt),
          })),
        ),
      ),
    );

    await tx.insert(quoteRevisions).values(
      seededQuoteRevisions.map((revision) => ({
        id: revision.id,
        quoteId: revision.quoteId,
        studioId: revision.studioId,
        revisionNumber: revision.revisionNumber,
        snapshotData: serializeSnapshotData(revision.snapshotData),
        title: revision.title,
        terms: revision.terms,
        createdAt: new Date(revision.createdAt),
      })),
    );

    await tx.delete(invoiceLineItems).where(inArray(invoiceLineItems.invoiceId, seededInvoiceIds));
    await tx.delete(invoiceSections).where(inArray(invoiceSections.invoiceId, seededInvoiceIds));

    for (const invoice of seededInvoices) {
      await tx
        .insert(invoices)
        .values({
          id: invoice.id,
          studioId: invoice.studioId,
          clientId: invoice.clientId,
          sourceQuoteId: invoice.sourceQuoteId,
          invoiceNumber: invoice.invoiceNumber,
          title: invoice.title,
          status: invoice.status,
          issueDate: toDate(invoice.issueDate),
          dueDate: toDate(invoice.dueDate),
          paymentInstructions: invoice.paymentInstructions,
          terms: invoice.terms,
          createdAt: new Date(invoice.createdAt),
          updatedAt: new Date(invoice.updatedAt),
        })
        .onConflictDoUpdate({
          target: invoices.id,
          set: {
            studioId: invoice.studioId,
            clientId: invoice.clientId,
            sourceQuoteId: invoice.sourceQuoteId,
            invoiceNumber: invoice.invoiceNumber,
            title: invoice.title,
            status: invoice.status,
            issueDate: toDate(invoice.issueDate),
            dueDate: toDate(invoice.dueDate),
            paymentInstructions: invoice.paymentInstructions,
            terms: invoice.terms,
            updatedAt: new Date(invoice.updatedAt),
          },
        });
    }

    await tx.insert(invoiceSections).values(
      seededInvoices.flatMap((invoice) =>
        invoice.sections.map((section) => ({
          id: section.id,
          invoiceId: invoice.id,
          studioId: invoice.studioId,
          title: section.title,
          content: section.content,
          position: section.position,
          createdAt: new Date(invoice.createdAt),
          updatedAt: new Date(invoice.updatedAt),
        })),
      ),
    );

    await tx.insert(invoiceLineItems).values(
      seededInvoices.flatMap((invoice) =>
        invoice.sections.flatMap((section) =>
          section.lineItems.map((lineItem) => ({
            id: lineItem.id,
            invoiceId: invoice.id,
            invoiceSectionId: section.id,
            studioId: invoice.studioId,
            name: lineItem.name,
            content: lineItem.content,
            quantity: lineItem.quantity,
            unitLabel: lineItem.unitLabel,
            unitPriceCents: lineItem.unitPriceCents,
            lineTotalCents: lineItem.lineTotalCents,
            position: lineItem.position,
            createdAt: new Date(invoice.createdAt),
            updatedAt: new Date(invoice.updatedAt),
          })),
        ),
      ),
    );
  });
}
