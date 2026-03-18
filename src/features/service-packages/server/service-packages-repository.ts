import { randomUUID } from "node:crypto";

import { asc, eq } from "drizzle-orm";

import { env } from "@/lib/env";
import type {
  ServicePackageInput,
  ServicePackageRecord,
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
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function sortServicePackages(servicePackages: ServicePackageRecord[]) {
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

    return rows.map((row) => mapRowToRecord(row));
  } catch {
    return sortServicePackages(readServicePackagesFromStore(studioId));
  }
}

export async function getServicePackageById(
  servicePackageId: string,
): Promise<ServicePackageRecord | null> {
  if (!env.DATABASE_URL) {
    return readServicePackageByIdFromStore(servicePackageId);
  }

  try {
    const [{ db }, { servicePackages }] = await Promise.all([
      import("@/server/db"),
      import("@/server/db/schema/service-packages"),
    ]);

    const rows = await db
      .select()
      .from(servicePackages)
      .where(eq(servicePackages.id, servicePackageId))
      .limit(1);

    const row = rows[0];
    return row ? mapRowToRecord(row) : null;
  } catch {
    return readServicePackageByIdFromStore(servicePackageId);
  }
}

export async function createServicePackageRecord(
  studioId: string,
  input: ServicePackageInput,
): Promise<ServicePackageRecord> {
  if (!env.DATABASE_URL) {
    return createServicePackageInStore(studioId, input);
  }

  try {
    const [{ db }, { servicePackages }] = await Promise.all([
      import("@/server/db"),
      import("@/server/db/schema/service-packages"),
    ]);

    const rows = await db
      .insert(servicePackages)
      .values({
        id: randomUUID(),
        studioId,
        name: input.name,
        category: input.category,
        startingPriceLabel: input.startingPriceLabel,
        shortDescription: input.shortDescription,
      })
      .returning();

    const row = rows[0];
    return row ? mapRowToRecord(row) : createServicePackageInStore(studioId, input);
  } catch {
    return createServicePackageInStore(studioId, input);
  }
}

export async function updateServicePackageRecord(
  studioId: string,
  servicePackageId: string,
  input: ServicePackageInput,
): Promise<ServicePackageRecord | null> {
  if (!env.DATABASE_URL) {
    return updateServicePackageInStore(servicePackageId, input);
  }

  try {
    const [{ db }, { and }, { servicePackages }] = await Promise.all([
      import("@/server/db"),
      import("drizzle-orm"),
      import("@/server/db/schema/service-packages"),
    ]);

    const rows = await db
      .update(servicePackages)
      .set({
        name: input.name,
        category: input.category,
        startingPriceLabel: input.startingPriceLabel,
        shortDescription: input.shortDescription,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(servicePackages.id, servicePackageId),
          eq(servicePackages.studioId, studioId),
        ),
      )
      .returning();

    const row = rows[0];
    return row ? mapRowToRecord(row) : null;
  } catch {
    return updateServicePackageInStore(servicePackageId, input);
  }
}

export function __resetServicePackagesStore() {
  resetServicePackagesStore();
}
