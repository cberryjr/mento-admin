const LOCAL_DATABASE_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);
const LOCAL_DATABASE_PORTS = new Set(["", "5432"]);
const POSTGRES_PROTOCOLS = new Set(["postgres:", "postgresql:"]);

type LocalDatabaseOptions = {
  purpose: string;
  expectedDatabaseNames?: string[];
};

function joinDatabaseNames(databaseNames: string[]) {
  return databaseNames.map((databaseName) => `"${databaseName}"`).join(", ");
}

export function getDatabaseName(url: URL) {
  return decodeURIComponent(url.pathname.replace(/^\/+/, ""));
}

export function assertLocalPostgresDatabaseUrl(
  databaseUrl: string,
  options: LocalDatabaseOptions,
) {
  let url: URL;

  try {
    url = new URL(databaseUrl);
  } catch {
    throw new Error(`${options.purpose} requires a valid PostgreSQL connection URL.`);
  }

  if (!POSTGRES_PROTOCOLS.has(url.protocol)) {
    throw new Error(`${options.purpose} requires a postgresql:// connection URL.`);
  }

  if (!LOCAL_DATABASE_HOSTS.has(url.hostname)) {
    throw new Error(
      `${options.purpose} only supports localhost databases. Received host "${url.hostname}".`,
    );
  }

  if (!LOCAL_DATABASE_PORTS.has(url.port)) {
    throw new Error(
      `${options.purpose} only supports port 5432. Received port "${url.port}".`,
    );
  }

  const databaseName = getDatabaseName(url);

  if (!databaseName) {
    throw new Error(`${options.purpose} requires an explicit database name in the URL path.`);
  }

  if (
    options.expectedDatabaseNames &&
    !options.expectedDatabaseNames.includes(databaseName)
  ) {
    throw new Error(
      `${options.purpose} only supports ${joinDatabaseNames(options.expectedDatabaseNames)}. Received "${databaseName}".`,
    );
  }

  return url;
}

export function toMaintenanceDatabaseUrl(
  databaseUrl: string,
  maintenanceDatabaseName = "postgres",
) {
  const url = new URL(databaseUrl);
  url.pathname = `/${maintenanceDatabaseName}`;
  return url.toString();
}
