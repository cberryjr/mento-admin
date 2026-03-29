import { randomUUID } from "node:crypto";

import { asc, eq } from "drizzle-orm";

import { env } from "@/lib/env";
import {
  calculateServicePackageTotalCents,
  formatServicePackageStartingPriceLabel,
  normalizeCatalogMetadata,
  normalizeComplexityTiers,
  type ServicePackageComplexityTierInput,
  type ServicePackageDetailRecord,
  type ServicePackageInput,
  type ServicePackageLineItemRecord,
  type ServicePackageRecord,
  type ServicePackageSectionRecord,
} from "@/features/service-packages/types";
import { isDatabaseConfiguredForRuntime } from "@/server/db/get-database-url";
import {
  __resetServicePackagesStore as resetServicePackagesStore,
  createServicePackageInStore,
  readServicePackageByIdFromStore,
  readServicePackagesFromStore,
  updateServicePackageInStore,
} from "@/features/service-packages/server/store/service-packages-store";

function isDatabaseConfigured() {
  return isDatabaseConfiguredForRuntime(env);
}

type ServicePackageRow = {
  id: string;
  studioId: string;
  name: string;
  categoryKey: string;
  categoryLabel: string;
  categoryShortLabel: string;
  category: string;
  startingPriceLabel: string;
  shortDescription: string;
  packageTotalCents: number;
  createdAt: Date;
  updatedAt: Date;
};

type ServicePackageComplexityTierRow = {
  id: string;
  servicePackageId: string;
  studioId: string;
  tierKey: string;
  tierTitle: string;
  descriptor: string;
  timeMinValue: number;
  timeMaxValue: number;
  timeUnit: string;
  quantityDefault: number;
  durationValueDefault: number | null;
  durationUnitDefault: string | null;
  resolutionDefault: string | null;
  revisionsDefault: number;
  urgencyDefault: string;
  position: number;
};

type ServicePackageTierDeliverableRow = {
  id: string;
  servicePackageComplexityTierId: string;
  value: string;
  position: number;
};

type ServicePackageTierProcessNoteRow = {
  id: string;
  servicePackageComplexityTierId: string;
  value: string;
  position: number;
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
  const catalog = normalizeCatalogMetadata({
    categoryKey: row.categoryKey,
    categoryLabel: row.categoryLabel,
    categoryShortLabel: row.categoryShortLabel,
    category: row.category,
  });

  return {
    id: row.id,
    studioId: row.studioId,
    name: row.name,
    categoryKey: catalog.categoryKey,
    categoryLabel: catalog.categoryLabel,
    categoryShortLabel: catalog.categoryShortLabel,
    category: catalog.category,
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
  complexityTierRows: ServicePackageComplexityTierRow[],
  deliverableRows: ServicePackageTierDeliverableRow[],
  processNoteRows: ServicePackageTierProcessNoteRow[],
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

  const catalog = normalizeCatalogMetadata({
    categoryKey: servicePackageRow.categoryKey,
    categoryLabel: servicePackageRow.categoryLabel,
    categoryShortLabel: servicePackageRow.categoryShortLabel,
    category: servicePackageRow.category,
  });

  const complexityTiers = normalizeComplexityTiers(
    catalog.categoryKey,
    complexityTierRows.map<ServicePackageComplexityTierInput>((tierRow) => ({
      id: tierRow.id,
      tier: tierRow.tierKey as ServicePackageComplexityTierInput["tier"],
      title: tierRow.tierTitle,
      descriptor: tierRow.descriptor,
      deliverables: deliverableRows
        .filter((row) => row.servicePackageComplexityTierId === tierRow.id)
        .sort((a, b) => a.position - b.position)
        .map((row) => row.value),
      processNotes: processNoteRows
        .filter((row) => row.servicePackageComplexityTierId === tierRow.id)
        .sort((a, b) => a.position - b.position)
        .map((row) => row.value),
      timeGuidance: {
        minValue: tierRow.timeMinValue,
        maxValue: tierRow.timeMaxValue,
        unit: tierRow.timeUnit as ServicePackageComplexityTierInput["timeGuidance"]["unit"],
      },
      variableDefaults: {
        quantity: tierRow.quantityDefault,
        durationValue: tierRow.durationValueDefault,
        durationUnit:
          tierRow.durationUnitDefault as ServicePackageComplexityTierInput["variableDefaults"]["durationUnit"],
        resolution:
          tierRow.resolutionDefault as ServicePackageComplexityTierInput["variableDefaults"]["resolution"],
        revisions: tierRow.revisionsDefault,
        urgency:
          tierRow.urgencyDefault as ServicePackageComplexityTierInput["variableDefaults"]["urgency"],
      },
      position: tierRow.position,
    })),
  );

  return {
    ...mapRowToRecord(servicePackageRow),
    complexityTiers,
    sections,
  };
}

function buildServicePackageRecordValues(
  servicePackageId: string,
  studioId: string,
  input: ServicePackageInput,
) {
  const packageTotalCents = calculateServicePackageTotalCents(input.sections);
  const catalog = normalizeCatalogMetadata(input);

  return {
    id: servicePackageId,
    studioId,
    name: input.name,
    categoryKey: catalog.categoryKey,
    categoryLabel: catalog.categoryLabel,
    categoryShortLabel: catalog.categoryShortLabel,
    category: catalog.category,
    startingPriceLabel: formatServicePackageStartingPriceLabel(packageTotalCents),
    shortDescription: input.shortDescription,
    packageTotalCents,
  };
}

function buildComplexityTierValues(
  servicePackageId: string,
  studioId: string,
  input: ServicePackageInput,
) {
  const categoryKey = normalizeCatalogMetadata(input).categoryKey;
  const complexityTiers = normalizeComplexityTiers(categoryKey, input.complexityTiers);

  return complexityTiers.map((tier) => ({
    id: tier.id,
    servicePackageId,
    studioId,
    tierKey: tier.tier,
    tierTitle: tier.title,
    descriptor: tier.descriptor,
    timeMinValue: tier.timeGuidance.minValue,
    timeMaxValue: tier.timeGuidance.maxValue,
    timeUnit: tier.timeGuidance.unit,
    quantityDefault: tier.variableDefaults.quantity,
    durationValueDefault: tier.variableDefaults.durationValue,
    durationUnitDefault: tier.variableDefaults.durationUnit,
    resolutionDefault: tier.variableDefaults.resolution,
    revisionsDefault: tier.variableDefaults.revisions,
    urgencyDefault: tier.variableDefaults.urgency,
    position: tier.position,
  }));
}

function buildTierDeliverableValues(
  servicePackageId: string,
  studioId: string,
  input: ServicePackageInput,
) {
  const categoryKey = normalizeCatalogMetadata(input).categoryKey;
  const complexityTiers = normalizeComplexityTiers(categoryKey, input.complexityTiers);

  return complexityTiers.flatMap((tier) =>
    tier.deliverables.map((value, index) => ({
      id: randomUUID(),
      servicePackageId,
      studioId,
      servicePackageComplexityTierId: tier.id,
      value,
      position: index + 1,
    })),
  );
}

function buildTierProcessNoteValues(
  servicePackageId: string,
  studioId: string,
  input: ServicePackageInput,
) {
  const categoryKey = normalizeCatalogMetadata(input).categoryKey;
  const complexityTiers = normalizeComplexityTiers(categoryKey, input.complexityTiers);

  return complexityTiers.flatMap((tier) =>
    tier.processNotes.map((value, index) => ({
      id: randomUUID(),
      servicePackageId,
      studioId,
      servicePackageComplexityTierId: tier.id,
      value,
      position: index + 1,
    })),
  );
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

  const [servicePackageRows, sectionRows, lineItemRows, complexityTierRows, deliverableRows, processNoteRows] = await Promise.all([
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
    db
      .select()
      .from(schema.servicePackageComplexityTiers)
      .where(eq(schema.servicePackageComplexityTiers.servicePackageId, servicePackageId))
      .orderBy(asc(schema.servicePackageComplexityTiers.position)),
    db
      .select()
      .from(schema.servicePackageTierDeliverables)
      .where(eq(schema.servicePackageTierDeliverables.servicePackageId, servicePackageId))
      .orderBy(asc(schema.servicePackageTierDeliverables.position)),
    db
      .select()
      .from(schema.servicePackageTierProcessNotes)
      .where(eq(schema.servicePackageTierProcessNotes.servicePackageId, servicePackageId))
      .orderBy(asc(schema.servicePackageTierProcessNotes.position)),
  ]);

  return {
    servicePackageRow: servicePackageRows[0] ?? null,
    sectionRows,
    lineItemRows,
    complexityTierRows,
    deliverableRows,
    processNoteRows,
  };
}

export async function listServicePackagesForStudio(
  studioId: string,
): Promise<ServicePackageRecord[]> {
  if (!isDatabaseConfigured()) {
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
  if (!isDatabaseConfigured()) {
    return readServicePackageByIdFromStore(servicePackageId);
  }

  try {
    const {
      servicePackageRow,
      sectionRows,
      lineItemRows,
      complexityTierRows,
      deliverableRows,
      processNoteRows,
    } = await loadServicePackageRows(
      servicePackageId,
    );

    return servicePackageRow
      ? buildServicePackageDetailRecord(
          servicePackageRow,
          sectionRows,
          lineItemRows,
          complexityTierRows,
          deliverableRows,
          processNoteRows,
        )
      : null;
  } catch {
    return readServicePackageByIdFromStore(servicePackageId);
  }
}

export async function getServicePackageForStudioById(
  studioId: string,
  servicePackageId: string,
): Promise<ServicePackageDetailRecord | null> {
  const visibleServicePackages = await listServicePackagesForStudio(studioId);

  if (!visibleServicePackages.some((servicePackage) => servicePackage.id === servicePackageId)) {
    return null;
  }

  const servicePackage = await getServicePackageById(servicePackageId);

  if (!servicePackage || servicePackage.studioId !== studioId) {
    return null;
  }

  return servicePackage;
}

export async function createServicePackageRecord(
  studioId: string,
  input: ServicePackageInput,
): Promise<ServicePackageDetailRecord> {
  if (!isDatabaseConfigured()) {
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
    const complexityTierValues = buildComplexityTierValues(servicePackageId, studioId, input);
    const tierDeliverableValues = buildTierDeliverableValues(servicePackageId, studioId, input);
    const tierProcessNoteValues = buildTierProcessNoteValues(servicePackageId, studioId, input);

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

      await tx.insert(schema.servicePackageComplexityTiers).values(complexityTierValues);
      await tx.insert(schema.servicePackageTierDeliverables).values(tierDeliverableValues);
      await tx.insert(schema.servicePackageTierProcessNotes).values(tierProcessNoteValues);
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
  if (!isDatabaseConfigured()) {
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
    const complexityTierValues = buildComplexityTierValues(servicePackageId, studioId, input);
    const tierDeliverableValues = buildTierDeliverableValues(servicePackageId, studioId, input);
    const tierProcessNoteValues = buildTierProcessNoteValues(servicePackageId, studioId, input);

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
      await tx
        .delete(schema.servicePackageTierDeliverables)
        .where(eq(schema.servicePackageTierDeliverables.servicePackageId, servicePackageId));
      await tx
        .delete(schema.servicePackageTierProcessNotes)
        .where(eq(schema.servicePackageTierProcessNotes.servicePackageId, servicePackageId));
      await tx
        .delete(schema.servicePackageComplexityTiers)
        .where(eq(schema.servicePackageComplexityTiers.servicePackageId, servicePackageId));

      await tx.insert(schema.servicePackageSections).values(
        stripClientSideId(sectionValues),
      );
      await tx.insert(schema.servicePackageLineItems).values(
        buildLineItemValues(servicePackageId, studioId, input, sectionIdMap),
      );
      await tx.insert(schema.servicePackageComplexityTiers).values(complexityTierValues);
      await tx.insert(schema.servicePackageTierDeliverables).values(tierDeliverableValues);
      await tx.insert(schema.servicePackageTierProcessNotes).values(tierProcessNoteValues);
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
