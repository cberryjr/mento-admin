# Story 3.7: Generate Transparent Estimate Breakdown for Quotes

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a studio owner,
I want to see a transparent estimate breakdown when viewing a quote that shows how the pricing is derived from role-hours, internal costs, and margin,
so that I can trust and explain the numbers to clients without manual calculation.

## Acceptance Criteria

1. **Given** a quote has been generated from one or more service packages that include complexity tier data **When** the user views the quote detail or preview **Then** an estimate breakdown panel displays the computed estimated hours, role breakdown, internal cost, margin applied, and final price per section.
2. **Given** the user adjusts quote line items, quantities, or pricing **When** the quote totals recalculate **Then** the estimate breakdown updates immediately to reflect the edited quote state.
3. **Given** a quote was generated from service packages **When** the estimate breakdown is computed **Then** the breakdown derives its data from the source service package complexity tiers (time ranges, role mappings, deliverable lists) rather than requiring manual entry.
4. **Given** the estimate breakdown is displayed **When** the user reviews it **Then** each computed value (estimated hours, role breakdown, internal cost, margin, final price, deliverables) is visible and traceable to its source inputs.
5. **Given** the estimate breakdown exists for a quote **When** the quote is reopened later **Then** the breakdown persists and reflects the latest saved quote state without data loss.
6. **Given** the estimate breakdown is shown in the quote preview **When** the preview is opened on supported browsers **Then** the breakdown remains accessible, readable, and aligned with WCAG 2.1 AA requirements.

## Tasks / Subtasks

- [x] Task 1: Define estimate breakdown data model and types (AC: #3, #4)
  - [x] 1.1 Add `EstimateBreakdown` type to `src/features/quotes/types.ts` with fields: `estimatedHours`, `roleBreakdown` (array of `{ role, hours, hourlyRateCents, costCents }`), `internalCostCents`, `marginPercent`, `marginCents`, `finalPriceCents`, `deliverables` (string array).
  - [x] 1.2 Add `SectionEstimateBreakdown` type that maps a breakdown to a specific quote section.
  - [x] 1.3 Add Zod schema in `src/features/quotes/schemas/estimate-breakdown-schema.ts` for validation of breakdown inputs if computed server-side.

- [x] Task 2: Build estimate calculator (AC: #1, #2, #3)
  - [x] 2.1 Create `src/features/quotes/server/calculators/estimate-breakdown.ts` implementing deterministic computation from service package complexity tiers and quote sections.
  - [x] 2.2 The calculator reads the service package's `servicePackageComplexityTiers` (time ranges, role defaults) and `servicePackageTierDeliverables` to produce per-section breakdowns.
  - [x] 2.3 For each quote section, map the source service package complexity tier's `timeMinValue`/`timeMaxValue` to estimated hours, derive role breakdown from tier metadata, compute `internalCostCents` from role-hours times hourly rates, apply `marginPercent` to get `marginCents`, and sum to `finalPriceCents`.
  - [x] 2.4 Use the existing `calculateQuoteTotalCents` from `types.ts` as the line-item subtotal baseline; the estimate breakdown adds cost/margin transparency on top.
  - [x] 2.5 Create `src/features/quotes/server/calculators/estimate-breakdown.test.ts` with unit tests for happy path, edge cases (missing tier data, zero quantities), and determinism.

- [x] Task 3: Add server query for estimate breakdown (AC: #3, #5)
  - [x] 3.1 Create `src/features/quotes/server/queries/get-quote-estimate-breakdown.ts` that loads the quote with its sections, resolves source service packages and their complexity tiers, and runs the calculator.
  - [x] 3.2 This query must follow auth-first pattern: `requireSession()`, `ensureStudioAccess(...)`.
  - [x] 3.3 Create `src/features/quotes/server/queries/get-quote-estimate-breakdown.test.ts`.

- [x] Task 4: Build estimate breakdown UI component (AC: #1, #4, #6)
  - [x] 4.1 Create `src/features/quotes/components/estimate-breakdown-panel.tsx` — a client component that displays per-section and grand-total breakdowns.
  - [x] 4.2 Show: estimated hours range, role breakdown table (role, hours, rate, cost), internal cost subtotal, margin percentage and amount, final price, deliverables list.
  - [x] 4.3 Use existing UI primitives from `src/components/ui/` (table, card, etc.) following Geist-inspired design system.
  - [x] 4.4 Ensure keyboard navigation and WCAG 2.1 AA: text-based feedback, readable labels, proper heading hierarchy.
  - [x] 4.5 Create `src/features/quotes/components/estimate-breakdown-panel.test.tsx`.

- [x] Task 5: Integrate estimate breakdown into quote detail page (AC: #1, #2, #5)
  - [x] 5.1 Update `src/app/(workspace)/quotes/[quoteId]/page.tsx` to fetch and display the estimate breakdown panel when the quote has generated content.
  - [x] 5.2 The breakdown must recompute when quote sections are edited — leverage the existing `QuoteStructureEditor` save flow (which already calls `recalculateQuoteTotals`) to also recompute the estimate breakdown.
  - [x] 5.3 Position the breakdown panel after the totals summary, before the preview link, consistent with the guided sequence UX (edit → breakdown → preview).

- [x] Task 6: Integrate estimate breakdown into quote preview (AC: #1, #6)
  - [x] 6.1 Update `src/features/quotes/components/quote-preview.tsx` to include the estimate breakdown in the client-facing preview layout.
  - [x] 6.2 The breakdown in preview should be read-only, showing the persisted state at time of preview generation.
  - [x] 6.3 Verify the preview route `src/app/(workspace)/quotes/[quoteId]/preview/page.tsx` passes breakdown data through.

- [x] Task 7: Add test coverage (AC: #1, #2, #3, #4, #5, #6)
  - [x] 7.1 Unit tests for `estimate-breakdown.ts` calculator (determinism, tier mapping, margin math).
  - [x] 7.2 Component tests for `estimate-breakdown-panel.tsx` (render, empty state, full breakdown display).
  - [x] 7.3 Query tests for `get-quote-estimate-breakdown.ts` (auth, studio access, correct computation).
  - [x] 7.4 Updated existing preview tests for new `estimateBreakdown` field.

- [x] Task 8: Quality gates (AC: #1, #2, #3, #4, #5, #6)
  - [x] 8.1 `npm run lint` — 0 errors.
  - [x] 8.2 `npm run test` — all tests pass (311 tests).
  - [x] 8.3 TypeScript compilation — 0 errors.

## Dev Notes

### Relevant Architecture Patterns and Constraints

- **Auth-first pattern**: All server actions and queries must use `requireSession()` + `ensureStudioAccess(...)`. [Source: architecture.md#Authentication & Security]
- **ActionResult envelope**: All mutations return `{ ok: true, data }` or `{ ok: false, error: { code, message, fieldErrors? } }`. [Source: architecture.md#API Response Formats]
- **Server-first rendering**: Quote detail and preview pages are server components. Only interactive parts are client components. [Source: architecture.md#Frontend Architecture]
- **Feature-first placement**: All new code stays inside `src/features/quotes/`. Do not modify clients, service-packages, or invoices features. [Source: architecture.md#Project Organization]
- **Zustand for editor state**: The quote editor uses a scoped Zustand store (`quote-editor-store.ts`). The estimate breakdown does NOT need Zustand — it is computed server-side and displayed read-only. [Source: architecture.md#State Management Patterns]
- **Naming conventions**: PascalCase for React components/TS types/Zod schemas; camelCase for functions/variables/hooks; kebab-case for filenames. [Source: architecture.md#Code Naming Conventions]
- **Loading state patterns**: Use explicit `isLoading` flags, disable repeat submissions, scope loading UI to the affected action. [Source: architecture.md#Loading State Patterns]
- **Error handling patterns**: Separate user-correctable validation errors from operational failures. Never expose raw provider or database errors. [Source: architecture.md#Error Handling Patterns]
- **Accessibility**: Status changes and computed values must be announced in meaningful text. WCAG 2.1 AA for core workflows. [Source: ux-design-specification.md#Accessibility Strategy]

### Source Tree Components to Touch

- `src/features/quotes/types.ts` — add `EstimateBreakdown`, `SectionEstimateBreakdown`, `RoleBreakdownEntry` types
- `src/features/quotes/schemas/estimate-breakdown-schema.ts` — new Zod schema for breakdown validation
- `src/features/quotes/server/calculators/estimate-breakdown.ts` — new deterministic calculator
- `src/features/quotes/server/calculators/estimate-breakdown.test.ts` — calculator unit tests
- `src/features/quotes/server/queries/get-quote-estimate-breakdown.ts` — new server query
- `src/features/quotes/server/queries/get-quote-estimate-breakdown.test.ts` — query tests
- `src/features/quotes/components/estimate-breakdown-panel.tsx` — new UI component
- `src/features/quotes/components/estimate-breakdown-panel.test.tsx` — component tests
- `src/app/(workspace)/quotes/[quoteId]/page.tsx` — integrate breakdown panel into detail page
- `src/features/quotes/components/quote-preview.tsx` — integrate breakdown into preview
- `tests/e2e/quotes.spec.ts` — add e2e coverage for breakdown display

### Existing Code Patterns to Follow

**Service package complexity tiers are already modeled** in the DB schema at `src/server/db/schema/service-packages.ts`:
- `servicePackageComplexityTiers` table: `tierKey`, `tierTitle`, `descriptor`, `timeMinValue`, `timeMaxValue`, `timeUnit`, `quantityDefault`, `durationValueDefault`, `durationUnitDefault`, `resolutionDefault`, `revisionsDefault`, `urgencyDefault`
- `servicePackageTierDeliverables` table: `value` (text), linked to a complexity tier
- `servicePackageTierProcessNotes` table: `value` (text), linked to a complexity tier

**Quote sections reference their source service package** via `sourceServicePackageId` in `quoteSections` schema. This is the link used to resolve which complexity tier data applies to a given section.

**Quote totals already compute** via `calculateQuoteTotalCents(sections)` in `types.ts`. The estimate breakdown extends this with cost/margin transparency — it does NOT replace line-item totals.

**Rodo spec defines the output contract** at `docs/rodo-spec.md#13. OUTPUT STRUCTURE (FOR QUOTES)`:
- Estimated hours
- Team roles required
- Internal cost
- Final price (after margin)
- Deliverables list

**Rodo spec defines production variables** at `docs/rodo-spec.md#11. PRODUCTION VARIABLES`:
- Complexity level (Standard/Advanced/Premium)
- Quantity of assets
- Duration (for animation)
- Resolution (HD, 4K, print)
- Number of revisions
- Urgency

**Rodo spec defines role mapping** at `docs/rodo-spec.md#14. ROLE MAPPING (FOR ENGINE)`:
- Creative Director, AI Artist, CGI Artist, Motion Designer, Illustrator, Editor/Compositor

**Sprint change proposal context** at `_bmad-output/planning-artifacts/sprint-change-proposal-2026-03-17.md`:
- Story 3.7 was added to convert the owner's quote engine spec into operational quote behavior
- Deterministic rule-based estimation is MVP; AI optimization remains post-MVP
- Estimate snapshot should persist per quote for reproducibility/auditability

### Previous Story Intelligence

**Story 3.6 (Save and Reopen Quote Drafts) — completed:**
- Enhanced the `QuoteStructureEditor` with explicit save confirmation and failure recovery guidance.
- Updated quotes list with status badges and `updatedAt` sorting.
- Key files modified: `quote-structure-editor.tsx`, `quotes-repository.ts`, `page.tsx`.
- The Zustand store's `markSaved()` and `hasUnsavedChanges` pattern is well-established — the estimate breakdown should NOT interfere with this flow.
- Repeated-save e2e coverage was added — the estimate breakdown should survive repeated saves without data loss.
- **Learnings**: Follow the same pattern of inline success/error feedback. Co-locate tests. Use the shared `formatDate` helper for any date display.

**Story 3.5 (Review Preview Readiness and Open the Quote Preview) — in-progress:**
- The `computeReadinessIssues()` function in `preview-readiness.ts` checks sections, line items, client association.
- The `QuotePreview` component renders the client-facing layout.
- The estimate breakdown should integrate into the preview WITHOUT changing the readiness gate logic — the breakdown is informational, not a readiness blocker.
- **Learnings**: Keep the breakdown as display-only in the preview. Do not add it to readiness checks.

**Story 3.2 (Generate Quote Content from Selected Service Packages) — done:**
- Quote generation resolves service packages and creates `quoteSections` and `quoteLineItems` from the package structure.
- Each `quoteSection` stores `sourceServicePackageId` — this is the key link for resolving complexity tier data.
- The `generate-quote-content.ts` action already fetches service packages with their sections and line items.
- **Learnings**: The generation flow does NOT currently fetch complexity tiers during generation. The estimate breakdown query must resolve tiers independently.

### Git Intelligence

Recent commits show the quote feature has been built incrementally:
- `d9da316` — Story 3.6: quote draft save/reopen (modified quotes list, editor, repository)
- `70ec94e` — Stories 3.4-3.5: preview, reordering, pricing adjustments
- `b12d342` — Stories 3.1-3.3: guided quote creation and editing flow

Key conventions established in these commits:
- Server actions use `requireSession()` + `ensureStudioAccess()` pattern
- Component tests mock server actions with `vi.mock`
- E2E tests use seeded fallback data (e.g., `Sunrise Yoga Studio`, `package-brand-launch`)
- Feature changes stay inside `src/features/quotes/` and `src/app/(workspace)/quotes/`

### Testing Standards Summary

- Unit tests: Vitest + React Testing Library. Co-located as `*.test.ts(x)` next to source.
- E2E tests: Playwright in `tests/e2e/quotes.spec.ts`.
- Follow existing test patterns: mock server actions with `vi.mock`, test component states (loading, success, error), verify accessibility with semantic queries.
- Calculator tests should verify deterministic output for identical inputs.
- Include at least one test for missing/incomplete tier data gracefully handled.

### Project Structure Notes

- All new code stays inside `src/features/quotes/` and `src/app/(workspace)/quotes/`.
- New `calculators/` directory under `src/features/quotes/server/` follows the existing architecture pattern shown in `src/features/invoices/server/calculators/`.
- Do not modify the clients, service-packages, or invoices features.
- New component tests co-locate with source files.
- E2E tests extend `tests/e2e/quotes.spec.ts`.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 3] — Epic 3 scope and FR coverage (FR8, FR13-FR21)
- [Source: _bmad-output/planning-artifacts/sprint-change-proposal-2026-03-17.md#B.2] — Story 3.7 origin and scope definition
- [Source: _bmad-output/planning-artifacts/sprint-change-proposal-2026-03-17.md#C.1] — Architecture changes for estimate snapshot persistence
- [Source: docs/rodo-spec.md#11] — Production variables (complexity, quantity, duration, resolution, revisions, urgency)
- [Source: docs/rodo-spec.md#13] — Output structure for quotes (estimated hours, roles, internal cost, final price, deliverables)
- [Source: docs/rodo-spec.md#14] — Role mapping for engine (Creative Director, AI Artist, CGI Artist, Motion Designer, Illustrator, Editor/Compositor)
- [Source: docs/rodo-spec.md#3] — Complexity levels: Standard (Level 1), Advanced (Level 2), Premium (Level 3)
- [Source: _bmad-output/planning-artifacts/prd.md#FR15] — Generate client-specific quote from service packages
- [Source: _bmad-output/planning-artifacts/prd.md#NFR7] — Zero silent data-loss
- [Source: _bmad-output/planning-artifacts/prd.md#NFR9] — Explicit success/failure feedback
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture] — Drizzle ORM, normalized relational schema, PostgreSQL
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Organization] — Feature-first placement, co-located tests
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Quote Structure Editor] — Quote editing UX patterns
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Accessibility Strategy] — WCAG 2.1 AA requirements
- [Source: src/server/db/schema/service-packages.ts] — Complexity tiers and deliverables DB schema
- [Source: src/server/db/schema/quote-sections.ts] — Quote sections and line items DB schema
- [Source: src/features/quotes/types.ts] — Existing quote types and `calculateQuoteTotalCents`
- [Source: src/features/quotes/lib/preview-readiness.ts] — Readiness check logic (do not modify)
- [Source: src/features/quotes/components/quote-preview.tsx] — Preview component to extend
- [Source: src/features/quotes/server/actions/generate-quote-content.ts] — Quote generation action (reference for tier resolution)
- [Source: _bmad-output/implementation-artifacts/3-6-save-and-reopen-quote-drafts.md] — Previous story intelligence

## Dev Agent Record

### Agent Model Used

opencode (mimo-v2-pro-free)

### Debug Log References

### Completion Notes List

- Implemented deterministic estimate calculator using service package complexity tiers
- Role allocation based on service category (ai-print-campaigns, ai-product-shoot, etc.)
- Margin percentages: standard 30%, advanced 40%, premium 50%
- Line item subtotals used as final price baseline; breakdown adds cost/margin transparency
- Estimate breakdown now persists as a saved quote snapshot with section-level source package and tier provenance
- QuoteStructureEditor updates the breakdown immediately after save/add/remove/reorder flows using the latest returned snapshot
- Breakdown remains read-only in preview mode and uses the persisted snapshot rather than live package drift
- All 314 tests pass, lint clean, TypeScript compiles with 0 errors

### File List

- `src/features/quotes/types.ts` — extended breakdown types with persisted source-package/tier provenance and quote-level snapshot metadata
- `src/features/quotes/schemas/estimate-breakdown-schema.ts` — expanded snapshot validation schema for persisted payloads and provenance metadata
- `src/features/quotes/server/calculators/estimate-breakdown.ts` — added source provenance to each section breakdown and exported deterministic default-tier selection
- `src/features/quotes/server/calculators/estimate-breakdown.test.ts` — 20 unit tests covering deterministic output, tier mapping, and provenance
- `src/features/quotes/server/estimate-breakdown-snapshot.ts` — new snapshot sync helper for persisted quote breakdowns with parallel package loading
- `src/features/quotes/server/queries/get-quote-by-id.ts` — now hydrates and returns the persisted quote breakdown snapshot
- `src/features/quotes/server/queries/get-quote-estimate-breakdown.ts` — now returns the saved snapshot (or a refreshed snapshot for legacy quotes)
- `src/features/quotes/server/queries/get-quote-estimate-breakdown.test.ts` — 4 query tests covering auth, cross-studio access, empty sections, and persisted provenance
- `src/features/quotes/server/queries/get-quote-preview.ts` — now uses the persisted estimate snapshot in preview payloads
- `src/features/quotes/server/queries/get-quote-preview.test.ts` — added snapshot coverage for package-backed preview payloads
- `src/features/quotes/server/quotes-repository.ts` — persists serialized quote breakdown snapshots and reloads them into quote records
- `src/features/quotes/server/store/quotes-store.ts` — stores quote breakdown snapshots in the in-memory fallback path
- `src/server/db/schema/quotes.ts` — added quote-level estimate breakdown snapshot persistence field
- `src/features/quotes/components/estimate-breakdown-panel.tsx` — now renders section provenance (package, tier, and source inputs) for AC #4 traceability
- `src/features/quotes/components/estimate-breakdown-panel.test.tsx` — 9 component tests covering render states and provenance display
- `src/features/quotes/components/quote-structure-editor.tsx` — now shows the saved breakdown snapshot inline and refreshes it immediately after quote edits
- `src/app/(workspace)/quotes/[quoteId]/page.tsx` — passes hydrated snapshot data into the editor and read-only detail layout
- `src/features/quotes/components/quote-preview.tsx` — preview continues rendering the read-only persisted breakdown snapshot
- `src/features/quotes/components/quote-preview.test.tsx` — now verifies preview rendering when `estimateBreakdown` snapshot data exists

### Senior Developer Review (AI)

- Reviewer: chuck chuck
- Date: 2026-03-21
- Outcome: Changes requested during review, then fixed in the same workflow
- Resolved review findings:
  - Fixed Task 5.2 so estimate breakdown data now updates immediately after saved quote edits in the editor flow.
  - Persisted quote-level estimate breakdown snapshots to prevent package drift on reopen and preview.
  - Added explicit source package, tier, and input provenance to satisfy AC #4 traceability.
  - Reworked breakdown hydration to parallelize package lookups and avoid silent section drops for refreshed snapshots.
  - Expanded automated coverage for persisted snapshot behavior, preview rendering, and provenance output.
- Verification:
  - `npm run lint`
  - `npm test`
  - `npx tsc --noEmit`

### Change Log

- Added transparent estimate breakdown feature: types, calculator, query, UI panel, and integration into quote detail and preview pages (2026-03-21)
- Applied code-review fixes for persisted breakdown snapshots, immediate editor refresh, provenance display, and added regression coverage (2026-03-21)
