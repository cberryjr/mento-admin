import { beforeEach, describe, expect, it } from "vitest";

import {
  __resetInvoicesStore,
  createInvoiceFromQuote,
  getInvoiceById,
  listInvoicesForStudio,
  updateInvoice,
} from "@/features/invoices/server/invoices-repository";
import { __resetQuotesStore } from "@/features/quotes/server/store/quotes-store";

async function seedQuote(title = "Brand Launch Proposal") {
  const quotesRepository = await import("@/features/quotes/server/quotes-repository");

  const quote = await quotesRepository.createQuoteRecord("default-studio", {
    clientId: "client-sunrise-yoga",
    title,
    selectedServicePackageIds: ["sp-brand-launch"],
    terms: "Net 15",
  });

  await quotesRepository.saveQuoteSections(quote.id, "default-studio", [
    {
      id: `${quote.id}-section-1`,
      quoteId: quote.id,
      studioId: "default-studio",
      sourceServicePackageId: "sp-brand-launch",
      title: "Discovery",
      content: "Align on audience and message.",
      position: 1,
      lineItems: [
        {
          id: `${quote.id}-li-1`,
          quoteId: quote.id,
          quoteSectionId: `${quote.id}-section-1`,
          studioId: "default-studio",
          name: "Workshop",
          content: "Kickoff and positioning workshop",
          quantity: 1,
          unitLabel: "session",
          unitPriceCents: 125000,
          lineTotalCents: 125000,
          position: 1,
        },
      ],
    },
    {
      id: `${quote.id}-section-2`,
      quoteId: quote.id,
      studioId: "default-studio",
      sourceServicePackageId: "sp-brand-launch",
      title: "Execution",
      content: "Create launch-ready visual assets.",
      position: 2,
      lineItems: [
        {
          id: `${quote.id}-li-2`,
          quoteId: quote.id,
          quoteSectionId: `${quote.id}-section-2`,
          studioId: "default-studio",
          name: "Launch kit",
          content: "Templates and rollout assets",
          quantity: 2,
          unitLabel: "deliverables",
          unitPriceCents: 90000,
          lineTotalCents: 180000,
          position: 1,
        },
      ],
    },
  ]);

  return quote;
}

describe("invoices-repository", () => {
  beforeEach(() => {
    __resetInvoicesStore();
    __resetQuotesStore();
  });

  describe("createInvoiceFromQuote", () => {
    it("creates a linked invoice draft with client details", async () => {
      const quote = await seedQuote();

      const invoice = await createInvoiceFromQuote("default-studio", quote.id);

      expect(invoice.id).toBeDefined();
      expect(invoice.studioId).toBe("default-studio");
      expect(invoice.sourceQuoteId).toBe(quote.id);
      expect(invoice.status).toBe("draft");
      expect(invoice.invoiceNumber).toMatch(/^INV-\d{8}-[A-F0-9]{8}$/);
      expect(invoice.sourceQuote).toEqual({
        id: quote.id,
        quoteNumber: quote.quoteNumber,
        title: quote.title,
      });
      expect(invoice.client).toEqual({
        id: "client-sunrise-yoga",
        name: "Sunrise Yoga Studio",
        contactName: "Avery Patel",
        contactEmail: "ops@sunriseyoga.example",
        contactPhone: "+1 555 0101",
      });
    });

    it("preserves quote sections and nested line items in the invoice draft", async () => {
      const quote = await seedQuote();

      const invoice = await createInvoiceFromQuote("default-studio", quote.id);

      expect(invoice.sections).toHaveLength(2);
      expect(invoice.sections[0].title).toBe("Discovery");
      expect(invoice.sections[0].lineItems).toHaveLength(1);
      expect(invoice.sections[0].lineItems[0].name).toBe("Workshop");
      expect(invoice.sections[1].title).toBe("Execution");
      expect(invoice.sections[1].lineItems[0].invoiceSectionId).toBe(
        invoice.sections[1].id,
      );
      expect(invoice.lineItems).toHaveLength(2);
    });

    it("throws when the source quote does not exist", async () => {
      await expect(
        createInvoiceFromQuote("default-studio", "missing-quote"),
      ).rejects.toThrow("Quote not found");
    });
  });

  describe("getInvoiceById", () => {
    it("returns the created invoice with preserved sections", async () => {
      const quote = await seedQuote();
      const created = await createInvoiceFromQuote("default-studio", quote.id);

      const fetched = await getInvoiceById(created.id);

      expect(fetched).not.toBeNull();
      expect(fetched?.id).toBe(created.id);
      expect(fetched?.invoiceNumber).toBe(created.invoiceNumber);
      expect(fetched?.sections.map((section) => section.title)).toEqual([
        "Discovery",
        "Execution",
      ]);
    });

    it("returns null for unknown invoice", async () => {
      const result = await getInvoiceById("nonexistent");
      expect(result).toBeNull();
    });
  });

  describe("listInvoicesForStudio", () => {
    it("lists invoices for a studio", async () => {
      const firstQuote = await seedQuote("Retainer Refresh");
      const secondQuote = await seedQuote("Spring Campaign");

      await createInvoiceFromQuote("default-studio", firstQuote.id);
      await createInvoiceFromQuote("default-studio", secondQuote.id);

      const invoices = await listInvoicesForStudio("default-studio");
      expect(invoices).toHaveLength(2);
    });

    it("does not list invoices from other studios", async () => {
      const firstQuote = await seedQuote("Studio One Quote");
      const quotesRepository = await import("@/features/quotes/server/quotes-repository");
      const otherQuote = await quotesRepository.createQuoteRecord("other-studio", {
        clientId: "client-other-studio",
        title: "Studio Two Quote",
        selectedServicePackageIds: ["sp-1"],
        terms: "",
      });

      await quotesRepository.saveQuoteSections(otherQuote.id, "other-studio", [
        {
          id: `${otherQuote.id}-section-1`,
          quoteId: otherQuote.id,
          studioId: "other-studio",
          sourceServicePackageId: "sp-1",
          title: "Scope",
          content: "",
          position: 1,
          lineItems: [],
        },
      ]);

      await createInvoiceFromQuote("default-studio", firstQuote.id);
      await createInvoiceFromQuote("other-studio", otherQuote.id);

      const invoices = await listInvoicesForStudio("default-studio");
      expect(invoices).toHaveLength(1);
      expect(invoices[0].studioId).toBe("default-studio");
    });

    it("returns empty array for studio with no invoices", async () => {
      const invoices = await listInvoicesForStudio("studio-empty");
      expect(invoices).toHaveLength(0);
    });
  });

  describe("updateInvoice", () => {
    it("updates header fields on a draft invoice", async () => {
      const quote = await seedQuote();
      const invoice = await createInvoiceFromQuote("default-studio", quote.id);

      const updated = await updateInvoice(
        invoice.id,
        "default-studio",
        {
          title: "Updated Title",
          terms: "New terms",
          paymentInstructions: "Wire transfer",
        },
      );

      expect(updated.title).toBe("Updated Title");
      expect(updated.terms).toBe("New terms");
      expect(updated.paymentInstructions).toBe("Wire transfer");
      expect(updated.sections).toHaveLength(2);
    });

    it("updates sections and line items", async () => {
      const quote = await seedQuote();
      const invoice = await createInvoiceFromQuote("default-studio", quote.id);

      const sectionId = invoice.sections[0].id;
      const lineItemId = invoice.sections[0].lineItems[0].id;

      const updated = await updateInvoice(
        invoice.id,
        "default-studio",
        {
          sections: [
            {
              id: sectionId,
              title: "Updated Discovery",
              content: "Updated content",
              position: 0,
              lineItems: [
                {
                  id: lineItemId,
                  name: "Updated Workshop",
                  content: "Updated description",
                  quantity: 2,
                  unitLabel: "sessions",
                  unitPriceCents: 150000,
                  position: 0,
                },
              ],
            },
          ],
        },
      );

      expect(updated.sections).toHaveLength(1);
      expect(updated.sections[0].title).toBe("Updated Discovery");
      expect(updated.sections[0].lineItems).toHaveLength(1);
      expect(updated.sections[0].lineItems[0].name).toBe("Updated Workshop");
      expect(updated.sections[0].lineItems[0].quantity).toBe(2);
      expect(updated.sections[0].lineItems[0].lineTotalCents).toBe(300000);
    });

    it("adds new sections and line items", async () => {
      const quote = await seedQuote();
      const invoice = await createInvoiceFromQuote("default-studio", quote.id);

      const updated = await updateInvoice(
        invoice.id,
        "default-studio",
        {
          sections: [
            ...invoice.sections.map((s) => ({
              id: s.id,
              title: s.title,
              content: s.content,
              position: s.position,
              lineItems: s.lineItems.map((li) => ({
                id: li.id,
                name: li.name,
                content: li.content,
                quantity: li.quantity,
                unitLabel: li.unitLabel,
                unitPriceCents: li.unitPriceCents,
                position: li.position,
              })),
            })),
            {
              title: "New Section",
              content: "Brand new",
              position: 2,
              lineItems: [
                {
                  name: "New Item",
                  content: "Brand new item",
                  quantity: 3,
                  unitLabel: "units",
                  unitPriceCents: 10000,
                  position: 0,
                },
              ],
            },
          ],
        },
      );

      expect(updated.sections).toHaveLength(3);
      expect(updated.sections[2].title).toBe("New Section");
      expect(updated.sections[2].lineItems[0].name).toBe("New Item");
      expect(updated.sections[2].lineItems[0].lineTotalCents).toBe(30000);
    });

    it("removes deleted sections and their line items", async () => {
      const quote = await seedQuote();
      const invoice = await createInvoiceFromQuote("default-studio", quote.id);

      const updated = await updateInvoice(
        invoice.id,
        "default-studio",
        {
          sections: [
            {
              id: invoice.sections[0].id,
              title: invoice.sections[0].title,
              content: invoice.sections[0].content,
              position: 0,
              lineItems: invoice.sections[0].lineItems.map((li) => ({
                id: li.id,
                name: li.name,
                content: li.content,
                quantity: li.quantity,
                unitLabel: li.unitLabel,
                unitPriceCents: li.unitPriceCents,
                position: li.position,
              })),
            },
          ],
        },
      );

      expect(updated.sections).toHaveLength(1);
      expect(updated.sections[0].title).toBe("Discovery");
      expect(updated.lineItems).toHaveLength(1);
    });

    it("throws when invoice not found", async () => {
      await expect(
        updateInvoice("nonexistent", "default-studio", { title: "Test" }),
      ).rejects.toThrow("Invoice not found");
    });
  });
});
