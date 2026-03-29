import {
  assertLocalTestDatabaseUrl,
  getSeededDatabaseName,
  loadRuntimeEnv,
  runMigrations,
  truncateApplicationTables,
  withDatabaseConnection,
} from "./shared";
import { seedLocalDatabase } from "./seed-data";

async function main() {
  const env = await loadRuntimeEnv();

  if (!env.TEST_DATABASE_URL) {
    throw new Error("TEST_DATABASE_URL is required to reset the local test database.");
  }

  assertLocalTestDatabaseUrl(env.TEST_DATABASE_URL, "Test database reset");

  await runMigrations(env.TEST_DATABASE_URL);
  await truncateApplicationTables(env.TEST_DATABASE_URL);

  await withDatabaseConnection(env.TEST_DATABASE_URL, async ({ db }) => {
    await seedLocalDatabase(db);
  });

  console.info(`Reset ${getSeededDatabaseName(env.TEST_DATABASE_URL)} with deterministic fixtures.`);
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
