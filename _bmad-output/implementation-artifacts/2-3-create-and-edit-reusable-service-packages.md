# Story 2.3: Create and Edit Reusable Service Packages

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a studio owner,
I want to create and update reusable service packages,
so that I can prepare quotes from repeatable commercial building blocks instead of starting from scratch.

## Acceptance Criteria

1. **Given** the user opens the service package creation flow **When** valid package information is entered and saved **Then** a reusable service package record is persisted successfully **And** it is available in the service package library for future quote workflows.

2. **Given** an existing service package is opened **When** the user edits package details and saves changes **Then** the updated service package is persisted **And** later quote generation can use the latest saved package definition.

3. **Given** required service package fields are incomplete or invalid **When** the user attempts to save the package **Then** inline validation identifies what must be corrected **And** in-progress values are preserved.

4. **Given** reusable service packages are a source record type **When** the user is viewing or editing a package **Then** the interface makes it clear that the package is reusable source content **And** later quote editing will occur on generated quote content rather than on the package itself.

## Tasks / Subtasks

- [x] Task 1: Define the service package domain shape and persistence baseline (AC: #1, #2, #4)
  - [x] 1.1 Add `src/features/service-packages/types.ts` with a stable input, record, and summary contract for reusable package metadata.
  - [x] 1.2 Add `src/features/service-packages/schemas/service-package-schema.ts` with normalized validation for the exact field contract this story owns: required `name`, required `category`, required `startingPriceLabel` (or a clearly equivalent lightweight pricing-guidance field), and at most one optional short summary field if it directly supports package-library and future picker clarity.
  - [x] 1.3 Add `src/server/db/schema/service-packages.ts`, export it from `src/server/db/schema/index.ts`, and generate a Drizzle migration for a studio-scoped `service_packages` table with lifecycle fields.
  - [x] 1.4 Keep the schema narrow to reusable package metadata; do not implement sections, line items, default content, or structured pricing in this story.

- [x] Task 2: Implement authenticated service package reads and writes with shared app contracts (AC: #1, #2, #3)
  - [x] 2.1 Add `src/features/service-packages/server/service-packages-repository.ts` plus a fallback in-memory store for non-database environments, mirroring the client and studio-defaults persistence pattern.
  - [x] 2.2 Replace fixture-only query behavior in `src/features/service-packages/server/queries/list-service-packages.ts` and `src/features/service-packages/server/queries/get-service-package-by-id.ts` with studio-scoped repository reads that still return the standard `ActionResult` envelope.
  - [x] 2.3 Add `src/features/service-packages/server/actions/create-service-package.ts` and `src/features/service-packages/server/actions/update-service-package.ts` with auth-first `requireSession()` and `ensureStudioAccess(...)` enforcement.
  - [x] 2.4 For update flows, load the existing package first, return a standard missing-record result if it does not exist, authorize against the persisted package `studioId`, and only then update through a studio-scoped repository path.
  - [x] 2.5 Revalidate affected list/detail paths after successful writes and return explicit success or failure states with field-level validation errors.

- [x] Task 3: Build create and edit package flows in the workspace (AC: #1, #2, #3, #4)
  - [x] 3.1 Add `src/features/service-packages/components/service-package-form.tsx` using the established controlled-input plus `useTransition` pattern from the client feature.
  - [x] 3.2 Add `src/app/(workspace)/service-packages/new/page.tsx` for create mode with a safe return path to the library.
  - [x] 3.3 Update `src/app/(workspace)/service-packages/[servicePackageId]/page.tsx` to become the edit/detail experience backed by the package form and a bound update action; missing records should continue to resolve with `notFound()`.
  - [x] 3.4 Mirror the current client UX flow: create redirects to the edit/detail page with a saved notice, edit stays in place with explicit success or failure feedback, and entered values stay available on invalid submit.
  - [x] 3.5 Update `src/app/(workspace)/service-packages/page.tsx` so `Create service package` routes to the new flow and existing library rows still reopen packages with preserved `backTo` context.

- [x] Task 4: Keep the reusable-source model explicit and future-safe (AC: #2, #4)
  - [x] 4.1 Use headings, helper copy, and save feedback that clearly distinguish reusable service packages from later quote-instance editing.
  - [x] 4.2 Preserve lightweight summary fields needed by the current library and future quote-selection workflows without overbuilding Story 2.4 behavior; if a short description is added, keep it optional and summary-oriented rather than turning this story into full package authoring.
  - [x] 4.3 Avoid dead-end or misleading UI states; if a downstream quote-generation action is not yet available, use explanatory copy rather than fake working CTAs.

- [x] Task 5: Verify accessibility, regression safety, and quality gates (AC: #1, #2, #3, #4)
  - [x] 5.1 Add unit tests for the service package schema, repository, queries, and server action result mapping.
  - [x] 5.2 Add component tests for create/edit rendering, inline validation, preserved values, and explicit reusable-source messaging.
  - [x] 5.3 Add an integration flow test in `tests/integration/service-packages/service-package-flow.test.ts` covering create, reopen, update, validation failure, and authz denial; create the package records inside the test rather than depending on today's fixture IDs.
  - [x] 5.4 Add Playwright coverage in `tests/e2e/service-packages.spec.ts` for create, edit, invalid submission recovery, and keyboard-only completion; create test data through the implemented flow rather than assuming fixture-backed persistence remains.
  - [x] 5.5 Verify `npm run lint`, `npm run test`, and `npm run build` pass.

## Dev Notes

### Developer Context Section

- Story 2.3 is the first real service-package implementation story in Epic 2. It should replace the current placeholder browse-only experience with authenticated, studio-scoped create and edit flows for reusable package records.
- Keep scope narrow and disciplined: this story creates and edits reusable package source records only. Story 2.4 owns sections, line items, default content, and pricing structure; Story 2.5 owns richer browsing and reopen patterns; Epic 3 owns quote generation from selected packages.
- The current app already has workspace navigation, a service package library route, a service package detail route, and fixture-backed query files. Reuse those paths and evolve them rather than inventing a new workflow shell or parallel package feature.
- The UI must make the source-record boundary obvious. Users should understand that service packages are reusable commercial definitions and that later quote editing happens on generated quote content, not on the service package itself.

### Technical Requirements

- Use Next.js Server Actions for authenticated create and update mutations; do not introduce new API routes for this story unless a real HTTP boundary is required.
- Enforce authentication and authorization before domain work begins by calling `requireSession()` and `ensureStudioAccess(...)` in every service package query and mutation path.
- Validate external input with Zod and return field-aware `ActionResult` errors:
  - Success: `{ ok: true, data }`
  - Failure: `{ ok: false, error: { code, message, fieldErrors? } }`
- Introduce a studio-scoped repository plus fallback store pattern like the client and studio-defaults features so create/edit flows work both with and without a configured database.
- Persist the exact MVP package field contract for this story: required `name`, required `category`, and required lightweight pricing guidance displayed in the current library/detail UI (`startingPriceLabel` or a clearly equivalent summary field). An optional `shortDescription` is acceptable only if it directly improves library and future picker clarity without expanding scope.
- Do not implement package sections, line items, or quote-generation payloads in this story. The persistence shape must leave a clean path for later `service_package_sections` and `service_package_line_items` work rather than collapsing future structure into an opaque blob prematurely.
- For update paths, load the existing package record first, return a standard not-found result if absent, authorize using the persisted record's `studioId`, and then update via the studio-scoped repository. Do not trust route access or client-submitted ownership data.
- Save outcomes must always be explicit, validation failures must preserve entered values, and the user must never be left in an ambiguous save state.

### Architecture Compliance

- Respect feature-first boundaries:
  - route composition in `src/app/(workspace)/service-packages/*`
  - service package UI in `src/features/service-packages/components/*`
  - validation in `src/features/service-packages/schemas/*`
  - data access and mutations in `src/features/service-packages/server/*`
- Keep database naming snake_case at persistence boundaries and camelCase in application-facing records and payloads.
- Preserve the server-first App Router pattern already used by clients: server route pages load package data, then hand interactive editing to a client form component.
- Reuse existing workspace protection and navigation patterns from `src/app/(workspace)/layout.tsx`, `src/proxy.ts`, and `src/components/app-shell/workspace-nav.tsx`; do not add parallel protection logic in the UI layer.
- Do not introduce Zustand, a new form framework, or a cross-feature global package state store. This story fits the existing controlled-form and local component state pattern.
- Keep service package logic feature-owned; do not push package-specific behaviors into shared `src/components` or unrelated quote modules.

### Library/Framework Requirements

- Use the current project-approved stack unless a concrete implementation bug or security issue requires a change:
  - `next` `16.1.6` in project (latest researched: `16.1.7`)
  - `react` and `react-dom` `19.2.3` in project (latest researched: `19.2.4`)
  - `next-auth` `4.24.13` and `@auth/core` `0.34.3`
  - `drizzle-orm` `0.45.1`
  - `drizzle-kit` `0.31.9` in project (latest researched: `0.31.10`)
  - `zod` `4.3.6`
  - `@playwright/test` `1.58.2`
  - `vitest` `4.1.0`
- Follow the existing Tailwind-based form and page styling patterns used in the client feature instead of introducing a new component library or styling system.
- Follow the existing controlled-input plus `useTransition` submission pattern from `src/features/clients/components/client-form.tsx`.

### File Structure Requirements

- Expected primary touch points:
  - `src/app/(workspace)/service-packages/page.tsx`
  - `src/app/(workspace)/service-packages/new/page.tsx`
  - `src/app/(workspace)/service-packages/[servicePackageId]/page.tsx`
  - `src/features/service-packages/components/service-package-form.tsx`
  - `src/features/service-packages/schemas/service-package-schema.ts`
  - `src/features/service-packages/types.ts`
  - `src/features/service-packages/server/actions/create-service-package.ts`
  - `src/features/service-packages/server/actions/update-service-package.ts`
  - `src/features/service-packages/server/service-packages-repository.ts`
  - `src/features/service-packages/server/store/service-packages-store.ts`
  - `src/features/service-packages/server/queries/list-service-packages.ts`
  - `src/features/service-packages/server/queries/get-service-package-by-id.ts`
  - `src/server/db/schema/service-packages.ts`
  - `src/server/db/schema/index.ts`
  - `drizzle/migrations/*`
- Preserve existing library/detail navigation conventions, including `backTo` query behavior for returning safely to the service package library.
- Keep file names kebab-case and co-locate feature unit/component tests with the feature code.
- For integration coverage, use a `.test.ts` file under `tests/integration/...` because the current Vitest config includes `tests/integration/**/*.test.ts` only.

### Testing Requirements

- Cover all acceptance-criteria paths explicitly:
  - successful package creation persists and returns the package to the library
  - successful package updates persist the latest saved definition
  - invalid or incomplete package input yields inline validation with preserved values
  - the create/edit experience clearly communicates that service packages are reusable source content
- Add negative tests for unauthenticated and unauthorized reads or writes so service package mutations cannot rely only on route protection.
- Add repository/query coverage for studio scoping, stable ordering, and missing-record handling.
- Add keyboard and accessibility checks for labels, focus order, descriptive submit actions, and reusable-source messaging.
- Keep reliability and explicit feedback aligned with NFR2, NFR7, and NFR9 by testing that saves return clear success/failure outcomes with no silent loss.
- Integration and e2e coverage should create their own service package data through the implemented flow instead of depending on the current fixture IDs, because this story replaces fixture-only behavior with repository-backed persistence.
- Verify `npm run lint`, `npm run test`, and `npm run build` pass.

### Previous Story Intelligence

- Story 2.2 reinforced the Epic 2 pattern of thin route composition, feature-owned server queries, shared empty/error feedback, and scope discipline around summary data rather than overbuilt cross-feature logic.
- Story 2.2 also highlighted that the current implementation still uses lightweight fixture-backed reads in places. For Story 2.3, evolve the existing service package paths carefully rather than bypassing them with a brand-new package subsystem.
- The broader Epic 2 implementation baseline from Story 2.1 is directly relevant here: use the same auth-first server action pattern, repository plus fallback store structure, `ActionResult` contract, explicit save feedback, and accessible form behavior rather than inventing a package-specific variation.
- Current service package fixtures only include `id`, `name`, `category`, and `startingPriceLabel`, so any richer package model added here must stay compatible with current library/detail needs while leaving room for Story 2.4's structured package content.
- The client feature already defines the safest create/edit interaction to copy: create redirects to the detail page with a saved notice, edit stays in place with inline success or failure messaging, and missing records resolve via `notFound()` from the route layer.

### Git Intelligence Summary

- Recent relevant implementation commit `ed09778` added the current Epic 2 client baseline: authenticated create/edit server actions, database plus fallback persistence, accessible controlled forms, integration tests, and Playwright coverage. Story 2.3 should mirror those patterns closely.
- Commit `d5abbe4` established the current protected workspace shell, auth/session hardening, and shared workspace feedback patterns. Reuse those conventions rather than creating alternate route protection or UI feedback systems.
- Foundation commit `f657ffd` established the current project conventions for environment handling, result envelopes, testing scripts, and App Router structure. Stay inside those conventions.
- Recent BMAD rollback commits are operational and not relevant to service package product implementation choices.

### Latest Tech Information

- Latest registry check results relevant to this story:
  - `next`: `16.1.7`
  - `react`: `19.2.4`
  - `react-dom`: `19.2.4`
  - `next-auth`: `4.24.13`
  - `@auth/core`: `0.34.3`
  - `drizzle-orm`: `0.45.1`
  - `drizzle-kit`: `0.31.10`
  - `zod`: `4.3.6`
  - `@playwright/test`: `1.58.2`
  - `vitest`: `4.1.0`
- Guidance for this story: remain on the architecture-pinned versions already in the repo unless a concrete bug or security requirement forces an upgrade mid-implementation.

### Project Context Reference

- No `project-context.md` exists in the repository.
- Treat the authoritative context for this story as the epics, PRD, architecture, UX specification, sprint status, and the current implementation under `src/app/(workspace)/service-packages`, `src/features/service-packages`, `src/features/clients`, and shared auth/result helpers.

### Project Structure Notes

- Current implementation already aligns with the architecture's feature-first routing for service packages: library and detail pages live under `src/app/(workspace)/service-packages`, and feature queries live under `src/features/service-packages/server/queries`.
- The repo does not yet implement real create/edit service package flows. The current `Create service package` buttons are inert, the detail page is read-only, and service package reads come only from fixtures.
- There is currently no service package form, schema, repository, fallback store, database schema, or migration. This story should introduce those missing pieces without replacing the existing library/detail entry points.
- The current fixture shape is intentionally lightweight. Evolve it into a persistent base service package record without prematurely absorbing Story 2.4's sections, line items, default content, or structured pricing responsibilities.
- Quote and invoice features are not yet consumers of service package persistence. Keep responsibilities clean so later Epic 3 quote selection and generation flows can read package summaries and definitions without inheriting package-edit UI logic.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.3] - canonical story statement and acceptance criteria
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 2] - cross-story context for client and service-package foundation work
- [Source: _bmad-output/planning-artifacts/prd.md#Service Package Library] - FR9 through FR13 scope and downstream quote-generation boundary
- [Source: _bmad-output/planning-artifacts/prd.md#Non-Functional Requirements] - save reliability, explicit feedback, accessibility, and performance guardrails
- [Source: _bmad-output/planning-artifacts/architecture.md#Requirements to Structure Mapping] - service package feature ownership and route boundaries
- [Source: _bmad-output/planning-artifacts/architecture.md#Architectural Boundaries] - server action, route, and feature-boundary rules
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules] - naming, response envelopes, validation, auth, and loading/error behavior standards
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries] - expected route, feature, and schema file placement
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Form Patterns] - inline validation, preserved progress, and structured editing expectations
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Feedback Patterns] - explicit success and failure messaging expectations
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Navigation Patterns] - workflow continuity and source-vs-instance clarity
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Service Package Picker] - downstream package-summary expectations for quote setup
- [Source: src/app/(workspace)/service-packages/page.tsx] - current library route and inert create CTA that this story should replace
- [Source: src/app/(workspace)/service-packages/[servicePackageId]/page.tsx] - current read-only detail route that should become the edit experience
- [Source: src/features/service-packages/server/queries/list-service-packages.ts] - current list-query contract and summary shape baseline
- [Source: src/features/service-packages/server/queries/get-service-package-by-id.ts] - current missing-record handling baseline
- [Source: src/features/service-packages/server/queries/service-package-fixtures.ts] - current service package fixture shape that this story must evolve carefully
- [Source: src/app/(workspace)/clients/new/page.tsx] - create-route composition pattern to mirror
- [Source: src/app/(workspace)/clients/[clientId]/page.tsx] - edit-route composition and `backTo` pattern to mirror
- [Source: src/features/clients/components/client-form.tsx] - controlled form, success/failure notice, and accessibility pattern to mirror
- [Source: src/features/clients/server/actions/create-client.ts] - auth-first server action and revalidation pattern to mirror
- [Source: src/features/clients/server/clients-repository.ts] - database plus fallback store pattern to mirror
- [Source: src/features/auth/require-session.ts] - authenticated-session helper
- [Source: src/server/auth/permissions.ts] - studio access enforcement helper
- [Source: src/lib/validation/action-result.ts] - standard result envelope
- [Source: src/components/app-shell/workspace-nav.tsx] - existing service package navigation behavior
- [Source: src/proxy.ts] - protected route coverage for `/service-packages`

## Dev Agent Record

### Implementation Plan

- Replace the fixture-only service-package read path with a repository-backed feature that mirrors the existing client and studio-defaults patterns.
- Keep the persistence shape intentionally narrow to reusable package metadata only so Story 2.4 can add structured package content later without unwinding this baseline.
- Reuse the client create/edit UX pattern for page composition, controlled form behavior, save notices, and path revalidation.
- Add unit, integration, and browser coverage before marking the story complete, including a production-safe build verification run.

### Agent Model Used

openai/gpt-5.4

### Debug Log References

- dev-story workflow execution
- `npx vitest run src/features/service-packages/schemas/service-package-schema.test.ts src/features/service-packages/server/service-packages-repository.test.ts src/features/service-packages/server/actions/create-service-package.test.ts src/features/service-packages/server/actions/update-service-package.test.ts src/features/service-packages/server/queries/list-service-packages.test.ts src/features/service-packages/server/queries/get-service-package-by-id.test.ts src/features/service-packages/components/service-package-form.test.tsx tests/integration/service-packages/service-package-flow.test.ts`
- `npm run test`
- `npm run lint`
- `NEXTAUTH_URL="https://mento-admin.test" STUDIO_OWNER_EMAIL="owner@mento.test" STUDIO_OWNER_PASSWORD="dev-password-override" npm run build`
- `npx playwright test`

### Completion Notes List

- Implemented the service-package metadata domain with shared types, Zod validation, a Drizzle schema, and a generated `service_packages` migration.
- Replaced fixture-only service-package reads with an auth-aware repository, in-memory fallback store, server actions, and standard `ActionResult` envelopes for list/detail/create/update flows.
- Added the reusable-source create/edit workspace experience with explicit source-record messaging, preserved invalid form input, saved notices, and working library navigation.
- Added unit, component, integration, and Playwright coverage for service-package creation, editing, validation recovery, authorization checks, and keyboard-only completion.
- Verified `npm run test`, `npm run lint`, and `npm run build` using production-safe `NEXTAUTH_URL` and `STUDIO_OWNER_*` overrides required by the repo's environment validation during build.

### File List

- _bmad-output/implementation-artifacts/2-3-create-and-edit-reusable-service-packages.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
- drizzle/migrations/0002_overjoyed_frightful_four.sql
- drizzle/migrations/meta/0002_snapshot.json
- drizzle/migrations/meta/_journal.json
- src/app/(workspace)/service-packages/[servicePackageId]/page.tsx
- src/app/(workspace)/service-packages/new/page.tsx
- src/app/(workspace)/service-packages/page.tsx
- src/features/service-packages/components/service-package-form.test.tsx
- src/features/service-packages/components/service-package-form.tsx
- src/features/service-packages/schemas/service-package-schema.test.ts
- src/features/service-packages/schemas/service-package-schema.ts
- src/features/service-packages/server/actions/create-service-package.test.ts
- src/features/service-packages/server/actions/create-service-package.ts
- src/features/service-packages/server/actions/update-service-package.test.ts
- src/features/service-packages/server/actions/update-service-package.ts
- src/features/service-packages/server/queries/get-service-package-by-id.test.ts
- src/features/service-packages/server/queries/get-service-package-by-id.ts
- src/features/service-packages/server/queries/list-service-packages.test.ts
- src/features/service-packages/server/queries/list-service-packages.ts
- src/features/service-packages/server/queries/service-package-fixtures.ts (deleted)
- src/features/service-packages/server/service-packages-repository.test.ts
- src/features/service-packages/server/service-packages-repository.ts
- src/features/service-packages/server/store/service-packages-store.ts
- src/features/service-packages/types.ts
- src/server/db/schema/index.ts
- src/server/db/schema/service-packages.ts
- tests/e2e/service-packages.spec.ts
- tests/integration/service-packages/service-package-flow.test.ts

## Change Log

- 2026-03-18: Implemented Story 2.3 by replacing fixture-only service-package pages with repository-backed create/edit flows, adding service-package persistence and tests across Vitest and Playwright, and updating sprint tracking from ready-for-dev to review.
- 2026-03-18: Applied code-review fixes: removed dead getServicePackageByIdForStudio export, fixed vitest config to pick up .test.tsx integration tests, updated navigation-reopen test with proper auth mocks, rewrote e2e edit test to use direct navigation, added focus-visible to detail back link, fixed aria-describedby chaining on textarea during error state, added text-zinc-900 to input and textarea field class names in both client-form and service-package-form. All 85 Vitest tests and 12 Playwright tests pass.
