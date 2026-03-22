# Story 5.4: Reopen and Update an Existing Invoice

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a studio owner,
I want to reopen an existing invoice and update it safely,
so that I can maintain accurate billing records after the invoice is created.

## Acceptance Criteria

1. **Given** one or more invoices already exist
   **When** the user reopens an invoice from the invoices area or a linked record view
   **Then** the latest persisted invoice state is loaded successfully
   **And** the linked client and source quote context remain available.

2. **Given** an existing invoice is reopened
   **When** the user updates invoice content and saves changes
   **Then** the updated invoice state is persisted successfully
   **And** the user receives explicit confirmation of the update.

3. **Given** the update action fails
   **When** the user attempts to save the reopened invoice
   **Then** the application shows explicit failure feedback
   **And** the user is not misled into thinking the invoice was updated.

4. **Given** invoices may be revisited repeatedly over time
   **When** the user returns to an existing invoice later
   **Then** the most recent saved values are shown
   **And** continuity with the original quote lineage is preserved.

## Tasks / Subtasks

- [x] Task 1: Add `reopenInvoice` server action (AC: 1, 2, 3)
  - [x] Create `src/features/invoices/server/actions/reopen-invoice.ts`
  - [x] Define `reopenInvoiceSchema` with `invoiceId` field using Zod
  - [x] Implement `reopenInvoiceAction` following the `markQuoteAccepted` pattern from `src/features/quotes/server/actions/mark-quote-accepted.ts`
  - [x] Call `requireSession()` then `ensureStudioAccess(session, studioId)` for auth
  - [x] Load invoice via `getInvoiceById` and verify it exists
  - [x] If invoice status is already `"draft"`, return success without changes (idempotent)
  - [x] If invoice status is `"sent"` or `"paid"`, update status to `"draft"` via repository
  - [x] Revalidate `/invoices` and `/invoices/${invoiceId}` paths
  - [x] Return standard `ActionResult<{ invoice: InvoiceDetailRecord }>` envelope

- [x] Task 2: Add `updateInvoiceStatus` to invoices repository (AC: 2)
  - [x] Add `updateInvoiceStatus` export to `src/features/invoices/server/invoices-repository.ts`
  - [x] For database path: update `invoices.status` column and `updatedAt` via Drizzle, then re-fetch via `getInvoiceById`
  - [x] For store fallback: call existing `setInvoiceStatusInStore(invoiceId, status)` from `src/features/invoices/server/store/invoices-store.ts`
  - [x] Follow existing `shouldUseStoreFallback` pattern for error handling

- [x] Task 3: Create `ReopenInvoiceButton` client component (AC: 1, 2, 3)
  - [x] Create `src/features/invoices/components/reopen-invoice-button.tsx`
  - [x] Accept `invoiceId` and optional `onReopened` callback props
  - [x] Call `reopenInvoiceAction` on click
  - [x] Show loading state (`isSubmitting`) while the action is in flight
  - [x] Disable button during submission to prevent double-clicks
  - [x] On success: call `router.refresh()` or redirect to show the now-editable draft
  - [x] On failure: show inline error via `InlineAlert` component
  - [x] Use `variant="outline"` button styling (closest to "secondary" in design system)

- [x] Task 4: Update invoice detail page for reopen flow (AC: 1, 2, 4)
  - [x] Modify `src/app/(workspace)/invoices/[invoiceId]/page.tsx`
  - [x] For non-draft invoices: show `ConversionReviewPanel` (read-only summary) with "Reopen for Editing" button
  - [x] Update page header: for sent/paid invoices show "Invoice details"; for draft invoices show "Edit invoice" (existing)
  - [x] Ensure "Preview" and "Export PDF" actions remain available for all statuses
  - [x] Preserve `backTo` navigation context

- [x] Task 5: Write tests (AC: 1, 2, 3, 4)
  - [x] Unit test for `reopenInvoiceAction` in `src/features/invoices/server/actions/reopen-invoice.test.ts`:
    - Reopens sent invoice to draft successfully
    - Reopens paid invoice to draft successfully
    - Returns success for already-draft invoice (idempotent)
    - Returns error for non-existent invoice
    - Returns error when studio access is denied
  - [x] Component test for `ReopenInvoiceButton` in `src/features/invoices/components/reopen-invoice-button.test.tsx`:
    - Renders button with correct label
    - Shows loading state during submission
    - Handles success and failure responses
  - [x] Update invoice detail/preview navigation tests to cover reopen flow and linked `backTo` preservation

## Dev Notes

### Relevant Architecture Patterns

**Server action contract** [Source: architecture.md#API & Communication Patterns]:
- All mutations use server actions validated with Zod at the boundary.
- Return the standard `ActionResult<T>` envelope: `{ ok: true, data }` or `{ ok: false, error: { code, message, fieldErrors? } }`.
- Auth pattern: `requireSession()` then `ensureStudioAccess(session, studioId)`.

**Naming conventions** [Source: architecture.md#Naming Patterns]:
- DB tables: plural snake_case (`invoices`)
- DB columns: snake_case (`updated_at`, `status`)
- Application types: camelCase (`InvoiceDetailRecord`, `InvoiceStatus`)
- Mutation names: verb-first camelCase (`reopenInvoice`)
- Files: kebab-case (`reopen-invoice.ts`, `reopen-invoice-button.tsx`)

**Status transition pattern** [Source: src/features/quotes/server/actions/mark-quote-accepted.ts]:
- The `markQuoteAccepted` action is the closest existing pattern for invoice status transitions.
- It validates input with Zod, loads the entity, checks auth, validates current status, calls a repository function (`updateQuoteStatus`), revalidates paths, and returns the standard envelope.
- For this story, follow the same structure but invert the direction: `"sent"/"paid"` → `"draft"` instead of `"draft"` → `"accepted"`.

**Repository pattern** [Source: src/features/invoices/server/invoices-repository.ts]:
- Lazy-import `db` and schema modules to avoid loading DB when `DATABASE_URL` is unset.
- Fall back to in-memory store for local dev without a DB.
- Use `db.transaction()` for multi-table writes.
- `shouldUseStoreFallback()` checks for connection/auth errors.
- Store fallback uses `setInvoiceStatusInStore()` which already exists.

**Existing invoice status model** [Source: src/features/invoices/types.ts]:
- `InvoiceStatus = "draft" | "sent" | "paid"`
- Current `updateInvoiceAction` (line 86-93) rejects non-draft invoices with: `"Only draft invoices can be edited."`
- This story does NOT change that guard — it adds a separate reopen step before editing.

### Source Tree Components

```
src/features/invoices/
  server/
    actions/
      reopen-invoice.ts                    # NEW - server action to reopen invoice
      reopen-invoice.test.ts               # NEW - tests for reopen action
    invoices-repository.ts                 # MODIFY - add updateInvoiceStatus export
  components/
    reopen-invoice-button.tsx              # NEW - client component for reopen action
    reopen-invoice-button.test.tsx         # NEW - component tests

src/app/(workspace)/invoices/
  [invoiceId]/
    page.tsx                               # MODIFY - add reopen flow for sent/paid invoices
```

### Key Files to Reference

- `src/features/quotes/server/actions/mark-quote-accepted.ts` — PRIMARY PATTERN for status-transition server action
- `src/features/invoices/server/actions/update-invoice.ts` — existing invoice update action (draft-only guard)
- `src/features/invoices/server/invoices-repository.ts` — invoice CRUD operations, needs `updateInvoiceStatus`
- `src/features/invoices/server/store/invoices-store.ts` — `setInvoiceStatusInStore()` already exists for fallback
- `src/features/invoices/components/conversion-review-panel.tsx` — read-only review panel for non-draft invoices
- `src/features/invoices/components/invoice-form.tsx` — editable form used for draft invoices
- `src/app/(workspace)/invoices/[invoiceId]/page.tsx` — invoice detail page to modify
- `src/features/invoices/types.ts` — `InvoiceStatus`, `InvoiceDetailRecord` types
- `src/components/feedback/inline-alert.tsx` — shared inline error component
- `src/lib/validation/action-result.ts` — `ActionResult<T>` type definition

### Data Flow for Reopen and Update

1. User opens invoice detail page for a `"sent"` or `"paid"` invoice
2. Page shows `ConversionReviewPanel` (read-only summary) + "Reopen for Editing" button
3. User clicks "Reopen for Editing"
4. `ReopenInvoiceButton` calls `reopenInvoiceAction({ invoiceId })`
5. Server action: `requireSession()` → `ensureStudioAccess()` → `getInvoiceById()` → validate status is `"sent"` or `"paid"` → `updateInvoiceStatus(invoiceId, "draft")` → revalidate paths → return `{ ok: true, data: { invoice } }`
6. Button shows success feedback, page re-renders as draft with `InvoiceForm`
7. User edits invoice using existing `InvoiceForm` → `updateInvoiceAction`
8. User can later send the invoice again (future story or manual status update)

### Testing Standards

- Unit/component tests co-located as `*.test.ts` or `*.test.tsx` files next to source
- Use Vitest with React Testing Library for component tests
- Follow existing test patterns in `src/features/invoices/server/actions/update-invoice.test.ts` and `src/features/invoices/components/conversion-review-panel.test.tsx`
- E2E tests use Playwright in `tests/e2e/` — optional for this story since the flow is covered by unit/component tests

### NFR Considerations

- NFR1: Invoice detail page must load in <= 2 seconds (95th percentile) — no change to load path
- NFR2: Reopen and update saves must complete in <= 2 seconds (95th percentile)
- NFR4/NFR5: Reopen action must require authentication and block unauthorized access
- NFR7: Zero silent data-loss — explicit success/failure feedback required
- NFR9: 100% explicit success/failure result for save and reopen actions
- NFR11: WCAG 2.1 AA — keyboard-reachable reopen button, accessible status feedback
- NFR12: Keyboard-only completion of reopen and update flow

### Previous Story Intelligence (from Story 5.3)

**Dev notes and learnings:**
- Story 5.3 added `InvoicePreview`, PDF export, and preview/PDF actions on the detail page
- The detail page already handles draft vs non-draft rendering: draft shows `InvoiceForm`, non-draft shows `ConversionReviewPanel`
- Invoice statuses: `"draft" | "sent" | "paid"` — the status field is a simple text column
- `setInvoiceStatusInStore()` already exists in the in-memory store for status transitions
- The `updateInvoiceAction` rejects non-draft edits at line 86-93 — this story adds the reopen step before that edit
- `ConversionReviewPanel` displays all invoice data in read-only mode — this stays visible for context after reopening
- The `markQuoteAccepted` action in the quotes feature is the best pattern reference for status transitions
- Git commit `39c86c5` implemented stories 5.1-5.3 and established the invoice feature conventions

**Files created in 5.3 that this story builds on:**
- `src/features/invoices/components/invoice-preview.tsx` — read-only preview (not modified here)
- `src/app/(workspace)/invoices/[invoiceId]/preview/page.tsx` — preview route (not modified here)
- `src/app/api/invoices/[invoiceId]/pdf/route.ts` — PDF export (not modified here)
- `src/app/(workspace)/invoices/[invoiceId]/page.tsx` — detail page (modified in this story)

**Files created in 5.1-5.2 that this story builds on:**
- `src/features/invoices/server/actions/update-invoice.ts` — draft-only edit action (not modified, reuse as-is)
- `src/features/invoices/components/invoice-form.tsx` — editable form (not modified, reuse as-is)
- `src/features/invoices/types.ts` — domain types (not modified)
- `src/features/invoices/server/invoices-repository.ts` — CRUD operations (modified: add `updateInvoiceStatus`)
- `src/features/invoices/server/store/invoices-store.ts` — `setInvoiceStatusInStore` (not modified, already exists)

### Git Intelligence

- Recent commit `39c86c5` implemented stories 5.1-5.3 (invoice conversion, editing, preview)
- Invoice infrastructure is fully established: schema, types, repository, queries, forms, store
- The `setInvoiceStatusInStore` function already exists in the store layer
- No database migration needed — the `status` column is a simple text field already present
- The reopen flow is the natural next step: it unlocks editing for post-creation invoice updates

## References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.4] — Story requirements and acceptance criteria
- [Source: _bmad-output/planning-artifacts/epics.md#FR32] — Functional requirement for reopening and updating invoices
- [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns] — Server action patterns
- [Source: _bmad-output/planning-artifacts/architecture.md#Naming Patterns] — Naming conventions
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries] — Invoice feature directory
- [Source: src/features/quotes/server/actions/mark-quote-accepted.ts] — Status-transition action pattern
- [Source: src/features/invoices/server/actions/update-invoice.ts] — Existing invoice update (draft-only guard)
- [Source: src/features/invoices/server/invoices-repository.ts] — Invoice CRUD and repository patterns
- [Source: src/features/invoices/server/store/invoices-store.ts] — `setInvoiceStatusInStore` already exists
- [Source: src/features/invoices/types.ts] — `InvoiceStatus` type definition

## Dev Agent Record

### Agent Model Used
opencode/mimo-v2-pro-free

### Debug Log References
- All 9 new tests pass (5 unit + 4 component)
- Full regression suite: 163 tests passed, 0 failures
- Pre-existing type error in `clients/types.ts` (unrelated to this story)
- Review-fix test sweep: 24 targeted tests passed across 6 files

### Completion Notes List
- Followed `markQuoteAccepted` pattern for server action structure
- Used `variant="outline"` instead of `variant="secondary"` (secondary not in design system)
- Idempotent reopen: already-draft invoices return success without changes
- Auth errors return "Invoice not found." (not "Unauthorized") to avoid leaking entity existence
- `updateInvoiceStatus` follows existing `shouldUseStoreFallback` pattern in invoices repository
- Added shared invoice navigation helpers so linked quote context survives invoice detail and preview hops
- Updated existing invoice detail/preview coverage and added focused tests for convert-to-invoice navigation
- Added safe fallback UI for rejected `reopenInvoiceAction` calls in the client button

### File List
- `src/features/invoices/server/actions/reopen-invoice.ts` — NEW
- `src/features/invoices/server/actions/reopen-invoice.test.ts` — NEW
- `src/features/invoices/server/invoices-repository.ts` — MODIFIED (added `updateInvoiceStatus` export, `InvoiceStatus` import, `setInvoiceStatusInStore` import)
- `src/features/invoices/components/reopen-invoice-button.tsx` — NEW
- `src/features/invoices/components/reopen-invoice-button.test.tsx` — NEW
- `src/features/invoices/components/convert-to-invoice-button.tsx` — MODIFIED (preserve linked `backTo` context when routing into invoice detail)
- `src/features/invoices/components/convert-to-invoice-button.test.tsx` — NEW
- `src/features/invoices/lib/navigation.ts` — NEW
- `src/features/invoices/lib/navigation.test.ts` — NEW
- `src/app/(workspace)/invoices/[invoiceId]/page.tsx` — MODIFIED (added `ReopenInvoiceButton` import and non-draft rendering)
- `src/app/(workspace)/invoices/[invoiceId]/page.test.tsx` — MODIFIED (added reopen/back-navigation coverage)
- `src/app/(workspace)/invoices/[invoiceId]/preview/page.tsx` — MODIFIED (use shared invoice navigation helpers)
- `src/app/(workspace)/invoices/[invoiceId]/preview/page.test.tsx` — MODIFIED (added linked quote `backTo` coverage)
- `src/app/(workspace)/quotes/[quoteId]/page.tsx` — MODIFIED (pass linked quote detail context into invoice conversion)
- `_bmad-output/implementation-artifacts/5-4-reopen-and-update-an-existing-invoice.md` — MODIFIED (review fixes, notes, and final status)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — MODIFIED (story status synced to done)

## Senior Developer Review (AI)

### Reviewer
chuck chuck

### Date
2026-03-22

### Outcome
Approve

### Review Notes
- Verified all 4 acceptance criteria against implementation and supporting tests.
- Fixed linked quote `backTo` preservation across quote -> invoice detail -> invoice preview navigation.
- Updated existing invoice detail/preview tests and added focused coverage for invoice navigation and quote-to-invoice routing.
- Fixed client-side reopen failure handling so rejected action calls surface a safe inline error.

## Change Log
- Reopen and update invoice flow: added `reopenInvoiceAction` server action, `updateInvoiceStatus` repository function, `ReopenInvoiceButton` component, and updated invoice detail page (2026-03-22)
- Code review follow-up: preserved linked `backTo` context, expanded invoice navigation coverage, and closed review findings (2026-03-22)
