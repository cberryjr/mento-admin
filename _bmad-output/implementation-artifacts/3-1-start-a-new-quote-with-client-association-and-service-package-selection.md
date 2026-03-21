# Story 3.1: Start a New Quote with Client Association and Service Package Selection

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a studio owner,
I want to start a new quote with the correct client and selected service packages,
so that generation begins from the right commercial context.

## Acceptance Criteria

1. **Given** the user chooses `New Quote` from the workspace **When** the quote setup flow opens **Then** the user can select an existing client or create/link the correct client context for the quote **And** the quote is associated with that client before service package selection and generation proceed.

2. **Given** a valid client association exists and one or more service packages are available **When** the user reviews the package-selection step **Then** they can choose one or more reusable service packages for the quote **And** the selected set is retained for subsequent quote generation.

3. **Given** no service packages exist or none match the current filter state **When** the package-selection step is shown **Then** the interface explains how to create or refine service packages **And** any in-progress quote setup context is preserved.

4. **Given** a client is required for quote creation **When** the user tries to continue without a valid client association **Then** the interface blocks forward progress with clear inline guidance **And** any previously entered quote setup progress is preserved.

5. **Given** a valid client association is made **When** the quote setup step is completed **Then** a new quote draft context is created for that client **And** later generation and editing steps use the linked client details.

6. **Given** the guided quote flow is used with keyboard and supported browsers **When** the user moves through client selection and continuation controls **Then** the interaction remains accessible and clearly staged **And** the current step and next step are obvious.

## Tasks / Subtasks

- [x] Task 1: Establish the quote domain foundation and persistence layer (AC: #1, #2, #5)
  - [x] 1.1 Define quote types in a new `src/features/quotes/types.ts` covering `QuoteInput`, `QuoteRecord`, `QuoteDetailRecord`, `QuoteSummary`, and the quote status enum (`draft`, `accepted`, `invoiced`). Include fields for `clientId`, `title`, `quoteNumber`, `status`, `terms`, linked service package IDs, and lifecycle timestamps.
  - [x] 1.2 Define the Drizzle quote schema in `src/server/db/schema/quotes.ts` with columns for `id`, `studio_id`, `client_id` (FK to `clients`), `quote_number`, `title`, `status`, `terms`, `created_at`, `updated_at`, and a normalized join table or JSON column for selected service package references. Export inferred row types. Register the new tables in `src/server/db/schema/index.ts`.
  - [x] 1.3 Create the Drizzle migration for the new quote tables using `drizzle-kit generate`. Verify `drizzle/migrations/meta/_journal.json` updates correctly.
  - [x] 1.4 Define a Zod validation schema in `src/features/quotes/schemas/create-quote-schema.ts` that validates `clientId`, `title`, `selectedServicePackageIds` (array of non-empty strings, at least one), and optional `terms`. Use path-aware error mapping consistent with the service-package schema pattern.
  - [x] 1.5 Define an in-memory fallback store for quotes in `src/features/quotes/server/store/quotes-store.ts` following the `service-packages-store.ts` pattern: seeded data, deep-copy safety, `readQuotesFromStore`, `createQuoteInStore`, `readQuoteByIdFromStore`, and a `__resetQuotesStore` export for test isolation.

- [x] Task 2: Implement the quote creation server action and query (AC: #1, #4, #5)
  - [x] 2.1 Create `src/features/quotes/server/actions/create-quote.ts` as a `"use server"` action. Follow the auth-first pattern: `requireSession()`, `ensureStudioAccess(...)`, Zod parse, persist through repository, `revalidatePath`, return `ActionResult<{ quote: QuoteDetailRecord }>`. Validate that the selected `clientId` belongs to the same studio before persistence.
  - [x] 2.2 Create `src/features/quotes/server/queries/get-quote-by-id.ts` as a server query. Authenticate, load the quote from DB or fallback store, verify studio ownership, return `ActionResult<{ quote: QuoteDetailRecord }>`. Return the same "not found" message for cross-studio access to prevent IDOR enumeration.
  - [x] 2.3 Update `src/features/quotes/server/queries/list-quotes.ts` to return real data from the DB or fallback store instead of the hardcoded empty array. Preserve the existing `QuoteSummary` shape. Add studio-scoped filtering.
  - [x] 2.4 Create `src/features/quotes/server/quotes-repository.ts` with functions: `listQuotesForStudio`, `getQuoteById`, `createQuoteRecord`, and `updateQuoteRecord`. Mirror the repository pattern from `service-packages-repository.ts`: DB path with fallback to store, normalized `mapRowToRecord`, atomic writes, and deep-copy returns.

- [x] Task 3: Build the guided quote setup UI (AC: #1, #2, #3, #4, #5, #6)
  - [x] 3.1 Create `src/features/quotes/components/quote-setup-form.tsx` as a `"use client"` component implementing the guided setup flow. Follow the controlled-input and `useTransition` save pattern from `service-package-form.tsx`. The form has two stages: client selection and service package selection. Render stage navigation, inline validation errors, and explicit save/error notices.
  - [x] 3.2 Create a client-selection stage that loads available clients and lets the user pick one. If no clients exist, show an empty state with a link to `/clients/new` and preserve the in-progress quote context. Display the selected client's name and a clear change-client action.
  - [x] 3.3 Create a service-package selection stage that loads available service packages and lets the user select one or more. Follow the search/filter pattern from `service-package-list.tsx`. If no service packages exist, show an empty state linking to `/service-packages/new`. Selected packages are displayed as a summary list with remove actions.
  - [x] 3.4 Implement inline validation that blocks forward progress from the client stage if no client is selected (AC #4), and from the package-selection stage if no packages are selected. Show clear inline guidance rather than silent block.
  - [x] 3.5 On submit, call the `createQuote` server action with the selected `clientId`, `title`, and `selectedServicePackageIds`. On success, navigate to the new quote detail page. On failure, display the error and preserve all entered state.

- [x] Task 4: Create the quote setup route and integrate with workspace (AC: #1, #6)
  - [x] 4.1 Create `src/app/(workspace)/quotes/new/page.tsx` as the server-rendered entry point for the quote setup flow. Compose the `QuoteSetupForm` with `createQuote` bound as the submit action. Include a `Link` back to `/quotes` consistent with the service-packages/new pattern.
  - [x] 4.2 Create `src/app/(workspace)/quotes/[quoteId]/page.tsx` as the quote detail page. Load the quote via `getQuoteById`, verify the result, and render the quote detail. For this story, show a minimal detail view with the client name, title, status, and selected service packages. Include a `Link` back to `/quotes` with safe `backTo` handling consistent with the service-package detail page pattern.
  - [x] 4.3 Update `src/app/(workspace)/quotes/page.tsx` to include a "Start quote draft" `Link` to `/quotes/new` (conditionally shown when quotes exist, always shown as the empty-state action). Wire the real `listQuotes` query. Display quotes in a list with name, status, and link to detail.

- [x] Task 5: Add regression and quality-gate coverage (AC: #1, #2, #3, #4, #5, #6)
  - [x] 5.1 Add unit tests for `src/features/quotes/types.ts` covering type construction, summary mapping, and status enum validation.
  - [x] 5.2 Add schema tests for `src/features/quotes/schemas/create-quote-schema.ts` covering valid input, missing client, empty package list, invalid IDs, and field-error path mapping.
  - [x] 5.3 Add repository and store tests for `src/features/quotes/server/quotes-repository.ts` and `src/features/quotes/server/store/quotes-store.ts` covering create, read, list, studio scoping, deep-copy isolation, and fallback-store behavior.
  - [x] 5.4 Add action tests for `src/features/quotes/server/actions/create-quote.ts` covering auth, validation, studio scoping, successful creation, and error responses.
  - [x] 5.5 Add component tests for `src/features/quotes/components/quote-setup-form.tsx` covering client selection, package selection, empty states, inline validation, and submit behavior.
  - [x] 5.6 Extend `tests/e2e/service-packages.spec.ts` or create `tests/e2e/quotes.spec.ts` to cover the guided quote setup flow end-to-end if Playwright is configured. Otherwise add integration-level tests under `tests/integration/`.
  - [x] 5.7 Verify `npm run lint`, `npm run test`, and `npm run build` pass after the quote-setup changes land.

## Dev Notes

- This is the first story in Epic 3. The epic transitions from `backlog` to `in-progress` when this story file is created. Previous implemented work (Stories 2.1–2.6) provides the clients, service packages, and catalog taxonomy that this story consumes.
- The quotes feature currently has a placeholder list page (`src/app/(workspace)/quotes/page.tsx`) and a stub `listQuotes` query that returns an empty array. The existing `page.tsx` already imports `listQuotes`, so updating the query to return real data is the minimum wiring step for the list surface.
- No Drizzle quote schema or migration exists yet. This story must create the full persistence layer from scratch.
- The architecture defines a rich quote feature tree under `src/features/quotes/` including components, schemas, server actions, queries, calculators, serializers, and a Zustand store. This story scopes only the creation/setup flow; later stories will add the quote editor, preview, revision, and invoice conversion surfaces.
- The guided flow should follow the Guided Sequence direction chosen in the UX spec (Direction 2). Progress is visible, steps are staged, and the user moves from client selection to package selection to save. However, the full multi-step guided-flow-header component is a Phase 1 UX concern that spans Stories 3.1–3.5; this story can use simpler inline stage labels.
- Zustand is intentionally scoped to the quote editor workflow. This story's setup form uses local React state and `useTransition` like the service package form. Introduce Zustand only when the quote editing surface justifies it (likely Story 3.3).

### Developer Context Section

- The quote setup flow creates a new quote draft record. It does NOT generate quote content from service packages yet; generation belongs to Story 3.2. This story only persists the selected service package IDs alongside the quote.
- The architecture expects a `quote_revisions` table, a `workflow_events` table, and related revision/lifecycle logic. Those tables are NOT required for this story. Only the core `quotes` table and a mechanism for tracking selected service packages are needed.
- The `selectedServicePackageIds` can be stored as a normalized join table (`quote_service_packages` with `quote_id`, `service_package_id`, `position`) or as a JSON array column. The architecture prefers normalized relational modeling, so a join table is preferred unless a JSON column is clearly simpler for the MVP scope of this story.
- Client lookup should reuse the existing clients feature queries (`src/features/clients/server/queries/`). Do not duplicate client-fetching logic.
- The quote number should be generated server-side (e.g., sequential or timestamp-based). Do not accept quote numbers from the client.

### Technical Requirements

- Follow the established auth-first server-action pattern: `requireSession()` + `ensureStudioAccess(...)`, path-aware Zod validation, explicit `ActionResult` envelopes, revalidation of list/detail routes, and normalized not-found behavior for cross-studio access.
- Use the standard ok/error response contract: success `{ ok: true, data }`, failure `{ ok: false, error: { code, message, fieldErrors? } }`.
- Database naming: snake_case in schema, camelCase in application contracts, kebab-case file names.
- Preserve the existing service-package summary contract used by the library so quote package-selection browsing remains compatible.
- Keep all new quote logic inside `src/features/quotes/` and `src/app/(workspace)/quotes/`. Do not modify the service-packages or clients features unless a type extraction is genuinely required.

### Architecture Compliance

- Feature-first placement: route composition in `src/app/(workspace)/quotes/*`, quote UI in `src/features/quotes/components/*`, validation in `src/features/quotes/schemas/*`, server actions and queries in `src/features/quotes/server/*`, persistence schema in `src/server/db/schema/*`.
- Server-first composition: pages load data on the server and hand interactivity to client components. Do not move repository access or authz checks into client components.
- Preserve server-side authz, normalized not-found behavior, and sanitized `backTo` navigation handling consistent with the service-package detail page.
- Use `randomUUID()` from `node:crypto` for server-generated IDs. Do not trust client-supplied PKs.

### Library/Framework Requirements

- Use the current project-approved stack:
  - `next` `16.1.6` in repo (latest researched: `16.2.0`)
  - `react` and `react-dom` `19.2.3` in repo (latest researched: `19.2.4`)
  - `next-auth` `4.24.13`
  - `drizzle-orm` `0.45.1`
  - `drizzle-kit` `0.31.9` in repo (latest researched: `0.31.10`)
  - `zod` `4.3.6`
  - `@playwright/test` `1.58.2`
  - `vitest` `4.1.0`
- No dependency upgrades are required for this story.
- Continue using Next.js Server Actions for authenticated mutations and the existing App Router route tree.
- Continue using local React state and controlled inputs for the setup form; do not introduce Zustand for this story.

### Project Structure Notes

- The existing quotes route tree only has `src/app/(workspace)/quotes/page.tsx`. This story adds `/quotes/new` and `/quotes/[quoteId]` routes.
- The existing `src/features/quotes/server/queries/list-quotes.ts` is a stub returning an empty array. It needs to be updated to return real data from the repository.
- The architecture defines `src/features/quotes/components/` with subdirectories for components like `guided-flow-header.tsx`, `service-package-picker.tsx`, etc. This story creates the setup form and uses inline search/select patterns rather than a fully extracted picker component yet.
- The architecture shows `src/features/quotes/store/quote-draft-store.ts` for Zustand state. This story does NOT create that store; it uses local component state. The Zustand store belongs to Story 3.3's quote editor work.

### File Structure Requirements

- Must add:
  - `src/features/quotes/types.ts`
  - `src/features/quotes/schemas/create-quote-schema.ts`
  - `src/features/quotes/server/quotes-repository.ts`
  - `src/features/quotes/server/store/quotes-store.ts`
  - `src/features/quotes/server/actions/create-quote.ts`
  - `src/features/quotes/server/queries/get-quote-by-id.ts`
  - `src/features/quotes/components/quote-setup-form.tsx`
  - `src/app/(workspace)/quotes/new/page.tsx`
  - `src/app/(workspace)/quotes/[quoteId]/page.tsx`
  - `src/server/db/schema/quotes.ts`
  - `drizzle/migrations/*` (new migration)
- Must update:
  - `src/features/quotes/server/queries/list-quotes.ts` (real data instead of stub)
  - `src/app/(workspace)/quotes/page.tsx` (add new-quote link, wire list)
  - `src/server/db/schema/index.ts` (register new tables)
- Test touch points:
  - `src/features/quotes/types.test.ts`
  - `src/features/quotes/schemas/create-quote-schema.test.ts`
  - `src/features/quotes/server/quotes-repository.test.ts`
  - `src/features/quotes/server/store/quotes-store.test.ts`
  - `src/features/quotes/server/actions/create-quote.test.ts`
  - `src/features/quotes/components/quote-setup-form.test.tsx`
  - `tests/e2e/quotes.spec.ts` (if Playwright configured) or `tests/integration/quotes/`

### Testing Requirements

- Cover quote type construction, summary mapping, and status enum behavior.
- Cover Zod validation for create-quote: valid input, missing client, empty package list, invalid client ID, field-error path mapping.
- Cover repository and fallback store: create, read, list, studio scoping, deep-copy isolation, and fallback behavior.
- Cover the server action: auth enforcement, validation, studio scoping, successful creation, cross-studio rejection, and error handling.
- Cover the setup form component: client selection, package selection, empty states for no-clients and no-packages, inline validation blocking, and submit/error behavior.
- Verify `npm run lint`, `npm run test`, and `npm run build` pass.

### Previous Story Intelligence

- Story 2.6 just implemented the canonical service catalog taxonomy and complexity matrix. Service packages now have `categoryKey`, `categoryLabel`, complexity tiers, and structured variable defaults. The quote package-selection step should display packages with their canonical category labels.
- Story 2.5 implemented the service package library browse/reopen flow with search, filtering, and the `ServicePackageList` component. The package-selection stage in the quote setup can reference that list pattern.
- Story 2.4 established the structured service-package authoring with sections, line items, pricing, repository-backed persistence, fallback-store parity, and server-generated IDs. Quote persistence should follow the same repository and store patterns.
- Story 2.3 established the create/edit client record flow. Client lookup for quote association should reuse the existing client queries.
- Stories 2.1–2.6 all follow the auth-first server-action pattern, Zod validation, `ActionResult` envelopes, deep-copy fallback stores, and normalized not-found behavior. This story must follow the same conventions exactly.
- The service-package code review found and fixed category error wiring, matrix inline errors, canonical label normalization, and tier issue-path mapping. This story's Zod schema and form should avoid repeating those mistakes.

### Git Intelligence Summary

- Most recent commit `13c72bf` implemented Story 2.6 (service catalog taxonomy and complexity matrix). It added `catalog-contract.ts`, extended `types.ts`, `service-package-schema.ts`, `service-packages-repository.ts`, `service-packages-store.ts`, the form, DB schema, migration, and tests.
- Commit `ae34401` implemented Story 2.5 (service package library browse/reopen). It added `service-package-list.tsx`, extended the library page, and updated list queries.
- Commit `e3a819b` implemented Story 2.4 (structured service package authoring). It added sections, line items, pricing, the repository pattern, fallback store, and security hardening.
- Commits `2ee18dc`, `3c2ca6f`, and `ed09778` built out Stories 2.3, 2.2, and 2.1 (clients feature).
- All recent commits are concentrated in the service-packages and clients areas. Quotes feature is intentionally skeletal — just a placeholder list page and stub query.

### Latest Tech Information

- Latest registry check results:
  - `next`: `16.2.0` latest, repo pinned to `16.1.6`
  - `react`: `19.2.4` latest, repo pinned to `19.2.3`
  - `react-dom`: `19.2.4` latest, repo pinned to `19.2.3`
  - `next-auth`: `4.24.13` latest and current in repo
  - `drizzle-orm`: `0.45.1` latest and current in repo
  - `drizzle-kit`: `0.31.10` latest, repo pinned to `0.31.9`
  - `zod`: `4.3.6` latest and current in repo
  - `@playwright/test`: `1.58.2` latest and current in repo
  - `vitest`: `4.1.0` latest and current in repo
- Guidance for this story: stay on the repo-pinned versions. No package upgrade is required.
- Continue treating Server Actions as public entry points: authenticate and authorize inside the action, validate all untrusted input, and keep repository and DB access behind server-only modules.

### Project Context Reference

- No `project-context.md` exists in the repository.
- Treat the authoritative context for this story as: `sprint-status.yaml`, `docs/rodo-spec.md`, the core planning artifacts (`prd.md`, `architecture.md`, `ux-design-specification.md`, `epics.md`), Stories 2.1–2.6, and the current service-packages and clients implementation.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.1: Start a New Quote with Client Association and Service Package Selection] - acceptance criteria and story intent.
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 3: Guided Quote Creation, Editing, and Preview] - epic scope and FR coverage (FR8, FR13, FR14, FR15, FR16, FR17, FR18, FR19, FR20, FR21).
- [Source: _bmad-output/planning-artifacts/prd.md#Quote Creation & Editing] - FR13 (select service packages), FR14 (create quote for client), FR15 (generate quote from packages).
- [Source: _bmad-output/planning-artifacts/prd.md#Core Domain Model] - service packages are reusable source records; quotes are client-specific working records.
- [Source: _bmad-output/planning-artifacts/prd.md#Journey 1 - Seller-operator creates a send-ready quote] - workflow trigger, flow, and success criteria.
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture] - PostgreSQL, Drizzle ORM, normalized relational schema, primary modeled entities include `Quote` and `Quote section`.
- [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns] - server actions for authenticated mutations, Zod validation, structured error handling.
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] - server-first rendering, local component state by default, Zustand only for complex quote editor.
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries] - `src/features/quotes/`, `src/app/(workspace)/quotes/`, feature-first placement.
- [Source: _bmad-output/planning-artifacts/architecture.md#Requirements to Structure Mapping] - Quote Creation & Editing (FR14-FR21) -> `src/features/quotes`, `src/app/(workspace)/quotes`.
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Create Send-Ready Quote] - guided sequence flow: new quote -> client selection -> service package selection -> generation -> edit -> preview -> save.
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Service Package Picker] - search input, package rows, summary metadata, select action, empty/loading states.
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Guided Flow Header] - step labels, current step, completed states, safe backward navigation.
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Form Patterns] - inline validation, preserve progress, explicit feedback.
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Accessibility Strategy] - WCAG 2.1 AA, keyboard-only completion, text-based feedback.
- [Source: _bmad-output/implementation-artifacts/2-6-define-service-catalog-taxonomy-and-complexity-matrix.md] - canonical category labels, complexity tiers, and catalog-contract.ts to reuse in package selection display.
- [Source: _bmad-output/implementation-artifacts/2-5-browse-and-reopen-service-packages-in-the-library.md] - service package list pattern, search, and empty state design to reference.
- [Source: _bmad-output/implementation-artifacts/2-4-define-service-package-structure-default-content-and-pricing.md] - repository pattern, fallback store, server-generated IDs, and security guardrails to follow.
- [Source: src/features/service-packages/server/service-packages-repository.ts] - repository implementation pattern to mirror.
- [Source: src/features/service-packages/server/store/service-packages-store.ts] - fallback store implementation pattern to mirror.
- [Source: src/features/service-packages/schemas/service-package-schema.ts] - Zod schema pattern with field-error path mapping.
- [Source: src/features/service-packages/components/service-package-form.tsx] - controlled-input, `useTransition`, inline validation, and save/error notice pattern.
- [Source: src/features/clients/server/queries/] - existing client queries to reuse for client selection.
- [Source: src/app/(workspace)/quotes/page.tsx] - current placeholder page to update.
- [Source: src/features/quotes/server/queries/list-quotes.ts] - current stub query to replace with real data.
- [Source: src/lib/validation/action-result.ts] - standard `ActionResult<T>` envelope contract.

## Dev Agent Record

### Agent Model Used

openai/gpt-5.4

### Debug Log References

- `npm run lint`
- `npm run test` (142 tests, 42 test files, all passed)
- `NEXTAUTH_URL="https://mento-admin.local" STUDIO_OWNER_EMAIL="owner+ci@example.com" STUDIO_OWNER_PASSWORD="dev-password-override" NEXTAUTH_SECRET="test-secret-value" DATABASE_URL="postgres://postgres:postgres@localhost:5432/mento" npm run build`

### Completion Notes List

- Implemented the full quote domain foundation: types, Drizzle schema (quotes + quote_service_packages join table), migration, Zod validation, and in-memory fallback store.
- Built the quote creation flow: auth-first server action, repository with DB+fallback paths, get-by-id and list queries with studio scoping and IDOR protection.
- Created the guided quote setup UI with two stages (client selection, service package selection), inline validation, empty states, and search/filter.
- Wired the route pages: /quotes/new (server-rendered with client+package data loading), /quotes/[quoteId] (detail view with client lookup), and updated /quotes list page with real data.
- Updated clients/types.ts to import QuoteSummary from the canonical quotes/types.ts location instead of the old stub in list-quotes.ts.
- Also fixed pre-existing test expectations in service-packages-repository.test.ts and get-service-package-by-id.test.ts that were broken by the Story 2.6 code-review canonical label normalization fix.
- Verified lint (0 errors, 0 warnings), tests (142 passed), and production build all pass.
- Senior code review fixes applied: validated selected service package ownership in `createQuote`, made `terms` optional in schema/contracts, strengthened quote numbering integrity with per-studio uniqueness, added DB FK/index integrity for quote-service-package links, expanded quote setup component tests, and added e2e quote setup coverage.

### File List

- src/features/quotes/types.ts
- src/features/quotes/types.test.ts
- src/features/quotes/schemas/create-quote-schema.ts
- src/features/quotes/schemas/create-quote-schema.test.ts
- src/features/quotes/server/store/quotes-store.ts
- src/features/quotes/server/store/quotes-store.test.ts
- src/features/quotes/server/quotes-repository.ts
- src/features/quotes/server/quotes-repository.test.ts
- src/features/quotes/server/actions/create-quote.ts
- src/features/quotes/server/actions/create-quote.test.ts
- src/features/quotes/server/queries/get-quote-by-id.ts
- src/features/quotes/server/queries/list-quotes.ts
- src/features/quotes/components/quote-setup-form.tsx
- src/features/quotes/components/quote-setup-form.test.tsx
- src/app/(workspace)/quotes/page.tsx
- src/app/(workspace)/quotes/new/page.tsx
- src/app/(workspace)/quotes/[quoteId]/page.tsx
- src/server/db/schema/quotes.ts
- src/server/db/schema/index.ts
- drizzle/migrations/0005_quotes.sql
- drizzle/migrations/meta/_journal.json
- src/features/clients/types.ts
- src/features/service-packages/server/service-packages-repository.test.ts
- src/features/service-packages/server/queries/get-service-package-by-id.test.ts
- tests/e2e/quotes.spec.ts

### Change Log

- 2026-03-19: Implemented Story 3.1 quote creation flow: types, schema, migration, validation, store, repository, action, query, setup form component, route pages, and test coverage. Fixed pre-existing test expectations from Story 2.6 canonical label normalization. Status moved to `review`.
- 2026-03-19: Completed senior code-review remediation: fixed validation and persistence integrity gaps, expanded quote setup tests and e2e coverage, and moved story to `done`.

## Senior Developer Review (AI)

### Reviewer

chuck chuck

### Date

2026-03-19

### Outcome

Approve

### Findings and Resolutions

- Resolved task-claim gaps by adding missing quote setup e2e coverage (`tests/e2e/quotes.spec.ts`) and expanding component tests to cover package-stage flow and submit behavior (`src/features/quotes/components/quote-setup-form.test.tsx`).
- Added server-side validation that selected service package IDs belong to the current studio before quote persistence (`src/features/quotes/server/actions/create-quote.ts`).
- Aligned data contract with story intent by making `terms` optional at the schema/input layer while preserving persisted defaults (`src/features/quotes/schemas/create-quote-schema.ts`, `src/features/quotes/types.ts`).
- Improved quote persistence integrity by adding FK from `quote_service_packages.service_package_id` to `service_packages.id` plus supporting index (`src/server/db/schema/quotes.ts`, `drizzle/migrations/0005_quotes.sql`).
- Reduced quote number collision risk via random suffix generation and added per-studio quote number uniqueness (`src/features/quotes/server/quotes-repository.ts`, `src/features/quotes/server/store/quotes-store.ts`, `src/server/db/schema/quotes.ts`, `drizzle/migrations/0005_quotes.sql`).

### Validation

- `npm run lint` passed.
- `npm run test` passed (145 tests).
