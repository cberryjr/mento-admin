# Story 1.4: Manage Studio Defaults for Quote and Invoice Prefill

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a studio owner,
I want to maintain studio defaults for commercial documents,
so that new quotes and invoices start with the right business details and terms.

## Acceptance Criteria

1. **Given** an authenticated user opens the studio defaults area **When** the defaults form is displayed **Then** the form includes studio name, studio contact details, default quote terms, and default invoice payment instructions **And** fields are labeled clearly with accessible validation behavior.

2. **Given** valid defaults are entered **When** the user saves the form **Then** the defaults are persisted successfully **And** the user receives explicit confirmation that the saved defaults will prefill future quotes and invoices.

3. **Given** invalid or incomplete required input is submitted **When** save is attempted **Then** inline validation explains what must be corrected **And** previously entered progress is preserved.

4. **Given** saved defaults already exist **When** the user returns later to the defaults area **Then** the latest persisted values are loaded for review and editing **And** subsequent quote and invoice stories can consume those values as prefills.

## Tasks / Subtasks

- [x] Task 1: Define studio defaults data model and persistence boundaries (AC: #2, #4)
  - [x] 1.1 Add `studio_defaults` schema with required fields and lifecycle columns in `src/server/db/schema/studio-defaults.ts` and export from `src/server/db/schema/index.ts`
  - [x] 1.2 Add migration(s) via Drizzle Kit for `studio_defaults` and enforce uniqueness per studio/workspace scope
  - [x] 1.3 Implement query and mutation modules in `src/features/studio-defaults/server/queries/get-studio-defaults.ts` and `src/features/studio-defaults/server/actions/update-studio-defaults.ts`
  - [x] 1.4 Enforce server-side auth and studio scoping (`requireSession`, `ensureStudioAccess`) before read/write

- [x] Task 2: Build settings/defaults UI and form behavior (AC: #1, #2, #3, #4)
  - [x] 2.1 Implement workspace defaults route in `src/app/(workspace)/settings/page.tsx` using server-first loading
  - [x] 2.2 Build `src/features/studio-defaults/components/studio-defaults-form.tsx` with fields for studio name, studio contact details, default quote terms, and default invoice payment instructions
  - [x] 2.3 Wire form submit to server action with explicit pending/success/error states and non-destructive retry behavior
  - [x] 2.4 Ensure returning users see latest persisted defaults prefilled from server query

- [x] Task 3: Implement validation and accessibility guardrails (AC: #1, #3)
  - [x] 3.1 Add schema validation in `src/features/studio-defaults/schemas/studio-defaults-schema.ts` (required fields, safe string lengths, normalization)
  - [x] 3.2 Return field-level errors via standard action envelope and surface inline errors near each field
  - [x] 3.3 Use persistent labels, keyboard-reachable controls, and text-based error feedback (including `aria-invalid`/error association after failed validation)
  - [x] 3.4 Preserve user-entered values on validation failures; never clear form state on failed save

- [x] Task 4: Ensure integration readiness for downstream quote/invoice prefill (AC: #2, #4)
  - [x] 4.1 Expose a stable query result shape for quote/invoice features to consume studio defaults later
  - [x] 4.2 Add lightweight contract tests for successful fetch/save and validation failure envelopes
  - [x] 4.3 Document expected prefill fields and semantics in dev notes/comments only where boundary meaning is non-obvious

- [x] Task 5: Verify quality gates and regression safety (AC: #1-#4)
  - [x] 5.1 Add/extend unit tests for schema and action result mapping
  - [x] 5.2 Add integration tests for create/update/load defaults and authz denial path
  - [x] 5.3 Add e2e coverage for settings defaults form: load existing values, invalid submit, successful save, and reload persistence
  - [x] 5.4 Verify `npm run lint`, `npm run test`, and `npm run build` pass

## Dev Notes

### Developer Context Section

- This story establishes the reusable business-default source that later quote and invoice generation stories depend on for prefill behavior.
- Keep scope tight: one authenticated settings/defaults surface with durable persistence, clear validation, and explicit feedback.
- Preserve user confidence by avoiding silent failures or ambiguous save states; every submit must result in explicit success or actionable errors.

### Technical Requirements

- Enforce authenticated, studio-scoped access for all defaults reads/writes; do not trust client-side ownership assertions.
- Use server actions for authenticated mutations and keep route handlers for explicit HTTP-only boundaries.
- Keep action contracts consistent with project standard:
  - Success: `{ ok: true, data }`
  - Failure: `{ ok: false, error: { code, message, fieldErrors? } }`
- Validate at boundaries with Zod before persistence; map validation failures to field-level messages.
- Use ISO date serialization and camelCase payloads in app-facing contracts.

### Architecture Compliance

- Follow feature-first layout and keep route components thin:
  - UI composition in `src/app/(workspace)/settings/page.tsx`
  - Feature UI in `src/features/studio-defaults/components/*`
  - Validation in `src/features/studio-defaults/schemas/*`
  - Data access and mutations in `src/features/studio-defaults/server/*`
- Keep persistence modeling in `src/server/db/schema/*` with snake_case database naming conventions.
- Reuse existing auth/security boundaries from Story 1.2 and app shell/navigation context from Story 1.3.

### Library/Framework Requirements

- Current pinned project stack should be preserved unless a specific story need forces upgrade:
  - `next` `16.1.6` (latest available: `16.1.7`)
  - `zod` `4.3.6` (latest available: `4.3.6`)
  - `drizzle-orm` `0.45.1` and `drizzle-kit` `0.31.9`
  - `next-auth` `4.24.13` / `@auth/core` `0.34.3`
- Follow Next.js Server Functions/Server Actions guidance for form mutations, pending states, and post-mutation refresh/revalidation behavior.

### File Structure Requirements

- Expected implementation touch points:
  - `src/app/(workspace)/settings/page.tsx`
  - `src/features/studio-defaults/components/studio-defaults-form.tsx`
  - `src/features/studio-defaults/schemas/studio-defaults-schema.ts`
  - `src/features/studio-defaults/server/actions/update-studio-defaults.ts`
  - `src/features/studio-defaults/server/queries/get-studio-defaults.ts`
  - `src/server/db/schema/studio-defaults.ts`
  - `src/server/db/schema/index.ts`
  - `drizzle/migrations/*`
- Keep filenames kebab-case and colocate unit/component tests with feature code.

### Testing Requirements

- Validate AC coverage explicitly:
  - Form renders required defaults fields with accessible labels and validation behavior
  - Valid save persists and shows explicit success state
  - Invalid save returns inline field guidance while preserving entered values
  - Reload shows latest persisted defaults values
- Include authz negative tests (unauthenticated/unauthorized cannot read or mutate defaults).
- Include keyboard and accessibility checks aligned with WCAG 2.1 AA expectations for forms and validation messaging.

### Previous Story Intelligence

- Story 1.3 reinforced workspace structure and route orientation; settings should live under the same protected workspace shell conventions.
- Story 1.3 also codified explicit feedback and contract consistency; reuse the same result envelope and avoid ad hoc response shapes.
- Story 1.2 established auth/session/permission patterns that should be reused rather than rewritten.

### Git Intelligence Summary

- Recent commits established a stable foundation: auth scaffolding, environment validation, CI/testing baseline, and architecture-aligned folder layout.
- Extend existing placeholder structure (`src/features`, `src/server/db/schema`, workspace routes) rather than creating parallel patterns.
- Maintain existing quality gate expectations (`lint`, tests, build) as part of done criteria.

### Latest Tech Information

- Next.js docs (v16.1.7, updated 2026-03-16) emphasize Server Functions/Actions for form mutations with framework-native pending states and revalidation/refresh patterns.
- Current npm registry versions relevant to this story:
  - `next`: `16.1.7` latest (project uses `16.1.6`)
  - `zod`: `4.3.6` latest
  - `drizzle-orm`: `0.45.1` latest
  - `next-auth`: `4.24.13` latest
- MDN ARIA guidance: use `aria-invalid` and linked error messaging after validation attempts, not pre-emptively before submit.

### Project Context Reference

- No `project-context.md` found in repository. Use epics, PRD, architecture, UX spec, sprint status, and prior story artifacts as authoritative context.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.4] - canonical user story and acceptance criteria
- [Source: _bmad-output/planning-artifacts/architecture.md#Requirements to Structure Mapping] - workspace/settings and studio-defaults feature boundaries
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules] - naming, response envelope, validation, and error/loading standards
- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security] - deny-by-default and studio-scoped authz patterns
- [Source: _bmad-output/planning-artifacts/prd.md#Functional Requirements] - FR4 and workflow continuity expectations
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Form Patterns] - inline validation, preserved progress, and readable labels
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Feedback Patterns] - explicit success/failure feedback requirements
- [Source: src/features/auth/require-session.ts] - canonical authenticated session guard
- [Source: src/server/auth/permissions.ts] - studio access enforcement helpers
- [Source: src/lib/validation/action-result.ts] - action contract shape used across features
- [Source: https://nextjs.org/docs/app/getting-started/updating-data] - latest server actions guidance (version 16.1.7)
- [Source: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-invalid] - form validation accessibility semantics

## Dev Agent Record

### Agent Model Used

openai/gpt-5.3-codex

### Debug Log References

- create-story workflow execution
- `npm test` (red phase, expected failures)
- `npm test` (green phase)
- `npm run lint`
- `npm run build`
- `npx playwright test tests/e2e/settings-defaults.spec.ts`
- `npx playwright test`

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created
- Implemented studio defaults schema, migration SQL, query/action modules, and an authenticated settings page with accessible form validation and explicit save feedback.
- Added stable prefill contract shape for downstream quote/invoice workflows, including runtime fallback persistence when database connectivity is unavailable.
- Added and passed unit, integration, and end-to-end coverage for create/update/load/validation flows and protected route behavior.

### File List

- _bmad-output/implementation-artifacts/1-4-manage-studio-defaults-for-quote-and-invoice-prefill.md
- drizzle/migrations/0000_studio_defaults.sql
- src/app/(workspace)/settings/page.tsx
- src/components/app-shell/workspace-nav.tsx
- src/features/studio-defaults/components/studio-defaults-form.test.tsx
- src/features/studio-defaults/components/studio-defaults-form.tsx
- src/features/studio-defaults/schemas/studio-defaults-schema.test.ts
- src/features/studio-defaults/schemas/studio-defaults-schema.ts
- src/features/studio-defaults/server/actions/update-studio-defaults.test.ts
- src/features/studio-defaults/server/actions/update-studio-defaults.ts
- src/features/studio-defaults/server/queries/get-studio-defaults.test.ts
- src/features/studio-defaults/server/queries/get-studio-defaults.ts
- src/features/studio-defaults/server/store/studio-defaults-store.ts
- src/features/studio-defaults/server/studio-defaults-repository.ts
- src/features/studio-defaults/types.ts
- src/proxy.ts
- src/server/db/schema/index.ts
- src/server/db/schema/studio-defaults.ts
- tests/e2e/settings-defaults.spec.ts

## Change Log

- 2026-03-17: Implemented Story 1.4 end-to-end with schema/migration, authenticated defaults query+mutation, accessible settings form UX, stable prefill contract, and full regression coverage (unit/integration/e2e).
