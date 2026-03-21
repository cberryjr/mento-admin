# Story 3.4: Adjust Quote Pricing, Ordering, and Totals

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a studio owner,
I want to adjust pricing and reorganize quote content with immediate totals feedback,
so that the quote reflects the right commercial structure before preview.

## Acceptance Criteria

1. **Given** a generated quote contains editable sections and line items **When** the user updates pricing values directly **Then** the quote stores the revised pricing on the quote instance **And** recalculated totals are shown immediately.

2. **Given** the user wants to reorganize the quote **When** they reorder sections or line items **Then** the quote reflects the new presentation order **And** the saved sequence is preserved when the quote is reopened.

3. **Given** a pricing or ordering change affects totals or quote completeness **When** the edit is made **Then** the interface gives clear feedback about the recalculated result **And** the user can see whether the quote is closer to preview readiness.

4. **Given** invalid pricing input or a failed update occurs **When** the user attempts the change **Then** the system returns explicit error feedback **And** no silent data loss or ambiguous save state occurs.

## Tasks / Subtasks

- [x] Task 1: Add reorder actions for sections and line items (AC: #2)
  - [x] 1.1 Create `src/features/quotes/server/actions/reorder-quote-sections.ts` server action that accepts a `quoteId` and ordered array of `sectionIds`. Follows auth-first pattern: `requireSession()`, `ensureStudioAccess(...)`, load quote, verify `draft` status, validate all section IDs belong to the quote, update `position` values based on new order, update `updatedAt`, `revalidatePath`, return `ActionResult<{ quote: QuoteDetailRecord }>`.
  - [x] 1.2 Create `src/features/quotes/server/actions/reorder-quote-line-items.ts` server action that accepts a `quoteId`, `sectionId`, and ordered array of `lineItemIds`. Same auth-first pattern. Validates line items belong to the section. Updates `position` values. Returns updated quote.
  - [x] 1.3 Add Zod schemas `reorderQuoteSectionsSchema` and `reorderQuoteLineItemsSchema` to `src/features/quotes/schemas/update-quote-sections-schema.ts`. Validate `quoteId` is a UUID, section/line-item arrays are non-empty with all UUID entries, no duplicates.

- [x] Task 2: Implement drag-and-drop reordering in the QuoteStructureEditor (AC: #2, #3)
  - [x] 2.1 Add drag-and-drop reorder support to `quote-structure-editor.tsx` for sections. Use `@dnd-kit/core` and `@dnd-kit/sortable` (already available via Tailwind ecosystem; add to `package.json` if not present). Sections become draggable with a grip handle. On drop, call `reorderQuoteSections` action and update local state optimistically.
  - [x] 2.2 Add drag-and-drop reorder support for line items within each section in `quote-editor-section.tsx`. Line items become draggable within their parent section. On drop, call `reorderQuoteLineItems` action and update local state.
  - [x] 2.3 Add keyboard reorder alternatives: Up/Down arrow buttons per section and per line item that swap position with adjacent sibling. Use same server actions. Accessible labels: "Move section up", "Move section down", "Move line item up", "Move line item down".
  - [x] 2.4 Add visual feedback during drag: ghost element, drop target indicator, cursor states. Follow WCAG 2.1 AA: drag operations must have keyboard equivalents (AC #4 from UX spec).
  - [x] 2.5 Update `quote-editor-store.ts` Zustand store to track reordering state (`isReordering`, `reorderError`) and handle optimistic position updates.

- [x] Task 3: Enhance inline pricing editing with immediate totals feedback (AC: #1, #3)
  - [x] 3.1 Ensure `quote-structure-editor.tsx` updates section subtotals and grand total optimistically when `unitPriceCents` or `quantity` changes in any line item. Use the existing `calculateLineTotalCents` and `recalculateQuoteTotals` helpers from `types.ts`. The totals must update in real-time before the server action returns.
  - [x] 3.2 Add a live "totals summary" bar at the bottom of the editor showing: grand total, number of sections, number of line items, and a delta indicator when local state differs from last-saved state.
  - [x] 3.3 Use the existing `updateQuoteLineItem` action for pricing changes. Trigger auto-save on blur (field loses focus) or on explicit "Save draft" click. Do NOT auto-save on every keystroke.
  - [x] 3.4 Format currency values using the existing `src/lib/format/currency.ts` helpers. Display in the studio's currency context.

- [x] Task 4: Add preview readiness indicator (AC: #3)
  - [x] 4.1 Create `src/features/quotes/components/preview-readiness-indicator.tsx` component. Computes readiness from current quote state: at least one section, each section has at least one line item, all line items have non-empty names, all `unitPriceCents >= 0`, all `quantity >= 1`, client is associated.
  - [x] 4.2 Show the readiness indicator inline in the editor (below totals summary). Display: "Ready for preview" (green) or "X items need attention" (amber) with a collapsible list of specific issues.
  - [x] 4.3 Each issue links to the relevant section or line item field for correction. Follows the UX spec's Preview Readiness Panel pattern: clicking an issue scrolls to and focuses the relevant field.
  - [x] 4.4 Update readiness dynamically as the user edits — do not require a save to re-evaluate.

- [x] Task 5: Integrate reorder and pricing into the quote detail page (AC: #1, #2, #3, #4)
  - [x] 5.1 Verify `src/app/(workspace)/quotes/[quoteId]/page.tsx` passes all needed props to `QuoteStructureEditor`: reorder callbacks, pricing change handlers, readiness state.
  - [x] 5.2 Ensure the "Save draft" button persists all position changes and pricing updates via `updateQuoteSections` action. After successful save, show success feedback via the existing status banner pattern.
  - [x] 5.3 Add unsaved-changes guard: if the user has reordered items or changed pricing without saving, show a confirmation dialog on navigation away. Reuse `dialog.tsx` and the existing `beforeunload`/`usePathname` pattern from Story 3.3.

- [x] Task 6: Add regression and quality-gate coverage (AC: #1, #2, #3, #4)
  - [x] 6.1 Add action tests for `reorder-quote-sections.ts` covering: auth enforcement, studio scoping, draft-status check, valid reorder, invalid section ID rejection, cross-studio rejection.
  - [x] 6.2 Add action tests for `reorder-quote-line-items.ts` covering: auth, scoping, valid reorder within section, line item not in section rejection, empty array rejection.
  - [x] 6.3 Add schema tests for `reorderQuoteSectionsSchema` and `reorderQuoteLineItemsSchema` in `update-quote-sections-schema.test.ts`: valid input, empty array, duplicate IDs, non-UUID values.
  - [x] 6.4 Add component tests for `quote-structure-editor.tsx` covering: drag-and-drop reorder of sections, keyboard reorder of sections, optimistic totals update on pricing change, readiness indicator updates.
  - [x] 6.5 Add component tests for `quote-editor-section.tsx` covering: drag-and-drop reorder of line items within section, keyboard reorder of line items.
  - [x] 6.6 Add component tests for `preview-readiness-indicator.tsx` covering: ready state, missing section, empty line item name, negative price, missing client.
  - [x] 6.7 Extend `tests/e2e/quotes.spec.ts` to cover: generate content, reorder a section, change a line item price, verify totals update, verify readiness indicator reflects changes, save draft, verify persistence.
  - [x] 6.8 Verify `npm run lint`, `npm run test`, and `npm run build` pass after all changes.

## Dev Notes

- This story builds on Story 3.3 which created the `QuoteStructureEditor` with inline editing for section titles, line item fields, add/remove operations, and basic save. Story 3.4 adds the missing **reordering** and **pricing feedback** capabilities plus a **preview readiness indicator**.
- The `QuoteStructureEditor` (`quote-structure-editor.tsx`) already has optimistic UI for field changes via `useTransition`. Extend this pattern for reordering and totals recalculation.
- The `updateQuoteLineItem` action from 3.3 already handles `unitPriceCents` updates with server-side `lineTotalCents = quantity * unitPriceCents` recalculation. Reuse it for pricing changes.
- The existing `recalculateQuoteTotals(sections)` helper computes grand totals from the sections array. Use it for optimistic totals display.
- The repository's `saveQuoteSections` function (`quotes-repository.ts`) uses delete-and-reinsert for full saves. Position reordering uses granular update actions, not this function.
- The UX design spec defines "Quote Structure Editor" with: section headers, line item rows, inline pricing fields, **reorder controls**, add/remove actions, totals summary. The reorder controls are the primary new capability in this story.
- The UX spec's "Preview Readiness Panel" component informs the readiness indicator design: readiness status, missing items list, warnings, confidence summary, primary action.
- Zustand store (`quote-editor-store.ts`) tracks dirty state and unsaved changes. Add reordering state tracking here.

### Developer Context Section

- Story 3.3 established the editor architecture: `QuoteStructureEditor` (client) -> `QuoteEditorSection` (sub-component) -> inline inputs. Reordering adds drag handles and move buttons at both levels.
- The `QuoteSectionRecord` includes `position: number` and `QuoteLineItemRecord` includes `position: number`. These fields already exist in the DB schema and types. Reordering changes these position values.
- The fallback store uses `structuredClone` for deep-copy isolation. Position updates in the fallback store must maintain sort order consistency.
- Previous code review from 3.3 found: inline validation, keyboard save/reset, source badges, dialog confirmations, Zustand store, unsaved-change guards. All implemented. Continue these patterns.
- The `generateQuoteContent` action sets initial positions when creating sections and line items from service packages. Reordering operates on these initial positions.

### Technical Requirements

- Follow the established auth-first server-action pattern: `requireSession()` + `ensureStudioAccess(...)`, path-aware Zod validation, explicit `ActionResult` envelopes, revalidation of list/detail routes, and normalized not-found behavior for cross-studio access.
- Use the standard ok/error response contract: success `{ ok: true, data }`, failure `{ ok: false, error: { code, message, fieldErrors? } }`.
- Database naming: snake_case in schema, camelCase in application contracts, kebab-case file names.
- Position values use 1-based indexing. After reorder, positions must be contiguous (1, 2, 3, ...).
- All reorder and pricing logic stays inside `src/features/quotes/` and `src/server/db/schema/`. Do not modify the service-packages feature.
- Zustand store for editor state must remain scoped to `src/features/quotes/store/`. Do not introduce global Zustand state.
- Drag-and-drop must have keyboard equivalents per WCAG 2.1 AA. Do not rely solely on drag interactions.

### Architecture Compliance

- Feature-first placement: reorder actions in `src/features/quotes/server/actions/`, components in `src/features/quotes/components/`, store in `src/features/quotes/store/`, schemas in `src/features/quotes/schemas/`.
- Server-first composition: the detail page loads data on the server and hands interactivity to the client editor component.
- Preserve server-side authz, normalized not-found behavior, and sanitized `backTo` navigation handling consistent with the existing detail page.
- Normalized relational modeling: `quote_sections` and `quote_line_items` are separate tables with explicit foreign keys. Reordering only updates `position` columns on these tables.
- Zustand store remains scoped to `src/features/quotes/store/quote-editor-store.ts`. No global state.

### Library/Framework Requirements

- Use the current project-approved stack:
  - `next` `16.1.6` in repo (latest: `16.2.1`)
  - `react` and `react-dom` `19.2.3` in repo (latest: `19.2.4`)
  - `next-auth` `4.24.13`
  - `drizzle-orm` `0.45.1`
  - `drizzle-kit` `0.31.9` in repo (latest: `0.31.10`)
  - `zod` `4.3.6`
  - `@playwright/test` `1.58.2`
  - `vitest` `4.1.0`
  - `zustand` `5.0.11`
- Add `@dnd-kit/core` and `@dnd-kit/sortable` for drag-and-drop if not already in `package.json`. These are the standard React drag-and-drop libraries compatible with React 19.
- No other dependency upgrades are required for this story.
- Use `useTransition` and Zustand for the editor component's local and workflow state respectively.

### Project Structure Notes

- New files:
  - `src/features/quotes/server/actions/reorder-quote-sections.ts`
  - `src/features/quotes/server/actions/reorder-quote-line-items.ts`
  - `src/features/quotes/components/preview-readiness-indicator.tsx`
- Files to update:
  - `src/features/quotes/schemas/update-quote-sections-schema.ts` (add reorder schemas)
  - `src/features/quotes/schemas/update-quote-sections-schema.test.ts` (add reorder schema tests)
  - `src/features/quotes/components/quote-structure-editor.tsx` (add drag-and-drop sections, totals bar, readiness)
  - `src/features/quotes/components/quote-structure-editor.test.tsx` (reorder and pricing tests)
  - `src/features/quotes/components/quote-editor-section.tsx` (add drag-and-drop line items)
  - `src/features/quotes/components/quote-editor-section.test.tsx` (reorder tests)
  - `src/features/quotes/store/quote-editor-store.ts` (reorder state)
  - `src/features/quotes/store/quote-editor-store.test.ts` (reorder state tests)
  - `src/app/(workspace)/quotes/[quoteId]/page.tsx` (pass new props, readiness)
  - `tests/e2e/quotes.spec.ts` (reorder and pricing e2e)
  - `package.json` (add @dnd-kit if needed)
- Architecture reference: `src/features/quotes/` feature folder per architecture.md Project Structure section

### File Structure Requirements

- Must add:
  - `src/features/quotes/server/actions/reorder-quote-sections.ts`
  - `src/features/quotes/server/actions/reorder-quote-sections.test.ts`
  - `src/features/quotes/server/actions/reorder-quote-line-items.ts`
  - `src/features/quotes/server/actions/reorder-quote-line-items.test.ts`
  - `src/features/quotes/components/preview-readiness-indicator.tsx`
  - `src/features/quotes/components/preview-readiness-indicator.test.tsx`
- Must update:
  - `src/features/quotes/schemas/update-quote-sections-schema.ts`
  - `src/features/quotes/schemas/update-quote-sections-schema.test.ts`
  - `src/features/quotes/components/quote-structure-editor.tsx`
  - `src/features/quotes/components/quote-structure-editor.test.tsx`
  - `src/features/quotes/components/quote-editor-section.tsx`
  - `src/features/quotes/components/quote-editor-section.test.tsx`
  - `src/features/quotes/store/quote-editor-store.ts`
  - `src/features/quotes/store/quote-editor-store.test.ts`
  - `src/app/(workspace)/quotes/[quoteId]/page.tsx`
  - `tests/e2e/quotes.spec.ts`

### Testing Requirements

- Cover reorder actions: auth enforcement, studio scoping, draft-status check, valid reorder, invalid ID rejection, cross-studio rejection, empty array rejection.
- Cover reorder schemas: valid input, empty array, duplicate IDs, non-UUID values.
- Cover editor component: drag-and-drop reorder of sections and line items, keyboard reorder, optimistic totals update on pricing change, readiness indicator state changes.
- Cover preview-readiness-indicator: ready state, missing section, empty line item name, negative price, quantity < 1, missing client.
- Verify `npm run lint`, `npm run test`, and `npm run build` pass.

### Previous Story Intelligence

- Story 3.3 created the full quote editing foundation:
  - `QuoteStructureEditor` and `QuoteEditorSection` components with inline editing for section titles, line item fields (name, content, quantity, unitLabel, unitPriceCents), add/remove sections and line items.
  - 7 server actions: `update-quote-sections` (full save), `update-quote-section`, `update-quote-line-item`, `add-quote-section`, `remove-quote-section`, `add-quote-line-item`, `remove-quote-line-item`.
  - `quote-editor-store.ts` Zustand store for dirty state tracking, unsaved changes.
  - Zod schemas for all input types in `update-quote-sections-schema.ts`.
  - Repository helpers: `loadQuoteSectionsForEditing`, `updateQuoteTimestamp`.
  - Shared `dialog.tsx` for confirmation prompts.
  - Source-vs-instance labeling via `sourceServicePackageId` badge.
  - Unsaved-change navigation guards (`beforeunload`, `usePathname`/`useRouter`).
- Story 3.2 created the quote generation flow: types (`QuoteSectionRecord`, `QuoteLineItemRecord`), DB schema (`quote_sections`, `quote_line_items`), migration, repository functions (`saveQuoteSections`, `deleteQuoteSections`), `generateQuoteContent` action, `GenerateQuoteButton`, `QuoteStructureView` (read-only).
- Story 3.1 created the quote creation flow: types, schema, migration, validation, store, repository, action, queries, setup form, route pages.
- Key learnings from 3.3 review: inline validation must be client-side before server calls; keyboard navigation must cover save/reset; destructive actions need confirmation dialogs; Zustand store for complex editor state; unsaved-change guards prevent data loss. Apply all these patterns to reorder and pricing features.
- The `updateQuoteLineItem` action already handles `unitPriceCents` and recalculates `lineTotalCents` server-side. Pricing editing via this action is already functional — the gap is **immediate optimistic totals feedback** in the UI and **preview readiness tracking**.

### Git Intelligence Summary

- Commit `7feed99` added shared dialog component for quote editor confirmations.
- Commit `b12d342` implemented Stories 3.1-3.3: full quote creation, generation, and editing flow. Added ~60 files across types, schema, migration, repository, store, actions, components, tests, and e2e.
- The `QuoteStructureEditor` component (`quote-structure-editor.tsx`) already exists with add/remove capabilities. Story 3.4 extends it with reorder controls.
- The `quote-editor-store.ts` Zustand store already tracks dirty state. Story 3.4 adds reordering state.
- The `update-quote-sections-schema.ts` already has section and line item validation schemas. Story 3.4 adds reorder-specific schemas.

### Latest Tech Information

- `next`: `16.1.6` in repo, latest `16.2.1` — no upgrade needed for this story
- `react`/`react-dom`: `19.2.3` in repo, latest `19.2.4` — no upgrade needed
- `next-auth`: `4.24.13` — current
- `drizzle-orm`: `0.45.1` — current
- `drizzle-kit`: `0.31.9` in repo, latest `0.31.10` — no upgrade needed
- `zod`: `4.3.6` — current
- `zustand`: `5.0.11` — current
- `@playwright/test`: `1.58.2` — current
- `vitest`: `4.1.0` — current
- `@dnd-kit/core` and `@dnd-kit/sortable`: add latest stable versions for React 19 drag-and-drop support
- No other dependency upgrades required for this story.

### Project Context Reference

- No `project-context.md` exists in the repository.
- Treat the authoritative context for this story as: `sprint-status.yaml`, the core planning artifacts (`prd.md`, `architecture.md`, `ux-design-specification.md`, `epics.md`), Stories 3.1–3.3, and the current quotes implementation.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.4: Adjust Quote Pricing, Ordering, and Totals] - acceptance criteria and story intent.
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 3: Guided Quote Creation, Editing, and Preview] - epic scope and FR coverage (FR18, FR19).
- [Source: _bmad-output/planning-artifacts/prd.md#Quote Creation & Editing] - FR18 (edit pricing), FR19 (add/remove/reorder sections).
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture] - PostgreSQL, Drizzle ORM, `quote_sections.position`, `quote_line_items.position` fields.
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] - Zustand 5.0.11 for quote editor workflow state; server-first rendering.
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries] - `src/features/quotes/`, feature-first placement.
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Quote Structure Editor] - section headers, line item rows, inline pricing fields, **reorder controls**, add/remove actions, totals summary, keyboard accessibility, source-vs-instance boundaries.
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Preview Readiness Panel] - readiness status, missing items list, warnings, confidence summary, primary action, click-to-correct.
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Form Patterns] - inline validation before hard stops, immediate recalculation feedback, grouped sections.
- [Source: _bmad-output/implementation-artifacts/3-3-edit-quote-sections-and-line-items.md] - previous story: types, schema, repository functions, editor components, Zustand store, actions, and patterns to follow.
- [Source: src/features/quotes/types.ts] - `QuoteSectionRecord`, `QuoteLineItemRecord`, `calculateLineTotalCents`, `recalculateQuoteTotals`.
- [Source: src/features/quotes/server/quotes-repository.ts] - repository functions for section/line item persistence.
- [Source: src/features/quotes/components/quote-structure-editor.tsx] - existing editor component to extend.
- [Source: src/features/quotes/components/quote-editor-section.tsx] - existing section sub-component to extend.
- [Source: src/features/quotes/store/quote-editor-store.ts] - existing Zustand store to extend.
- [Source: src/features/quotes/schemas/update-quote-sections-schema.ts] - existing schemas to extend.
- [Source: src/features/quotes/server/actions/update-quote-line-item.ts] - existing action for pricing updates.
- [Source: src/lib/format/currency.ts] - currency formatting helpers.
- [Source: src/lib/validation/action-result.ts] - standard `ActionResult<T>` envelope contract.

## Dev Agent Record

### Agent Model Used

mimo-v2-pro-free

### Debug Log References

- `npm run test` (241 tests, 53 test files, all passed)
- `npm run lint` (0 errors, 0 warnings)
- `NEXTAUTH_URL="https://example.com" STUDIO_OWNER_EMAIL="studio@example.com" STUDIO_OWNER_PASSWORD="local-build-password" npm run build` (passed)

### Completion Notes List

- Installed `@dnd-kit/core`, `@dnd-kit/sortable`, and `@dnd-kit/utilities` for drag-and-drop support.
- Added `reorderQuoteSectionsSchema` and `reorderQuoteLineItemsSchema` Zod schemas with duplicate-ID validation.
- Created `reorderQuoteSections` and `reorderQuoteLineItems` server actions following auth-first pattern with draft-status checks and position normalization.
- Added `reorderSections` and `reorderLineItems` actions to the Zustand store for optimistic local state updates.
- Rewrote `QuoteStructureEditor` with DnD context wrapping sections via `SortableContext`, drag handles (grip icon), keyboard move buttons (up/down arrows), totals summary bar with delta indicator, and `PreviewReadinessIndicator`.
- Updated `QuoteEditorSection` to accept and render `onMoveLineItemUp`/`onMoveLineItemDown` callbacks as up/down arrow buttons next to each line item.
- Created `PreviewReadinessIndicator` component that dynamically evaluates readiness (client, sections, line items, names, prices, quantities) and provides click-to-focus navigation.
- Updated `quote/[quoteId]/page.tsx` to pass `clientId` prop to editor.
- Added 7 new tests to reorder action test file covering auth, scoping, draft-status, valid reorder, invalid IDs, and cross-studio rejection.
- Added 6 new schema tests for reorder schemas (valid input, empty array, duplicate IDs).
- Added 3 new store tests for reorder (section reorder, line item reorder, mismatched IDs).
- Updated existing editor and section component tests with new props and reorder action mocks.
- Added review-fix coverage for UUID-only reorder payloads, section drag persistence, line-item drag persistence, blur-triggered line-item saves, reorder-state tracking, preview readiness edge cases, and quote flow persistence after reorder/pricing edits.
- Fixed review findings by preventing unsaved local edits from being overwritten during add/remove/reorder operations, wiring line-item pricing blur saves through `updateQuoteLineItem`, centralizing quote currency formatting in a shared helper, and targeting readiness links to the exact invalid field.
- All 241 tests pass, lint clean, build verified.

### File List

- package.json
- package-lock.json
- src/features/quotes/schemas/update-quote-sections-schema.ts
- src/features/quotes/schemas/update-quote-sections-schema.test.ts
- src/features/quotes/server/actions/reorder-quote-sections.ts
- src/features/quotes/server/actions/reorder-quote-line-items.ts
- src/features/quotes/server/actions/reorder-quote-actions.test.ts
- src/features/quotes/store/quote-editor-store.ts
- src/features/quotes/store/quote-editor-store.test.ts
- src/features/quotes/components/quote-structure-view.tsx
- src/features/quotes/components/quote-structure-editor.tsx
- src/features/quotes/components/quote-structure-editor.test.tsx
- src/features/quotes/components/quote-editor-section.tsx
- src/features/quotes/components/quote-editor-section.test.tsx
- src/features/quotes/components/preview-readiness-indicator.tsx
- src/features/quotes/components/preview-readiness-indicator.test.tsx
- src/lib/format/currency.ts
- src/app/(workspace)/quotes/[quoteId]/page.tsx
- tests/e2e/quotes.spec.ts

## Senior Developer Review (AI)

### Reviewer

- chuck chuck

### Review Date

- 2026-03-21

### Outcome

- Approved after fixes

### Summary

- Prevented silent data loss by auto-persisting valid local edits before reorder/add/remove mutations and by routing line-item blur saves through the existing `updateQuoteLineItem` action.
- Added true line-item drag-and-drop, reorder state tracking, shared currency formatting, UUID validation for reorder payloads, and exact-focus readiness issue links.
- Expanded automated coverage across schemas, actions, store behavior, component drag/blur flows, readiness edge cases, and the quote e2e workflow; lint, test, and build verification all pass.

### Change Log

- 2026-03-21: Senior developer review fixes applied for Story 3.4: prevented unsaved-edit overwrite during reorder/add/remove flows, added line-item drag-and-drop and blur-triggered line-item saves, enforced UUID reorder validation, centralized quote currency formatting in `src/lib/format/currency.ts`, improved readiness issue targeting, expanded component/store/schema/e2e coverage, and verified lint/test/build. Status: done.
