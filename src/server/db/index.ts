import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "@/lib/env";
import { getDatabaseUrlForRuntime } from "@/server/db/get-database-url";

const databaseUrl = getDatabaseUrlForRuntime(env);

const client = postgres(databaseUrl, {
  max: 1,
  prepare: false,
});

export const db = drizzle(client);
