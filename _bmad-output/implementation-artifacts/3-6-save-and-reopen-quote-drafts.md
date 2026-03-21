# Story 3.6: Save and Reopen Quote Drafts

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a studio owner,
I want to save quote drafts and reopen them later,
so that I can preserve in-progress work without rebuilding the quote.

## Acceptance Criteria

1. **Given** a quote has been started or edited **When** the user saves it as a draft **Then** the current client association, generated structure, edits, pricing, and quote status are persisted successfully **And** the user receives explicit confirmation that the draft was saved.
2. **Given** a saved draft quote exists **When** the user reopens it from the quotes area **Then** the latest persisted draft state is loaded **And** the user can continue editing, previewing, or revising from that point.
3. **Given** a save operation fails **When** the user attempts to save the quote draft **Then** the interface shows an explicit failure state with safe recovery guidance **And** the user is not misled into thinking the draft was saved.
4. **Given** repeated quote saves occur during normal editing **When** the workflow is exercised under expected MVP usage **Then** draft persistence remains aligned with the documented reliability and performance targets **And** the quote remains available for later revision and invoice-conversion stories.

## Tasks / Subtasks

- [x] Task 1: Verify and enhance explicit save confirmation feedback (AC: #1, #3)
  - [x] 1.1 Audit `QuoteStructureEditor` manual save flow. Verified: `handleSave` (line 381) calls `updateQuoteSections` and displays "Quote draft saved successfully." on success (line 396) and shows inline error with "Save failed" header on failure (line 398-399). Uses `role="status"` for success and `role="alert"` for errors — both accessible.
  - [x] 1.2 Audit auto-save path. Verified: `persistDraftIfNeeded` with `{ silent: true }` is called before structural operations (add/remove/reorder) — no toast shown. Only explicit "Save draft" button and line-item-blur show confirmation messages.
  - [x] 1.3 Verify save failure handling. Verified: on `{ ok: false }`, local state is retained (no `markSaved` call), error shown inline, save button stays enabled (only disabled by `isSaving` which resolves). `hasUnsavedChanges` remains `true` after failure, so `useUnsavedChangesGuard` still fires.
  - [x] 1.4 Verify `isSaving` flag. Verified: `useTransition` provides `isSaving`, which disables "Save draft" button (line 742) and shows "Saving..." text (line 745).

- [x] Task 2: Enhance the quotes list page for draft identification and reopening (AC: #2)
  - [x] 2.1 Reviewed `listQuotes` query and `QuoteSummary` type. `updatedAt` field already exists in the type and is populated by `toQuoteSummary()`.
  - [x] 2.2 Verified each quote links to `/quotes/{quoteId}`. Detail page loads full quote via `getQuoteById` and passes `initialSections` to `QuoteStructureEditor`, which calls `initialize()`.
  - [x] 2.3 Added `StatusBadge` component with color-coded styling (blue for draft, green for accepted, purple for invoiced). Reused the shared UTC-safe `formatDate` helper for `updatedAt` display. Updated list layout to show badge and date alongside quote info.
  - [x] 2.4 Sorted quote summaries by most recent `updatedAt` so recently saved drafts surface first in the quotes list.

- [x] Task 3: Verify draft reopen continuity from the detail page (AC: #2)
  - [x] 3.1 Verified full reopen path: `/quotes` list → click quote → detail page loads via `getQuoteById` → passes `initialSections` to `QuoteStructureEditor` → `initialize()` loads into Zustand store.
  - [x] 3.2 Verified `GenerateQuoteButton` appears when `quote.status === "draft"` and `!hasGeneratedContent`.
  - [x] 3.3 Verified preview link available when `hasGeneratedContent && quote.status === "draft"`.

- [x] Task 4: Verify unsaved changes guard protects draft continuity (AC: #1, #3)
  - [x] 4.1 Verified `useUnsavedChangesGuard` hooks into `beforeunload`, anchor click interception, and `popstate`.
  - [x] 4.2 Verified guard fires after failed save — `hasUnsavedChanges` remains `true` since `markSaved` is only called on success.
  - [x] 4.3 Verified guard cleared after successful save — `markSaved()` sets `initialSections = sections` and `hasUnsavedChanges = false`.

- [x] Task 5: Add test coverage (AC: #1, #2, #3, #4)
  - [x] 5.1 Added 3 new tests to `quote-structure-editor.test.tsx`: "shows success feedback after explicit save", "shows error feedback on save failure", "keeps the Save draft button enabled after a failed save for retry".
  - [x] 5.2 Added `src/app/(workspace)/quotes/page.test.tsx` to cover row-scoped status badges, updated dates, the empty state CTA, and the quotes list error state.
  - [x] 5.3 Updated the e2e test "saves a draft, navigates to the quotes list, and reopens it with preserved content" to verify repeated saves, the row-scoped draft badge, and reopen continuity for both edited content and quantity.
  - [x] 5.4 Added a repeated-save server action test in `update-quote-sections.test.ts` to verify no silent data loss across multiple saves and to assert each local save completes within the 2-second budget.

- [x] Task 6: Quality gates (AC: #1, #2, #3, #4)
  - [x] 6.1 `npm run lint` — 0 errors.
  - [x] 6.2 `npm run test` — 280 tests passed (56 test files).
  - [x] 6.3 `NEXTAUTH_URL="https://example.com" STUDIO_OWNER_EMAIL="studio@example.com" STUDIO_OWNER_PASSWORD="local-build-password" npm run build` — successful production build.

## Dev Notes

### Relevant Architecture Patterns and Constraints

- **Auth-first pattern**: All server actions and queries must use `requireSession()` + `ensureStudioAccess(...)`. The `updateQuoteSections` action already follows this pattern.
- **ActionResult envelope**: All mutations return `{ ok: true, data }` or `{ ok: false, error: { code, message, fieldErrors? } }`. The editor must handle both cases.
- **Zustand for editor state**: The quote editor uses a scoped Zustand store (`quote-editor-store.ts`). The store manages `initialSections` (last saved), `sections` (working copy), `hasUnsavedChanges` (dirty flag). Reopening a quote calls `initialize()` to load from the server.
- **Server-first rendering**: The quote list page and detail page are server components. Only the `QuoteStructureEditor` is a client component.
- **Feature-first placement**: All changes stay inside `src/features/quotes/` and `src/app/(workspace)/quotes/`.
- **Loading state patterns**: Use explicit `isSaving` flags, disable repeat submissions, scope loading UI to the affected action. From architecture: "Disable repeat submissions while a mutation is in flight."
- **Error handling patterns**: Separate user-correctable validation errors from operational failures. Never expose raw provider or database errors. "Every save, convert, preview, and export path must end with a clear success or failure state."
- **Accessibility**: "Status changes such as saved, accepted, error, and converted must be announced in meaningful text" (UX spec). Use `aria-live` regions or toast announcements.

### Source Tree Components to Touch

- `src/features/quotes/components/quote-structure-editor.tsx` — save feedback, `isSaving` state, and recovery guidance after save failures
- `src/features/quotes/store/quote-editor-store.ts` — Zustand store (verified `markSaved` behavior, no changes needed)
- `src/app/(workspace)/quotes/page.tsx` — quotes list page (enhanced with status badge, shared date formatting, and recent-save ordering)
- `src/app/(workspace)/quotes/page.test.tsx` — quotes list coverage for status badges, dates, empty state, and error state
- `src/app/(workspace)/quotes/[quoteId]/page.tsx` — detail page (verified reopen path, no changes needed)
- `src/features/quotes/server/quotes-repository.ts` — quote ordering by latest `updatedAt`
- `src/features/quotes/server/quotes-repository.test.ts` — quote ordering regression coverage
- `src/features/quotes/server/actions/update-quote-sections.test.ts` — repeated-save persistence and local timing coverage
- `src/features/quotes/types.ts` — `QuoteSummary` type (verified `updatedAt` exists, no changes needed)

### Testing Standards Summary

- Unit tests: Vitest + React Testing Library. Co-located as `*.test.ts(x)` next to source.
- E2E tests: Playwright in `tests/e2e/quotes.spec.ts`.
- Follow existing test patterns: mock server actions with `vi.mock`, test component states (loading, success, error), verify accessibility with semantic queries.

### Project Structure Notes

- All code stays inside `src/features/quotes/` and `src/app/(workspace)/quotes/`.
- Do not modify the clients, service-packages, or invoices features.
- New component tests co-locate with source files.
- E2E tests extend `tests/e2e/quotes.spec.ts`.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.6: Save and Reopen Quote Drafts] — acceptance criteria and story intent.
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 3: Guided Quote Creation, Editing, and Preview] — epic scope, FR20 (save quote as draft).
- [Source: _bmad-output/planning-artifacts/prd.md#FR20] — save quote as draft requirement.
- [Source: _bmad-output/planning-artifacts/prd.md#FR3] — browse and reopen existing quotes.
- [Source: _bmad-output/planning-artifacts/prd.md#FR27] — view quote lifecycle status.
- [Source: _bmad-output/planning-artifacts/prd.md#NFR7] — zero silent data-loss across save operations.
- [Source: _bmad-output/planning-artifacts/prd.md#NFR9] — explicit success/failure feedback for save actions.
- [Source: _bmad-output/planning-artifacts/prd.md#NFR2] — save completes in <= 2 seconds (p95).
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Feedback Patterns] — "Quote draft saved" toast, error: explain what failed/preserved/what to do next.
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Quote Structure Editor] — draft continuity, totals recalculation.
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Save Draft as Terminal Step] — save as draft is final guided-flow step, durable draft success state.
- [Source: _bmad-output/planning-artifacts/architecture.md#Loading State Patterns] — isSaving, disable submissions, explicit success/failure states.
- [Source: _bmad-output/planning-artifacts/architecture.md#Error Handling Patterns] — separate validation from operational, no raw errors.
- [Source: src/features/quotes/components/quote-structure-editor.tsx] — editor with save logic, auto-save, unsaved changes guard.
- [Source: src/features/quotes/store/quote-editor-store.ts] — Zustand store with initialize, markSaved, hasUnsavedChanges.
- [Source: src/features/quotes/server/actions/update-quote-sections.ts] — primary save draft action.
- [Source: src/features/quotes/server/queries/list-quotes.ts] — quotes list query.
- [Source: src/app/(workspace)/quotes/page.tsx] — quotes list page.
- [Source: src/app/(workspace)/quotes/[quoteId]/page.tsx] — quote detail page (reopen path).
- [Source: src/components/feedback/inline-alert.tsx] — inline alert component for success/error feedback.

## Dev Agent Record

### Agent Model Used

mimo-v2-pro-free

### Debug Log References

- `npm run lint` — 0 errors
- `npm run test` — 280 tests passed (56 test files)
- `NEXTAUTH_URL="https://example.com" STUDIO_OWNER_EMAIL="studio@example.com" STUDIO_OWNER_PASSWORD="local-build-password" npm run build` — successful production build

### Completion Notes List

- Added explicit save-failure recovery guidance in `QuoteStructureEditor` so users know their in-browser edits are preserved and whether to retry or reload after an operational save failure.
- Updated the quotes list to reuse the shared UTC-safe date formatter and sort drafts by most recent `updatedAt`, so the latest saved quote is easier to reopen.
- Added dedicated quotes page coverage plus stronger server-action and e2e coverage for row-scoped draft badges, repeated saves, reopen continuity, and the local 2-second save budget.
- All acceptance criteria are now covered by implementation and automated verification: explicit save confirmation (AC #1), reopen with preserved state (AC #2), failure guidance with retry/reload direction (AC #3), and repeated-save persistence/reliability coverage (AC #4).

### File List

- `src/app/(workspace)/quotes/page.tsx` (modified — reused shared date formatter for quote rows)
- `src/app/(workspace)/quotes/page.test.tsx` (new — added quotes list coverage for status badges, dates, empty state, and error state)
- `src/features/quotes/components/quote-structure-editor.tsx` (modified — added explicit retry/reload recovery guidance for save failures)
- `src/features/quotes/components/quote-structure-editor.test.tsx` (modified — extended save failure coverage with recovery guidance assertions)
- `src/features/quotes/server/actions/update-quote-sections.test.ts` (modified — added repeated-save persistence and local timing coverage)
- `src/features/quotes/server/quotes-repository.ts` (modified — sort quote summaries by latest `updatedAt`)
- `src/features/quotes/server/quotes-repository.test.ts` (modified — added ordering regression coverage)
- `tests/e2e/quotes.spec.ts` (modified — strengthened repeated-save and row-scoped reopen assertions)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified — status updates)
- `_bmad-output/implementation-artifacts/3-6-save-and-reopen-quote-drafts.md` (modified — story file)

## Change Log

- 2026-03-21 — Implemented Story 3.6: enhanced quotes list page with status badges and date display, verified save/reopen/guard behavior, added 4 new tests (3 unit + 1 e2e). All quality gates pass.
- 2026-03-21 — Senior developer review fixes applied: added retry/reload recovery guidance for save failures, switched the quotes list to the shared UTC date formatter, sorted drafts by latest `updatedAt`, added quotes page and repeated-save regression coverage, strengthened the save/reopen e2e assertions, and re-ran lint/test/build. Status: done.

## Senior Developer Review (AI)

### Reviewer

- Reviewer: chuck chuck
- Date: 2026-03-21
- Outcome: Approved after fixes

### Review Notes

- Added explicit save-failure recovery guidance in `QuoteStructureEditor` so failed saves explain that local edits are still in the editor and tell the user whether to retry or reload.
- Reused the shared UTC-safe `formatDate` helper and sorted quotes by latest `updatedAt`, so the quotes list shows consistent dates and surfaces the most recently saved draft first.
- Added dedicated quotes page coverage plus stronger server-action and e2e assertions for row-scoped draft badges, repeated saves, reopen continuity, and the local 2-second save budget.
- Reference captured during review: MDN `Intl.DateTimeFormat` documents that output varies with locale and time zone unless options are specified, which is why the quotes list now reuses the shared UTC formatter.

### Validation

- `npm run lint`
- `npm run test`
- `NEXTAUTH_URL="https://example.com" STUDIO_OWNER_EMAIL="studio@example.com" STUDIO_OWNER_PASSWORD="local-build-password" npm run build`
