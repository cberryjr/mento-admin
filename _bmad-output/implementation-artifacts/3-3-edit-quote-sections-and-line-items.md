# Story 3.3: Edit Quote Sections and Line Items

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a studio owner,
I want to edit generated quote sections and line items,
so that I can tailor the quote to the specific client opportunity.

## Acceptance Criteria

1. **Given** a generated quote exists **When** the user edits section content or line-item details **Then** the quote instance is updated successfully **And** the underlying service package source records remain unchanged.

2. **Given** the user needs to add or remove quote content **When** they add a section or line item, or remove an existing one **Then** the quote structure updates correctly **And** the revised structure is reflected in the editing surface.

3. **Given** required content becomes incomplete during editing **When** the user leaves a section or line item in an invalid state **Then** inline validation identifies the affected area **And** the user can continue correcting the quote without losing draft continuity.

4. **Given** the quote editor is used with keyboard navigation **When** the user moves through editable sections and line items **Then** the editing flow remains accessible and understandable **And** source-versus-instance boundaries stay explicit in the UI.

## Tasks / Subtasks

- [x] Task 1: Add input types and update validation for quote editing (AC: #1, #3)
  - [x] 1.1 Add `QuoteSectionInput` and `QuoteLineItemInput` types to `src/features/quotes/types.ts` covering `id` (optional for new items), `title`, `content`, `name`, `quantity`, `unitLabel`, `unitPriceCents`, `position`. Include `sourceServicePackageId` as optional on section input to preserve source tracking.
  - [x] 1.2 Create Zod validation schemas in `src/features/quotes/schemas/update-quote-sections-schema.ts`: `updateQuoteSectionSchema` validating section title/content are non-empty strings, and `updateQuoteLineItemSchema` validating name is non-empty, quantity >= 1, unitPriceCents >= 0, position >= 1. Include `quoteId` and full `sections` array in the top-level `updateQuoteSectionsSchema`.
  - [x] 1.3 Add `calculateLineTotalCents(quantity, unitPriceCents)` and `recalculateQuoteTotals(sections)` helper functions to `src/features/quotes/types.ts`. Ensure line totals and section subtotals are always recomputed server-side from quantity × unit price.

- [x] Task 2: Implement update server action and repository functions (AC: #1, #2)
  - [x] 2.1 Create `src/features/quotes/server/actions/update-quote-sections.ts` as a `"use server"` action following the auth-first pattern: `requireSession()`, `ensureStudioAccess(...)`, load quote by ID, verify studio ownership, verify quote is in `draft` status, validate input with Zod, recalculate line totals server-side, call `saveQuoteSections` (already exists), update `updatedAt` timestamp, `revalidatePath`, return `ActionResult<{ quote: QuoteDetailRecord }>`.
  - [x] 2.2 Add per-section update action `src/features/quotes/server/actions/update-quote-section.ts` for updating a single section's title and content. Follow same auth-first pattern. Validates section belongs to the quote. Returns updated quote.
  - [x] 2.3 Add per-line-item update action `src/features/quotes/server/actions/update-quote-line-item.ts` for updating a single line item's name, content, quantity, unitLabel, unitPriceCents. Recalculates `lineTotalCents` server-side. Follow same auth-first pattern. Returns updated quote.
  - [x] 2.4 Add `addQuoteSection` action in `src/features/quotes/server/actions/add-quote-section.ts` that creates a new empty section with a generated UUID, default title, position at end of list, and returns updated quote.
  - [x] 2.5 Add `removeQuoteSection` action in `src/features/quotes/server/actions/remove-quote-section.ts` that removes a section and its line items from the quote, repositions remaining sections, and returns updated quote.
  - [x] 2.6 Add `addQuoteLineItem` action in `src/features/quotes/server/actions/add-quote-line-item.ts` that creates a new line item under a specific section with default name, quantity 1, position at end of section's line items, and returns updated quote.
  - [x] 2.7 Add `removeQuoteLineItem` action in `src/features/quotes/server/actions/remove-quote-line-item.ts` that removes a line item, repositions remaining items, recalculates totals, and returns updated quote.

- [x] Task 3: Build the Quote Structure Editor component (AC: #1, #2, #3, #4)
  - [x] 3.1 Create `src/features/quotes/components/quote-structure-editor.tsx` as a `"use client"` component. Renders editable sections with inline text inputs for section title and content. Each section expands to show its line items in an editable table with inline inputs for name, content, quantity, unit label, and unit price. Use `useTransition` for save operations. Display section subtotals and grand total that update immediately when inputs change (optimistic UI).
  - [x] 3.2 Add inline validation feedback in the editor: highlight fields with invalid values (empty name, negative quantity) with red borders and error text. Disable save when validation fails. Use the Zod schemas from Task 1 for client-side pre-validation before calling server actions.
  - [x] 3.3 Add "Add section" and "Add line item" buttons in the editor. "Add section" appends a new section at the bottom. "Add line item" per section appends a new item at the bottom of that section. Both trigger server actions and update the local state on success.
  - [x] 3.4 Add "Remove section" and "Remove line item" buttons with confirmation via the existing `dialog.tsx` component pattern. Removal shows a brief confirmation prompt before calling the server action.
  - [x] 3.5 Create `src/features/quotes/components/quote-editor-section.tsx` as a sub-component representing one editable section with its line items table. Accepts callbacks for update, add-item, remove-item, and remove-section operations.
  - [x] 3.6 Add explicit "source vs instance" labeling: each section shows a small badge indicating the source service package name (loaded from the quote's `sourceServicePackageId` mapped to package name). This keeps the boundary visible per AC #4.

- [x] Task 4: Integrate editor into the quote detail page (AC: #1, #4)
  - [x] 4.1 Update `src/app/(workspace)/quotes/[quoteId]/page.tsx` to show the `QuoteStructureEditor` (instead of read-only `QuoteStructureView`) when the quote has generated content AND is in `draft` status. Keep the read-only `QuoteStructureView` for non-draft quotes.
  - [x] 4.2 Add a "Save draft" button that calls the full `updateQuoteSections` action with the current editor state. Show success/error feedback via a status banner similar to the existing `saved === "created"` pattern.
  - [x] 4.3 Ensure keyboard navigation works: Tab moves between fields, Enter saves current section, Escape cancels edit. Follow WCAG 2.1 AA patterns from the project's existing form components.
  - [x] 4.4 Add a confirmation dialog when navigating away from a quote with unsaved changes. Use `beforeunload` for browser close and a `usePathname`/`useRouter` pattern for in-app navigation.

- [x] Task 5: Add regression and quality-gate coverage (AC: #1, #2, #3, #4)
  - [x] 5.1 Add type and validation tests for `QuoteSectionInput`, `QuoteLineItemInput`, and the Zod schemas in `src/features/quotes/schemas/update-quote-sections-schema.test.ts`. Cover valid inputs, empty title rejection, negative quantity rejection, and field error mapping.
  - [x] 5.2 Add action tests for `update-quote-sections.ts` covering auth enforcement, studio scoping, draft-status check, section and line item validation, successful update with recalculated totals, cross-studio rejection, non-draft rejection.
  - [x] 5.3 Add action tests for `add-quote-section.ts`, `remove-quote-section.ts`, `add-quote-line-item.ts`, `remove-quote-line-item.ts` covering auth, scoping, position reordering, and empty-section edge cases.
  - [x] 5.4 Add component tests for `quote-structure-editor.tsx` covering editable fields, add/remove interactions, inline validation feedback, totals recalculation, save button behavior, and keyboard navigation.
  - [x] 5.5 Add component tests for `quote-editor-section.tsx` covering section rendering, line item editing, add/remove item callbacks, and source badge display.
  - [x] 5.6 Extend `tests/e2e/quotes.spec.ts` to cover the editing flow: generate content, edit section title, edit line item quantity, add a new section, remove a line item, save draft, verify totals update.
  - [x] 5.7 Verify `npm run lint`, `npm run test`, and `npm run build` pass after all changes.

## Dev Notes

- This story builds on Story 3.2 which generated quote sections and line items from service packages. The quote now has `sections: QuoteSectionRecord[]` with nested `lineItems: QuoteLineItemRecord[]` ready for editing.
- The existing `QuoteStructureView` component is read-only. This story creates a new editable `QuoteStructureEditor` component and conditionally swaps it in for draft quotes.
- The UX design spec defines the "Quote Structure Editor" component with: section headers, line item rows, inline pricing fields, reorder controls, add/remove actions, totals summary. Reordering is handled in Story 3.4 — this story focuses on content editing only.
- `lineTotalCents` must always be recalculated server-side as `quantity * unitPriceCents`. Do NOT accept totals from the client.
- The architecture specifies Zustand for the quote editor workflow state. This story introduces Zustand for tracking dirty state, unsaved changes, and optimistic field updates.
- Source service packages must remain completely unchanged. Editing only affects the quote's `quote_sections` and `quote_line_items` tables.
- This story uses the existing `saveQuoteSections` repository function which deletes-and-reinserts. For granular per-section/per-item updates, new repository functions may be needed for efficiency.

### Developer Context Section

- The `QuoteSectionRecord` type includes `sourceServicePackageId` which links back to the service package the section was generated from. Use this to display source-vs-instance labeling.
- The repository's `saveQuoteSections` function (`quotes-repository.ts:417`) performs a delete-all-and-reinsert pattern within a transaction. This is fine for full saves but wasteful for single-field edits. Add granular update functions for per-section and per-line-item saves.
- The fallback store uses `structuredClone` for deep-copy isolation. Granular update functions must follow this pattern.
- The `QuoteStructureView` component (`quote-structure-view.tsx`) uses `calculateQuoteTotalCents` and local `calculateSectionTotal` for display. Reuse these for the editor's optimistic totals display.
- Previous code review from Story 3.2 found: success feedback gap (fixed), test name mismatch (fixed). Apply lessons by ensuring the editor provides explicit save confirmation and test assertions match test intent.

### Technical Requirements

- Follow the established auth-first server-action pattern: `requireSession()` + `ensureStudioAccess(...)`, path-aware Zod validation, explicit `ActionResult` envelopes, revalidation of list/detail routes, and normalized not-found behavior for cross-studio access.
- Use the standard ok/error response contract: success `{ ok: true, data }`, failure `{ ok: false, error: { code, message, fieldErrors? } }`.
- Database naming: snake_case in schema, camelCase in application contracts, kebab-case file names.
- Use `randomUUID()` from `node:crypto` for server-generated IDs (new sections, new line items).
- All quote editing logic stays inside `src/features/quotes/` and `src/server/db/schema/`. Do not modify the service-packages feature.
- Zustand store for editor state must be scoped to `src/features/quotes/store/`. Do not introduce global Zustand state.

### Architecture Compliance

- Feature-first placement: editor actions in `src/features/quotes/server/actions/`, components in `src/features/quotes/components/`, store in `src/features/quotes/store/`, schemas in `src/features/quotes/schemas/`.
- Server-first composition: the detail page loads data on the server and hands interactivity to the client editor component.
- Preserve server-side authz, normalized not-found behavior, and sanitized `backTo` navigation handling consistent with the existing detail page.
- Normalized relational modeling: sections and line items are in separate tables with explicit foreign keys. Editing only touches these tables, never the source service packages.

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
  - `zustand` `5.0.11` (already in repo for quote editor workflow state)
- No dependency upgrades are required for this story.
- Use `useTransition` and Zustand for the editor component's local and workflow state respectively.
- Do NOT introduce Zustand for the generate button (that stays local React state); use Zustand only for the editor's complex dirty-tracking and optimistic-update workflow.

### Project Structure Notes

- New files:
  - `src/features/quotes/schemas/update-quote-sections-schema.ts`
  - `src/features/quotes/server/actions/update-quote-sections.ts`
  - `src/features/quotes/server/actions/update-quote-section.ts`
  - `src/features/quotes/server/actions/update-quote-line-item.ts`
  - `src/features/quotes/server/actions/add-quote-section.ts`
  - `src/features/quotes/server/actions/remove-quote-section.ts`
  - `src/features/quotes/server/actions/add-quote-line-item.ts`
  - `src/features/quotes/server/actions/remove-quote-line-item.ts`
  - `src/features/quotes/store/quote-editor-store.ts`
  - `src/features/quotes/components/quote-structure-editor.tsx`
  - `src/features/quotes/components/quote-editor-section.tsx`
- Files to update:
  - `src/features/quotes/types.ts` (add QuoteSectionInput, QuoteLineItemInput, recalculation helpers)
  - `src/features/quotes/types.test.ts` (new type tests)
  - `src/features/quotes/server/quotes-repository.ts` (add granular update functions)
  - `src/features/quotes/server/quotes-repository.test.ts` (new repository tests)
  - `src/app/(workspace)/quotes/[quoteId]/page.tsx` (swap read-only view for editor in draft state)
  - `tests/e2e/quotes.spec.ts` (add editing flow e2e)
- Architecture reference: `src/features/quotes/` feature folder per architecture.md Project Structure section

### File Structure Requirements

- Must add:
  - `src/features/quotes/schemas/update-quote-sections-schema.ts`
  - `src/features/quotes/schemas/update-quote-sections-schema.test.ts`
  - `src/features/quotes/server/actions/update-quote-sections.ts`
  - `src/features/quotes/server/actions/update-quote-sections.test.ts`
  - `src/features/quotes/server/actions/update-quote-section.ts`
  - `src/features/quotes/server/actions/update-quote-line-item.ts`
  - `src/features/quotes/server/actions/add-quote-section.ts`
  - `src/features/quotes/server/actions/remove-quote-section.ts`
  - `src/features/quotes/server/actions/add-quote-line-item.ts`
  - `src/features/quotes/server/actions/remove-quote-line-item.ts`
  - `src/features/quotes/server/actions/add-remove-quote-actions.test.ts`
  - `src/features/quotes/store/quote-editor-store.ts`
  - `src/features/quotes/store/quote-editor-store.test.ts`
  - `src/features/quotes/components/quote-structure-editor.tsx`
  - `src/features/quotes/components/quote-structure-editor.test.tsx`
  - `src/features/quotes/components/quote-editor-section.tsx`
  - `src/features/quotes/components/quote-editor-section.test.tsx`
- Must update:
  - `src/features/quotes/types.ts` (input types, recalculation helpers)
  - `src/features/quotes/types.test.ts`
  - `src/features/quotes/server/quotes-repository.ts` (granular update functions)
  - `src/features/quotes/server/quotes-repository.test.ts`
  - `src/app/(workspace)/quotes/[quoteId]/page.tsx` (editor integration)
  - `tests/e2e/quotes.spec.ts`

### Testing Requirements

- Cover Zod schemas for section and line item input validation: valid inputs, empty title, negative quantity, invalid position.
- Cover update-quote-sections action: auth enforcement, studio scoping, draft-status check, section and line item validation, successful update with recalculated totals, cross-studio rejection, non-draft rejection.
- Cover add/remove section and line item actions: auth, scoping, position reordering, empty-section edge cases, cascading delete of line items when section removed.
- Cover editor component: editable fields, add/remove interactions, inline validation feedback, totals recalculation, save button behavior, keyboard navigation.
- Cover editor-section component: section rendering, line item editing, add/remove item callbacks, source badge display.
- Verify `npm run lint`, `npm run test`, and `npm run build` pass.

### Previous Story Intelligence

- Story 3.2 created the quote generation flow: types (`QuoteSectionRecord`, `QuoteLineItemRecord`), DB schema (`quote_sections`, `quote_line_items`), migration (`0006_quote_sections.sql`), repository functions (`saveQuoteSections`, `deleteQuoteSections`, `setQuoteGeneratedAt`), `generateQuoteContent` action, `GenerateQuoteButton`, `QuoteStructureView` (read-only), and the detail page.
- The `QuoteDetailRecord` includes `sections: QuoteSectionRecord[]` and `generatedAt: string | null`. Sections are loaded by `getQuoteById` in the repository.
- The `QuoteSectionRecord` has `sourceServicePackageId` field linking back to the source service package. Use this for source-vs-instance labeling.
- The repository's `saveQuoteSections` function (`quotes-repository.ts:417-473`) deletes all existing line items and sections for a quote, then reinserts. This is suitable for full saves but inefficient for single-field edits. Add granular functions.
- The fallback store uses three maps: `__mentoQuotesStore`, `__mentoQuoteSectionsStore` (sections without line items), `__mentoQuoteLineItemsStore` (line items keyed by section ID). `writeQuoteSectionsToStore` splits sections and line items across these maps.
- Code review from 3.2 found: Task 2.1 file claim was inaccurate (functions were consolidated into `quotes-repository.ts`), test "rejects generation for non-draft quotes" didn't actually test rejection, success feedback was missing, unused import lint warning. All fixed.

### Git Intelligence Summary

- Story 3.2 was implemented (not yet committed) adding the full generation flow: types, schema, migration, store, repository extensions, generate action, components, detail page, and tests.
- Story 3.1 was implemented (not yet committed) adding the quote creation flow: types, schema, migration, validation, store, repository, action, queries, setup form, and route pages.
- Commit `13c72bf` implemented Story 2.6 (service catalog taxonomy and complexity matrix).
- Commit `e3a819b` implemented Story 2.4 (structured service package authoring) — established the sections/line items pattern this story follows.
- The `quote_structure_editor` component name appears in the architecture project structure at `src/features/quotes/components/quote-structure-editor.tsx`.

### Latest Tech Information

- Latest registry check results:
  - `next`: `16.2.0` latest, repo pinned to `16.1.6`
  - `react`: `19.2.4` latest, repo pinned to `19.2.3`
  - `react-dom`: `19.2.4` latest, repo pinned to `19.2.3`
  - `next-auth`: `4.24.13` latest and current in repo
  - `drizzle-orm`: `0.45.1` latest and current in repo
  - `drizzle-kit`: `0.31.10` latest, repo pinned to `0.31.9`
  - `zod`: `4.3.6` latest and current in repo
  - `zustand`: `5.0.11` latest and current in repo
  - `@playwright/test`: `1.58.2` latest and current in repo
  - `vitest`: `4.1.0` latest and current in repo
- No dependency upgrades are required for this story.
- Continue treating Server Actions as public entry points: authenticate and authorize inside the action, validate all untrusted input, keep repository and DB access behind server-only modules.

### Project Context Reference

- No `project-context.md` exists in the repository.
- Treat the authoritative context for this story as: `sprint-status.yaml`, the core planning artifacts (`prd.md`, `architecture.md`, `ux-design-specification.md`, `epics.md`), Stories 2.4–3.2, and the current service-packages and quotes implementation.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.3: Edit Quote Sections and Line Items] - acceptance criteria and story intent.
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 3: Guided Quote Creation, Editing, and Preview] - epic scope and FR coverage (FR16, FR17, FR19).
- [Source: _bmad-output/planning-artifacts/prd.md#Quote Creation & Editing] - FR16 (edit without changing sources), FR17 (edit line items), FR19 (add/remove/reorder sections).
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture] - PostgreSQL, Drizzle ORM, normalized relational schema, `Quote section` and `Quote line item` as primary modeled entities.
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] - Zustand 5.0.11 for quote editor workflow state; server-first rendering with client components for interactivity.
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries] - `src/features/quotes/`, `src/features/quotes/store/quote-draft-store.ts`, feature-first placement.
- [Source: _bmad-output/planning-artifacts/architecture.md#Requirements to Structure Mapping] - Quote Creation & Editing (FR14-FR21) -> `src/features/quotes`.
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Quote Structure Editor] - section headers, line item rows, inline pricing fields, add/remove actions, totals summary, keyboard accessibility, source-vs-instance boundaries.
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Form Patterns] - inline validation before hard stops, immediate recalculation feedback, grouped sections.
- [Source: _bmad-output/implementation-artifacts/3-2-generate-quote-content-from-selected-service-packages.md] - previous story context: types, schema, repository functions, QuoteStructureView, GenerateQuoteButton, and detail page patterns.
- [Source: _bmad-output/implementation-artifacts/3-1-start-a-new-quote-with-client-association-and-service-package-selection.md] - quote types, schema, repository, store patterns to follow.
- [Source: src/features/quotes/types.ts] - `QuoteSectionRecord`, `QuoteLineItemRecord`, `QuoteDetailRecord`, `calculateQuoteTotalCents`.
- [Source: src/features/quotes/server/quotes-repository.ts#saveQuoteSections] - delete-and-reinsert pattern for section persistence (lines 417-473).
- [Source: src/features/quotes/server/store/quotes-store.ts] - fallback store with `structuredClone`, `writeQuoteSectionsToStore`, `deleteQuoteSectionsFromStore`.
- [Source: src/features/quotes/components/quote-structure-view.tsx] - read-only structure display component to be replaced/extended by the editor.
- [Source: src/features/quotes/components/generate-quote-button.tsx] - `useTransition` pattern for client components calling server actions.
- [Source: src/components/ui/dialog.tsx] - shared dialog component for confirmation prompts.
- [Source: src/lib/validation/action-result.ts] - standard `ActionResult<T>` envelope contract.

## Dev Agent Record

### Agent Model Used

openai/gpt-5.4

### Debug Log References

- `npm run lint` (0 errors, 0 warnings)
- `npm run test` (209 tests, 51 test files, all passed)
- `NEXTAUTH_URL="https://example.com" STUDIO_OWNER_EMAIL="studio@example.com" STUDIO_OWNER_PASSWORD="local-build-password" npm run build` (passed)

### Completion Notes List

- Added `QuoteLineItemInput`, `QuoteSectionInput`, and `UpdateQuoteSectionsInput` types to `types.ts` along with `calculateLineTotalCents` and `recalculateQuoteTotals` helpers.
- Created Zod validation schemas in `update-quote-sections-schema.ts` covering section titles, line item names, quantity >= 1, unitPriceCents >= 0, plus add/remove action schemas.
- Created 7 server actions: `update-quote-sections.ts` (full save), `update-quote-section.ts`, `update-quote-line-item.ts`, `add-quote-section.ts`, `remove-quote-section.ts`, `add-quote-line-item.ts`, `remove-quote-line-item.ts`. All follow the auth-first pattern with requireSession(), ensureStudioAccess(), draft-status check, and ActionResult return.
- Created `QuoteStructureEditor` client component with optimistic UI for editing sections and line items. Includes add/remove section and line item buttons with inline confirmation, save draft button, grand total display, and source-vs-instance labeling.
- Created `QuoteEditorSection` sub-component with inline inputs for section title/content and editable table for line items (name, content, quantity, unit label, unit price).
- Updated the quote detail page to show `QuoteStructureEditor` for draft quotes with generated content, and `QuoteStructureView` for non-draft quotes.
- Added repository helpers `loadQuoteSectionsForEditing` and `updateQuoteTimestamp` to `quotes-repository.ts`.
- Fixed the review findings by adding inline client-side validation, keyboard save/reset handling, shared dialog confirmations, source-package name badges, unsaved-change navigation guards, and a Zustand-backed quote editor store.
- Expanded automated coverage for update actions, add/remove actions, quote editor store behavior, component interactions, and the Story 3.3 e2e editing flow.
- All 209 tests pass, lint clean (0 errors, 0 warnings), and build verification passes with explicit review env overrides.

### File List

- package-lock.json
- package.json
- src/components/ui/dialog.tsx
- src/features/quotes/types.ts
- src/features/quotes/types.test.ts
- src/features/quotes/schemas/update-quote-sections-schema.ts
- src/features/quotes/schemas/update-quote-sections-schema.test.ts
- src/features/quotes/server/quotes-repository.ts
- src/features/quotes/server/actions/update-quote-sections.ts
- src/features/quotes/server/actions/update-quote-sections.test.ts
- src/features/quotes/server/actions/update-quote-section.ts
- src/features/quotes/server/actions/update-quote-line-item.ts
- src/features/quotes/server/actions/add-quote-section.ts
- src/features/quotes/server/actions/remove-quote-section.ts
- src/features/quotes/server/actions/add-quote-line-item.ts
- src/features/quotes/server/actions/remove-quote-line-item.ts
- src/features/quotes/server/actions/add-remove-quote-actions.test.ts
- src/features/quotes/store/quote-editor-store.ts
- src/features/quotes/store/quote-editor-store.test.ts
- src/features/quotes/components/quote-structure-editor.tsx
- src/features/quotes/components/quote-structure-editor.test.tsx
- src/features/quotes/components/quote-editor-section.tsx
- src/features/quotes/components/quote-editor-section.test.tsx
- src/app/(workspace)/quotes/[quoteId]/page.tsx
- tests/e2e/quotes.spec.ts

- Note: the branch still contains additional uncommitted Story 3.1/3.2 quote files in git status. They were reviewed as surrounding context, but the list above is the Story 3.3 implementation and review-fix set.

## Senior Developer Review (AI)

### Reviewer

- chuck chuck

### Review Date

- 2026-03-21

### Outcome

- Approved after fixes

### Summary

- Fixed missing inline validation, keyboard save/reset behavior, source badge mapping, and destructive-action confirmations in the quote editor.
- Added a scoped Zustand editor store plus unsaved-change guards to preserve draft continuity and warn before navigation loss.
- Expanded automated coverage for server actions, editor/store interactions, and the Story 3.3 end-to-end editing flow; lint, test, and build verification now pass.

### Change Log

- 2026-03-19: Implemented Story 3.3 quote section and line item editing: input types, Zod validation schemas, 7 server actions (update-sections, update-section, update-line-item, add/remove section, add/remove line-item), QuoteStructureEditor and QuoteEditorSection components, detail page integration with draft-editor swap, repository helpers, and comprehensive test coverage (197 tests, lint clean). Status: review.
- 2026-03-21: Senior developer review fixes applied: added inline validation, keyboard save/reset, shared dialog confirmations, source-package name mapping, Zustand editor state, unsaved-change guards, expanded automated coverage, and successful lint/test/build verification. Status: done.
