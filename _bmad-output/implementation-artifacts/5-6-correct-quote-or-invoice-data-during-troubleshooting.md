# Story 5.6: Correct Quote or Invoice Data During Troubleshooting

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a studio owner,
I want to correct incorrect quote or invoice data during troubleshooting,
so that I can recover from workflow problems without leaving the system.

## Acceptance Criteria

1. **Given** a quote or invoice contains incorrect client data, section content, line items, pricing values, terms, or status fields (and invoice-specific dates)
   **When** the user updates the incorrect values and saves
   **Then** the affected record is corrected successfully
   **And** any dependent totals are recalculated accurately.

2. **Given** the user identified the issue from a connected record chain
   **When** they navigate to the relevant editable record
   **Then** the workflow allows correction without forcing duplicate record creation
   **And** continuity with related records is preserved.

3. **Given** a correction introduces invalid data or cannot be saved
   **When** the user attempts to persist the correction
   **Then** the application returns explicit validation or failure feedback
   **And** the user is guided toward recovery without silent data loss.

4. **Given** troubleshooting is part of the trust model for the MVP
   **When** corrected records are reopened later
   **Then** the saved corrections remain visible and traceable
   **And** the workflow remains usable without external spreadsheets or document reconstruction.

## Tasks / Subtasks

- [x] Task 1: Create `correctQuoteData` server action (AC: 1, 2, 3, 4)
  - [x] Create `src/features/quotes/server/actions/correct-quote-data.ts`
  - [x] Define input schema with Zod: `{ quoteId: string, corrections: QuoteCorrectionPayload }`
  - [x] Support correction of: client data, section content, line items, pricing values, dates, terms
  - [x] Validate all inputs with Zod at boundary
  - [x] Recalculate totals after any pricing or line-item correction
  - [x] Return standard result envelope: `{ ok: true, data }` or `{ ok: false, error: { code, message, fieldErrors? } }`
  - [x] Auth pattern: `requireSession()` then `ensureStudioAccess(session, studioId)`
  - [x] Emit `quote.corrected` workflow event after successful save

- [x] Task 2: Create `correctInvoiceData` server action (AC: 1, 2, 3, 4)
  - [x] Create `src/features/invoices/server/actions/correct-invoice-data.ts`
  - [x] Define input schema with Zod: `{ invoiceId: string, corrections: InvoiceCorrectionPayload }`
  - [x] Support correction of: client data, section content, line items, pricing values, dates, terms, payment instructions
  - [x] Validate all inputs with Zod at boundary
  - [x] Recalculate totals after any pricing or line-item correction
  - [x] Return standard result envelope
  - [x] Auth pattern: `requireSession()` then `ensureStudioAccess(session, studioId)`
  - [x] Emit `invoice.corrected` workflow event after successful save

- [x] Task 3: Create `CorrectionForm` component (AC: 1, 3)
  - [x] Create `src/features/corrections/components/correction-form.tsx`
  - [x] Reuse existing form patterns from `src/features/quotes/components/quote-editor/` and `src/features/invoices/components/`
  - [x] Support inline editing of all correctable fields
  - [x] Show real-time totals recalculation
  - [x] Display validation errors inline (field-aware format)
  - [x] Preserve existing data when fields are not modified
  - [x] Keyboard accessible: all fields reachable via tab, form submittable via Enter
  - [x] Use Geist-inspired styling consistent with existing components

- [x] Task 4: Create correction entry points (AC: 2)
  - [x] Add "Correct Data" action to `src/app/(workspace)/quotes/[quoteId]/page.tsx`
  - [x] Add "Correct Data" action to `src/app/(workspace)/invoices/[invoiceId]/page.tsx`
  - [x] Use `variant="outline"` or quiet/tertiary button style
  - [x] Preserve `backTo` context so user can return to originating page
  - [x] Link to correction form with entity type and ID params

- [x] Task 5: Write tests (AC: 1, 2, 3, 4)
  - [x] Unit test for `correctQuoteData` in `src/features/quotes/server/actions/correct-quote-data.test.ts`:
    - Corrects client data successfully
    - Corrects section content successfully
    - Corrects line items and recalculates totals
    - Corrects pricing values and recalculates totals
    - Corrects dates and terms
    - Returns validation error for invalid input
    - Returns unauthorized for wrong studio
    - Emits `quote.corrected` event
  - [x] Unit test for `correctInvoiceData` in `src/features/invoices/server/actions/correct-invoice-data.test.ts`:
    - Corrects client data successfully
    - Corrects section content successfully
    - Corrects line items and recalculates totals
    - Corrects pricing values and recalculates totals
    - Corrects dates, terms, and payment instructions
    - Returns validation error for invalid input
    - Returns unauthorized for wrong studio
    - Emits `invoice.corrected` event
  - [x] Component test for `CorrectionForm` in `src/features/corrections/components/correction-form.test.tsx`:
    - Renders editable fields for all correctable data
    - Updates field values on user input
    - Shows validation errors for invalid input
    - Recalculates totals on pricing changes
    - Submits correction with valid data
    - Keyboard navigation works correctly

## Dev Notes

### Relevant Architecture Patterns

**Server action contract** [Source: architecture.md#API & Communication Patterns]:
- Server actions for authenticated mutations
- Return standard result envelope: `{ ok: true, data }` or `{ ok: false, error: { code, message, fieldErrors? } }`
- Auth pattern: `requireSession()` then `ensureStudioAccess(session, studioId)` [Source: src/features/auth/require-session.ts]
- Zod validation at every action input [Source: architecture.md#Data Architecture]

**Naming conventions** [Source: architecture.md#Naming Patterns]:
- DB tables: plural snake_case (`quotes`, `quote_sections`, `quote_line_items`, `invoices`)
- DB columns: snake_case (`created_at`, `updated_at`, `quote_id`, `client_id`)
- Server actions: verb-first camelCase (`correctQuoteData`, `correctInvoiceData`)
- Files: kebab-case (`correct-quote-data.ts`, `correction-form.tsx`)

**Existing data model relationships** [Source: architecture.md#Data Architecture]:
- `quotes` ← `quote_sections.quote_id` (FK)
- `quote_sections` ← `quote_line_items.quote_section_id` (FK)
- `quotes` ← `invoices.quote_id` (FK)
- `invoices` ← `invoice_sections.invoice_id` (FK)
- `invoice_sections` ← `invoice_line_items.invoice_section_id` (FK)
- `clients` ← `quotes.client_id` (FK)
- `clients` ← `invoices.client_id` (FK)

**Status types** [Source: architecture.md#Data Architecture]:
- Quote status: `"draft" | "accepted" | "invoiced"`
- Invoice status: `"draft" | "sent" | "paid"`
- Status corrections must respect lifecycle rules (e.g., cannot revert `invoiced` to `draft`)

**Correction workflow constraints** [Source: epics.md#FR36]:
- Correction must not force duplicate record creation
- Continuity with related records must be preserved
- Totals must recalculate accurately after any correction
- Corrections must be visible and traceable when record is reopened

### Source Tree Components

```
src/features/quotes/server/actions/
  correct-quote-data.ts                      # NEW - server action for quote corrections
  correct-quote-data.test.ts                 # NEW - unit tests

src/features/invoices/server/actions/
  correct-invoice-data.ts                    # NEW - server action for invoice corrections
  correct-invoice-data.test.ts               # NEW - unit tests

src/features/corrections/                    # NEW - correction feature directory
  components/
    correction-form.tsx                      # NEW - correction form component
    correction-form.test.tsx                 # NEW - component tests

src/app/(workspace)/quotes/[quoteId]/
  page.tsx                                   # MODIFY - add "Correct Data" link

src/app/(workspace)/invoices/[invoiceId]/
  page.tsx                                   # MODIFY - add "Correct Data" link
```

### Key Files to Reference

- `src/features/quotes/server/actions/update-quote-sections.ts` — server action pattern for quote updates
- `src/features/quotes/server/actions/update-quote-line-item.ts` — line item update pattern
- `src/features/invoices/server/actions/update-invoice.ts` — invoice update pattern
- `src/features/invoices/server/actions/reopen-invoice.ts` — action button pattern
- `src/features/quotes/lib/totals.ts` — quote totals calculation (if exists)
- `src/features/invoices/lib/totals.ts` — invoice totals calculation (if exists)
- `src/features/auth/require-session.ts` — authentication helper
- `src/lib/validation/action-result.ts` — `ActionResult<T>` type definition
- `src/features/quotes/components/quote-editor/` — quote editor form patterns
- `src/features/invoices/components/` — invoice form patterns

### Data Flow for Correction

1. User clicks "Correct Data" from quote or invoice detail page
2. Navigation to correction form with entity type and ID
3. Form loads current record data (sections, line items, client, pricing, dates, terms)
4. User modifies incorrect fields inline
5. Form recalculates totals in real-time as pricing/line items change
6. On submit, server action validates all inputs with Zod
7. Server action persists corrections and recalculates totals server-side
8. Server action emits workflow event (`quote.corrected` or `invoice.corrected`)
9. User receives explicit success/failure feedback
10. Corrected record remains linked to related records (client, source quote, revisions)

### Correction Payload Structure

```typescript
type QuoteCorrectionPayload = {
  clientId?: string;                    // update client association
  sections?: {
    id: string;
    name?: string;
    description?: string;
    lineItems?: {
      id: string;
      description?: string;
      quantity?: number;
      unitPrice?: number;
    }[];
  }[];
  dates?: {
    issueDate?: string;                 // ISO 8601
    validUntil?: string;                // ISO 8601
  };
  terms?: string;                       // terms and conditions
  status?: "draft" | "accepted";        // limited status corrections
};

type InvoiceCorrectionPayload = {
  clientId?: string;
  sections?: {
    id: string;
    name?: string;
    description?: string;
    lineItems?: {
      id: string;
      description?: string;
      quantity?: number;
      unitPrice?: number;
    }[];
  }[];
  dates?: {
    issueDate?: string;
    dueDate?: string;
  };
  terms?: string;
  paymentInstructions?: string;
  status?: "draft" | "sent";            // limited status corrections
};
```

### Previous Story Intelligence (from Story 5.5)

**Dev notes and learnings:**
- Story 5.5 created `getRecordHistory` query and `ConnectedRecordHistory` component
- Record history page allows users to trace invoice lineage and identify data issues
- This story (5.6) implements the actual correction capability discovered through record history
- Navigation helpers established in Stories 5.3-5.5 should be reused for correction entry points
- Invoice detail page shows `ConversionReviewPanel` for non-draft invoices — corrections should work alongside this view
- Quote detail page supports revision timeline — corrections should not create new revisions

**Files from earlier stories this story builds on:**
- `src/features/invoices/lib/navigation.ts` — invoice navigation helpers
- `src/features/quotes/lib/navigation.ts` — quote navigation helpers
- `src/features/record-history/components/connected-record-history.tsx` — record chain for discovering issues
- `src/app/(workspace)/records/history/page.tsx` — record history page

### Git Intelligence

- Recent commits implemented Stories 5.1-5.5 (invoice conversion, editing, preview, reopen, record history)
- Invoice infrastructure is fully established: schema, types, repository, queries, forms, store, navigation
- Quote infrastructure includes sections, line items, revisions, and status management
- Totals calculation logic exists in quote and invoice features — reuse for correction recalculation
- Server action patterns are consistent across features: Zod validation, auth checks, result envelope

### Testing Standards

- Unit/component tests co-located as `*.test.ts` or `*.test.tsx` files next to source
- Use Vitest with React Testing Library for component tests
- Follow existing test patterns in `src/features/invoices/server/actions/reopen-invoice.test.ts` and `src/features/quotes/server/actions/update-quote-sections.test.ts`
- E2E tests use Playwright in `tests/e2e/` — optional for this story since core logic is covered by unit/component tests

### NFR Considerations

- NFR2: Correction saves must complete in <= 2 seconds (95th percentile)
- NFR4/NFR5: Correction actions must require authentication and block unauthorized access
- NFR7: Zero silent data-loss — corrections must persist accurately
- NFR8: Corrected records must preserve client, quote, revision, and invoice links
- NFR9: 100% explicit success/failure result for correction actions
- NFR11: WCAG 2.1 AA — keyboard-reachable correction form fields
- NFR12: Keyboard-only completion of correction workflow

## References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.6] — Story requirements and acceptance criteria
- [Source: _bmad-output/planning-artifacts/epics.md#FR36] — Correct incorrect data during troubleshooting
- [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns] — Server action patterns and result envelope
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture] — Entity relationships and FK model
- [Source: _bmad-output/planning-artifacts/architecture.md#Naming Patterns] — Naming conventions
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Troubleshooting] — UX correction workflow
- [Source: src/features/quotes/server/actions/update-quote-sections.ts] — Quote update pattern
- [Source: src/features/invoices/server/actions/update-invoice.ts] — Invoice update pattern
- [Source: src/features/auth/require-session.ts] — Auth helper

## Dev Agent Record

### Agent Model Used

- openai/gpt-5.4

### Debug Log References

- `npm test -- src/features/quotes/server/actions/correct-quote-data.test.ts`
- `npm test -- src/features/invoices/server/actions/correct-invoice-data.test.ts`
- `npm test -- src/features/corrections/components/correction-form.test.tsx`
- `npm test -- "src/app/(workspace)/quotes/[quoteId]/page.test.tsx"`
- `npm test -- "src/app/(workspace)/invoices/[invoiceId]/page.test.tsx"`
- `npm test`
- `npm run lint`

### Implementation Plan

- Add dedicated quote and invoice correction server actions that merge partial corrections into existing records, validate at the action boundary, enforce lifecycle constraints, and emit correction workflow events.
- Reuse existing invoice and quote editing patterns to build a shared correction form with inline field errors, keyboard submission support, and live totals recalculation.
- Add quote and invoice detail entry points plus a shared correction route that preserves return navigation back to the originating record.

### Completion Notes List

- Implemented `correctQuoteData` and `correctInvoiceData` server actions with scoped auth checks, field-aware validation, totals recalculation, lifecycle guards, and correction workflow event emission.
- Added a shared `CorrectionForm` and `/records/correct` workflow entry that supports inline quote and invoice troubleshooting with preserved return navigation.
- Extended invoice persistence to support client reassignment during correction and added a lightweight correction event store for workflow traceability hooks.
- Added unit and component coverage for correction actions and form behavior, plus page-level regression coverage for the new quote and invoice entry points.
- Clarified with the user that quote-specific date correction should remain scoped to the current persisted model; invoice date correction is fully implemented.
- Added strict correction payload validation to block unknown fields and prevent silent correction drops.
- Added explicit server feedback when quote date correction is requested against the current quote model.
- Added record-history metadata for last quote/invoice correction event timestamps to improve troubleshooting traceability.

### File List

- `_bmad-output/implementation-artifacts/5-6-correct-quote-or-invoice-data-during-troubleshooting.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `src/app/(workspace)/invoices/[invoiceId]/page.test.tsx`
- `src/app/(workspace)/invoices/[invoiceId]/page.tsx`
- `src/app/(workspace)/quotes/[quoteId]/page.test.tsx`
- `src/app/(workspace)/quotes/[quoteId]/page.tsx`
- `src/app/(workspace)/records/correct/page.tsx`
- `src/features/corrections/components/correction-form.test.tsx`
- `src/features/corrections/components/correction-form.tsx`
- `src/features/corrections/server/correction-events.ts`
- `src/features/invoices/server/actions/correct-invoice-data.test.ts`
- `src/features/invoices/server/actions/correct-invoice-data.ts`
- `src/features/invoices/server/invoices-repository.ts`
- `src/features/invoices/server/store/invoices-store.ts`
- `src/features/quotes/server/actions/correct-quote-data.test.ts`
- `src/features/quotes/server/actions/correct-quote-data.ts`
- `src/features/record-history/server/queries/get-record-history.ts`

## Change Log

- 2026-03-22: Added quote/invoice correction actions, shared correction UI/route, persisted invoice client reassignment support, workflow event hooks, and full regression coverage for the troubleshooting correction flow.
- 2026-03-22: Code review remediation - strict payload validation, explicit quote-date correction feedback, and correction timestamp visibility in record history.

## Senior Developer Review (AI)

### Reviewer

- chuck chuck

### Date

- 2026-03-22

### Outcome

- Approved

### Summary

- Remediated high/medium findings from adversarial review by eliminating silent payload drops, documenting quote-date scope explicitly, and surfacing correction timing metadata for troubleshooting visibility.
