import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { clients } from "@/server/db/schema/clients";
import { quotes } from "@/server/db/schema/quotes";

export const invoices = pgTable(
  "invoices",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    studioId: text("studio_id").notNull(),
    clientId: text("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "restrict" }),
    sourceQuoteId: text("source_quote_id")
      .notNull()
      .references(() => quotes.id, { onDelete: "restrict" }),
    invoiceNumber: text("invoice_number").notNull(),
    title: text("title").notNull(),
    status: text("status").notNull().default("draft"),
    issueDate: timestamp("issue_date", { withTimezone: true }),
    dueDate: timestamp("due_date", { withTimezone: true }),
    paymentInstructions: text("payment_instructions").notNull().default(""),
    terms: text("terms").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (table) => ({
    invoicesStudioIdIdx: index("idx_invoices_studio_id").on(table.studioId),
    invoicesClientIdIdx: index("idx_invoices_client_id").on(table.clientId),
    invoicesSourceQuoteIdIdx: index("idx_invoices_source_quote_id").on(
      table.sourceQuoteId,
    ),
    invoicesStudioStatusIdx: index("idx_invoices_studio_status").on(
      table.studioId,
      table.status,
    ),
    invoicesStudioInvoiceNumberUq: uniqueIndex(
      "uq_invoices_studio_invoice_number",
    ).on(table.studioId, table.invoiceNumber),
  }),
);

export const invoiceSections = pgTable(
  "invoice_sections",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    invoiceId: text("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),
    studioId: text("studio_id").notNull(),
    title: text("title").notNull(),
    content: text("content").notNull().default(""),
    position: integer("position").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (table) => ({
    invoiceSectionsInvoiceIdIdx: index("idx_invoice_sections_invoice_id").on(
      table.invoiceId,
    ),
    invoiceSectionsInvoicePositionIdx: index(
      "idx_invoice_sections_invoice_position",
    ).on(table.invoiceId, table.position),
    invoiceSectionsStudioIdIdx: index("idx_invoice_sections_studio_id").on(
      table.studioId,
    ),
  }),
);

export const invoiceLineItems = pgTable(
  "invoice_line_items",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    invoiceId: text("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),
    invoiceSectionId: text("invoice_section_id")
      .notNull()
      .references(() => invoiceSections.id, { onDelete: "cascade" }),
    studioId: text("studio_id").notNull(),
    name: text("name").notNull(),
    content: text("content").notNull().default(""),
    quantity: integer("quantity").notNull(),
    unitLabel: text("unit_label").notNull().default(""),
    unitPriceCents: integer("unit_price_cents").notNull().default(0),
    lineTotalCents: integer("line_total_cents").notNull().default(0),
    position: integer("position").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (table) => ({
    invoiceLineItemsInvoiceIdIdx: index(
      "idx_invoice_line_items_invoice_id",
    ).on(table.invoiceId),
    invoiceLineItemsSectionPositionIdx: index(
      "idx_invoice_line_items_section_position",
    ).on(table.invoiceSectionId, table.position),
    invoiceLineItemsPositionIdx: index(
      "idx_invoice_line_items_position",
    ).on(table.invoiceId, table.position),
    invoiceLineItemsStudioIdIdx: index(
      "idx_invoice_line_items_studio_id",
    ).on(table.studioId),
  }),
);

export type InvoiceRow = typeof invoices.$inferSelect;
export type InvoiceSectionRow = typeof invoiceSections.$inferSelect;
export type InvoiceLineItemRow = typeof invoiceLineItems.$inferSelect;
