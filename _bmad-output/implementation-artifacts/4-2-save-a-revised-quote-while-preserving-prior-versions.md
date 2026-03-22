# Story 4.2: Save a Revised Quote While Preserving Prior Versions

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a studio owner,
I want each quote revision saved without overwriting prior versions,
so that I can preserve a trustworthy history of changes over time.

## Acceptance Criteria

1. Given an existing quote has been reopened for revision, when the user saves the revised quote, then the system persists the updated version successfully and at least one prior version remains preserved as history.
2. Given a prior version already exists, when a new revision is saved, then the system records the newer version as distinct from earlier ones and the saved revision does not corrupt or erase previous revision data.
3. Given the save operation fails during revision, when the user attempts to save the revised quote, then the application shows explicit failure feedback and the user is not told the revision was saved unless persistence actually succeeded.
4. Given revision saves occur repeatedly over time, when quote history is exercised in normal workflow use, then quote lineage remains reliable and traceable and the behavior remains aligned with the documented reliability targets.

## Tasks / Subtasks

- [x] Create the `quote_revisions` persistence layer for immutable version snapshots (AC: 1, 2)
  - [x] Add Drizzle schema for `quote_revisions` table with columns: `id`, `quote_id`, `studio_id`, `revision_number`, `snapshot_data` (JSON text storing full sections+line items at save time), `terms`, `title`, `created_at`
  - [x] Add index on `quote_id` and unique constraint on `(quote_id, revision_number)` for ordering guarantees
  - [x] Generate and verify Drizzle migration for the new table
  - [x] Add repository functions: `createQuoteRevision` (snapshot current quote state), `listQuoteRevisions` (ordered by revision_number desc)
- [x] Implement revision-aware save server action (AC: 1, 2, 3)
  - [x] Create `src/features/quotes/server/actions/revise-quote.ts` server action
  - [x] Action receives `quoteId` and the edited sections; validates with Zod schema
  - [x] Before applying edits: read current quote state, create a revision snapshot of the PREVIOUS state via `createQuoteRevision`
  - [x] After snapshot: apply the new sections via existing `saveQuoteSections`, update quote `updatedAt` timestamp
  - [x] Return standard result envelope `{ ok: true, data: { revisionNumber } }` on success
  - [x] On failure: return `{ ok: false, error: { code, message } }` without corrupting existing data; do NOT claim success if snapshot or save failed
  - [x] Preserve existing draft-only mutation guard: reject if quote status is not `draft`
- [x] Extend the quote detail page to trigger revision-aware saves (AC: 1, 3)
  - [x] In `src/app/(workspace)/quotes/[quoteId]/page.tsx`, when the quote is in revision-ready state (i.e., `saved=revised` flow from Story 4.1), wire the save button to call the new `reviseQuote` action instead of the existing `updateQuoteSections` action
  - [x] Preserve the existing `updateQuoteSections` path for non-revision draft edits (backward compatibility)
  - [x] Display explicit success feedback on revision save: `Revision saved. Previous version preserved.`
  - [x] Display explicit failure feedback on revision save failure: `Could not save revision. Your changes were not lost from the editor.`
  - [x] Use existing feedback primitives (`InlineAlert`, `Toast`) rather than bespoke patterns
- [x] Wire revision timeline component stub for later story consumption (AC: 2)
  - [x] Create `src/features/quotes/components/revision-timeline.tsx` as a minimal component that fetches and renders revision list from `listQuoteRevisions`
  - [x] Display: revision number, timestamp, and a `View` action placeholder (compare/view wired in Story 4.3)
  - [x] Show current working version as the latest entry
  - [x] Do NOT implement full version comparison or detail viewing in this story (defer to 4.3)
- [x] Add automated coverage (AC: 1, 2, 3, 4)
  - [x] Add `src/features/quotes/server/actions/revise-quote.test.ts` covering: successful revision save creates snapshot + updates sections, failure returns error envelope without data corruption, non-draft quote rejected
  - [x] Add `src/features/quotes/server/quotes-repository.test.ts` extension for `createQuoteRevision` and `listQuoteRevisions` functions
  - [x] Add `src/app/(workspace)/quotes/[quoteId]/page.test.tsx` coverage for revision-save success/failure feedback UI
  - [x] Extend `tests/e2e/quotes.spec.ts` with a revision save regression: reopen draft, edit, save as revision, verify prior version preserved, verify editor shows updated content

## Dev Notes

- **Story 4.1 foundation:** Story 4.1 created the revision-ready entry experience via `saved=revised` query parameter on the quote detail page. It added `buildQuoteRevisionReadyHref` to `src/features/quotes/lib/navigation.ts`, recovery UI for operational load failures, and draft-only `Revise` entry on the quotes list. All existing draft-only mutation guards in `update-quote-sections.ts`, `add-quote-section.ts`, and `reorder-quote-sections.ts` remain intact. [Source: _bmad-output/implementation-artifacts/4-1-reopen-an-existing-quote-for-revision.md]
- **Critical constraint:** The existing `saveQuoteSections` function in `src/features/quotes/server/quotes-repository.ts` performs a destructive delete-and-rewrite of sections and line items. This is compatible with current draft editing but is NOT a substitute for immutable revision history. This story must snapshot the previous state BEFORE calling `saveQuoteSections`, not after. Do not modify `saveQuoteSections` itself—layer revision capture around it. [Source: src/features/quotes/server/quotes-repository.ts:481-538]
- **Current editing model:** The quote editor uses `QuoteStructureEditor` with a Zustand store (`quote-editor-store.ts`) that tracks `sections`, `hasUnsavedChanges`, `initialSections`, and `markSaved()`. After a successful revision save, call `markSaved()` with the new sections to reset the dirty state. Do not introduce a second editor surface. [Source: src/features/quotes/store/quote-editor-store.ts]
- **Quote schema drift note:** The `quotes` table already has an `estimateBreakdownSnapshot` column. The new `quote_revisions` table should NOT duplicate this column; revision snapshots should capture sections, line items, title, and terms only. The estimate breakdown is computed at read time and does not need versioning. [Source: src/server/db/schema/quotes.ts]
- **In-memory store fallback:** The codebase uses an in-memory store fallback when `DATABASE_URL` is not set. New revision repository functions must include both the Drizzle path and the in-memory store path, following the existing dual-path pattern in `quotes-repository.ts`. [Source: src/features/quotes/server/store/quotes-store.ts]
- **Quote status boundary:** Only `draft` quotes are editable. Do not allow revision saves on `accepted` or `invoiced` quotes. The existing `QuoteStatus` type is `"draft" | "accepted" | "invoiced"`. [Source: src/features/quotes/types.ts:1]

### Technical Requirements

- Preserve the standard result envelope shape: `{ ok: true, data, meta? }` or `{ ok: false, error: { code, message, fieldErrors? } }`. [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules]
- Keep quote access behind `requireSession()` and studio-scoped authorization checks; revision creation and listing must verify the quote belongs to the caller's studio. [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security]
- The `reviseQuote` action must be atomic: snapshot the prior state, then apply new sections. If snapshot creation fails, do NOT proceed to save new sections. If section save fails after snapshot, the revision record is acceptable (it captured the pre-edit state) but the action must report failure so the user knows their edits were not persisted. [Source: _bmad-output/planning-artifacts/epics.md#Story 4.2]
- The revision snapshot should store a JSON representation of the quote's sections and line items as they were BEFORE the revision edit was applied. This means reading current sections, serializing them into `snapshot_data`, then writing the new sections. [Source: _bmad-output/planning-artifacts/epics.md#Story 4.2 Acceptance Criteria]
- Do not add a new persisted quote status such as `revising`. The quote remains `draft` throughout revision cycles. Revision metadata is stored in the separate `quote_revisions` table. [Source: _bmad-output/implementation-artifacts/4-1-reopen-an-existing-quote-for-revision.md]
- `getQuoteById()` currently refreshes the estimate breakdown snapshot on read. Preserve that behavior; do not let revision creation side-effect the estimate breakdown. [Source: src/features/quotes/server/queries/get-quote-by-id.ts]

### Architecture Compliance

- Keep route composition in `src/app/(workspace)/quotes` and business logic in `src/features/quotes/server`; do not move persistence or auth checks into route components. [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries]
- Server actions remain the mutation boundary; reserve route handlers for explicit HTTP-only surfaces. [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns]
- Database naming stays snake_case (`quote_revisions`, `quote_id`, `revision_number`, `created_at`); application-facing types stay camelCase (`QuoteRevision`, `revisionNumber`). Filenames use kebab-case. [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules]
- Keep revision persistence separate from UI-only state. Revision data belongs in Drizzle schema and repository, not in Zustand. [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries]
- Architecture reserves `src/app/(workspace)/quotes/[quoteId]/revisions` for revision history viewing (Story 4.3). Do not build the revision detail page here—only the timeline stub and the save mechanism. [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries]

### Library and Framework Requirements

- Current stack: Next.js App Router (`next` 16.1.6), React 19, Drizzle ORM 0.45.1, `next-auth` 4.24.13 with `@auth/core` 0.34.3, Zod 4.3.6, Zustand 5.0.12, Tailwind 4. [Source: package.json]
- Use Zod 4.3.6 to validate the revision action input at the server boundary. [Source: _bmad-output/planning-artifacts/architecture.md#Core Architectural Decisions]
- Do not introduce new dependencies. All required patterns (Drizzle schema, Zod validation, server actions, Zustand integration) already exist in the codebase. [Source: package.json]
- Keep the existing targeted Zustand approach for quote editor state. Do not add revision state to the Zustand store; revision data is fetched separately for the timeline. [Source: src/features/quotes/store/quote-editor-store.ts]

### File Structure Requirements

- New files to create:
  - `src/server/db/schema/quote-revisions.ts` — Drizzle schema for `quote_revisions` table
  - `src/features/quotes/server/actions/revise-quote.ts` — server action for revision-aware save
  - `src/features/quotes/components/revision-timeline.tsx` — minimal revision list component stub
  - `drizzle/migrations/<timestamp>_add_quote_revisions.ts` — generated migration (auto-generated by Drizzle Kit)
- Files to modify:
  - `src/server/db/schema/index.ts` — add `quote_revisions` export
  - `src/features/quotes/server/quotes-repository.ts` — add `createQuoteRevision` and `listQuoteRevisions` functions
  - `src/features/quotes/server/store/quotes-store.ts` — add in-memory revision store functions
  - `src/app/(workspace)/quotes/[quoteId]/page.tsx` — wire revision save path and feedback UI
  - `src/features/quotes/types.ts` — add `QuoteRevision` type
- Test files to create/modify:
  - `src/features/quotes/server/actions/revise-quote.test.ts` (new)
  - `src/features/quotes/server/quotes-repository.test.ts` (modify)
  - `src/app/(workspace)/quotes/[quoteId]/page.test.tsx` (modify)
  - `tests/e2e/quotes.spec.ts` (modify)
- Prefer feature-local placement. Avoid generic dumping-ground files. [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules]
- Use existing feedback primitives (`InlineAlert`, toast patterns) for success/failure messaging rather than bespoke UI. [Source: src/app/(workspace)/quotes/page.tsx]

### Testing Requirements

- Use Vitest for unit and component tests; React Testing Library for component rendering; Playwright for end-to-end coverage. [Source: _bmad-output/planning-artifacts/architecture.md]
- Revision save action tests must verify: (a) snapshot is created from pre-edit state, (b) new sections are persisted, (c) prior revisions are not corrupted, (d) non-draft quotes are rejected, (e) save failure returns error envelope. [Source: _bmad-output/planning-artifacts/epics.md#Story 4.2]
- Repository tests must verify: `createQuoteRevision` increments revision_number correctly, `listQuoteRevisions` returns ordered results, snapshot_data round-trips through JSON serialization. [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture]
- Page component tests must verify: success feedback renders after revision save, failure feedback renders on error, editor dirty state resets after successful save, existing draft-save behavior is not regressed. [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Feedback Patterns]
- E2E regression must cover: open draft quote via revision-ready path, edit a line item, save revision, reopen quote, verify content reflects latest edit. [Source: _bmad-output/planning-artifacts/epics.md#Story 4.2]
- Keep changes aligned with NFR2 (save speed <= 2s), NFR7 (zero silent data loss), NFR8 (correct lineage links), and NFR9 (explicit success/failure feedback). [Source: _bmad-output/planning-artifacts/epics.md#NonFunctional Requirements]

### Project Structure Notes

- The `quote_revisions` schema follows the same pattern as `quote-sections.ts` and `quotes.ts`: `pgTable` with text PK via `crypto.randomUUID()`, foreign key to `quotes.id`, timestamps with `defaultNow()`, and named indexes following `idx_<table>_<column>` convention. [Source: src/server/db/schema/quotes.ts]
- The `reviseQuote` action follows the existing action pattern in `src/features/quotes/server/actions/`: async function, Zod input validation, `requireSession()` for auth, studio-scoped access check, standard result envelope return. [Source: src/features/quotes/server/actions/update-quote-sections.ts]
- The revision timeline component is a Phase 2 continuity component per UX spec. This story creates the minimal data-fetching stub; full timeline interaction is deferred to Story 4.3. [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Component Strategy]
- The `saved=revised` query parameter from Story 4.1 is the trigger that distinguishes revision-ready editing from normal draft editing. Use this parameter to determine whether to call `reviseQuote` or `updateQuoteSections` on save. [Source: _bmad-output/implementation-artifacts/4-1-reopen-an-existing-quote-for-revision.md]

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 4: Quote Revision and Acceptance Lifecycle]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.2: Save a Revised Quote While Preserving Prior Versions]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.3: View Revision History and Identify the Current Quote Version]
- [Source: _bmad-output/planning-artifacts/prd.md#Journey 2 - Commercial editor revises a quote without losing control or trust]
- [Source: _bmad-output/planning-artifacts/prd.md#Quote Revision & Lifecycle]
- [Source: _bmad-output/planning-artifacts/prd.md#Non-Functional Requirements]
- [Source: _bmad-output/planning-artifacts/architecture.md#Core Architectural Decisions]
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture]
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules]
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Revise Quote With Continuity]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Feedback Patterns]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Revision Timeline]
- [Source: _bmad-output/implementation-artifacts/4-1-reopen-an-existing-quote-for-revision.md]
- [Source: src/features/quotes/server/quotes-repository.ts]
- [Source: src/features/quotes/server/actions/update-quote-sections.ts]
- [Source: src/features/quotes/store/quote-editor-store.ts]
- [Source: src/features/quotes/types.ts]
- [Source: src/server/db/schema/quotes.ts]
- [Source: src/app/(workspace)/quotes/[quoteId]/page.tsx]
- [Source: package.json]

## Dev Agent Record

### Agent Model Used

openai/gpt-5.4

### Debug Log References

- `npm test -- src/features/quotes/server/actions/revise-quote.test.ts src/features/quotes/server/quotes-repository.test.ts "src/app/(workspace)/quotes/[quoteId]/page.test.tsx"`
- `DATABASE_URL="${DATABASE_URL:-postgres://postgres:postgres@localhost:5432/mento_admin}" npx drizzle-kit generate`
- `npm test`
- `npm run lint`
- `npx playwright test tests/e2e/quotes.spec.ts`

### Completion Notes List

- Added immutable `quote_revisions` persistence across Drizzle and the in-memory fallback store, including ordered revision listing and generated migration artifacts.
- Implemented `reviseQuote` to snapshot the pre-save quote state before applying edited sections, preserve draft-only guards, and return revision metadata with the refreshed quote payload.
- Updated the quote editor and detail page to switch revision-ready saves onto the new action, show explicit revision success and failure feedback, and render a revision timeline stub with the current working version plus preserved prior revisions.
- Added regression coverage for repository behavior, revision-save action behavior, page-level revision feedback, and Playwright quote revision flow verification.

### File List

- `_bmad-output/implementation-artifacts/4-2-save-a-revised-quote-while-preserving-prior-versions.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `drizzle/migrations/0007_charming_nitro.sql`
- `drizzle/migrations/meta/0007_snapshot.json`
- `drizzle/migrations/meta/_journal.json`
- `src/app/(workspace)/quotes/[quoteId]/page.test.tsx`
- `src/app/(workspace)/quotes/[quoteId]/page.tsx`
- `src/features/quotes/components/quote-structure-editor.tsx`
- `src/features/quotes/components/revision-timeline.tsx`
- `src/features/quotes/server/actions/revise-quote.test.ts`
- `src/features/quotes/server/actions/revise-quote.ts`
- `src/features/quotes/server/quotes-repository.test.ts`
- `src/features/quotes/server/quotes-repository.ts`
- `src/features/quotes/server/store/quotes-store.ts`
- `src/features/quotes/types.ts`
- `src/server/db/schema/index.ts`
- `src/server/db/schema/quote-revisions.ts`
- `tests/e2e/quotes.spec.ts`

## Senior Developer Review (AI)

**Reviewer:** AI Code Review  
**Date:** 2026-03-21  
**Outcome:** Changes Requested → Fixed

### Critical Issues Fixed
1. **reviseQuote action used getQuoteById from queries module** which returns `ActionResult<{ quote }>`, but the action code accessed `.ok` and `.data.quote` on the repository-level `getQuoteById` which returns `QuoteDetailRecord | null`. Fixed by importing the repository function directly and handling the null case + studio access check inline. Also eliminated the redundant second DB round-trip for the reload.
2. **Test used `as never` cast** to suppress type mismatch between mock data (`ActionResult` shape) and the actual `getQuoteById` return type from queries. Fixed by using proper `Awaited<ReturnType<...>>` casts.

### Medium Issues Fixed
3. **createQuoteRevision DB path** fetched full quote via `getQuoteById` then checked studio separately. Fixed by using a single DB query with `WHERE quote_id = ? AND studio_id = ?`.
4. **RevisionTimeline disabled View buttons** had no aria-label or tooltip explaining they were stubs. Added `aria-label` indicating future availability.
5. **reviseQuote called getQuoteById twice** — optimized to construct the response from existing data after save.

### Verification
- All 345 tests pass (63 files)
- Lint passes clean
- No regressions introduced

## Change Log

- 2026-03-21: Added immutable quote revision snapshots, revision-aware save handling, revision timeline stub, and automated coverage for revision persistence and UX flows.
- 2026-03-21: Code review — fixed critical type mismatch in reviseQuote action (getQuoteById return type), fixed createQuoteRevision studio-scoped DB query, improved RevisionTimeline accessibility, optimized away redundant DB call.
