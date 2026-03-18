# Story 2.4: Define Service Package Structure, Default Content, and Pricing

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a studio owner,
I want to define sections, line items, default content, and pricing inside a service package,
so that generated quotes begin from a realistic commercial structure.

## Acceptance Criteria

1. **Given** a service package is being created or edited **When** the user adds sections and line items **Then** the package stores the defined structure successfully **And** the section and line-item hierarchy can be reviewed when the package is reopened.

2. **Given** the user enters default descriptive content and pricing guidance for package elements **When** the package is saved **Then** those defaults are persisted as part of the service package **And** they are available to later quote-generation stories.

3. **Given** the user needs to revise package structure **When** sections or line items are updated **Then** the changes are saved without corrupting the rest of the package definition **And** the updated package remains reusable.

4. **Given** the package editor includes structured and priced content **When** totals or structured defaults change **Then** the interface provides clear, accessible feedback about the saved structure **And** the editing experience remains usable on supported desktop and tablet breakpoints.

## Tasks / Subtasks

- [ ] Task 1: Establish the canonical structured service-package contract and persistence model (AC: #1, #2, #3)
  - [ ] 1.1 Add `src/features/service-packages/types.ts` with stable summary, detail, section, line-item, and input contracts that preserve current library fields (`name`, `category`, `startingPriceLabel`) while adding reusable structure, default content, pricing guidance, and ordering metadata.
  - [ ] 1.2 Lock down the minimum nested contract explicitly: each section must include a stable `id`, `title`, optional `defaultContent`, and `position`; each line item must include a stable `id`, `sectionId`, `name`, optional `defaultContent`, `quantity`, optional `unitLabel`, `unitPriceCents`, and `position`; package totals and `startingPriceLabel` should be derived from those structured line items rather than stored as unrelated display-only text.
  - [ ] 1.3 Add `src/features/service-packages/schemas/service-package-schema.ts` with nested Zod schemas for package metadata, sections, and line items; use path-aware validation output that the UI can map back to nested fields.
  - [ ] 1.4 Add or extend `src/server/db/schema/service-packages.ts` and `src/server/db/schema/index.ts` so the database can persist `service_packages`, `service_package_sections`, and `service_package_line_items` with studio scoping, stable order fields, default content fields, deterministic pricing data, and lifecycle timestamps.
  - [ ] 1.5 Generate the matching Drizzle migration and fallback in-memory store shape without collapsing structured package data into an opaque blob that would block later quote-generation work.

- [ ] Task 2: Implement authenticated repository, query, and mutation support for structured packages (AC: #1, #2, #3)
  - [ ] 2.1 Add `src/features/service-packages/server/service-packages-repository.ts` plus `src/features/service-packages/server/store/service-packages-store.ts` to load and save package summaries and full nested package definitions in a studio-scoped way.
  - [ ] 2.2 Replace fixture-only behavior in `src/features/service-packages/server/queries/list-service-packages.ts` and `src/features/service-packages/server/queries/get-service-package-by-id.ts` with repository-backed reads that return library-safe summaries and full editor detail data.
  - [ ] 2.3 Add `src/features/service-packages/server/actions/create-service-package.ts` and `src/features/service-packages/server/actions/update-service-package.ts` with `requireSession()`, `ensureStudioAccess(...)`, nested validation, revalidation of list/detail paths, and explicit success or failure envelopes.
  - [ ] 2.4 For updates, load the persisted package first, authorize against its `studioId`, and replace or reconcile nested sections and line items inside a single transaction so partial edits cannot corrupt sibling content.
  - [ ] 2.5 Keep the library-facing `startingPriceLabel` aligned with structured pricing data by deriving or reliably synchronizing the summary value whenever package pricing changes.

- [ ] Task 3: Build the structured package editor in the workspace routes (AC: #1, #2, #3, #4)
  - [ ] 3.1 Add `src/features/service-packages/components/service-package-form.tsx` using the current controlled-input plus `useTransition` pattern, extended for nested sections and line items with add, edit, remove, and reorder interactions.
  - [ ] 3.2 Use stable client-side row identity for unsaved sections and line items (temporary IDs or equivalent). Do not rely on array indexes for React keys, reorder behavior, or nested validation/error mapping.
  - [ ] 3.3 Add `src/app/(workspace)/service-packages/new/page.tsx` and evolve `src/app/(workspace)/service-packages/[servicePackageId]/page.tsx` into the create/edit experience backed by the new structured form and bound server actions.
  - [ ] 3.4 Update `src/app/(workspace)/service-packages/page.tsx` so `Create service package` routes into the create flow and existing library rows still reopen packages with preserved `backTo` context.
  - [ ] 3.5 Surface section totals or package pricing summaries immediately in the editor when structured pricing changes, and keep save feedback explicit, accessible, and consistent with the rest of the workspace.
  - [ ] 3.6 Make the reusable-source boundary obvious through headings, helper copy, and status messaging so users understand they are editing reusable package content, not a client-specific quote instance.

- [ ] Task 4: Protect downstream quote-generation compatibility while keeping scope disciplined (AC: #2, #3, #4)
  - [ ] 4.1 Keep Story 2.4 focused on reusable service-package authoring only; do not implement quote generation, quote-instance editing, taxonomy management, or package-library filtering in this story.
  - [ ] 4.2 Store package structure and pricing in a deterministic format that later Epic 3 quote-generation work can map into quote sections, line items, and initial pricing guidance without reinterpreting formatted strings.
  - [ ] 4.3 Preserve the current library summary behavior while leaving room for Story 2.5 browsing improvements and Epic 3 package-selection flows.
  - [ ] 4.4 If the Story 2.3 create/edit baseline is still missing in the current branch, implement that missing enabling work as part of this story rather than layering structured editing on top of fixture-only pages.

- [ ] Task 5: Verify regression safety, accessibility, and quality gates (AC: #1, #2, #3, #4)
  - [ ] 5.1 Add unit tests for the nested service-package schema, repository transaction behavior, list/detail queries, and server-action result mapping.
  - [ ] 5.2 Add component tests for nested editor rendering, inline validation, preserved values, add/remove/reorder behavior, explicit reusable-source messaging, and pricing-summary feedback.
  - [ ] 5.3 Add an integration flow test in `tests/integration/service-packages/service-package-flow.test.ts` covering create, reopen, update, authz denial, and no-corruption regression checks across sections and line items.
  - [ ] 5.4 Add Playwright coverage in `tests/e2e/service-packages.spec.ts` for structured package creation/editing, keyboard-only completion, saved feedback, and tablet-safe layout behavior; update existing workspace navigation tests if they currently depend on fixture IDs.
  - [ ] 5.5 Verify `npm run lint`, `npm run test`, and `npm run build` pass.

## Dev Notes

### Developer Context Section

- Story 2.4 is the structural service-package story in Epic 2. It turns service packages from flat reusable metadata into the reusable source model that later quote-generation stories will consume.
- The current repository state still reflects pre-2.3 service-package placeholders: the library and detail pages are fixture-backed and read-only, and there is no package form, repository, store, DB schema, or server action path yet. Treat the missing Story 2.3 baseline as required enabling work before structured editing can succeed.
- Keep the source-vs-instance boundary explicit. Service packages own reusable sections, line items, default content, and pricing guidance; quote and invoice records remain downstream client-specific working records and must not write back into the package source.
- Preserve the existing workspace tone and navigation model. The structured package editor should feel like a deliberate, calm authoring surface for reusable commercial building blocks, not a generic spreadsheet or a quote editor clone.

### Technical Requirements

- Use Next.js Server Actions for create and update mutations; do not introduce new API routes for this story unless a real HTTP boundary becomes unavoidable.
- Enforce authentication and authorization before domain work begins by calling `requireSession()` and `ensureStudioAccess(...)` in every service-package query and mutation path.
- Validate the full nested payload with Zod and return explicit `ActionResult` failures. Because the package editor is nested, do not rely on shallow `flatten().fieldErrors` alone; map issue paths into stable field keys the form can attach to section and line-item controls.
- Lock the nested package model to the minimum reusable contract this story needs: section `id`, `title`, optional `defaultContent`, `position`; line-item `id`, `sectionId`, `name`, optional `defaultContent`, `quantity`, optional `unitLabel`, `unitPriceCents`, `position`. Do not let the implementation invent incompatible shapes for pricing or hierarchy.
- Persist package, section, and line-item writes atomically. Use a single repository save path and Drizzle transaction boundaries so updates cannot partially save a parent record while leaving nested children stale or missing.
- Store pricing guidance in a deterministic machine-consumable shape that later quote generation can reuse directly. Do not store line-item pricing only as formatted display strings; keep numeric pricing data plus whatever lightweight summary label the library needs, and derive package totals / `startingPriceLabel` from the structured line items.
- Preserve stable ordering for sections and line items on create, reorder, reopen, and update flows so later quote generation and editor re-entry see the same structure the user saved.
- Use stable identifiers for unsaved nested rows in client state. Do not use array indexes as React keys or as the only identity for reorder and validation behavior.
- The fallback in-memory store must deep-copy nested package data on read and write so one test or request cannot mutate shared nested references accidentally.
- Save outcomes must always be explicit, validation failures must preserve entered values, and the user must never be left in an ambiguous save state when structure or pricing changes fail.

### Architecture Compliance

- Respect feature-first boundaries:
  - route composition in `src/app/(workspace)/service-packages/*`
  - service-package UI in `src/features/service-packages/components/*`
  - validation in `src/features/service-packages/schemas/*`
  - data access and mutations in `src/features/service-packages/server/*`
  - persistence tables exported from `src/server/db/schema/*`
- Keep database naming snake_case at persistence boundaries and camelCase in application-facing records, payloads, and form state.
- Preserve the current server-first App Router pattern: route pages load package data and pass interactive editing to a client form component rather than moving data access into the UI layer.
- Reuse existing workspace protection and navigation behavior from `src/proxy.ts` and `src/components/app-shell/workspace-nav.tsx`; do not add parallel route-protection logic inside service-package components.
- Use the shared `ActionResult` success/error contract and explicit local async state naming (`isPending`, save notices, field errors) instead of inventing a package-specific response shape.
- Do not introduce Zustand, a new form library, or cross-feature global package state. This story fits the existing local component state and controlled-input model.
- Keep quote-generation and invoice logic out of this story. The service-package feature should expose reusable source data, not take ownership of downstream quote-instance behavior.

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
- Treat Server Actions as public POST entry points. Re-authorize inside the action, validate all untrusted input, and keep repository access behind a server-only boundary.
- Use React local form state for nested editing and submit one normalized payload on save rather than trying to persist every section or line-item edit independently.
- Use Drizzle transactions for multi-table save flows and `.returning()` to recover inserted IDs cleanly when sections and line items are created together.
- Use Zod nested object and array schemas plus issue-path handling for section and line-item validation; nested editor errors will need more structure than the flat client form currently uses.
- Follow existing Tailwind-based workspace styling patterns instead of introducing a new component library or design system variation for the package editor.

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
- Preserve the existing list/detail entry points and `backTo` query behavior rather than creating a parallel service-package route tree.
- Keep file names kebab-case and co-locate feature unit/component tests with the service-package feature.
- If schema growth requires separate section and line-item table exports, keep them grouped with the service-package schema boundary rather than scattering them into unrelated files or generic helpers.
- Update or retire `src/features/service-packages/server/queries/service-package-fixtures.ts` carefully so workspace navigation tests continue to have deterministic data or are migrated to create their own records explicitly.

### Testing Requirements

- Cover all acceptance-criteria paths explicitly:
  - successful package creation persists section and line-item hierarchy
  - successful reopen shows saved structure and pricing guidance intact
  - updates to one section or line item do not corrupt sibling content
  - pricing and default-content edits produce clear saved feedback
- Add negative tests for unauthenticated and unauthorized reads or writes so service-package mutations cannot rely only on route protection.
- Add regression tests for stable ordering across create, reorder, reopen, and update flows.
- Add validation tests for nested section and line-item errors, including preserved form values after failed submit.
- Add explicit tests for stable nested identity so reorder, remove, and validation-message targeting continue to work after rows move.
- Add accessibility checks for labels, keyboard-only add/remove/reorder alternatives, visible focus states, descriptive save actions, and text-based status feedback that does not rely on color alone.
- Update `tests/integration/workspace/navigation-reopen.test.tsx` and `tests/e2e/workspace-navigation.spec.ts` if they currently depend on fixture-only package IDs or read-only detail behavior.
- Keep reliability and explicit feedback aligned with NFR2, NFR7, NFR9, and NFR11 by testing for explicit outcomes and no silent data loss.
- Verify `npm run lint`, `npm run test`, `npm run build`, and targeted Playwright coverage pass; if no dedicated script exists, run `npx playwright test tests/e2e/service-packages.spec.ts tests/e2e/workspace-navigation.spec.ts` or the equivalent command that executes the new and updated browser flows.

### Previous Story Intelligence

- Story 2.3 already captured the intended baseline for this feature area: authenticated service-package create/edit flows should mirror the client feature's server-action, repository, fallback-store, and accessibility patterns rather than inventing a package-specific architecture.
- The repo has not actually implemented that 2.3 baseline yet. Current service-package pages are still fixture-backed and read-only, so Story 2.4 must either land on top of freshly added 2.3 enabling work or explicitly include that work before structured authoring begins.
- Story 2.3 also preserved a lightweight library summary contract (`name`, `category`, `startingPriceLabel`) for browse and future picker flows. Keep that summary available while adding richer structured package detail behind the editor and detail query path.
- Story 2.2 reinforced the pattern of thin route composition, feature-owned queries, shared feedback components, and disciplined scope boundaries. Reuse those patterns here instead of turning service packages into a special-case workflow shell.
- The safest create/edit interaction pattern in the current codebase still comes from the client feature: create routes redirect into the detail page with a saved notice, edit flows stay in place with explicit success or failure feedback, and missing records resolve through the route layer with `notFound()`.
- Because the Story 2.3 baseline is missing in code, the safest implementation order is: land repository-backed create/edit foundations first, then layer nested structure, pricing, and reorder behavior on top of that working baseline.

### Git Intelligence Summary

- Recent relevant implementation commit `3c2ca6f` extended the client detail experience with related-record context while keeping thin route composition and feature-owned query logic. Story 2.4 should preserve that same separation of route shell, feature query, and feedback UI.
- Commit `ed09778` is the strongest implementation template for this story: it added authenticated create/edit client flows, Drizzle plus fallback persistence, explicit `ActionResult` handling, integration coverage, and Playwright coverage. Mirror those patterns closely for service packages.
- Commit `d5abbe4` established the current auth/session hardening and protected-workspace conventions. Reuse those auth helpers and route-protection assumptions instead of creating alternate security plumbing in the service-package feature.
- The two BMAD rollback/restore commits in the recent history are operational repository maintenance and do not change product implementation guidance for this story.

### Latest Tech Information

- Latest registry and docs check results relevant to this story:
  - `next`: `16.1.7` latest, project pinned to `16.1.6`
  - `react`: `19.2.4` latest, project pinned to `19.2.3`
  - `react-dom`: `19.2.4` latest, project pinned to `19.2.3`
  - `drizzle-orm`: `0.45.1` latest and current in project
  - `drizzle-kit`: `0.31.10` latest, project pinned to `0.31.9`
  - `zod`: `4.3.6` latest and current in project
  - `@playwright/test`: `1.58.2` latest and current in project
  - `vitest`: `4.1.0` latest and current in project
- Guidance for this story: stay on the architecture-pinned versions already in the repo unless a concrete bug or security issue appears during implementation; the current version drift is patch-level only.
- Next.js Server Actions should still be treated as public endpoints: re-authorize inside the action, validate all incoming data, and keep server-only data access behind the repository layer.
- For nested editor saves, React local form state plus one normalized save payload is the safest approach. Avoid trying to persist every individual section or line-item interaction as its own mutation.
- For nested validation, Zod issue-path handling is more appropriate than flat-only error flattening. Use stable dotted or indexed field keys that the structured package form can map back onto nested controls.
- For persistence, Drizzle transactions remain the right guardrail for saving package + section + line-item changes together so the hierarchy cannot land in a partially updated state.

### Project Context Reference

- No `project-context.md` exists in the repository.
- Treat the authoritative context for this story as the epics, PRD, architecture, UX specification, sprint status, Story 2.3 file, and the current implementation under `src/app/(workspace)/service-packages`, `src/features/service-packages`, `src/features/clients`, and shared auth/result helpers.

### Project Structure Notes

- Current service-package implementation lives only in `src/app/(workspace)/service-packages/page.tsx`, `src/app/(workspace)/service-packages/[servicePackageId]/page.tsx`, and fixture-based query files under `src/features/service-packages/server/queries`.
- The library page currently renders inert `Create service package` buttons and the detail page only shows `name`, `category`, and `startingPriceLabel`. Story 2.4 should evolve those entry points instead of replacing them with a parallel route model.
- There is currently no service-package form, schema, repository, fallback store, database schema, or migration. Those missing foundations are part of why Story 2.4 must account for enabling work from the unimplemented Story 2.3 baseline.
- Existing workspace navigation tests still assume deterministic fixture package IDs such as `package-brand-launch`; once persistence becomes real, either seed compatible fallback data or update tests to create their own records explicitly.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.4] - canonical story statement and acceptance criteria
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 2] - cross-story context for client and service-package foundation work
- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.2] - downstream quote-generation expectation for generated sections, line items, and initial pricing guidance
- [Source: _bmad-output/planning-artifacts/prd.md#Service Package Library] - FR9 through FR13 scope, reusable-source boundaries, and service-package persistence requirements
- [Source: _bmad-output/planning-artifacts/prd.md#Non-Functional Requirements] - save reliability, explicit feedback, accessibility, and performance guardrails
- [Source: _bmad-output/planning-artifacts/architecture.md#Requirements to Structure Mapping] - service-package feature ownership and route boundaries
- [Source: _bmad-output/planning-artifacts/architecture.md#Architectural Boundaries] - server action, route, and feature-boundary rules
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules] - naming, response envelopes, validation, auth, and loading/error behavior standards
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries] - expected route, feature, and schema file placement
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Form Patterns] - inline validation, preserved progress, and structured editing expectations
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Quote Structure Editor] - source-vs-instance clarity, immediate totals, and editable section/line-item requirements
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Feedback Patterns] - explicit success and failure messaging expectations
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Responsive Strategy] - desktop-first and tablet-safe layout expectations
- [Source: src/app/(workspace)/service-packages/page.tsx] - current library route and inert create CTA that this story must replace
- [Source: src/app/(workspace)/service-packages/[servicePackageId]/page.tsx] - current read-only detail route that should become the structured edit experience
- [Source: src/features/service-packages/server/queries/list-service-packages.ts] - current list-query contract and summary shape baseline
- [Source: src/features/service-packages/server/queries/get-service-package-by-id.ts] - current missing-record handling baseline
- [Source: src/features/service-packages/server/queries/service-package-fixtures.ts] - current lightweight fixture shape and deterministic IDs used by tests
- [Source: src/app/(workspace)/clients/new/page.tsx] - create-route composition pattern to mirror
- [Source: src/app/(workspace)/clients/[clientId]/page.tsx] - edit-route composition and `backTo` pattern to mirror
- [Source: src/features/clients/components/client-form.tsx] - controlled form, success/failure notice, and accessibility pattern to mirror
- [Source: src/features/clients/server/actions/create-client.ts] - auth-first server action and revalidation pattern to mirror
- [Source: src/features/clients/server/actions/update-client.ts] - update flow pattern that loads existing record before authz and save
- [Source: src/features/clients/server/clients-repository.ts] - database plus fallback-store pattern to mirror
- [Source: tests/integration/clients/client-flow.test.ts] - integration-test structure and repository-backed flow pattern to mirror
- [Source: tests/e2e/clients.spec.ts] - e2e create/edit coverage pattern to mirror
- [Source: src/features/studio-defaults/components/studio-defaults-form.tsx] - current multiline/default-content form precedent
- [Source: src/features/studio-defaults/server/studio-defaults-repository.ts] - persistence precedent for reusable default text content
- [Source: src/features/auth/require-session.ts] - authenticated-session helper
- [Source: src/server/auth/permissions.ts] - studio-access enforcement helper
- [Source: src/lib/validation/action-result.ts] - standard result envelope
- [Source: src/proxy.ts] - protected route coverage for `/service-packages`
- [Source: tests/integration/workspace/navigation-reopen.test.tsx] - current fixture-based workspace navigation expectations
- [Source: tests/e2e/workspace-navigation.spec.ts] - current browser-level reopen coverage for service-package routes

## Dev Agent Record

### Agent Model Used

openai/gpt-5.4

### Debug Log References

- create-story workflow execution
- manual checklist validation review against `_bmad/bmm/workflows/4-implementation/create-story/checklist.md`

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created
- Story 2.4 is marked ready-for-dev with an explicit note that the current branch still lacks the Story 2.3 service-package baseline in code, so enabling work is called out directly in the tasks and dev notes.

### File List

- _bmad-output/implementation-artifacts/2-4-define-service-package-structure-default-content-and-pricing.md
