import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { quotes } from "@/server/db/schema/quotes";

export const quoteSections = pgTable(
  "quote_sections",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    quoteId: text("quote_id")
      .notNull()
      .references(() => quotes.id, { onDelete: "cascade" }),
    studioId: text("studio_id").notNull(),
    sourceServicePackageId: text("source_service_package_id").notNull(),
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
    quoteSectionsQuoteIdIdx: index("idx_quote_sections_quote_id").on(table.quoteId),
    quoteSectionsQuotePositionIdx: index("idx_quote_sections_quote_position").on(
      table.quoteId,
      table.position,
    ),
    quoteSectionsStudioIdIdx: index("idx_quote_sections_studio_id").on(table.studioId),
  }),
);

export const quoteLineItems = pgTable(
  "quote_line_items",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    quoteId: text("quote_id")
      .notNull()
      .references(() => quotes.id, { onDelete: "cascade" }),
    quoteSectionId: text("quote_section_id")
      .notNull()
      .references(() => quoteSections.id, { onDelete: "cascade" }),
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
    quoteLineItemsQuoteIdIdx: index("idx_quote_line_items_quote_id").on(table.quoteId),
    quoteLineItemsSectionPositionIdx: index("idx_quote_line_items_section_position").on(
      table.quoteSectionId,
      table.position,
    ),
    quoteLineItemsStudioIdIdx: index("idx_quote_line_items_studio_id").on(table.studioId),
  }),
);

export type QuoteSectionRow = typeof quoteSections.$inferSelect;
export type QuoteLineItemRow = typeof quoteLineItems.$inferSelect;
