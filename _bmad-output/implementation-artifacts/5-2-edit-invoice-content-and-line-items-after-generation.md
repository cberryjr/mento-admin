# Story 5.2: Edit Invoice Content and Line Items After Generation

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a studio owner,
I want to edit invoice content and line items after conversion,
So that the final invoice reflects the billing details I need to send.

## Acceptance Criteria

1. **Given** an invoice draft has been generated from an accepted quote
   **When** the user edits invoice fields, line items, dates, payment instructions, or related content
   **Then** the invoice draft is updated successfully
   **And** the edited values are stored on the invoice record.

2. **Given** invoice line items affect commercial totals
   **When** the user changes invoice line items or pricing-related values
   **Then** totals are recalculated correctly
   **And** the updated totals are shown clearly.

3. **Given** invalid or incomplete invoice edits are entered
   **When** the user attempts to save changes
   **Then** inline validation identifies the affected fields or sections
   **And** previously entered progress is preserved for correction.

4. **Given** the invoice editor is used on supported browsers and with keyboard interaction
   **When** the user moves through invoice editing controls
   **Then** the editing experience remains accessible and understandable
   **And** explicit success or failure feedback is provided for save actions.

## Tasks / Subtasks

- [x] Task 1: Extend update-invoice Zod schema to support line item edits (AC: 1, 3)
  - [x] Add `sections` array to `updateInvoiceSchema` with nested `lineItems` for section/line-item editing
  - [x] Each section: `id` (optional for new), `title`, `content`, `position`, and nested `lineItems`
  - [x] Each line item: `id` (optional for new), `name`, `content`, `quantity`, `unitLabel`, `unitPriceCents`, `position`
  - [x] Keep existing `title`, `terms`, `paymentInstructions`, `issueDate`, `dueDate` fields
  - [x] Add Zod refinements for quantity > 0, unitPriceCents >= 0, position >= 0

- [x] Task 2: Create update-invoice server action (AC: 1, 2, 3, 4)
  - [x] Create `src/features/invoices/server/actions/update-invoice.ts`
  - [x] Validate input with extended `updateInvoiceSchema`
  - [x] Require session, ensure studio access (follow `create-invoice-from-quote.ts` auth pattern)
  - [x] Verify invoice exists and status is "draft" (block edits on non-draft invoices)
  - [x] Update invoice header fields (title, terms, paymentInstructions, issueDate, dueDate)
  - [x] Handle section updates: update existing, add new, remove deleted
  - [x] Handle line item updates: update existing, add new, remove deleted
  - [x] Recalculate `lineTotalCents` for each line item (`quantity * unitPriceCents`)
  - [x] Recalculate invoice-level totals via `calculateInvoiceTotalCents`
  - [x] Use `db.transaction()` for multi-table writes (DB path)
  - [x] Update store fallback for in-memory path
  - [x] Return standard `ActionResult<InvoiceDetailRecord>` envelope
  - [x] Revalidate `/invoices` and `/invoices/[invoiceId]` paths

- [x] Task 3: Add updateInvoice method to invoices repository (AC: 1)
  - [x] Add `updateInvoice(invoiceId, studioId, input)` to `src/features/invoices/server/invoices-repository.ts`
  - [x] DB path: update `invoices` row fields, upsert/delete `invoice_sections`, upsert/delete `invoice_line_items`
  - [x] Store fallback: update the invoice record in the in-memory store
  - [x] Return updated `InvoiceDetailRecord`

- [x] Task 4: Add store fallback update functions (AC: 1)
  - [x] Add `updateInvoiceInStore(invoiceId, input)` to `src/features/invoices/server/store/invoices-store.ts`
  - [x] Support updating header fields, sections, and line items with recalculation
  - [x] Preserve `createdAt`, `invoiceNumber`, `sourceQuoteId`, `clientId`, `studioId` (immutable fields)

- [x] Task 5: Create InvoiceForm component (AC: 1, 2, 3, 4)
  - [x] Create `src/features/invoices/components/invoice-form.tsx`
  - [x] Render editable invoice header: title, issue date, due date, terms, payment instructions
  - [x] Render editable section headers: title, content
  - [x] Render editable line items: name, content, quantity, unit label, unit price (formatted as currency)
  - [x] Recalculate totals client-side on line item changes (immediate feedback)
  - [x] Show inline validation errors from server action response
  - [x] Preserve unsaved progress on validation failure
  - [x] Show explicit save success/failure feedback
  - [x] Disable form controls when invoice status is not "draft"
  - [x] Follow Geist-inspired design system (reuse existing `button.tsx`, `input.tsx`, `card.tsx`)
  - [x] Keyboard-operable: all fields reachable, add/remove section and line item via keyboard
  - [x] Add accessibility: labels, aria attributes, focus management

- [x] Task 6: Wire InvoiceForm into invoice detail page (AC: 1, 4)
  - [x] Update `src/app/(workspace)/invoices/[invoiceId]/page.tsx`
  - [x] Replace or augment the read-only ConversionReviewPanel with the editable InvoiceForm
  - [x] Pass invoice data as initial values to the form
  - [x] Conditionally show edit form only when invoice status is "draft"
  - [x] Keep source-quote linkage and client details visible above the form

- [x] Task 7: Write tests (AC: 1, 2, 3, 4)
  - [x] Unit test for `update-invoice` server action (happy path, validation, auth, non-draft guard)
  - [x] Unit test for repository `updateInvoice` method
  - [x] Unit test for `updateInvoiceInStore` store fallback
  - [x] Component test for `InvoiceForm` (renders, validates, submits, shows feedback)
  - [x] Update E2E tests in `tests/e2e/quotes.spec.ts` or create `tests/e2e/invoices.spec.ts` for invoice editing flow

## Dev Notes

### Relevant Architecture Patterns

**Server action contract** [Source: architecture.md#API & Communication Patterns]:
- All mutations use server actions validated with Zod at the boundary.
- Return the standard `ActionResult<T>` envelope: `{ ok: true, data }` or `{ ok: false, error: { code, message, fieldErrors? } }`.
- Auth pattern: `requireSession()` then `ensureStudioAccess(session, studioId)`.

**Naming conventions** [Source: architecture.md#Naming Patterns]:
- DB tables: plural snake_case (`invoices`, `invoice_line_items`)
- DB columns: snake_case (`created_at`, `unit_price_cents`)
- Application types: camelCase (`InvoiceDetailRecord`, `unitPriceCents`)
- Mutation names: verb-first camelCase (`updateInvoice`)
- Files: kebab-case (`update-invoice.ts`)

**Repository pattern** [Source: invoices-repository.ts]:
- Lazy-import `db` and schema modules to avoid loading DB when DATABASE_URL is unset.
- Fall back to in-memory store for local dev without a DB.
- Use `db.transaction()` for multi-table writes.
- `shouldUseStoreFallback()` checks for connection/auth errors.

**Status transitions** [Source: InvoiceStatus type]:
- Invoice status values: `"draft" | "sent" | "paid"`
- Editing is only allowed when status === `"draft"`
- Block edits with explicit error if status is not "draft"

**Form pattern** [Source: service-package-form.tsx, client-form.tsx]:
- Use React 19 `useActionState` or `useFormState` for server action integration
- Inline validation from `fieldErrors` in the action result
- Disable submit during `isPending`
- Show success/failure feedback via inline alerts

**Totals calculation** [Source: invoice-totals.ts]:
- `calculateInvoiceTotalCents(lineItems)` sums `lineTotalCents`
- Each line item: `lineTotalCents = quantity * unitPriceCents`
- Recalculate on every edit (both client-side preview and server-side save)

### Source Tree Components

```
src/features/invoices/
  schemas/
    update-invoice-schema.ts         # MODIFY - add sections/lineItems support
  server/
    invoices-repository.ts           # MODIFY - add updateInvoice method
    actions/
      update-invoice.ts              # NEW - server action for invoice editing
    store/
      invoices-store.ts              # MODIFY - add updateInvoiceInStore
  components/
    invoice-form.tsx                 # NEW - editable invoice form
    invoice-form.test.tsx            # exists (stub) - populate with tests

src/app/(workspace)/invoices/
  [invoiceId]/
    page.tsx                         # MODIFY - wire InvoiceForm

tests/e2e/
  invoices.spec.ts                   # NEW or MODIFY existing quotes.spec.ts
```

### Data Flow for Invoice Editing

1. User opens invoice detail page (status === "draft")
2. InvoiceForm renders with current invoice data as initial values
3. User edits header fields, section titles, line item names/prices/quantities
4. Client-side totals recalculate immediately on quantity/price changes
5. User submits form → calls `updateInvoice(invoiceId, formData)`
6. Server action validates input with extended `updateInvoiceSchema`
7. Server action checks auth (requireSession + ensureStudioAccess)
8. Server action verifies invoice status === "draft"
9. Repository updates `invoices` row, upserts/deletes sections and line items in transaction
10. Repository recalculates `lineTotalCents` per line item
11. Server action returns `ActionResult<InvoiceDetailRecord>`
12. UI shows success/failure feedback, revalidates page data

### Key Files to Reference

- `src/features/invoices/server/actions/create-invoice-from-quote.ts` - server action pattern to follow
- `src/features/invoices/server/invoices-repository.ts` - repository pattern with DB + store fallback
- `src/features/invoices/types.ts` - InvoiceDetailRecord, InvoiceSectionRecord, InvoiceLineItemRecord types
- `src/features/invoices/schemas/update-invoice-schema.ts` - existing schema to extend
- `src/features/invoices/server/store/invoices-store.ts` - in-memory store to extend
- `src/features/invoices/server/calculators/invoice-totals.ts` - totals calculator
- `src/features/invoices/components/conversion-review-panel.tsx` - existing component for reference
- `src/features/quotes/server/actions/save-quote-draft.ts` - comparable quote save pattern
- `src/lib/validation/action-result.ts` - ActionResult type
- `src/features/auth/require-session.ts` - auth helper

### Testing Standards

- Unit tests co-located as `*.test.ts` files next to source
- Use Vitest with standard arrange/act/assert
- Follow existing test patterns in `src/features/invoices/server/actions/create-invoice-from-quote.test.ts`
- Test happy path, validation errors, auth failures, non-draft guard, totals recalculation
- Component tests use React Testing Library
- E2E tests use Playwright in `tests/e2e/`

### NFR Considerations

- NFR2: Invoice save must complete in <= 2 seconds (95th percentile)
- NFR7: Zero silent data-loss - always return explicit success/failure
- NFR8: Invoice-to-quote lineage must be preserved (do not break sourceQuoteId linkage)
- NFR9: Explicit success/failure feedback for save action
- NFR11: WCAG 2.1 AA compliance for invoice form
- NFR12: Keyboard-only completion of invoice editing task

### Previous Story Intelligence (from Story 5.1)

**Dev notes and learnings:**
- Repository falls back to in-memory store when DATABASE_URL is unset or DB connection fails
- `shouldUseStoreFallback()` catches auth failures (28P01), connection refused (ECONNREFUSED), and DNS failures
- Invoice sections are stored separately from line items; line items reference their parent section via `invoiceSectionId`
- Generated invoice number format: `INV-YYYYMMDD-XXXXXXXX`
- After invoice creation, source quote status updates to "invoiced"
- ConversionReviewPanel shows carried-over data but is currently read-only
- Event system deferred - no `invoice.updated` event to emit yet

**Files created in 5.1 that this story builds on:**
- `src/server/db/schema/invoices.ts` - Drizzle schema with `invoices`, `invoiceSections`, `invoiceLineItems` tables
- `src/features/invoices/types.ts` - InvoiceDetailRecord with nested sections and line items
- `src/features/invoices/server/invoices-repository.ts` - create and read operations
- `src/features/invoices/server/store/invoices-store.ts` - in-memory store with create/read
- `src/features/invoices/schemas/update-invoice-schema.ts` - stub schema (header fields only)
- `src/features/invoices/server/calculators/invoice-totals.ts` - sum calculator

## References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.2] - Story requirements and acceptance criteria
- [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns] - Server action patterns
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture] - Drizzle ORM, schema design
- [Source: _bmad-output/planning-artifacts/architecture.md#Naming Patterns] - Naming conventions
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries] - Invoice feature directory
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Convert Accepted Quote To Invoice] - Invoice editing UX flow
- [Source: src/features/invoices/server/actions/create-invoice-from-quote.ts] - Server action pattern
- [Source: src/features/invoices/server/invoices-repository.ts] - Repository with DB + store fallback
- [Source: src/features/invoices/schemas/update-invoice-schema.ts] - Schema to extend

## Dev Agent Record

### Agent Model Used
mimo-v2-pro-free

### Debug Log References

### Completion Notes List
- Extended updateInvoiceSchema with sections array containing nested lineItems, with Zod validations for quantity > 0, unitPriceCents >= 0, position >= 0
- Added issueDate and dueDate fields to the schema with nullable string transform
- Created updateInvoice server action following create-invoice-from-quote.ts pattern (auth, validation, non-draft guard, ActionResult envelope, revalidatePath)
- Added updateInvoice method to invoices repository with full DB transaction support (upsert/delete sections and line items) and store fallback
- Created updateInvoiceInStore for in-memory path with header field updates, section upsert/deletion, line item upsert/deletion, and lineTotalCents recalculation
- Built InvoiceForm component with editable header fields, section/line item management (add/remove), client-side totals recalculation, inline validation, success/failure feedback, accessibility labels and keyboard operability, disabled state for non-draft invoices
- Wired InvoiceForm into invoice detail page, showing edit form for draft invoices and read-only ConversionReviewPanel for sent/paid invoices
- Created random-id utility for stable temporary keys
- Senior developer review fixes applied: nested invoice validation errors now map to field paths, date strings validate before persistence, InvoiceForm now uses shared UI primitives with dollar-formatted unit-price inputs, and non-draft invoice review is explicitly read-only
- Validated the review fixes with targeted invoice Vitest coverage (41 passing tests), targeted Chromium Playwright invoice conversion/editing checks, and ESLint on the touched invoice files

### File List
- src/app/(workspace)/invoices/[invoiceId]/page.tsx (MODIFIED) - Invoice detail page route for draft editing and read-only review
- src/app/(workspace)/quotes/[quoteId]/page.tsx (MODIFIED) - Accepted-quote detail flow wiring for invoice conversion
- src/components/ui/button.tsx (NEW) - Shared button primitive reused by invoice editing surfaces
- src/components/ui/input.tsx (NEW) - Shared input primitive reused by invoice editing surfaces
- src/components/ui/textarea.tsx (NEW) - Shared textarea primitive reused by invoice editing surfaces
- src/features/invoices/components/conversion-review-panel.tsx (NEW) - Read-only review panel for non-draft invoices
- src/features/invoices/components/conversion-review-panel.test.tsx (NEW) - Component coverage for read-only invoice review behavior
- src/features/invoices/components/convert-to-invoice-button.tsx (NEW) - Client-side conversion button for accepted quotes
- src/features/invoices/components/invoice-form.tsx (NEW) - Editable invoice form with nested validation and totals feedback
- src/features/invoices/components/invoice-form.test.tsx (NEW) - Component coverage for invoice editing and inline validation
- src/features/invoices/schemas/create-invoice-from-quote-schema.ts (NEW) - Conversion input schema
- src/features/invoices/schemas/update-invoice-schema.ts (MODIFIED) - Invoice editing schema with nested field-error mapping and strict date validation
- src/features/invoices/server/actions/create-invoice-from-quote.ts (NEW) - Server action for accepted-quote invoice conversion
- src/features/invoices/server/actions/create-invoice-from-quote.test.ts (NEW) - Conversion action tests
- src/features/invoices/server/actions/update-invoice.ts (NEW) - Server action for invoice editing
- src/features/invoices/server/actions/update-invoice.test.ts (NEW) - Invoice editing action tests
- src/features/invoices/server/calculators/invoice-totals.ts (NEW) - Invoice totals calculator
- src/features/invoices/server/calculators/invoice-totals.test.ts (NEW) - Totals calculator tests
- src/features/invoices/server/invoices-repository.ts (MODIFIED) - Invoice persistence with DB/store update support
- src/features/invoices/server/invoices-repository.test.ts (NEW) - Repository coverage for invoice conversion and editing
- src/features/invoices/server/mappers.ts (NEW) - Invoice DB row to record mapping helpers
- src/features/invoices/server/queries/get-invoice.ts (NEW) - Invoice detail query with auth-aware result envelope
- src/features/invoices/server/queries/list-invoices.ts (MODIFIED) - Invoice list query backed by repository data
- src/features/invoices/server/store/invoices-store.ts (MODIFIED) - Store fallback update support for invoice editing
- src/features/invoices/types.ts (NEW) - Invoice domain types and summary mapping
- src/features/quotes/components/quote-status-chip.tsx (MODIFIED) - Added invoiced status treatment used by invoice flow
- src/features/quotes/components/quote-status-chip.test.tsx (MODIFIED) - Coverage for invoiced quote status chip
- src/lib/utils/random-id.ts (NEW) - Temporary client-only IDs for unsaved form rows
- src/server/db/schema/index.ts (MODIFIED) - Exported invoice schema modules
- src/server/db/schema/invoices.ts (NEW) - Invoice, section, and line-item persistence schema
- tests/e2e/quotes.spec.ts (MODIFIED) - Invoice conversion and edit/save end-to-end coverage

### Change Log
- 2026-03-21: Initial implementation - invoice editing with sections and line items, server action, repository, store fallback, InvoiceForm component, tests

## Senior Developer Review (AI)

- Reviewer: chuck chuck
- Date: 2026-03-21
- Outcome: Approve
- Findings addressed: nested invoice validation now resolves to field-level paths, invalid dates are rejected before persistence, the invoice form now reuses shared UI primitives and dollar-based price inputs, non-draft review is explicitly read-only, and Playwright coverage now exercises invoice conversion plus invoice edit/save persistence

### Change Log
- Implemented invoice editing after generation: schema, action, repository/store updates, editable form, and targeted test coverage (2026-03-21)
- Senior developer review fixes applied: strict date validation, nested field-error mapping, shared UI primitives, read-only non-draft review, and invoice edit/save Playwright coverage (2026-03-21)
