import { defineConfig } from "drizzle-kit";
import { env } from "./src/lib/env";

if (!env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required for Drizzle config.");
}

export default defineConfig({
  schema: "./src/server/db/schema/index.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
});
