import type { Env } from "@/lib/env";

type DatabaseRuntimeEnv = Pick<Env, "NODE_ENV" | "DATABASE_URL" | "TEST_DATABASE_URL">;

export function getDatabaseEnvVarForRuntime(nodeEnv: DatabaseRuntimeEnv["NODE_ENV"]) {
  return nodeEnv === "test" ? "TEST_DATABASE_URL" : "DATABASE_URL";
}

export function isDatabaseConfiguredForRuntime(env: DatabaseRuntimeEnv) {
  if (env.NODE_ENV === "test") {
    return Boolean(env.TEST_DATABASE_URL);
  }

  return Boolean(env.DATABASE_URL);
}

export function getDatabaseUrlForRuntime(env: DatabaseRuntimeEnv) {
  const envVarName = getDatabaseEnvVarForRuntime(env.NODE_ENV);
  const databaseUrl = env.NODE_ENV === "test" ? env.TEST_DATABASE_URL : env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      `${envVarName} is required to initialize the database client when NODE_ENV=${env.NODE_ENV}.`,
    );
  }

  return databaseUrl;
}
