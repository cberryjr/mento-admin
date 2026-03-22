import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { quotes } from "@/server/db/schema/quotes";

export const quoteRevisions = pgTable(
  "quote_revisions",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    quoteId: text("quote_id")
      .notNull()
      .references(() => quotes.id, { onDelete: "cascade" }),
    studioId: text("studio_id").notNull(),
    revisionNumber: integer("revision_number").notNull(),
    snapshotData: text("snapshot_data").notNull(),
    terms: text("terms").notNull().default(""),
    title: text("title").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    quoteRevisionsQuoteIdIdx: index("idx_quote_revisions_quote_id").on(
      table.quoteId,
    ),
    quoteRevisionsQuoteRevisionNumberUq: uniqueIndex(
      "uq_quote_revisions_quote_id_revision_number",
    ).on(table.quoteId, table.revisionNumber),
  }),
);

export type QuoteRevisionRow = typeof quoteRevisions.$inferSelect;
