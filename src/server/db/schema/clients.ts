import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const clients = pgTable(
  "clients",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    studioId: text("studio_id").notNull(),
    name: text("name").notNull(),
    contactName: text("contact_name").notNull().default(""),
    contactEmail: text("contact_email").notNull().default(""),
    contactPhone: text("contact_phone").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (table) => ({
    clientsStudioIdIdx: index("idx_clients_studio_id").on(table.studioId),
    clientsStudioNameCreatedAtIdx: index("idx_clients_studio_name_created_at").on(
      table.studioId,
      table.name,
      table.createdAt,
    ),
  }),
);

export type ClientRow = typeof clients.$inferSelect;
