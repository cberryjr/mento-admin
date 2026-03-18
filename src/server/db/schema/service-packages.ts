import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const servicePackages = pgTable(
  "service_packages",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    studioId: text("studio_id").notNull(),
    name: text("name").notNull(),
    category: text("category").notNull(),
    startingPriceLabel: text("starting_price_label").notNull(),
    shortDescription: text("short_description").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (table) => ({
    servicePackagesStudioIdIdx: index("idx_service_packages_studio_id").on(table.studioId),
    servicePackagesStudioNameCreatedAtIdx: index(
      "idx_service_packages_studio_name_created_at",
    ).on(table.studioId, table.name, table.createdAt),
  }),
);

export type ServicePackageRow = typeof servicePackages.$inferSelect;
