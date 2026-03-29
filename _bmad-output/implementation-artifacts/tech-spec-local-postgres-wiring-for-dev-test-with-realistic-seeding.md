---
title: 'Local Postgres Wiring for Dev/Test with Realistic Seeding'
slug: 'local-postgres-wiring-for-dev-test-with-realistic-seeding'
created: '2026-03-22T18:05:00Z'
status: 'completed'
stepsCompleted: [1, 2, 3, 4]
tech_stack:
  - TypeScript
  - Next.js App Router
  - PostgreSQL
  - Drizzle ORM
  - Vitest
  - Playwright
files_to_modify:
  - .env.example
  - .env.local
  - package.json
  - README.md
  - drizzle.config.ts
  - src/lib/env.ts
  - src/lib/env.test.ts
  - src/server/db/index.ts
  - src/server/db/get-database-url.ts
  - tests/e2e/auth.spec.ts
  - playwright.config.ts
  - vitest.config.ts
  - scripts/db/create-local-dbs.ts
  - scripts/db/migrate.ts
  - scripts/db/seed-dev.ts
  - scripts/db/reset-test-db.ts
code_patterns:
  - Env validation and defaults centralized in src/lib/env.ts
  - DB runtime instantiated from DATABASE_URL in src/server/db/index.ts
  - Drizzle schema-first migration model with ordered SQL files in drizzle/migrations
  - Repository layer supports in-memory fallback when DATABASE_URL is absent or connection/auth fails
  - Store modules include seeded fixture patterns and reset helpers for deterministic test setup
  - App and E2E default to localhost:3000
test_patterns:
  - Vitest unit/integration tests under src/**/*.test.* and tests/integration/**/*.test.*
  - Playwright E2E tests under tests/e2e with webServer on localhost:3000
  - E2E auth uses STUDIO_OWNER_EMAIL and STUDIO_OWNER_PASSWORD env fallbacks
  - Existing tests frequently rely on in-memory store resets for deterministic execution
---

# Tech-Spec: Local Postgres Wiring for Dev/Test with Realistic Seeding

**Created:** 2026-03-22T18:05:00Z

## Overview

### Problem Statement

The project needs a reliable local database setup for realistic end-to-end testing, but there is not yet a finalized implementation-ready plan that enforces separate local dev/test databases, safe infrastructure handling (no restart without approval), and deterministic seed data aligned to real-world usage. The app must continue to run locally on localhost:3000 for manual verification.

### Solution

Wire the app to local PostgreSQL on localhost:5432 using dedicated databases (`mento-admin-dev` for development and `mento-admin-test` for tests), define deterministic realistic seeds for core business flows, and codify a local execution path for migrations, seeding, tests, and app startup on port 3000 while explicitly treating CI database failures as a follow-up question.

### Scope

**In Scope:**
- Local database configuration for `mento-admin-dev` and `mento-admin-test` on localhost:5432
- Safety constraints for infrastructure operations (no restart actions without explicit approval)
- Migration + seed workflow for realistic domain data
- Test configuration updates needed for isolated test database usage
- Local verification workflow with app running on localhost:3000
- Capture CI failure as follow-up/open question (no CI implementation changes in this spec)

**Out of Scope:**
- Restarting any infrastructure/database service without explicit user approval
- Implementing GitHub CI service/database orchestration changes in this spec
- Production or hosted database changes

## Context for Development

### Codebase Patterns

- Environment variables are validated centrally in `src/lib/env.ts`; production-only guards are strict while development can run with defaults.
- DB runtime is instantiated from `DATABASE_URL` in `src/server/db/index.ts`; if missing, DB module initialization fails fast.
- Drizzle migration tooling is configured by `drizzle.config.ts` and ordered SQL entries in `drizzle/migrations/*` with journal metadata.
- Repository layer currently supports two persistence paths: DB path when configured and in-memory fallback/store fixtures when unavailable (or on connectivity/auth failures for select repositories).
- Store modules (`clients-store`, `service-packages-store`, `quotes-store`, `invoices-store`) already define seeded fixture data and reset helpers, which is the closest existing pattern for deterministic seed-like behavior.
- E2E execution is pinned to localhost:3000 (`playwright.config.ts`) and auth fixtures read owner credentials from env with safe defaults.

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `.env.example` | Baseline local environment variable contract that needs dev/test DB naming updates |
| `.env.local` | Active local environment with current DB URL to be aligned to `mento-admin-dev` |
| `src/lib/env.ts` | Runtime env validation/defaults and owner credential contract for local testing |
| `src/server/db/index.ts` | Postgres client initialization behavior and failure mode when DB URL missing |
| `drizzle.config.ts` | Drizzle connection source and migration execution anchor |
| `drizzle/migrations/meta/_journal.json` | Ground truth for currently applied migration order |
| `src/server/db/schema/index.ts` | Schema export index for any seed utility needing full schema scope |
| `src/features/clients/server/store/clients-store.ts` | Existing realistic fixture style and studio-scoped data patterns |
| `src/features/service-packages/server/store/service-packages-store.ts` | Existing package/section/line-item fixture structures to mirror in DB seeds |
| `src/features/quotes/server/store/quotes-store.ts` | Quote lifecycle and revision data model patterns in seeded store flows |
| `src/features/invoices/server/store/invoices-store.ts` | Invoice lifecycle and linkage model patterns for realistic seed scenarios |
| `playwright.config.ts` | localhost:3000 webServer contract used by E2E verification |
| `tests/e2e/auth.spec.ts` | Auth entrypoint that depends on local owner env values |
| `vitest.config.ts` | Current test inclusion model to keep updated tests discoverable |
| `README.md` | Developer runbook location for local DB setup and execution commands |
| `.github/workflows/ci.yml` | CI follow-up reference; currently sets DATABASE_URL but does not provision Postgres service |

### Technical Decisions

- Use separate local DB names on localhost:5432: `mento-admin-dev` (development) and `mento-admin-test` (test).
- Keep localhost app execution on port 3000 for parity with current workflow and E2E defaults.
- Implement deterministic DB seeding using realistic domain fixtures (clients, service packages, quotes, revisions, invoices) to support manual and automated testing.
- Enforce infrastructure-safety rule in implementation notes: no DB/service/container restart actions without explicit user approval.
- Keep GitHub CI repair out of this quick-spec scope; track as follow-up with open question about CI Postgres provisioning capability and migration execution model.

## Implementation Plan

### Tasks

- [x] Task 1: Standardize local environment contracts for isolated dev/test databases
  - File: `.env.example`
  - Action: Replace generic DB example with `postgresql://postgres:postgres@localhost:5432/mento-admin-dev`; add `TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mento-admin-test`; include owner auth defaults used by E2E.
  - Notes: Keep localhost:3000 unchanged; do not add production values.

- [x] Task 2: Align local runtime env to the dedicated dev database
  - File: `.env.local`
  - Action: Update `DATABASE_URL` to `mento-admin-dev`; add `TEST_DATABASE_URL` for `mento-admin-test`; preserve existing auth keys.
  - Notes: This file remains local-only and gitignored; README must include explicit `cp .env.example .env.local` onboarding step.

- [x] Task 3: Extend env validation to support explicit test DB URL
  - File: `src/lib/env.ts`
  - Action: Add `TEST_DATABASE_URL` validation and enforce: when `NODE_ENV=test`, `TEST_DATABASE_URL` must be present and a valid URL; keep production checks unchanged.
  - Notes: In non-test environments, `TEST_DATABASE_URL` remains optional.

- [x] Task 4: Implement runtime database URL selection for test isolation
  - File: `src/server/db/get-database-url.ts`
  - Action: Add `getDatabaseUrlForRuntime(env)` helper that resolves DB URL as: `NODE_ENV=test` -> `TEST_DATABASE_URL` (preferred) with fallback error if missing; otherwise `DATABASE_URL`.
  - Notes: Include strict localhost safety checks for scripts separately; runtime helper should focus on deterministic environment selection.

- [x] Task 5: Adopt runtime DB URL selector in DB client initialization
  - File: `src/server/db/index.ts`
  - Action: Replace direct `env.DATABASE_URL` usage with `getDatabaseUrlForRuntime(env)`.
  - Notes: Error message must explicitly mention required variable for the active environment.

- [x] Task 6: Add DB utility scripts for deterministic local setup and execution
  - File: `package.json`
  - Action: Add script runner dependency (`tsx`) and scripts for `db:create-local`, `db:migrate:dev`, `db:seed:dev`, `db:reset:test`, and composed `db:setup:local`.
  - Notes: Script entries must use `tsx scripts/db/*.ts`; scripts must only target local URLs from env variables.

- [x] Task 7: Add local DB creation utility with safety guards
  - File: `scripts/db/create-local-dbs.ts`
  - Action: Create script that connects to `postgres` maintenance DB on localhost and idempotently creates `mento-admin-dev` and `mento-admin-test` if missing.
  - Notes: Refuse non-local hosts; no stop/start/restart commands or service control calls.

- [x] Task 8: Add migration runner utility for local dev DB
  - File: `scripts/db/migrate.ts`
  - Action: Create script that runs Drizzle migrations against `DATABASE_URL` (dev path) using existing migration journal order.
  - Notes: Fail fast with clear error messaging for auth/connection errors.

- [x] Task 9: Add deterministic realistic seed script for dev DB
  - File: `scripts/db/seed-dev.ts`
  - Action: Seed studio defaults, owner-accessible client records, service packages with sections/line items, quote lifecycle records (draft/accepted/invoiced + revisions), and invoice lifecycle records (draft/sent/paid) with realistic timestamps/content.
  - Notes: Use stable IDs and idempotent upsert semantics; preserve existing test-critical IDs including `client-sunrise-yoga`, `client-otter-coffee`, `package-brand-launch`, and `package-content-sprint`.

- [x] Task 10: Add isolated test DB reset/seed helper
  - File: `scripts/db/reset-test-db.ts`
  - Action: Implement script to run `TRUNCATE ... RESTART IDENTITY CASCADE` over application tables on `TEST_DATABASE_URL`, then seed minimal deterministic fixture set.
  - Notes: Restrict execution to localhost `mento-admin-test`; abort on any non-local host or non-matching DB name before destructive operations.

- [x] Task 11: Keep Drizzle tooling aligned to local DB flows
  - File: `drizzle.config.ts`
  - Action: Confirm config remains sourced from `DATABASE_URL` and compatible with new script-based migration flow.
  - Notes: No schema changes required by this spec.

- [x] Task 12: Document local setup, runbook, and safety policy
  - File: `README.md`
  - Action: Add section for local DB setup (`cp .env.example .env.local`, `db:create-local -> db:migrate:dev -> db:seed:dev`), test reset flow, app start on port 3000, and explicit no-restart-without-approval rule.
  - Notes: Include troubleshooting for connection/auth issues.

- [x] Task 13: Ensure E2E/local runtime continues to target localhost:3000 and test DB isolation
  - File: `playwright.config.ts`
  - Action: Preserve `baseURL` and `port:3000`; set `webServer.env` to ensure E2E test runs use `NODE_ENV=test` and `DATABASE_URL` resolved from `TEST_DATABASE_URL`.
  - Notes: Keep parity with manual testing URL while isolating E2E data from dev DB.

- [x] Task 14: Add/update tests for env + script behavior
  - File: `src/lib/env.test.ts`
  - Action: Add cases covering `TEST_DATABASE_URL` parsing, required-on-test behavior, and compatibility with existing production guards.
  - Notes: Keep test suite deterministic and independent from live DB where possible.

### Acceptance Criteria

- [ ] AC 1: Given local PostgreSQL is reachable on `localhost:5432`, when the setup commands are run, then both `mento-admin-dev` and `mento-admin-test` exist and are reachable without restarting infrastructure services.
- [ ] AC 2: Given `NODE_ENV=development`, when the app is started from local env, then runtime DB operations target `mento-admin-dev` and the app remains accessible at `http://localhost:3000`.
- [ ] AC 3: Given the development database has no data, when `db:migrate:dev` then `db:seed:dev` are executed, then realistic deterministic records are created for studio defaults, clients, service packages, quotes (including revision coverage), and invoices with linked lineage.
- [ ] AC 4: Given repeated seed execution, when `db:seed:dev` is run multiple times, then resulting dataset remains deterministic/idempotent without duplicate logical records and preserves required fixture IDs used by current tests.
- [ ] AC 5: Given local tests need DB isolation, when `db:reset:test` is executed, then only `mento-admin-test` is reset and seeded, and no data mutation occurs in `mento-admin-dev`.
- [ ] AC 6: Given `NODE_ENV=test`, when runtime DB URL is resolved, then `TEST_DATABASE_URL` is required and selected for DB access.
- [ ] AC 7: Given Playwright E2E execution, when the local web server starts, then it runs on localhost:3000 with test-scoped DB environment and does not write to `mento-admin-dev`.
- [ ] AC 8: Given any DB utility script is run with a non-local or unexpected database target, when host or DB name safety checks fail, then the script aborts with an explicit error and performs no destructive action.
- [ ] AC 9: Given team members follow the README runbook, when onboarding a fresh local environment, then they can create `.env.local` from `.env.example`, create DBs, migrate, seed, run tests, and launch the app on localhost:3000 without undocumented steps.
- [ ] AC 10: Given this implementation is complete, when commands and scripts are inspected, then no restart or service-control commands exist and all infrastructure restart actions remain approval-gated.
- [ ] AC 11: Given CI remains out of scope, when the spec is reviewed, then CI DB failure is documented as an open follow-up question instead of being silently omitted.

## Additional Context

### Dependencies

- Existing dependencies in `package.json`: `postgres`, `drizzle-orm`, `drizzle-kit`, `vitest`, `@playwright/test`.
- Add script runtime dependency: `tsx` for executing `scripts/db/*.ts` commands.
- Local PostgreSQL service available on `localhost:5432` with credentials capable of creating databases and applying migrations.
- Existing schema definitions and migration history in `src/server/db/schema/*` and `drizzle/migrations/*`.
- Local environment management through `.env.local` and `.env.example`.

### Testing Strategy

- Unit: Extend `src/lib/env.test.ts` for new `TEST_DATABASE_URL` behavior and guard logic.
- Script-level validation: Run DB utilities against local instance and assert safety-guard failures on invalid targets.
- Integration: Execute representative integration tests after `db:reset:test` to verify test DB isolation and deterministic setup.
- E2E: Run `tests/e2e/auth.spec.ts` plus at least one quote/invoice flow while app serves on localhost:3000 with test DB environment derived from `TEST_DATABASE_URL`.
- Manual verification sequence:
  1. `npm run db:create-local`
  2. `npm run db:migrate:dev`
  3. `npm run db:seed:dev`
  4. `npm run db:reset:test`
  5. `npm run dev` and verify `http://localhost:3000`
  6. Run selected test suites and confirm expected records render in UI.

### Notes

- Infrastructure constraint: no DB/service/container restart actions are allowed without explicit user approval.
- Risk: Existing repository fallback behavior may mask DB issues if configuration is partial; runbook must make DB-path verification explicit.
- Limitation: This quick-spec does not solve GitHub CI DB provisioning/execution; it records a follow-up open question only.
- Follow-up question for separate workflow: Can CI reliably provision PostgreSQL service and run migrations/seeds before lint/type/test/build stages?
- Seed Data Contract (must remain stable unless tests are updated in the same change): `client-sunrise-yoga`, `client-otter-coffee`, `package-brand-launch`, `package-content-sprint`.

## Review Notes

- Adversarial review completed
- Findings: 3 total, 3 fixed, 0 skipped
- Resolution approach: auto-fix
