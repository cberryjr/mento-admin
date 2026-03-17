import { pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const studioDefaults = pgTable(
  "studio_defaults",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    studioId: text("studio_id").notNull(),
    studioName: text("studio_name").notNull(),
    studioContactName: text("studio_contact_name").notNull().default(""),
    studioContactEmail: text("studio_contact_email").notNull().default(""),
    studioContactPhone: text("studio_contact_phone").notNull().default(""),
    defaultQuoteTerms: text("default_quote_terms").notNull(),
    defaultInvoicePaymentInstructions: text(
      "default_invoice_payment_instructions",
    ).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdateFn(() => new Date()),
  },
  (table) => ({
    studioDefaultsStudioIdUnique: uniqueIndex("uq_studio_defaults_studio_id").on(
      table.studioId,
    ),
  }),
);

export type StudioDefaultsRow = typeof studioDefaults.$inferSelect;
