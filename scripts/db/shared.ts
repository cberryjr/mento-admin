import path from "node:path";

import { loadEnvConfig } from "@next/env";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

import {
  assertLocalPostgresDatabaseUrl,
  getDatabaseName,
  toMaintenanceDatabaseUrl,
} from "@/server/db/local-db-safety";
import * as schema from "@/server/db/schema";

loadEnvConfig(process.cwd());

export const LOCAL_DEV_DATABASE_NAME = "mento-admin-dev";
export const LOCAL_TEST_DATABASE_NAME = "mento-admin-test";

const APP_TABLE_NAMES = [
  "studio_defaults",
  "clients",
  "service_packages",
  "service_package_sections",
  "service_package_line_items",
  "service_package_complexity_tiers",
  "service_package_tier_deliverables",
  "service_package_tier_process_notes",
  "quotes",
  "quote_service_packages",
  "quote_sections",
  "quote_line_items",
  "quote_revisions",
  "invoices",
  "invoice_sections",
  "invoice_line_items",
] as const;

export async function loadRuntimeEnv() {
  return (await import("@/lib/env")).env;
}

export function createDatabaseConnection(databaseUrl: string) {
  const client = postgres(databaseUrl, {
    max: 1,
    prepare: false,
  });

  return {
    client,
    db: drizzle(client, { schema }),
  };
}

export async function withDatabaseConnection<T>(
  databaseUrl: string,
  callback: (connection: ReturnType<typeof createDatabaseConnection>) => Promise<T>,
) {
  const connection = createDatabaseConnection(databaseUrl);

  try {
    return await callback(connection);
  } finally {
    await connection.client.end({ timeout: 5 });
  }
}

export function assertLocalDevDatabaseUrl(databaseUrl: string, purpose: string) {
  return assertLocalPostgresDatabaseUrl(databaseUrl, {
    purpose,
    expectedDatabaseNames: [LOCAL_DEV_DATABASE_NAME],
  });
}

export function assertLocalTestDatabaseUrl(databaseUrl: string, purpose: string) {
  return assertLocalPostgresDatabaseUrl(databaseUrl, {
    purpose,
    expectedDatabaseNames: [LOCAL_TEST_DATABASE_NAME],
  });
}

export function assertKnownLocalDatabaseUrl(databaseUrl: string, purpose: string) {
  return assertLocalPostgresDatabaseUrl(databaseUrl, {
    purpose,
    expectedDatabaseNames: [LOCAL_DEV_DATABASE_NAME, LOCAL_TEST_DATABASE_NAME],
  });
}

export function getLocalDatabaseTargets(env: Awaited<ReturnType<typeof loadRuntimeEnv>>) {
  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for local database setup.");
  }

  if (!env.TEST_DATABASE_URL) {
    throw new Error("TEST_DATABASE_URL is required for local database setup.");
  }

  assertLocalDevDatabaseUrl(env.DATABASE_URL, "Local development database setup");
  assertLocalTestDatabaseUrl(env.TEST_DATABASE_URL, "Local test database setup");

  return {
    devDatabaseUrl: env.DATABASE_URL,
    testDatabaseUrl: env.TEST_DATABASE_URL,
  };
}

export function getMaintenanceDatabaseUrl(databaseUrl: string) {
  return toMaintenanceDatabaseUrl(databaseUrl);
}

export async function runMigrations(databaseUrl: string) {
  assertKnownLocalDatabaseUrl(databaseUrl, "Database migrations");

  await withDatabaseConnection(databaseUrl, async ({ db }) => {
    await migrate(db, {
      migrationsFolder: path.resolve(process.cwd(), "drizzle/migrations"),
    });
  });
}

export async function truncateApplicationTables(databaseUrl: string) {
  assertLocalTestDatabaseUrl(databaseUrl, "Test database reset");

  const truncateStatement = `TRUNCATE TABLE ${APP_TABLE_NAMES.map((tableName) => `"${tableName}"`).join(", ")} RESTART IDENTITY CASCADE`;

  await withDatabaseConnection(databaseUrl, async ({ client }) => {
    await client.unsafe(truncateStatement);
  });
}

export function getSeededDatabaseName(databaseUrl: string) {
  return getDatabaseName(new URL(databaseUrl));
}
