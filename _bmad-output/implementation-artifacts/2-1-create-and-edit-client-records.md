# Story 2.1: Create and Edit Client Records

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a studio owner,
I want to create and update client records,
so that my quote and invoice workflows start with accurate client information.

## Acceptance Criteria

1. **Given** the user opens the client creation flow **When** valid client details are entered and saved **Then** a new client record is persisted successfully **And** the user receives explicit confirmation that the client is ready for future quote and invoice use.

2. **Given** an existing client record is opened **When** the user updates client details and saves changes **Then** the revised client information is persisted **And** subsequent workflows can use the latest saved values.

3. **Given** required client information is missing or invalid **When** the user attempts to save the client form **Then** inline validation identifies the specific fields that need correction **And** already entered values remain available for correction.

4. **Given** the client form is used in supported browsers and keyboard navigation **When** the user moves through fields, actions, and validation states **Then** the interaction remains accessible and usable **And** focus, labels, and error messaging remain clear.

## Tasks / Subtasks

- [x] Task 1: Define client domain schema and persistence boundaries (AC: #1, #2)
  - [x] 1.1 Add or complete `clients` table schema in `src/server/db/schema/clients.ts` with lifecycle fields and studio scoping (`created_at`, `updated_at`, ownership foreign key)
  - [x] 1.2 Export schema from `src/server/db/schema/index.ts` and generate Drizzle migration(s)
  - [x] 1.3 Ensure required constraints/indexes for reliable lookup and editing workflows (studio scoping + stable list ordering)

- [x] Task 2: Implement server-side create and update actions with validation (AC: #1, #2, #3)
  - [x] 2.1 Create/complete `src/features/clients/server/actions/create-client.ts` and `src/features/clients/server/actions/update-client.ts`
  - [x] 2.2 Enforce authentication/authorization before mutation using existing session and permission helpers
  - [x] 2.3 Return standardized action envelopes (`ok/data` or `ok/error`) with field-level validation errors
  - [x] 2.4 Revalidate affected client list/detail surfaces after successful writes

- [x] Task 3: Build and wire client form UX for create/edit flows (AC: #1, #2, #3, #4)
  - [x] 3.1 Implement `src/features/clients/components/client-form.tsx` for both create and edit modes
  - [x] 3.2 Wire create route `src/app/(workspace)/clients/new/page.tsx` and edit/detail route `src/app/(workspace)/clients/[clientId]/page.tsx`
  - [x] 3.3 Show explicit success and failure feedback on save attempts; do not allow ambiguous save states
  - [x] 3.4 Preserve entered values on validation failures and support safe retry

- [x] Task 4: Support accessible keyboard-first interaction and robust validation feedback (AC: #3, #4)
  - [x] 4.1 Add `src/features/clients/schemas/client-schema.ts` (or complete existing) with required fields and normalization rules
  - [x] 4.2 Map schema validation errors to inline per-field guidance and set `aria-invalid` only after validation attempts
  - [x] 4.3 Ensure persistent labels, logical tab order, visible focus states, and descriptive submit actions

- [x] Task 5: Verify quality gates and regression safety (AC: #1-#4)
  - [x] 5.1 Add/extend unit tests for schema validation and server action result mapping
  - [x] 5.2 Add integration tests for create/update persistence, authz denial, and error envelope shape
  - [x] 5.3 Add e2e checks for create client, edit client, invalid submission recovery, and keyboard-only completion
  - [x] 5.4 Verify `npm run lint`, `npm run test`, and `npm run build` pass

## Dev Notes

### Developer Context Section

- This is the first story in Epic 2, so it establishes the implementation baseline for all client-linked quote and invoice workflows.
- Keep client data model narrow and stable: this story should create a trustworthy client source record, not full CRM expansion.
- Build for continuity: created/edited client data must be safe to consume by upcoming stories that open client detail context and quote association.

### Technical Requirements

- Enforce server-side authz for all client reads/writes; do not trust any client-side ownership or role assertions.
- Use Server Actions for authenticated create/update mutations and keep HTTP route handlers for explicit endpoint-only use cases.
- Validate external input with Zod before persistence and return field-aware errors for inline UX correction.
- Preserve action contract consistency:
  - Success: `{ ok: true, data }`
  - Failure: `{ ok: false, error: { code, message, fieldErrors? } }`
- Ensure saves and updates return explicit success/failure outcomes and avoid silent data loss behavior.

### Architecture Compliance

- Respect feature-first boundaries:
  - Route composition in `src/app/(workspace)/clients/*`
  - UI in `src/features/clients/components/*`
  - Validation in `src/features/clients/schemas/*`
  - Data access/mutations in `src/features/clients/server/*`
- Keep database naming snake_case at persistence boundaries and camelCase in application payloads.
- Reuse existing auth and permission primitives from Story 1.2/1.3 foundations instead of introducing alternate guard patterns.

### Library/Framework Requirements

- Use current project-approved stack and only upgrade when required by implementation constraints:
  - `next` `16.1.6` in project (latest researched: `16.1.7`)
  - `drizzle-orm` `0.45.1` (latest researched: `0.45.1`)
  - `drizzle-kit` `0.31.9` in architecture baseline (latest researched: `0.31.10`)
  - `zod` `4.3.6` (latest researched: `4.3.6`)
  - `next-auth` `4.24.13` and `@auth/core` `0.34.3` (latest researched: same)
  - `zustand` `5.0.11` in architecture baseline (latest researched: `5.0.12`) - not required for this story
  - `@sentry/nextjs` `10.43.0` in architecture baseline (latest researched: `10.44.0`) - no change required in this story

### File Structure Requirements

- Expected implementation touch points:
  - `src/app/(workspace)/clients/new/page.tsx`
  - `src/app/(workspace)/clients/[clientId]/page.tsx`
  - `src/features/clients/components/client-form.tsx`
  - `src/features/clients/schemas/client-schema.ts`
  - `src/features/clients/server/actions/create-client.ts`
  - `src/features/clients/server/actions/update-client.ts`
  - `src/features/clients/server/queries/list-clients.ts`
  - `src/features/clients/server/queries/get-client-by-id.ts`
  - `src/server/db/schema/clients.ts`
  - `src/server/db/schema/index.ts`
  - `drizzle/migrations/*`
- Keep file names kebab-case and co-locate unit/component tests with feature code.

### Testing Requirements

- Validate all AC paths explicitly:
  - successful client creation with confirmation feedback
  - successful client update with persisted latest values
  - inline validation errors with preserved in-progress input
  - keyboard navigation and clear focus/error semantics on supported browsers
- Add negative auth tests for unauthenticated/unauthorized write attempts.
- Include reliability checks aligned to NFR2/NFR7/NFR9 (save responsiveness, no silent loss, explicit state feedback).

### Latest Tech Information

- NPM registry checks confirm latest stable versions relevant to this story:
  - `next`: `16.1.7`
  - `drizzle-orm`: `0.45.1`
  - `drizzle-kit`: `0.31.10`
  - `zod`: `4.3.6`
  - `next-auth`: `4.24.13`
  - `@auth/core`: `0.34.3`
- Current story guidance: remain on architecture-pinned versions unless there is a concrete bug/security requirement to upgrade mid-epic.

### Project Context Reference

- No `project-context.md` found in repository. Use epics, PRD, architecture, UX specification, sprint status, and existing implementation artifacts as authoritative context.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.1] - canonical story statement and acceptance criteria
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 2] - cross-story context and downstream dependencies
- [Source: _bmad-output/planning-artifacts/prd.md#Functional Requirements] - FR5 and FR6 capability contract
- [Source: _bmad-output/planning-artifacts/prd.md#Non-Functional Requirements] - reliability, accessibility, and feedback quality expectations
- [Source: _bmad-output/planning-artifacts/architecture.md#Requirements to Structure Mapping] - client feature boundaries and route ownership
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules] - naming, response envelope, validation, and loading/error behavior standards
- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security] - deny-by-default authz requirements
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Form Patterns] - inline validation and preserved progress behavior
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Feedback Patterns] - explicit success/failure messaging expectations
- [Source: src/features/auth/require-session.ts] - authenticated access helper
- [Source: src/server/auth/permissions.ts] - authorization helper patterns
- [Source: src/lib/validation/action-result.ts] - action result envelope standard

## Dev Agent Record

### Agent Model Used

openai/gpt-5.3-codex

### Debug Log References

- create-story workflow execution
- `npm test -- src/features/clients/server/clients-repository.test.ts`
- `npm test -- src/features/clients/server/actions/create-client.test.ts src/features/clients/server/actions/update-client.test.ts`
- `npm test -- src/features/clients/schemas/client-schema.test.ts src/features/clients/components/client-form.test.tsx`
- `npm test -- tests/integration/clients/client-flow.test.ts`
- `npm run lint`
- `npm test`
- `npx playwright test tests/e2e/clients.spec.ts`
- `npx playwright test`
- `DATABASE_URL=postgresql://user:pass@localhost:5432/mento NEXTAUTH_SECRET=build-secret-value NEXTAUTH_URL=https://example.com STUDIO_OWNER_EMAIL=build@example.com STUDIO_OWNER_PASSWORD=build-password npm run build`

### Implementation Plan

- Add a studio-scoped client schema and repository boundary with database support plus a global fallback store for non-database environments.
- Route create/edit flows through authenticated server actions and a shared client form that shows explicit save outcomes and inline correction guidance.
- Validate the story with unit, integration, Playwright, lint, and build checks before moving the story to review.

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created
- Added the client schema, migration, repository, and fallback persistence path with studio scoping and stable ordering for list/edit workflows.
- Implemented authenticated create/update server actions plus create/edit client routes with explicit success or failure feedback and preserved retry state.
- Added unit, integration, and end-to-end coverage for validation, persistence, authorization denial, and keyboard-first interaction paths.

### File List

- _bmad-output/implementation-artifacts/2-1-create-and-edit-client-records.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
- drizzle/migrations/0001_clients.sql
- src/app/(workspace)/clients/[clientId]/page.tsx
- src/app/(workspace)/clients/new/page.tsx
- src/app/(workspace)/clients/page.tsx
- src/features/clients/components/client-form.test.tsx
- src/features/clients/components/client-form.tsx
- src/features/clients/schemas/client-schema.test.ts
- src/features/clients/schemas/client-schema.ts
- src/features/clients/server/actions/create-client.test.ts
- src/features/clients/server/actions/create-client.ts
- src/features/clients/server/actions/update-client.test.ts
- src/features/clients/server/actions/update-client.ts
- src/features/clients/server/clients-repository.test.ts
- src/features/clients/server/clients-repository.ts
- src/features/clients/server/queries/get-client-by-id.ts
- src/features/clients/server/queries/list-clients.ts
- src/features/clients/server/store/clients-store.ts
- src/features/clients/types.ts
- src/server/db/schema/clients.ts
- src/server/db/schema/index.ts
- tests/e2e/clients.spec.ts
- tests/integration/clients/client-flow.test.ts

## Senior Developer Review (AI)

**Review Date:** 2026-03-17
**Reviewer:** claude-sonnet-4-6
**Outcome:** Changes Requested → All Fixed → Approved

### Action Items

- [x] [High] `updateClientRecord` DB path missing `studio_id` WHERE filter — cross-studio update possible [`src/features/clients/server/clients-repository.ts:172`]
- [x] [High] `aria-invalid` set to `false` on initial render — should be absent until first submission attempt [`src/features/clients/components/client-form.tsx:144,165,186,207`]
- [x] [Medium] `client-fixtures.ts` orphaned dead code, not deleted and not in File List [`src/features/clients/server/queries/client-fixtures.ts`]
- [x] [Medium] Auth check ran after Zod validation in `createClient` and `updateClient` — violates architecture pattern [`src/features/clients/server/actions/create-client.ts:26`]
- [x] [Medium] No unit tests for `list-clients.ts` or `get-client-by-id.ts` query layer
- [x] [Medium] `createClientFromFormData` unused dead export [`src/features/clients/server/actions/create-client.ts:73`]
- [x] [Low] Drizzle migration meta/journal missing — `drizzle-kit` state tracking broken [`drizzle/migrations/meta/`]
- [x] [Low] `setNotice(successNotice)` in create mode fires before redirect — dead state update [`src/features/clients/components/client-form.tsx:107`]
- [x] [Low] "Back to clients" link on new client page missing focus ring [`src/app/(workspace)/clients/new/page.tsx:17`]
- [x] [Low] Double email `toLowerCase()` normalization in `toClientInput` + Zod chain [`src/features/clients/schemas/client-schema.ts:14`]

**All 10 findings fixed. 53 unit/integration tests pass. 8 e2e tests pass. Lint clean.**

## Change Log

- 2026-03-17: Implemented Story 2.1 with client schema and migration support, authenticated create/edit flows, accessible validation feedback, and regression coverage across unit, integration, Playwright, lint, and build checks.
- 2026-03-17: Code review (AI) — fixed 2 High, 4 Medium, 4 Low findings; all tests green; story marked done.
