import {
  assertLocalDevDatabaseUrl,
  getSeededDatabaseName,
  loadRuntimeEnv,
  withDatabaseConnection,
} from "./shared";
import { seedLocalDatabase } from "./seed-data";

async function main() {
  const env = await loadRuntimeEnv();

  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to seed the local development database.");
  }

  assertLocalDevDatabaseUrl(env.DATABASE_URL, "Development database seeding");

  await withDatabaseConnection(env.DATABASE_URL, async ({ db }) => {
    await seedLocalDatabase(db);
  });

  console.info(`Seeded ${getSeededDatabaseName(env.DATABASE_URL)} with deterministic fixtures.`);
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
