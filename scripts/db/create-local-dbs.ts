import postgres from "postgres";

import { getMaintenanceDatabaseUrl, getLocalDatabaseTargets, loadRuntimeEnv } from "./shared";
import { getDatabaseName } from "@/server/db/local-db-safety";

function quoteIdentifier(identifier: string) {
  return `"${identifier.replaceAll('"', '""')}"`;
}

async function ensureDatabaseExists(client: ReturnType<typeof postgres>, databaseName: string) {
  const existing = await client<{ datname: string }[]>`
    select datname from pg_database where datname = ${databaseName}
  `;

  if (existing.length > 0) {
    console.info(`Database ${databaseName} already exists.`);
    return;
  }

  await client.unsafe(`create database ${quoteIdentifier(databaseName)}`);
  console.info(`Created database ${databaseName}.`);
}

async function main() {
  const env = await loadRuntimeEnv();
  const { devDatabaseUrl, testDatabaseUrl } = getLocalDatabaseTargets(env);
  const adminDatabaseUrl = getMaintenanceDatabaseUrl(devDatabaseUrl);
  const adminClient = postgres(adminDatabaseUrl, {
    max: 1,
    prepare: false,
  });

  try {
    await ensureDatabaseExists(adminClient, getDatabaseName(new URL(devDatabaseUrl)));
    await ensureDatabaseExists(adminClient, getDatabaseName(new URL(testDatabaseUrl)));
  } finally {
    await adminClient.end({ timeout: 5 });
  }
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
