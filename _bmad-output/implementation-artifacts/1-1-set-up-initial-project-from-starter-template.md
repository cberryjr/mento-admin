# Story 1.1: Set Up Initial Project from Starter Template

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a studio owner,
I want the product initialized with a working application foundation and automated quality checks,
So that I can reliably access and evolve the workspace on a safe baseline.

## Acceptance Criteria

1. **Given** the project has not yet been initialized **When** the foundation story is implemented **Then** the application is created with the approved Next.js starter using TypeScript, App Router, Tailwind CSS, ESLint, `src/` layout, and the `@/*` import alias **And** dependencies are installed and the repository includes baseline configuration for local, preview, and production environments.

2. **Given** the foundation is in place **When** a change is proposed for the application **Then** a GitHub Actions workflow runs lint, type checks, test commands, and build verification automatically **And** failures block the change from being treated as deployment-ready.

3. **Given** the application is deployed to the target platform **When** a preview or production environment starts **Then** environment configuration is read through centralized validation **And** a health-check endpoint or equivalent deployment verification path confirms the app is running.

4. **Given** the workspace will later store protected commercial records **When** the initial platform baseline is created **Then** Vercel-oriented deployment, managed PostgreSQL connectivity scaffolding, Sentry setup hooks, and test framework wiring are present at a baseline level **And** later stories can add feature-specific schema and auth behavior without replacing the foundation.

## Tasks / Subtasks

- [ ] Task 1: Initialize the Next.js project from the official starter (AC: #1)
  - [ ] 1.1 Run `npx create-next-app@latest mento-admin --ts --eslint --tailwind --app --src-dir --import-alias "@/*" --use-npm` from the parent directory of the workspace
  - [ ] 1.2 Verify the generated project compiles, starts locally, and the default page renders
  - [ ] 1.3 Confirm `package.json` has correct `name`, `scripts` include `dev`, `build`, `start`, `lint`
  - [ ] 1.4 Confirm the `src/` directory exists with `app/` subdirectory, `layout.tsx`, `page.tsx`, and `globals.css`
  - [ ] 1.5 Confirm `tsconfig.json` includes `"@/*"` path alias mapping to `"./src/*"`

- [ ] Task 2: Establish environment configuration with centralized validation (AC: #3)
  - [ ] 2.1 Create `src/lib/env.ts` with Zod-based environment variable validation
  - [ ] 2.2 Define environment variable schema covering: `DATABASE_URL` (required in production), `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `SENTRY_DSN` (optional), `RESEND_API_KEY` (optional), `NODE_ENV`
  - [ ] 2.3 Create `.env.example` documenting all expected variables with placeholder values
  - [ ] 2.4 Create `.env.local` (gitignored) with safe local development defaults
  - [ ] 2.5 Ensure `src/lib/env.ts` is importable and validates at startup; invalid config surfaces a clear error

- [ ] Task 3: Set up the CI pipeline with GitHub Actions (AC: #2)
  - [ ] 3.1 Create `.github/workflows/ci.yml` that triggers on push to `main` and on pull requests
  - [ ] 3.2 CI steps: checkout, setup Node.js 20.x, `npm ci`, `npm run lint`, `npx tsc --noEmit`, `npm test -- --passWithNoTests` (or equivalent), `npm run build`
  - [ ] 3.3 Ensure any step failure blocks the pipeline (exit code propagation)
  - [ ] 3.4 Verify the workflow YAML is valid and complete

- [ ] Task 4: Create the health-check endpoint (AC: #3)
  - [ ] 4.1 Create `src/app/api/health/route.ts` as a GET Route Handler
  - [ ] 4.2 Return `{ ok: true, timestamp: <ISO 8601> }` with status 200
  - [ ] 4.3 Follow the standard response envelope pattern: `{ ok: true, data: { status: "healthy", timestamp } }`

- [ ] Task 5: Install and configure baseline dependencies (AC: #4)
  - [ ] 5.1 Install Drizzle ORM (`drizzle-orm`) and Drizzle Kit (`drizzle-kit`) as dependencies
  - [ ] 5.2 Create `drizzle.config.ts` at project root with PostgreSQL driver config reading `DATABASE_URL` from env
  - [ ] 5.3 Create `src/server/db/index.ts` exporting a placeholder database client using `drizzle-orm/postgres-js` with `postgres` driver
  - [ ] 5.4 Create `src/server/db/schema/` directory with an empty barrel `index.ts`
  - [ ] 5.5 Create `drizzle/migrations/` directory (empty, ready for future migrations)
  - [ ] 5.6 Install `@sentry/nextjs` and create baseline Sentry config files: `sentry.client.config.ts`, `sentry.server.config.ts`, and `instrumentation.ts` (all reading from env, no-op if DSN is absent)
  - [ ] 5.7 Install Zod (`zod`) for validation
  - [ ] 5.8 Install `postgres` (the PostgreSQL driver for drizzle-orm/postgres-js)

- [ ] Task 6: Install and configure the test framework (AC: #2, #4)
  - [ ] 6.1 Install Vitest, `@testing-library/react`, `@testing-library/jest-dom`, and `jsdom` as dev dependencies
  - [ ] 6.2 Create `vitest.config.ts` at project root configured for `jsdom` environment, path aliases matching `tsconfig.json`, and `src/` as the test root
  - [ ] 6.3 Add `"test"` script to `package.json` pointing to `vitest run`
  - [ ] 6.4 Install Playwright (`@playwright/test`) as a dev dependency
  - [ ] 6.5 Create `playwright.config.ts` at project root with `baseURL` for local dev server, `webServer` config for automatic start, and `tests/e2e/` as the test directory
  - [ ] 6.6 Create `tests/e2e/` directory with a placeholder smoke test (e.g., verify the home page loads)
  - [ ] 6.7 Create `tests/integration/` and `tests/fixtures/` and `tests/helpers/` directories (empty, ready for later stories)
  - [ ] 6.8 Create a sample unit test co-located with source (e.g., `src/lib/env.test.ts`) that validates env parsing

- [ ] Task 7: Scaffold the baseline project structure (AC: #4)
  - [ ] 7.1 Create `src/lib/errors/` with `app-error.ts` and `error-codes.ts` stubs
  - [ ] 7.2 Create `src/lib/validation/action-result.ts` defining the `ActionResult<T>` type: `{ ok: true, data: T } | { ok: false, error: { code: string, message: string, fieldErrors?: Record<string, string[]> } }`
  - [ ] 7.3 Create `src/lib/utils/cn.ts` with a `cn()` helper using `clsx` + `tailwind-merge` (install both)
  - [ ] 7.4 Create `src/server/` subdirectories: `auth/`, `analytics/`, `email/`, `monitoring/`, `pdf/` (empty `index.ts` or placeholder files)
  - [ ] 7.5 Create `src/features/` directory (empty, ready for feature modules)
  - [ ] 7.6 Create `src/components/ui/` and `src/components/app-shell/` and `src/components/feedback/` directories (empty, ready for component implementation)
  - [ ] 7.7 Create `src/middleware.ts` as a placeholder exporting the Next.js middleware config with a `matcher` for `/(workspace)/(.*)` pattern (no auth logic yet -- that is Story 1.2)
  - [ ] 7.8 Create `src/app/not-found.tsx` with a simple 404 page
  - [ ] 7.9 Create `src/styles/tokens.css` as a placeholder for design tokens
  - [ ] 7.10 Install `clsx` and `tailwind-merge` as dependencies

- [ ] Task 8: Configure Vercel deployment baseline (AC: #3, #4)
  - [ ] 8.1 Ensure `next.config.ts` is present and exports valid config (starter provides this)
  - [ ] 8.2 Verify `.gitignore` covers `.env.local`, `.env*.local`, `node_modules/`, `.next/`, `out/`
  - [ ] 8.3 Confirm the project builds cleanly with `npm run build`
  - [ ] 8.4 Confirm the health endpoint works when running `npm run dev` locally

## Dev Notes

### Architecture Compliance

This story establishes the foundation that every subsequent story builds on. The developer MUST follow these architecture decisions exactly:

**Initialization command (exact, do not modify):**
```bash
npx create-next-app@latest mento-admin --ts --eslint --tailwind --app --src-dir --import-alias "@/*" --use-npm
```

**CRITICAL:** Since the workspace directory is already named `mento-admin`, you must either:
- Run the command from the parent directory (`/Users/serveradmin/workspace/repos/`) and let it create the `mento-admin/` folder, OR
- Run with `.` as the project name inside the existing directory if the starter supports it, OR
- Initialize in a temporary name and move files into the workspace root

The output must end up at the workspace root `/Users/serveradmin/workspace/repos/mento-admin/` with `package.json` at the root.

**Technology versions from architecture document:**
- Next.js: 16.1.6 (current via `create-next-app@latest`)
- Node.js: 20.9+ (use 20.x in CI)
- Drizzle ORM: 0.45.1
- Drizzle Kit: 0.31.9
- Zod: 4.3.6
- Auth.js / next-auth: 4.24.13 with @auth/core 0.34.3 (NOT installed in this story -- Story 1.2)
- Sentry: @sentry/nextjs 10.43.0
- Zustand: 5.0.11 (NOT installed in this story -- later stories)
- Resend: 6.9.3 (NOT installed in this story -- later stories)
- Vitest, @testing-library/react, Playwright (latest stable)

**Install specific versions where the architecture document specifies them:**
```bash
npm install drizzle-orm@0.45.1 zod@4.3.6 postgres @sentry/nextjs@10.43.0 clsx tailwind-merge
npm install -D drizzle-kit@0.31.9 vitest @testing-library/react @testing-library/jest-dom jsdom @playwright/test
```

### Naming Conventions

- Filenames: kebab-case (`env.ts`, `app-error.ts`, `action-result.ts`, `ci.yml`)
- Types/interfaces: PascalCase (`ActionResult`, `AppError`)
- Functions/variables: camelCase (`validateEnv`, `healthCheck`)
- Database naming: snake_case (not relevant yet but set the convention in schema stubs)
- Route handlers: follow Next.js App Router conventions (`route.ts` files)

### Project Structure Notes

The architecture document defines the complete project structure. This story creates the skeleton. Key directories:

```
mento-admin/
├── .env.example
├── .github/workflows/ci.yml
├── drizzle.config.ts
├── vitest.config.ts
├── playwright.config.ts
├── instrumentation.ts
├── sentry.client.config.ts
├── sentry.server.config.ts
├── drizzle/migrations/
├── tests/
│   ├── e2e/
│   ├── fixtures/
│   ├── helpers/
│   └── integration/
│       ├── api/
│       ├── db/
│       └── pdf/
└── src/
    ├── app/
    │   ├── api/health/route.ts
    │   ├── globals.css
    │   ├── layout.tsx
    │   ├── not-found.tsx
    │   └── page.tsx
    ├── components/
    │   ├── app-shell/
    │   ├── feedback/
    │   └── ui/
    ├── features/
    ├── lib/
    │   ├── env.ts
    │   ├── errors/
    │   │   ├── app-error.ts
    │   │   └── error-codes.ts
    │   ├── utils/cn.ts
    │   └── validation/action-result.ts
    ├── middleware.ts
    ├── server/
    │   ├── analytics/
    │   ├── auth/
    │   ├── db/
    │   │   ├── index.ts
    │   │   └── schema/index.ts
    │   ├── email/
    │   ├── monitoring/
    │   └── pdf/
    └── styles/tokens.css
```

**Do NOT create any files outside this structure.** Do NOT create feature-specific files yet (client forms, quote editors, etc.). Those belong to later stories.

### API Response Pattern

The health endpoint is the first route handler. It MUST follow the standard envelope:

```typescript
// Success response
{ ok: true, data: { status: "healthy", timestamp: "2026-03-15T12:00:00.000Z" } }
```

### Environment Validation Pattern

`src/lib/env.ts` should:
- Define a Zod schema for all expected environment variables
- Parse `process.env` through the schema
- Export the validated config object
- Throw a clear error with field-level detail if validation fails
- Handle optional variables gracefully (Sentry DSN, Resend key)

Example structure:
```typescript
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url().optional(), // Required in production
  NEXTAUTH_SECRET: z.string().min(1).optional(),
  NEXTAUTH_URL: z.string().url().optional(),
  SENTRY_DSN: z.string().url().optional(),
  RESEND_API_KEY: z.string().optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;
```

### CI Pipeline Requirements

`.github/workflows/ci.yml` must:
- Trigger on `push` to `main` and on `pull_request`
- Use Node.js 20.x
- Run `npm ci` (not `npm install`)
- Run lint: `npm run lint`
- Run type check: `npx tsc --noEmit`
- Run unit tests: `npm test` (Vitest)
- Run build: `npm run build`
- Each step must fail the pipeline independently

### Sentry Configuration

Sentry files should be safe no-ops when `SENTRY_DSN` is not set:
- `sentry.client.config.ts`: initialize Sentry client-side only if DSN exists
- `sentry.server.config.ts`: initialize Sentry server-side only if DSN exists
- `instrumentation.ts`: Next.js instrumentation hook that conditionally loads Sentry

### Things NOT to Do in This Story

- Do NOT implement authentication (Story 1.2)
- Do NOT create database schema tables (later stories)
- Do NOT run actual database migrations (later stories)
- Do NOT create UI components beyond the default page and 404 (Story 1.3+)
- Do NOT install next-auth, Zustand, or Resend (later stories)
- Do NOT create feature modules in `src/features/` (later stories)
- Do NOT add workspace navigation or layout chrome (Story 1.3)
- Do NOT hardcode any secrets or credentials
- Do NOT modify the `create-next-app` initialization flags

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Starter Template Evaluation] - initialization command and rationale
- [Source: _bmad-output/planning-artifacts/architecture.md#Core Architectural Decisions] - technology versions and stack decisions
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules] - naming, structure, format, and process patterns
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries] - complete directory tree and boundary rules
- [Source: _bmad-output/planning-artifacts/architecture.md#Architecture Validation Results] - implementation sequence priority
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.1] - acceptance criteria and user story
- [Source: _bmad-output/planning-artifacts/prd.md#Additional Requirements] - starter template requirement, runtime baseline, testing baseline
- [Source: _bmad-output/planning-artifacts/prd.md#Non-Functional Requirements] - performance, security, reliability targets

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
