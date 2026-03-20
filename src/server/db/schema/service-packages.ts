import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const servicePackages = pgTable(
  "service_packages",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    studioId: text("studio_id").notNull(),
    name: text("name").notNull(),
    category: text("category").notNull(),
    startingPriceLabel: text("starting_price_label").notNull(),
    shortDescription: text("short_description").notNull().default(""),
    packageTotalCents: integer("package_total_cents").notNull().default(0),
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

export const servicePackageSections = pgTable(
  "service_package_sections",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    servicePackageId: text("service_package_id")
      .notNull()
      .references(() => servicePackages.id, { onDelete: "cascade" }),
    studioId: text("studio_id").notNull(),
    title: text("title").notNull(),
    defaultContent: text("default_content").notNull().default(""),
    position: integer("position").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (table) => ({
    servicePackageSectionsPackagePositionIdx: index(
      "idx_service_package_sections_package_position",
    ).on(table.servicePackageId, table.position),
    servicePackageSectionsStudioIdIdx: index("idx_service_package_sections_studio_id").on(
      table.studioId,
    ),
  }),
);

export const servicePackageLineItems = pgTable(
  "service_package_line_items",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    servicePackageId: text("service_package_id")
      .notNull()
      .references(() => servicePackages.id, { onDelete: "cascade" }),
    servicePackageSectionId: text("service_package_section_id")
      .notNull()
      .references(() => servicePackageSections.id, { onDelete: "cascade" }),
    studioId: text("studio_id").notNull(),
    name: text("name").notNull(),
    defaultContent: text("default_content").notNull().default(""),
    quantity: integer("quantity").notNull(),
    unitLabel: text("unit_label").notNull().default(""),
    unitPriceCents: integer("unit_price_cents").notNull().default(0),
    position: integer("position").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (table) => ({
    servicePackageLineItemsSectionPositionIdx: index(
      "idx_service_package_line_items_section_position",
    ).on(table.servicePackageSectionId, table.position),
    servicePackageLineItemsPackageIdx: index("idx_service_package_line_items_package_id").on(
      table.servicePackageId,
    ),
    servicePackageLineItemsStudioIdIdx: index(
      "idx_service_package_line_items_studio_id",
    ).on(table.studioId),
  }),
);

export type ServicePackageRow = typeof servicePackages.$inferSelect;
export type ServicePackageSectionRow = typeof servicePackageSections.$inferSelect;
export type ServicePackageLineItemRow = typeof servicePackageLineItems.$inferSelect;
