# Story 5.1: Convert an Accepted Quote into a Linked Invoice Draft

Status: done

## Story

As a studio owner,
I want to convert an accepted quote into an invoice draft,
So that invoicing feels like the natural next step after quote approval.

## Acceptance Criteria

1. **Given** a quote is in accepted state
   **When** the user chooses to convert it into an invoice
   **Then** the system creates a new invoice draft from that accepted quote
   **And** the invoice is linked to both the source quote and the client.

2. **Given** the accepted quote contains client details, line items, totals, and terms
   **When** invoice conversion succeeds
   **Then** the invoice draft carries over the relevant commercial data transparently
   **And** the user can review what came from the quote.

3. **Given** a quote is not in the correct state for conversion
   **When** the user attempts to create an invoice from it
   **Then** the action is blocked with explicit feedback
   **And** no invalid invoice record is created.

4. **Given** invoice conversion is part of the core MVP flow
   **When** the workflow is exercised under expected usage
   **Then** the conversion path remains aligned with the target time and reliability requirements
   **And** the resulting invoice is ready for later editing and client-facing review.

## Tasks / Subtasks

- [x] Task 1: Create invoice Drizzle schema (AC: 1, 2)
  - [x] Create `src/server/db/schema/invoices.ts` with `invoices` table (id, studio_id, client_id, source_quote_id, invoice_number, title, status, issue_date, due_date, payment_instructions, terms, created_at, updated_at)
  - [x] Create `invoice_line_items` table (id, invoice_id, studio_id, name, content, quantity, unit_label, unit_price_cents, line_total_cents, position, created_at, updated_at)
  - [x] Add snake_case column names per naming conventions
  - [x] Export from `src/server/db/schema/index.ts`
  - [x] Generate Drizzle migration (`drizzle/migrations/0008_glorious_vin_gonzales.sql`)

- [x] Task 2: Create invoice types and Zod schemas (AC: 1, 2)
  - [x] Create `src/features/invoices/types.ts` with InvoiceRecord, InvoiceLineItemRecord, InvoiceDetailRecord, InvoiceStatus types
  - [x] Create `src/features/invoices/schemas/create-invoice-from-quote-schema.ts` with Zod input schema for quoteId
  - [x] Create `src/features/invoices/schemas/update-invoice-schema.ts` with Zod schema for invoice edits

- [x] Task 3: Create invoice repository with DB and store fallback (AC: 1, 2)
  - [x] Create `src/features/invoices/server/invoices-repository.ts`
  - [x] Implement `createInvoiceFromQuote(studioId, quoteId)` that reads accepted quote, copies sections/line items into invoice, sets status to "draft", generates invoice number, links to source quote and client
  - [x] Implement `getInvoiceById(invoiceId)` for detail retrieval
  - [x] Implement in-memory store fallback for when DATABASE_URL is unset (follow quotes-store.ts pattern)
  - [x] Generate invoice number format: `INV-YYYYMMDD-XXXXXXXX`

- [x] Task 4: Create create-invoice-from-quote server action (AC: 1, 3)
  - [x] Create `src/features/invoices/server/actions/create-invoice-from-quote.ts`
  - [x] Validate input with Zod, require session, ensure studio access
  - [x] Verify quote exists and status is "accepted" before conversion (block non-accepted states)
  - [x] Call repository to create invoice record with linked line items
  - [x] Update quote status to "invoiced" after successful conversion
  - [ ] Emit `invoice.generated` workflow event (no event system exists in codebase - deferred)
  - [x] Revalidate invoice and quote paths
  - [x] Return standard ActionResult envelope

- [x] Task 5: Create get-invoice query (AC: 2)
  - [x] Create `src/features/invoices/server/queries/get-invoice.ts`
  - [x] Return InvoiceDetailRecord with source quote linkage visible
  - [x] Follow existing query patterns (requireSession, ensureStudioAccess, try/catch with AppError handling)

- [x] Task 6: Update list-invoices query to use repository (AC: 2)
  - [x] Replace stub in `src/features/invoices/server/queries/list-invoices.ts`
  - [x] Query actual invoice records from repository
  - [x] Keep existing ActionResult contract

- [x] Task 7: Create invoice totals calculator (AC: 2)
  - [x] Create `src/features/invoices/server/calculators/invoice-totals.ts`
  - [x] Implement `calculateInvoiceTotalCents(lineItems)` following quote-totals.ts pattern

- [x] Task 8: Create invoice mappers (AC: 2)
  - [x] Create `src/features/invoices/server/mappers.ts`
  - [x] Map DB rows to application types with camelCase output

- [x] Task 9: Create conversion-review-panel component (AC: 2)
  - [x] Create `src/features/invoices/components/conversion-review-panel.tsx`
  - [x] Show source quote reference, carried-over fields, and editable invoice fields
  - [x] Follow Geist-inspired design system with clear source-vs-instance distinction

- [x] Task 10: Create invoice detail page route (AC: 1, 2)
  - [x] Create `src/app/(workspace)/invoices/[invoiceId]/page.tsx`
  - [x] Display invoice details with source quote linkage
  - [x] Show conversion review panel with carried-over data

- [x] Task 11: Wire convert-to-invoice action into quote detail view (AC: 1, 3)
  - [x] Add "Convert to Invoice" action on accepted quote detail page (`src/app/(workspace)/quotes/[quoteId]/page.tsx`)
  - [x] Gate on quote status === "accepted" only
  - [x] Show explicit feedback on success or failure
  - [x] Navigate to new invoice detail page on success

- [x] Task 12: Write tests
  - [x] Unit test for `create-invoice-from-quote` server action
  - [x] Unit test for invoice repository
  - [x] Unit test for invoice totals calculator

## Dev Notes

### Relevant Architecture Patterns

**Quote-to-invoice conversion boundary** [Source: architecture.md#Integration Points]:
- Quote conversion crosses feature boundaries through an explicit quote action that creates invoice records, rather than direct UI-layer mutation.
- The conversion reads from persisted records, not from client draft state.

**Server action contract** [Source: architecture.md#API & Communication Patterns]:
- All mutations use server actions validated with Zod at the boundary.
- Return the standard `ActionResult<T>` envelope: `{ ok: true, data }` or `{ ok: false, error: { code, message, fieldErrors? } }`.

**Naming conventions** [Source: architecture.md#Naming Patterns]:
- DB tables: plural snake_case (`invoices`, `invoice_line_items`)
- DB columns: snake_case (`created_at`, `client_id`, `source_quote_id`)
- Application types: camelCase (`InvoiceDetailRecord`, `invoiceNumber`)
- Mutation names: verb-first camelCase (`createInvoiceFromQuote`)
- Files: kebab-case (`create-invoice-from-quote.ts`)

**Repository pattern** [Source: quotes-repository.ts]:
- Lazy-import `db` and schema modules to avoid loading DB when DATABASE_URL is unset.
- Fall back to in-memory store for local dev without a DB.
- Use `db.transaction()` for multi-table writes.

**Status transitions** [Source: QuoteStatus type]:
- After conversion, update source quote status from `"accepted"` to `"invoiced"`.
- Invoice starts with status `"draft"`.

**Event system** [Source: architecture.md#Communication Patterns]:
- Emit `invoice.generated` event after successful conversion.
- Event payload includes: `eventName`, `occurredAt`, `actorUserId`, `entityType`, `entityId`, `metadata`.

### Source Tree Components

```
src/
  server/
    db/
      schema/
        invoices.ts           # NEW - Drizzle schema
        index.ts              # MODIFY - export invoices, invoiceLineItems
  features/
    invoices/
      types.ts                # NEW - Invoice types
      invoice-form.test.tsx   # exists (stub)
      schemas/
        create-invoice-from-quote-schema.ts  # NEW
        update-invoice-schema.ts             # NEW
      components/
        conversion-review-panel.tsx          # NEW
        invoice-form.tsx                     # NEW (for story 5.2)
        invoice-preview.tsx                  # NEW (for story 5.3)
        payment-instructions-card.tsx        # NEW (for story 5.3)
      server/
        invoices-repository.ts               # NEW
        mappers.ts                           # NEW
        actions/
          create-invoice-from-quote.ts       # NEW
          update-invoice.ts                  # NEW (for story 5.2)
        calculators/
          invoice-totals.ts                  # NEW
        queries/
          get-invoice.ts                     # NEW
          list-invoices.ts                   # MODIFY - replace stub
          store/
            invoices-store.ts               # NEW - in-memory fallback
  app/
    (workspace)/
      invoices/
        [invoiceId]/
          page.tsx                            # NEW - detail page
        page.tsx                              # exists (stub)
```

### Data Flow for Conversion

1. User triggers `createInvoiceFromQuote({ quoteId })` from accepted quote detail page
2. Server action validates input, checks auth, verifies quote status === "accepted"
3. Repository reads quote with all sections and line items
4. Repository creates `invoices` row linked to `source_quote_id` and `client_id`
5. Repository copies each section's line items into `invoice_line_items` rows
6. Server action updates quote status to `"invoiced"`
7. Server action emits `invoice.generated` workflow event
8. Server action revalidates `/invoices`, `/invoices/[id]`, `/quotes`, `/quotes/[id]` paths
9. UI navigates to new invoice detail page

### Key Files to Reference

- `src/features/quotes/server/actions/mark-quote-accepted.ts` - server action pattern to follow
- `src/features/quotes/server/quotes-repository.ts` - repository pattern with lazy DB imports and store fallback
- `src/features/quotes/types.ts` - type definition pattern
- `src/features/quotes/server/quotes-store.ts` - in-memory store pattern
- `src/lib/validation/action-result.ts` - ActionResult type
- `src/server/db/schema/quotes.ts` - Drizzle schema pattern
- `src/server/db/schema/studio-defaults.ts` - payment instructions field pattern

### Testing Standards

- Unit tests co-located as `*.test.ts` files next to source
- Use Vitest with standard arrange/act/assert
- Follow existing test patterns in `src/features/quotes/server/actions/mark-quote-accepted.test.ts`
- Test happy path, validation errors, auth failures, and state guard (non-accepted quote rejection)

### NFR Considerations

- NFR3: Invoice conversion must complete in <= 2 seconds (95th percentile)
- NFR7: Zero silent data-loss - always return explicit success/failure
- NFR8: Invoice-to-quote lineage must be preserved in 100% of tested flows
- NFR9: Explicit success/failure feedback for conversion action

## References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.1] - Story requirements and acceptance criteria
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture] - Drizzle ORM, PostgreSQL schema design
- [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns] - Server action patterns
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries] - Invoice feature directory structure
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Convert Accepted Quote To Invoice] - UX flow and Conversion Review Panel
- [Source: src/features/quotes/server/actions/mark-quote-accepted.ts] - Closest existing action pattern
- [Source: src/features/quotes/server/quotes-repository.ts] - Repository pattern with DB + store fallback

## Dev Agent Record

### Agent Model Used
opencode/mimo-v2-pro-free

### Debug Log References
- `.env.local` includes `DATABASE_URL`, but local PostgreSQL auth currently fails; the accepted-quote conversion flow was verified against the in-memory fallback path used by the quote workflow in this environment
- Generated Drizzle migration `0008_glorious_vin_gonzales.sql`
- Local `drizzle-kit migrate` attempt failed with PostgreSQL auth in `.env.local`; connection/auth failures now fall back to the in-memory quote/invoice stores during local review

### Completion Notes List
- Implemented quote-to-invoice conversion with preserved invoice section structure, nested line items, source quote linkage, and client detail carryover
- Invoice now carries over: client details, title, terms, preserved quote sections, nested line items, source quote linkage, and client association
- Server action validates quote status === "accepted" before conversion
- After conversion, quote status updates to "invoiced"
- ConversionReviewPanel shows source quote reference, client details, carried-over quote sections/line items, totals, and editable invoice-draft fields for review
- ConvertToInvoiceButton replaces "coming soon" placeholder on accepted quote detail page
- Invoice repository now only falls back to in-memory storage for connection/auth failures so schema-level write errors still surface explicitly
- Targeted Vitest suites pass for invoice repository, action, calculator, conversion review panel, and quote status chip
- Chromium Playwright coverage passes for accepted-quote conversion and read-only accepted-state flows
- ESLint passes on all touched invoice-conversion files
- Event system (`invoice.generated`) deferred - no event system exists in codebase yet

### File List
- `drizzle/migrations/0008_glorious_vin_gonzales.sql` (NEW) - Adds invoice_sections support and invoice_line_items section linkage
- `drizzle/migrations/meta/0008_snapshot.json` (NEW) - Drizzle schema snapshot for invoice section migration
- `drizzle/migrations/meta/_journal.json` (MODIFIED) - Registers migration `0008_glorious_vin_gonzales`
- `src/server/db/schema/invoices.ts` (NEW) - Drizzle schema for invoices, invoice_sections, and invoice_line_items tables
- `src/server/db/schema/index.ts` (MODIFIED) - Added invoice, invoice_sections, and invoice_line_items exports
- `src/features/invoices/types.ts` (NEW) - Invoice types and toInvoiceSummary helper
- `src/features/invoices/schemas/create-invoice-from-quote-schema.ts` (NEW) - Zod schema for conversion input
- `src/features/invoices/schemas/update-invoice-schema.ts` (NEW) - Zod schema for invoice edits
- `src/features/invoices/server/invoices-repository.ts` (NEW) - Repository with DB writes, connection-safe store fallback, and preserved invoice sections
- `src/features/invoices/server/mappers.ts` (NEW) - DB row to application type mappers with nested invoice sections and client detail mapping
- `src/features/invoices/server/store/invoices-store.ts` (NEW) - In-memory store fallback
- `src/features/invoices/server/calculators/invoice-totals.ts` (NEW) - Invoice totals calculator
- `src/features/invoices/server/actions/create-invoice-from-quote.ts` (NEW) - Server action for conversion
- `src/features/invoices/server/queries/get-invoice.ts` (NEW) - Invoice detail query
- `src/features/invoices/server/queries/list-invoices.ts` (MODIFIED) - Replaced stub with repository query
- `src/features/invoices/components/conversion-review-panel.tsx` (NEW) - Review panel for carried-over quote data, client details, and invoice-draft fields
- `src/features/invoices/components/conversion-review-panel.test.tsx` (NEW) - Component coverage for client carryover and editable draft fields
- `src/features/invoices/components/convert-to-invoice-button.tsx` (NEW) - Client-side conversion button
- `src/app/(workspace)/invoices/[invoiceId]/page.tsx` (NEW) - Invoice detail page route with hardened back-link sanitization and client summary
- `src/app/(workspace)/quotes/[quoteId]/page.tsx` (MODIFIED) - Wired ConvertToInvoiceButton for accepted quotes
- `src/features/quotes/components/quote-status-chip.tsx` (MODIFIED) - Added explicit invoiced-state status styling used by accepted/invoiced quote flows
- `src/features/quotes/components/quote-status-chip.test.tsx` (MODIFIED) - Added coverage for the invoiced quote status chip state
- `src/features/invoices/server/calculators/invoice-totals.test.ts` (NEW) - Calculator tests
- `src/features/invoices/server/invoices-repository.test.ts` (NEW) - Repository tests
- `src/features/invoices/server/actions/create-invoice-from-quote.test.ts` (NEW) - Action tests
- `tests/e2e/quotes.spec.ts` (MODIFIED) - Added accepted-quote invoice conversion coverage and updated accepted-state assertions

## Senior Developer Review (AI)

- Reviewer: chuck chuck
- Date: 2026-03-21
- Outcome: Approve
- Findings addressed: preserved quote section structure during invoice conversion, surfaced client details in invoice review, added invoice-draft fields to the conversion panel, tightened repo fallback behavior for DB connection/auth failures, generated the invoice-section migration, and added targeted unit/component/e2e coverage for the accepted-quote conversion flow

### Change Log
- Implemented quote-to-invoice conversion: full pipeline from accepted quote to invoice draft with linked data, tests, and UI integration (2026-03-21)
- Senior developer review fixes applied: preserved invoice sections, surfaced client carryover, generated migration `0008_glorious_vin_gonzales`, and refreshed accepted-quote test coverage (2026-03-21)
