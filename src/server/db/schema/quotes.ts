import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { clients } from "@/server/db/schema/clients";
import { servicePackages } from "@/server/db/schema/service-packages";

export const quotes = pgTable(
  "quotes",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    studioId: text("studio_id").notNull(),
    clientId: text("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "restrict" }),
    quoteNumber: text("quote_number").notNull(),
    title: text("title").notNull(),
    status: text("status").notNull().default("draft"),
    terms: text("terms").notNull().default(""),
    estimateBreakdownSnapshot: text("estimate_breakdown_snapshot"),
    generatedAt: timestamp("generated_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (table) => ({
    quotesStudioIdIdx: index("idx_quotes_studio_id").on(table.studioId),
    quotesClientIdIdx: index("idx_quotes_client_id").on(table.clientId),
    quotesStudioStatusIdx: index("idx_quotes_studio_status").on(
      table.studioId,
      table.status,
    ),
    quotesStudioQuoteNumberUq: uniqueIndex("uq_quotes_studio_quote_number").on(
      table.studioId,
      table.quoteNumber,
    ),
  }),
);

export const quoteServicePackages = pgTable(
  "quote_service_packages",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    quoteId: text("quote_id")
      .notNull()
      .references(() => quotes.id, { onDelete: "cascade" }),
    servicePackageId: text("service_package_id")
      .notNull()
      .references(() => servicePackages.id, { onDelete: "restrict" }),
    position: integer("position").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    quoteServicePackagesQuoteIdIdx: index(
      "idx_quote_service_packages_quote_id",
    ).on(table.quoteId),
    quoteServicePackagesServicePackageIdIdx: index(
      "idx_quote_service_packages_service_package_id",
    ).on(table.servicePackageId),
  }),
);

export type QuoteRow = typeof quotes.$inferSelect;
export type QuoteServicePackageRow = typeof quoteServicePackages.$inferSelect;
