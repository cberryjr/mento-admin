# Mento Admin

## Local setup

1. Install dependencies.
2. Copy the local env template.
3. Adjust `.env.local` if your local Postgres user/password differ from the example values.
4. Create local databases.
5. Run migrations and seeds.

```bash
npm install
cp .env.example .env.local
npm run db:setup:local
```

The local workflow uses two dedicated PostgreSQL databases on `localhost:5432`:

- `mento-admin-dev` for manual development
- `mento-admin-test` for Playwright and test resets

## Daily workflow

Start the app on `http://localhost:3000`:

```bash
npm run dev
```

Refresh local dev fixtures at any time:

```bash
npm run db:seed:dev
```

Reset the isolated test database before local test runs:

```bash
npm run db:reset:test
```

Run the main test suites:

```bash
npm test
npm run test:e2e
```

If you already have `npm run dev` running on port `3000`, stop it before `npm run test:e2e` so Playwright can boot the isolated test server and reset `mento-admin-test` first.

## Database commands

- `npm run db:create-local` creates `mento-admin-dev` and `mento-admin-test` if they do not exist.
- `npm run db:migrate:dev` applies Drizzle migrations to the local dev database.
- `npm run db:seed:dev` loads deterministic studio, client, service package, quote, revision, and invoice fixtures into the local dev database.
- `npm run db:reset:test` migrates, truncates, and reseeds only `mento-admin-test`.
- `npm run db:setup:local` runs the full local bootstrap sequence.

## Safety rules

- Database utility scripts only allow `localhost` targets.
- Test reset refuses any database name other than `mento-admin-test`.
- Development seed refuses any database name other than `mento-admin-dev`.
- No restart, stop, or service-control commands are included here. Any infrastructure restart stays approval-gated.

## Troubleshooting

- If database creation fails, confirm local PostgreSQL is already running on `localhost:5432` and that the configured user can create databases.
- If migrations or seeds fail with auth errors, verify `DATABASE_URL` and `TEST_DATABASE_URL` in `.env.local`.
- If Playwright cannot sign in, confirm `STUDIO_OWNER_EMAIL` and `STUDIO_OWNER_PASSWORD` in `.env.local` match the values you expect.
- If the app falls back to in-memory behavior unexpectedly, verify the selected database URL is reachable before starting the app.

## Open follow-up

CI currently sets `DATABASE_URL` for test runs but does not provision a PostgreSQL service in `.github/workflows/ci.yml`. A separate follow-up should decide how CI provisions Postgres and when migrations/seeds should run.
