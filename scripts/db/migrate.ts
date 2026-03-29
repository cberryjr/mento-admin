import {
  assertLocalDevDatabaseUrl,
  getSeededDatabaseName,
  loadRuntimeEnv,
  runMigrations,
} from "./shared";

async function main() {
  const env = await loadRuntimeEnv();

  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to run local development migrations.");
  }

  assertLocalDevDatabaseUrl(env.DATABASE_URL, "Development database migrations");
  await runMigrations(env.DATABASE_URL);

  console.info(`Applied migrations to ${getSeededDatabaseName(env.DATABASE_URL)}.`);
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
