import { randomUUID } from "node:crypto";

import { asc, eq } from "drizzle-orm";

import { env } from "@/lib/env";
import {
  calculateServicePackageTotalCents,
  formatServicePackageStartingPriceLabel,
  type ServicePackageDetailRecord,
  type ServicePackageInput,
  type ServicePackageLineItemRecord,
  type ServicePackageRecord,
  type ServicePackageSectionRecord,
} from "@/features/service-packages/types";
import {
  __resetServicePackagesStore as resetServicePackagesStore,
  createServicePackageInStore,
  readServicePackageByIdFromStore,
  readServicePackagesFromStore,
  updateServicePackageInStore,
} from "@/features/service-packages/server/store/service-packages-store";

type ServicePackageRow = {
  id: string;
  studioId: string;
  name: string;
  category: string;
  startingPriceLabel: string;
  shortDescription: string;
  packageTotalCents: number;
  createdAt: Date;
  updatedAt: Date;
};

type ServicePackageSectionRow = {
  id: string;
  servicePackageId: string;
  studioId: string;
  title: string;
  defaultContent: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;
};

type ServicePackageLineItemRow = {
  id: string;
  servicePackageId: string;
  servicePackageSectionId: string;
  studioId: string;
  name: string;
  defaultContent: string;
  quantity: number;
  unitLabel: string;
  unitPriceCents: number;
  position: number;
  createdAt: Date;
  updatedAt: Date;
};

function mapRowToRecord(row: ServicePackageRow): ServicePackageRecord {
  return {
    id: row.id,
    studioId: row.studioId,
    name: row.name,
    category: row.category,
    startingPriceLabel: row.startingPriceLabel,
    shortDescription: row.shortDescription,
    packageTotalCents: row.packageTotalCents,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function sortServicePackages(servicePackages: ServicePackageDetailRecord[]) {
  return [...servicePackages].sort((left, right) => {
    const nameComparison = left.name.localeCompare(right.name, undefined, {
      sensitivity: "base",
    });

    if (nameComparison !== 0) {
      return nameComparison;
    }

    return left.createdAt.localeCompare(right.createdAt);
  });
}

function sortSections(sections: ServicePackageSectionRecord[]) {
  return [...sections].sort((left, right) => left.position - right.position);
}

function sortLineItems(lineItems: ServicePackageLineItemRecord[]) {
  return [...lineItems].sort((left, right) => left.position - right.position);
}

function buildServicePackageDetailRecord(
  servicePackageRow: ServicePackageRow,
  sectionRows: ServicePackageSectionRow[],
  lineItemRows: ServicePackageLineItemRow[],
): ServicePackageDetailRecord {
  const sections = sortSections(
    sectionRows.map((sectionRow) => {
      const lineItems = sortLineItems(
        lineItemRows
          .filter((lineItemRow) => lineItemRow.servicePackageSectionId === sectionRow.id)
          .map<ServicePackageLineItemRecord>((lineItemRow) => ({
            id: lineItemRow.id,
            sectionId: lineItemRow.servicePackageSectionId,
            name: lineItemRow.name,
            defaultContent: lineItemRow.defaultContent,
            quantity: lineItemRow.quantity,
            unitLabel: lineItemRow.unitLabel,
            unitPriceCents: lineItemRow.unitPriceCents,
            position: lineItemRow.position,
          })),
      );

      return {
        id: sectionRow.id,
        title: sectionRow.title,
        defaultContent: sectionRow.defaultContent,
        position: sectionRow.position,
        lineItems,
      };
    }),
  );

  return {
    ...mapRowToRecord(servicePackageRow),
    sections,
  };
}

function buildServicePackageRecordValues(
  servicePackageId: string,
  studioId: string,
  input: ServicePackageInput,
) {
  const packageTotalCents = calculateServicePackageTotalCents(input.sections);

  return {
    id: servicePackageId,
    studioId,
    name: input.name,
    category: input.category,
    startingPriceLabel: formatServicePackageStartingPriceLabel(packageTotalCents),
    shortDescription: input.shortDescription,
    packageTotalCents,
  };
}

function buildSectionValues(servicePackageId: string, studioId: string, input: ServicePackageInput) {
  return input.sections.map((section) => {
    const sectionId = randomUUID();
    return {
      id: sectionId,
      clientSideId: section.id,
      servicePackageId,
      studioId,
      title: section.title,
      defaultContent: section.defaultContent,
      position: section.position,
    };
  });
}

function buildLineItemValues(
  servicePackageId: string,
  studioId: string,
  input: ServicePackageInput,
  sectionIdMap: Map<string, string>,
) {
  return input.sections.flatMap((section) =>
    section.lineItems.map((lineItem) => ({
      id: randomUUID(),
      servicePackageId,
      servicePackageSectionId: sectionIdMap.get(section.id) ?? randomUUID(),
      studioId,
      name: lineItem.name,
      defaultContent: lineItem.defaultContent,
      quantity: lineItem.quantity,
      unitLabel: lineItem.unitLabel,
      unitPriceCents: lineItem.unitPriceCents,
      position: lineItem.position,
    })),
  );
}

function buildSectionIdMap(
  sectionValues: Array<{ id: string; clientSideId: string }>,
): Map<string, string> {
  return new Map(sectionValues.map((s) => [s.clientSideId, s.id]));
}

function stripClientSideId<T extends { clientSideId?: string }>(
  values: T[],
): Omit<T, "clientSideId">[] {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return values.map(({ clientSideId: _clientSideId, ...rest }) => rest);
}

async function loadServicePackageRows(servicePackageId: string) {
  const [{ db }, schema] = await Promise.all([
    import("@/server/db"),
    import("@/server/db/schema/service-packages"),
  ]);

  const [servicePackageRows, sectionRows, lineItemRows] = await Promise.all([
    db.select().from(schema.servicePackages).where(eq(schema.servicePackages.id, servicePackageId)).limit(1),
    db
      .select()
      .from(schema.servicePackageSections)
      .where(eq(schema.servicePackageSections.servicePackageId, servicePackageId))
      .orderBy(asc(schema.servicePackageSections.position)),
    db
      .select()
      .from(schema.servicePackageLineItems)
      .where(eq(schema.servicePackageLineItems.servicePackageId, servicePackageId))
      .orderBy(asc(schema.servicePackageLineItems.position)),
  ]);

  return {
    servicePackageRow: servicePackageRows[0] ?? null,
    sectionRows,
    lineItemRows,
  };
}

export async function listServicePackagesForStudio(
  studioId: string,
): Promise<ServicePackageRecord[]> {
  if (!env.DATABASE_URL) {
    return sortServicePackages(readServicePackagesFromStore(studioId));
  }

  try {
    const [{ db }, { servicePackages }] = await Promise.all([
      import("@/server/db"),
      import("@/server/db/schema/service-packages"),
    ]);

    const rows = await db
      .select()
      .from(servicePackages)
      .where(eq(servicePackages.studioId, studioId))
      .orderBy(asc(servicePackages.name), asc(servicePackages.createdAt));

    return rows.map(mapRowToRecord);
  } catch {
    return sortServicePackages(readServicePackagesFromStore(studioId));
  }
}

export async function getServicePackageById(
  servicePackageId: string,
): Promise<ServicePackageDetailRecord | null> {
  if (!env.DATABASE_URL) {
    return readServicePackageByIdFromStore(servicePackageId);
  }

  try {
    const { servicePackageRow, sectionRows, lineItemRows } = await loadServicePackageRows(
      servicePackageId,
    );

    return servicePackageRow
      ? buildServicePackageDetailRecord(servicePackageRow, sectionRows, lineItemRows)
      : null;
  } catch {
    return readServicePackageByIdFromStore(servicePackageId);
  }
}

export async function createServicePackageRecord(
  studioId: string,
  input: ServicePackageInput,
): Promise<ServicePackageDetailRecord> {
  if (!env.DATABASE_URL) {
    return createServicePackageInStore(studioId, input);
  }

  try {
    const servicePackageId = randomUUID();
    const [{ db }, schema] = await Promise.all([
      import("@/server/db"),
      import("@/server/db/schema/service-packages"),
    ]);

    const sectionValues = buildSectionValues(servicePackageId, studioId, input);
    const sectionIdMap = buildSectionIdMap(sectionValues);

    await db.transaction(async (tx) => {
      await tx.insert(schema.servicePackages).values(
        buildServicePackageRecordValues(servicePackageId, studioId, input),
      );

      await tx.insert(schema.servicePackageSections).values(
        stripClientSideId(sectionValues),
      );

      await tx.insert(schema.servicePackageLineItems).values(
        buildLineItemValues(servicePackageId, studioId, input, sectionIdMap),
      );
    });

    const created = await getServicePackageById(servicePackageId);
    return created ?? createServicePackageInStore(studioId, input);
  } catch {
    return createServicePackageInStore(studioId, input);
  }
}

export async function updateServicePackageRecord(
  studioId: string,
  servicePackageId: string,
  input: ServicePackageInput,
): Promise<ServicePackageDetailRecord | null> {
  if (!env.DATABASE_URL) {
    return updateServicePackageInStore(studioId, servicePackageId, input);
  }

  try {
    const [{ db }, { and }, schema] = await Promise.all([
      import("@/server/db"),
      import("drizzle-orm"),
      import("@/server/db/schema/service-packages"),
    ]);

    const sectionValues = buildSectionValues(servicePackageId, studioId, input);
    const sectionIdMap = buildSectionIdMap(sectionValues);

    let updatedRowCount = 0;

    await db.transaction(async (tx) => {
      const updateResult = await tx
        .update(schema.servicePackages)
        .set({
          ...buildServicePackageRecordValues(servicePackageId, studioId, input),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.servicePackages.id, servicePackageId),
            eq(schema.servicePackages.studioId, studioId),
          ),
        )
        .returning();

      updatedRowCount = updateResult.length;

      if (updatedRowCount === 0) {
        return;
      }

      await tx
        .delete(schema.servicePackageLineItems)
        .where(eq(schema.servicePackageLineItems.servicePackageId, servicePackageId));
      await tx
        .delete(schema.servicePackageSections)
        .where(eq(schema.servicePackageSections.servicePackageId, servicePackageId));

      await tx.insert(schema.servicePackageSections).values(
        stripClientSideId(sectionValues),
      );
      await tx.insert(schema.servicePackageLineItems).values(
        buildLineItemValues(servicePackageId, studioId, input, sectionIdMap),
      );
    });

    if (updatedRowCount === 0) {
      return null;
    }

    return getServicePackageById(servicePackageId);
  } catch {
    return updateServicePackageInStore(studioId, servicePackageId, input);
  }
}

export function __resetServicePackagesStore() {
  resetServicePackagesStore();
}
