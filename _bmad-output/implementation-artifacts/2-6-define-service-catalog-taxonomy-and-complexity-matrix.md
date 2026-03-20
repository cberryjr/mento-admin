# Story 2.6: Define Service Catalog Taxonomy and Complexity Matrix

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a studio owner,
I want to define a standardized service catalog with category profiles and complexity tiers,
so that future quotes use consistent reusable estimation rules instead of ad hoc package setup.

## Acceptance Criteria

1. **Given** the studio owner defines or updates service catalog rules **When** they save a category profile aligned to the owner catalog specification **Then** the category persists as reusable source data with a canonical identifier and human-readable label **And** the saved profile can be reopened without losing structure.

2. **Given** a service category profile exists **When** the user defines Standard, Advanced, and Premium complexity tiers **Then** each tier is stored as part of a deterministic complexity matrix **And** later quote-estimation stories can consume the saved tiers without parsing formatted display text.

3. **Given** the user enters tier defaults for deliverables, duration/time-range guidance, and production variables such as quantity, duration, resolution, revisions, and urgency **When** the matrix is saved **Then** those defaults persist in machine-readable form **And** the same saved defaults are shown when the package or profile is reopened.

4. **Given** service packages remain reusable source records **When** catalog taxonomy and complexity settings are updated **Then** only reusable source-layer data changes **And** this story does not generate quote-instance estimate outputs, quote preview breakdowns, or AI-driven pricing behavior.

5. **Given** the matrix editor is used with keyboard navigation and supported browsers **When** validation fails or a save succeeds **Then** labels, focus handling, inline errors, and save feedback remain explicit and accessible **And** entered progress is preserved for correction.

## Tasks / Subtasks

- [x] Task 1: Establish the canonical service catalog and complexity matrix contract inside the service-package source layer (AC: #1, #2, #3, #4)
  - [x] 1.1 Add one feature-local source-of-truth module for canonical category keys, display labels, tier enums, resolution options, urgency options, and any short-label mappings required by `docs/rodo-spec.md` time-estimation tables so form, schema, repository/store, and tests do not duplicate hardcoded lists.
  - [x] 1.2 Extend `src/features/service-packages/types.ts` with first-class catalog metadata for canonical service categories, fixed complexity levels (`standard`, `advanced`, `premium`), deliverable templates, production-variable defaults, and machine-readable duration/time-range guidance that later quote estimation can reuse directly.
  - [x] 1.3 Replace the current unconstrained free-text category model with a canonical category key + display label contract derived from `docs/rodo-spec.md`, while preserving a library-safe human-readable category string for summary surfaces.
  - [x] 1.4 Define one exact machine-readable tier contract that includes, at minimum: tier identity, summary/descriptor text, ordered deliverables, ordered process notes, normalized time guidance (`minValue`, `maxValue`, `unit`), and structured variable defaults for quantity, optional duration, resolution, revisions, and urgency.
  - [x] 1.5 Keep the reusable-source boundary explicit: this story stores reusable catalog rules and defaults only; it must not produce quote-instance outputs such as `estimatedHours`, `roleBreakdown`, `internalCost`, or `finalPrice` yet.

- [x] Task 2: Add validation and persistence support for catalog taxonomy and matrix data (AC: #1, #2, #3, #4)
  - [x] 2.1 Extend `src/features/service-packages/schemas/service-package-schema.ts` with path-aware validation for canonical category selection, required complexity tiers, ordered deliverables, and structured production-variable defaults.
  - [x] 2.2 Update `src/server/db/schema/service-packages.ts`, `src/server/db/schema/index.ts`, and the next Drizzle migration so catalog/matrix data is stored in a deterministic, queryable form that matches the architecture's normalized-relational preference rather than an opaque text blob.
  - [x] 2.3 Update `src/features/service-packages/server/service-packages-repository.ts`, `src/features/service-packages/server/store/service-packages-store.ts`, `src/features/service-packages/server/actions/create-service-package.ts`, `src/features/service-packages/server/actions/update-service-package.ts`, and the service-package detail/list query contracts so both the database path and fallback in-memory path can create, reload, validate, and update the same catalog/matrix structure without reference-sharing bugs.
  - [x] 2.4 Add explicit legacy/backfill handling for existing service-package records and seeded fixtures that currently only have free-text `category` values. Reopening a pre-2.6 package must not crash or silently discard data.
  - [x] 2.5 Keep create/update writes atomic through the existing repository save flow so category/tier defaults cannot partially save while sibling matrix data is stale or missing.
  - [x] 2.6 Preserve the existing service-package summary contract used by the library (`id`, `name`, `category`, `startingPriceLabel`, `shortDescription`, `updatedAt`, `packageTotalCents`) so Story 2.5 browsing work remains compatible.

- [x] Task 3: Extend the service-package authoring experience to manage canonical category and complexity defaults (AC: #1, #2, #3, #5)
  - [x] 3.1 Update `src/features/service-packages/components/service-package-form.tsx` so the metadata section uses a canonical category selector and a dedicated complexity-matrix authoring section instead of a free-text-only category input.
  - [x] 3.2 Add structured UI for Standard, Advanced, and Premium tiers with editable deliverables, duration/time guidance, and production-variable defaults; keep row identity stable and avoid using array indexes as business identity.
  - [x] 3.3 Preserve the current controlled-input and `useTransition` save pattern, explicit success/error notices, and reusable-source messaging so the form still reads as source authoring rather than quote editing.
  - [x] 3.4 Keep desktop-first and tablet-safe layout behavior intact while making keyboard navigation through tier controls, deliverable rows, and validation errors explicit and recoverable.

- [x] Task 4: Protect downstream compatibility and keep story scope disciplined (AC: #2, #3, #4, #5)
  - [x] 4.1 Keep all new logic inside the existing service-package feature and route tree (`src/app/(workspace)/service-packages/*`, `src/features/service-packages/*`); do not create a parallel quote-estimation feature or separate catalog admin area unless the current feature boundaries become unworkable.
  - [x] 4.2 Do not add taxonomy-based library filtering, server-side search, preview-time estimate rendering, AI pricing, or quote snapshot generation in this story; those concerns belong to Story 2.5 browsing follow-up and Story 3.7 estimate breakdown work.
  - [x] 4.3 Preserve safe navigation and security guardrails already established for service packages, including server-side authz checks, normalized not-found behavior for cross-studio access, and sanitized `backTo` handling.
  - [x] 4.4 If tier or deliverable records need stable downstream references, do not rely on recreated database row IDs alone; preserve stable logical identifiers or mapping rules so later quote stories are not coupled to update-time row churn.

- [x] Task 5: Add regression, accessibility, and quality-gate coverage for the new source rules (AC: #1, #2, #3, #4, #5)
  - [x] 5.1 Extend `src/features/service-packages/types.test.ts` and `src/features/service-packages/schemas/service-package-schema.test.ts` to cover canonical categories, required tiers, ordered deliverables, structured variable defaults, and invalid matrix inputs.
  - [x] 5.2 Extend repository, fallback-store, action, and query tests under `src/features/service-packages/server/*` to verify taxonomy/matrix persistence, studio scoping, normalized not-found auth behavior, and deterministic reopen/update flows.
  - [x] 5.3 Extend `src/features/service-packages/components/service-package-form.test.tsx` to cover category selection, tier editing, preserved values after validation failure, keyboard reachability, and explicit save/error feedback.
  - [x] 5.4 Extend `tests/integration/service-packages/service-package-flow.test.ts` and `tests/e2e/service-packages.spec.ts` so the create/reopen/edit/library flows continue to work with the new catalog metadata without introducing taxonomy-filter assumptions.
  - [x] 5.5 Verify `npm run lint`, `npm run test`, and `npm run build` pass after the catalog matrix changes land.

## Dev Notes

- This story is the additive source-rule follow-up to the structured service-package work completed in Story 2.4. The repo now has real service-package persistence, nested sections/line items, and a reusable-source authoring flow, but `category` is still a free-text field and there is no first-class complexity matrix yet.
- The planning artifacts are partially ahead of the core epic file: `sprint-status.yaml` includes Story `2-6-define-service-catalog-taxonomy-and-complexity-matrix`, but `_bmad-output/planning-artifacts/epics.md` still ends Epic 2 at Story 2.5. Treat `sprint-change-proposal-2026-03-17.md` plus `docs/rodo-spec.md` as the canonical source for Story 2.6 scope and guardrails.
- Keep the implementation inside the service-package source layer. The current quotes feature remains mostly placeholder-level, so Story 2.6 should prepare deterministic reusable inputs for later quote stories rather than trying to invent runtime quote breakdown behavior early.
- Preserve the source-vs-instance boundary established in Story 2.4 and repeated throughout the UX docs: service packages own reusable rules and defaults; quote and invoice records remain downstream working records.

### Developer Context Section

- The owner spec in `docs/rodo-spec.md` introduces seven canonical categories: AI Print Campaigns, AI Product Shoot, AI Concept Art, AI Character Design, AI Animation Ads, Cineminuto, and Social Media Animation. Those categories are the taxonomy baseline for this story.
- Complexity is fixed to three tiers from the same spec: Standard, Advanced, and Premium. Do not let the implementation invent arbitrary tier names or counts.
- The minimum structured defaults to capture are the ones explicitly called out in the owner spec and sprint change proposal: deliverables, quantity of assets, duration, resolution, number of revisions, urgency, and machine-readable duration/time guidance. These defaults must reopen exactly as saved.
- In scope for a category profile: canonical category key/label, any shorter reporting label needed to reconcile `docs/rodo-spec.md` section naming (for example `AI Print Campaigns` vs `Print`), base deliverables, and per-tier descriptors/process notes where the owner spec provides them. Out of scope for this story: pricing formulas, quote outputs, and analytics/reporting taxonomy work.
- Story 3.7 will later generate a transparent estimate breakdown. Story 2.6 should therefore store reusable deterministic inputs, not quote outputs. If a field is only useful for a future estimate engine, store it as reusable source data and keep it clearly separate from quote-instance calculations.
- Story 2.5 is already `ready-for-dev` and expects library browsing to remain simple. Preserve the current list summary contract and do not turn this story into a browsing/filtering feature.

### Technical Requirements

- Canonical categories should be represented as stable identifiers plus display labels, not raw free-text strings alone. The UI may show friendly labels, but persistence and TypeScript contracts should keep a deterministic canonical value.
- Reconcile naming differences inside `docs/rodo-spec.md` through an explicit shared mapping, not ad hoc string comparisons. Example: `ai-print-campaigns` may map to display label `AI Print Campaigns` and time-baseline label `Print`; `social-media-animation` may map to `Social Media Animation` and `Social Animation`.
- Complexity tiers must be first-class structured data. Represent them in a way that guarantees exactly one Standard, one Advanced, and one Premium entry per saved matrix.
- Deliverables must be stored as ordered structured items, not only as paragraphs in `shortDescription` or `defaultContent`. Later stories need a deterministic list to consume and display.
- Production variables must stay machine-readable. Use explicit typed fields for quantity, duration/time-range, resolution, revisions, and urgency rather than burying defaults in helper text or prose blocks.
- Recommended minimum contract for production variables: `quantity` as positive integer, optional `durationValue` plus `durationUnit`, `resolution` as a shared enum-backed option list (starting with `hd`, `4k`, `print`), `revisions` as non-negative integer, and `urgency` as a small shared enum such as `standard` / `rush`. If a variable does not apply to a category/tier, store `null` or another explicit structured value rather than omitting the field silently.
- The owner spec expresses time guidance in days or weeks. Persist this as normalized structured data (for example min/max values plus unit) so Story 3.7 can convert it predictably instead of parsing strings like `2-3 days` or `5-7 weeks`.
- Keep package pricing guidance numeric where pricing is involved. Do not replace existing `packageTotalCents` / `startingPriceLabel` behavior with freeform catalog strings.
- Maintain the current auth-first server-action pattern: `requireSession()` plus `ensureStudioAccess(...)`, path-aware Zod validation, explicit `ActionResult` envelopes, revalidation of list/detail routes, and normalized not-found behavior for cross-studio access.
- Update both persistence paths. Anything added to the Drizzle schema must also exist in the fallback in-memory store with deep-copy safety so tests and non-DB paths do not drift.
- The current repository update path recreates nested rows on save. If complexity tiers or deliverable rows need stable downstream references, preserve stable logical IDs or deterministic mapping rules instead of assuming DB row IDs remain constant across edits.
- Keep quote-estimate outputs out of this story. Do not calculate or persist `estimatedHours`, `roleBreakdown`, `internalCost`, `marginApplied`, or `finalPrice` on quotes here.

### Architecture Compliance

- Respect feature-first boundaries:
  - route composition in `src/app/(workspace)/service-packages/*`
  - service-package UI in `src/features/service-packages/components/*`
  - validation in `src/features/service-packages/schemas/*`
  - service-package server actions, queries, repository, and store in `src/features/service-packages/server/*`
  - persistence schema in `src/server/db/schema/*`
- Keep catalog logic inside the existing service-packages feature boundary. If new helpers or constants are needed, place them in feature-local files such as `src/features/service-packages/catalog-*.ts`, not in generic `src/lib/helpers.ts`-style dumping grounds.
- Preserve server-first composition: pages load data on the server and hand interactivity to client components. Do not move repository access or authz checks into client components.
- Follow architecture naming rules: snake_case in database schema, camelCase in application contracts, kebab-case file names, and the shared ok/error result contract.
- Favor normalized relational persistence or other strongly typed structured persistence that remains queryable and explicit. Do not hide the entire matrix in an opaque text field that later quote stories must reinterpret.
- Reuse the current security hardening already in this feature: server-side studio checks, normalized not-found behavior, and sanitized `backTo` navigation handling.

### Library/Framework Requirements

- Use the current project-approved stack unless a concrete implementation bug requires otherwise:
  - `next` `16.1.6` in repo (latest researched: `16.2.0`)
  - `react` and `react-dom` `19.2.3` in repo (latest researched: `19.2.4`)
  - `next-auth` `4.24.13`
  - `@auth/core` `0.34.3`
  - `drizzle-orm` `0.45.1`
  - `drizzle-kit` `0.31.9` in repo (latest researched: `0.31.10`)
  - `zod` `4.3.6`
  - `@playwright/test` `1.58.2`
  - `vitest` `4.1.0`
- No dependency upgrades are required for this story. The newer versions currently available are patch-level only and do not justify scope expansion.
- Continue using Next.js Server Actions for authenticated mutations and the existing App Router route tree for create/edit/list views.
- Continue using local React state and controlled inputs for structured editor interactions; do not introduce Zustand or a new form library for this story.
- Use Zod issue-path mapping for nested validation and Drizzle-backed structured persistence/migrations for the source-rule model.

### Project Structure Notes

- Current service-package implementation already owns the source-layer authoring route tree (`/service-packages`, `/service-packages/new`, `/service-packages/[servicePackageId]`). Keep Story 2.6 inside that existing structure rather than inventing a separate catalog administration area.
- `category` is currently a single free-text field in the service-package contract and library summary. Story 2.6 should formalize it into canonical taxonomy data while preserving a readable summary label for list surfaces and future Story 2.5 browse/search behavior.
- The list query currently returns a stable summary shape and the detail route composes the large controlled `ServicePackageForm`. New catalog matrix state should extend those existing patterns instead of bypassing them.
- The quotes feature is still intentionally skeletal. Any design choice that depends on a full quote editor or estimate UI already existing is too broad for this story.
- Because the repo supports both database-backed and fallback-store-backed persistence, every new source-rule field must be added to both paths and covered by tests in both contexts.
- Existing seeded and persisted packages predate this story. The detail query and form bootstrap path must handle legacy records safely until the migration/backfill has run and fixtures are updated.

### File Structure Requirements

- Must change:
  - `src/features/service-packages/types.ts`
  - `src/features/service-packages/schemas/service-package-schema.ts`
  - `src/features/service-packages/components/service-package-form.tsx`
  - `src/features/service-packages/server/actions/create-service-package.ts`
  - `src/features/service-packages/server/actions/update-service-package.ts`
  - `src/features/service-packages/server/queries/list-service-packages.ts`
  - `src/features/service-packages/server/queries/get-service-package-by-id.ts`
  - `src/features/service-packages/server/service-packages-repository.ts`
  - `src/features/service-packages/server/store/service-packages-store.ts`
  - `src/app/(workspace)/service-packages/page.tsx`
  - `src/app/(workspace)/service-packages/new/page.tsx`
  - `src/app/(workspace)/service-packages/[servicePackageId]/page.tsx`
  - `src/server/db/schema/service-packages.ts`
  - `src/server/db/schema/index.ts`
  - `drizzle/migrations/*`
- Likely add or split if the matrix contract becomes too large for existing files:
  - `src/features/service-packages/catalog-*.ts`
  - feature-local helpers or mappers colocated under `src/features/service-packages/*`
- Test touch points:
  - `src/features/service-packages/types.test.ts`
  - `src/features/service-packages/schemas/service-package-schema.test.ts`
  - `src/features/service-packages/server/service-packages-repository.test.ts`
  - `src/features/service-packages/server/store/service-packages-store.test.ts`
  - `src/features/service-packages/server/actions/create-service-package.test.ts`
  - `src/features/service-packages/server/actions/update-service-package.test.ts`
  - `src/features/service-packages/server/queries/list-service-packages.test.ts`
  - `src/features/service-packages/server/queries/get-service-package-by-id.test.ts`
  - `src/features/service-packages/components/service-package-form.test.tsx`
  - `tests/integration/service-packages/service-package-flow.test.ts`
  - `tests/integration/workspace/navigation-reopen.test.tsx`
  - `tests/e2e/service-packages.spec.ts`
- Keep `src/features/quotes/*`, `src/features/invoices/*`, and quote preview/export routes unchanged unless a compile-safe type extraction is genuinely required. Estimate rendering belongs to later quote stories.

### Testing Requirements

- Cover the taxonomy baseline explicitly: the seven canonical categories from `docs/rodo-spec.md` must be available, saved, and reopened deterministically.
- Cover the complexity baseline explicitly: each saved matrix contains Standard, Advanced, and Premium tiers with clear validation when any required tier or field is missing.
- Add validation tests for ordered deliverables and structured variable defaults, including preserved values after failed save.
- Add migration/backfill coverage for legacy records and seeded fallback-store fixtures so pre-2.6 packages reopen safely and receive deterministic category/matrix defaults.
- Add repository/store tests proving both persistence paths save and reload the same catalog matrix structure without mutating shared references.
- Add regression tests for authz, normalized not-found behavior, and safe reopen/edit flows after matrix data is added.
- Add component and browser tests for keyboard traversal through category selection, tier editing, deliverable editing, and save feedback.
- Keep Story 2.5 compatibility covered by verifying list/detail/library flows still work without taxonomy-specific filtering assumptions.
- Verify `npm run lint`, `npm run test`, and `npm run build` pass.

### Previous Story Intelligence

- Story 2.4 already established the current implementation baseline: authenticated service-package create/edit flows, structured sections and line items, numeric pricing guidance, repository-backed persistence, fallback-store parity, and explicit reusable-source messaging. Story 2.6 should build on that exact pattern instead of creating a parallel workflow.
- Story 2.4 also set a critical downstream guardrail: package source data must stay deterministic so later quote-generation stories can reuse it directly. The new catalog matrix should follow that same rule.
- Story 2.4 code review fixed several security and data-integrity issues that still matter here: server-generated IDs instead of trusting client PKs, normalized not-found responses to avoid IDOR leaks, sanitized `backTo` navigation, overflow guards on numeric inputs, and deep-copy fallback-store safety.
- Story 2.5 is the immediately previous story file in backlog order, even though it is not implemented yet. Its dev notes explicitly say not to add taxonomy-based library filtering or server-side search. Preserve simple browse/list contracts and keep taxonomy work focused on source-rule authoring.
- The current library summary still uses a human-readable `category` string. Standardizing the taxonomy must not break summary rendering or the future Story 2.5 search/filter assumptions.

### Git Intelligence Summary

- Recent commit `e3a819b` implemented Story 2.4 and hardened service-package navigation and security. Reuse its service-package form, repository, action, migration, and test patterns; do not re-open solved auth and redirect issues.
- Commit `2ee18dc` established the repository-backed service-package create/edit baseline and the current list/detail/query contracts. Extend that feature area rather than introducing a new catalog feature with separate infrastructure.
- Commit `3c2ca6f` added a reusable record-summary pattern in the clients feature and shared date-format usage. That pattern is relevant if any new catalog summary details need to surface in the service-package library later, but Story 2.6 should keep list changes minimal.
- Recent product commits are concentrated in the service-packages area. Quote runtime features are still intentionally light, which reinforces that Story 2.6 should stop at deterministic source-rule authoring.

### Latest Tech Information

- Latest registry check results:
  - `next`: `16.2.0` latest, repo pinned to `16.1.6`
  - `react`: `19.2.4` latest, repo pinned to `19.2.3`
  - `react-dom`: `19.2.4` latest, repo pinned to `19.2.3`
  - `next-auth`: `4.24.13` latest and current in repo
  - `@auth/core`: `0.34.3` latest and current in repo
  - `drizzle-orm`: `0.45.1` latest and current in repo
  - `drizzle-kit`: `0.31.10` latest, repo pinned to `0.31.9`
  - `zod`: `4.3.6` latest and current in repo
  - `@playwright/test`: `1.58.2` latest and current in repo
  - `vitest`: `4.1.0` latest and current in repo
- Guidance for this story: stay on the repo-pinned versions. No package upgrade is required to implement structured catalog metadata.
- Continue treating Server Actions as public entry points: authenticate and authorize inside the action, validate all untrusted input, and keep repository and DB access behind server-only modules.
- Use structured Zod validation and explicit typed persistence for the matrix. Avoid clever client-only state or loosely typed serialization that would make Story 3.7 harder.

### Project Context Reference

- No `project-context.md` exists in the repository.
- Treat the authoritative context for this story as: `sprint-status.yaml`, `sprint-change-proposal-2026-03-17.md`, `docs/rodo-spec.md`, the core planning artifacts (`prd.md`, `architecture.md`, `ux-design-specification.md`, `epics.md`), Story 2.4, Story 2.5, and the current service-package implementation under `src/app/(workspace)/service-packages` and `src/features/service-packages`.

### References

- [Source: _bmad-output/implementation-artifacts/sprint-status.yaml] - story backlog ordering; Story `2-6-define-service-catalog-taxonomy-and-complexity-matrix` is the first remaining Epic 2 backlog item.
- [Source: _bmad-output/planning-artifacts/sprint-change-proposal-2026-03-17.md#Issue Summary] - reason the new story exists and the owner-defined catalog/estimation requirements.
- [Source: _bmad-output/planning-artifacts/sprint-change-proposal-2026-03-17.md#B.1 New Story 2.6 (Epic 2)] - explicit story intent to define category profiles, Standard/Advanced/Premium tiers, and deliverable/variable defaults.
- [Source: _bmad-output/planning-artifacts/sprint-change-proposal-2026-03-17.md#B.2 New Story 3.7 (Epic 3)] - downstream dependency on transparent estimate breakdown generation.
- [Source: _bmad-output/planning-artifacts/sprint-change-proposal-2026-03-17.md#C.1 Data and calculation architecture update] - architecture need for profile/complexity/variable storage and deterministic traceability.
- [Source: _bmad-output/planning-artifacts/sprint-change-proposal-2026-03-17.md#D.1 Guided workflow extension] - future UX expectation for complexity selection and estimate transparency.
- [Source: docs/rodo-spec.md#2. SERVICE CATEGORIES] - canonical category set.
- [Source: docs/rodo-spec.md#3. COMPLEXITY LEVELS] - fixed Standard/Advanced/Premium matrix baseline.
- [Source: docs/rodo-spec.md#11. PRODUCTION VARIABLES] - required variable defaults to capture as structured inputs.
- [Source: docs/rodo-spec.md#12. STANDARD TIME ESTIMATION] - baseline time guidance that must remain machine-readable.
- [Source: docs/rodo-spec.md#13. OUTPUT STRUCTURE (FOR QUOTES)] - downstream output contract that Story 3.7 will implement.
- [Source: docs/rodo-spec.md#14. ROLE MAPPING (FOR ENGINE)] - future role breakdown context; keep this story source-layer only.
- [Source: docs/rodo-spec.md#16. NEXT STEP (RECOMMENDED)] - sequencing signal: catalog first, pricing/engine rules next.
- [Source: _bmad-output/planning-artifacts/prd.md#MVP - Minimum Viable Product] - reusable service packages remain in-scope source records for quote workflows.
- [Source: _bmad-output/planning-artifacts/prd.md#Explicitly Out of Scope for MVP] - broad taxonomy/tag-based discovery and AI estimate intelligence remain out of scope.
- [Source: _bmad-output/planning-artifacts/prd.md#Core Domain Model] - service packages are reusable source records; quotes and invoices are client-specific working records.
- [Source: _bmad-output/planning-artifacts/prd.md#Journey 3 - Operations maintainer keeps reusable assets ready for fast quoting] - source-layer maintenance context.
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 2: Client and Service Package Foundation] - epic-level business value and reusable foundation context.
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.4: Define Service Package Structure, Default Content, and Pricing] - immediate predecessor implementation pattern and deterministic source-data requirement.
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.5: Browse and Reopen Service Packages in the Library] - browse/list continuity that must remain compatible.
- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.1: Start a New Quote with Client Association and Service Package Selection] - downstream package-selection dependency.
- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.2: Generate Quote Content from Selected Service Packages] - downstream requirement that service packages expose reusable source rules.
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture] - normalized relational, machine-readable persistence preference.
- [Source: _bmad-output/planning-artifacts/architecture.md#Architectural Boundaries] - route, feature, and persistence ownership rules.
- [Source: _bmad-output/planning-artifacts/architecture.md#Requirements to Structure Mapping] - service-package feature ownership.
- [Source: _bmad-output/planning-artifacts/architecture.md#Integration Points] - server action -> repository -> persistence -> refresh data flow.
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Service Package Picker] - downstream source-package selection context.
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Feedback Patterns] - explicit success/failure messaging expectations.
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Form Patterns] - inline validation and preserved progress behavior.
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Search and Filtering Patterns] - keep retrieval simple; do not turn this story into enterprise filtering.
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Accessibility Strategy] - keyboard reachability and text-based state requirements.
- [Source: _bmad-output/implementation-artifacts/2-4-define-service-package-structure-default-content-and-pricing.md] - implemented service-package structure baseline and prior guardrails.
- [Source: _bmad-output/implementation-artifacts/2-5-browse-and-reopen-service-packages-in-the-library.md] - compatibility guardrail against taxonomy-filter scope creep.
- [Source: src/features/service-packages/types.ts] - current service-package contract and summary shape.
- [Source: src/features/service-packages/schemas/service-package-schema.ts] - current nested validation and path-aware field-error mapping.
- [Source: src/features/service-packages/components/service-package-form.tsx] - controlled-input authoring surface to extend.
- [Source: src/features/service-packages/server/service-packages-repository.ts] - current repository transaction/update behavior and row-identity caveat.
- [Source: src/features/service-packages/server/store/service-packages-store.ts] - fallback-store parity and seeded package patterns.
- [Source: src/server/db/schema/service-packages.ts] - existing service-package relational schema boundary.
- [Source: src/app/(workspace)/service-packages/page.tsx] - current library summary contract.
- [Source: src/app/(workspace)/service-packages/new/page.tsx] - create route composition.
- [Source: src/app/(workspace)/service-packages/[servicePackageId]/page.tsx] - detail/edit route composition and safe `backTo` handling.

## Dev Agent Record

### Agent Model Used

openai/gpt-5.4

### Debug Log References

- `npm run lint`
- `npm run test`
- `NEXTAUTH_URL="https://mento-admin.local" STUDIO_OWNER_EMAIL="owner+ci@example.com" STUDIO_OWNER_PASSWORD="dev-password-override" NEXTAUTH_SECRET="test-secret-value" DATABASE_URL="postgres://postgres:postgres@localhost:5432/mento" npm run build`

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created.
- Story 2.6 is sourced from `sprint-status.yaml`, `sprint-change-proposal-2026-03-17.md`, and `docs/rodo-spec.md` because the core `epics.md` file has not yet been updated with the new story text.
- The story is intentionally scoped to reusable source-rule authoring inside the existing service-package feature. Transparent estimate rendering, quote snapshot outputs, and AI pricing remain downstream work.
- Implemented canonical catalog and complexity matrix contracts with stable keys, category metadata normalization, deterministic tier defaults, and reusable machine-readable variable/time guidance.
- Added normalized relational persistence for matrix tiers, deliverables, and process notes; updated repository/store paths for create, read, update, and legacy-safe fallback behavior.
- Extended service package authoring UX with canonical category selection and full matrix editing while preserving existing source-record messaging and save/error patterns.
- Expanded unit/integration coverage for schema validation, store/repository behavior, action/query contracts, and workflow compatibility; verified lint, tests, and production build.
- Applied code-review remediation to align category error wiring, surface inline matrix validation errors, enforce canonical category labels from keys, and tighten tier issue-path mapping.

### File List

- _bmad-output/implementation-artifacts/2-6-define-service-catalog-taxonomy-and-complexity-matrix.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
- src/features/service-packages/catalog-contract.ts
- src/features/service-packages/types.ts
- src/features/service-packages/types.test.ts
- src/features/service-packages/schemas/service-package-schema.ts
- src/features/service-packages/schemas/service-package-schema.test.ts
- src/features/service-packages/server/store/service-packages-store.ts
- src/features/service-packages/server/store/service-packages-store.test.ts
- src/features/service-packages/server/service-packages-repository.ts
- src/features/service-packages/server/service-packages-repository.test.ts
- src/features/service-packages/server/actions/create-service-package.test.ts
- src/features/service-packages/server/actions/update-service-package.test.ts
- src/features/service-packages/server/queries/get-service-package-by-id.test.ts
- src/features/service-packages/components/service-package-form.tsx
- src/features/service-packages/components/service-package-form.test.tsx
- src/server/db/schema/service-packages.ts
- src/server/db/schema/index.ts
- drizzle/migrations/0004_service_catalog_matrix.sql
- drizzle/migrations/meta/0004_snapshot.json
- drizzle/migrations/meta/_journal.json
- src/app/(workspace)/service-packages/page.tsx
- src/app/(workspace)/service-packages/new/page.tsx
- src/app/(workspace)/service-packages/[servicePackageId]/page.tsx
- tests/integration/service-packages/service-package-flow.test.ts
- tests/e2e/service-packages.spec.ts

### Change Log

- 2026-03-19: Code review fixes applied for Story 2.6 (category error mapping, matrix inline error rendering, canonical label normalization, and issue-path mapping cleanup).
- 2026-03-19: Implemented canonical service catalog taxonomy + complexity matrix authoring, validation, persistence, migrations, and regression coverage for Story 2.6. Status moved to `review`.
