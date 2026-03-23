# Story 5.5: Inspect Connected Record History and Trace Invoice Lineage

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a studio owner,
I want to inspect connected record history and trace invoices back to their source quote,
so that I can understand how each commercial record was produced.

## Acceptance Criteria

1. **Given** a client, quote, revision, and invoice chain exists
   **When** the user opens connected record history from a client, quote, or invoice context
   **Then** the interface shows related quotes, revisions, statuses, and linked invoices in a clear record chain
   **And** the relationship among those records is understandable.

2. **Given** an invoice was created from an accepted quote
   **When** the user traces that invoice backward
   **Then** the source quote can be identified and opened
   **And** the client relationship remains visible.

3. **Given** the user needs to inspect how a commercial record was assembled
   **When** they review connected details
   **Then** the interface exposes the linked client, source service-package context, generated quote content, and invoice details needed for troubleshooting
   **And** the user can move among those records without losing orientation.

4. **Given** connected history is used with keyboard navigation or assistive technology
   **When** the user reviews the record chain
   **Then** order, status, and source relationships are programmatically clear
   **And** the interaction remains accessible.

## Tasks / Subtasks

- [x] Task 1: Create `getRecordHistory` server query (AC: 1, 2, 3)
  - [x] Create `src/features/record-history/server/queries/get-record-history.ts`
  - [x] Define input: `{ entityType: "client" | "quote" | "invoice", entityId: string }`
  - [x] For `client`: query all quotes linked to the client, then for each quote load revisions and linked invoices
  - [x] For `quote`: load the quote, its revisions, linked client, and any invoices generated from it
  - [x] For `invoice`: load the invoice, its source quote (via `quoteId` FK), the quote's revisions, and the linked client
  - [x] For each quote, also load the originating service packages referenced in the quote sections (if `quote_sections` or similar has `service_package_id` references)
  - [x] Return a `RecordChain` type: `{ client, quoteChain: { quote, revisions[], invoices[] }[], currentEntity }`
  - [x] Use Drizzle queries following existing `getInvoiceById`/`getQuoteById` patterns in `src/features/*/server/queries/`
  - [x] For store fallback: build equivalent chain from in-memory store data
  - [x] Follow `requireSession()` then `ensureStudioAccess(session, studioId)` auth pattern

- [x] Task 2: Create `ConnectedRecordHistory` component (AC: 1, 2, 3, 4)
  - [x] Create `src/features/record-history/components/connected-record-history.tsx`
  - [x] Accept `RecordChain` data as props
  - [x] Render a vertical timeline/list showing the record chain: Client → Quote → Revisions → Invoice
  - [x] Each node shows: record type label, record name/identifier, status badge (use `RecordStatusBadge` or similar pattern from `src/components/app-shell/record-status-badge.tsx`), timestamp, and a link to open the record
  - [x] Current entity is visually highlighted/marked
  - [x] Quote nodes expand to show revision list if multiple revisions exist
  - [x] Invoice nodes show status and link back to source quote
  - [x] Client node shows name and links to client detail
  - [x] Service package context shown at quote level (names of source packages)
  - [x] All links use existing navigation helpers: `buildInvoiceDetailHref`, quote detail paths
  - [x] Keyboard navigable: tab order follows visual chain order, all links reachable
  - [x] Status and relationships communicated via text (not color alone) for accessibility
  - [x] Use Geist-inspired styling consistent with existing components (neutral surfaces, clean typography)

- [x] Task 3: Create record history page route (AC: 1, 3)
  - [x] Create `src/app/(workspace)/records/history/page.tsx`
  - [x] Accept search params: `type` (client|quote|invoice) and `id` (entity ID)
  - [x] Server component that calls `getRecordHistory` with the params
  - [x] Renders `ConnectedRecordHistory` with the fetched data
  - [x] Include page shell with back navigation to the originating context
  - [x] Handle missing/invalid params with clear error state

- [x] Task 4: Add "View Connected History" entry points (AC: 1, 2)
  - [x] Add "View Record History" action to `src/app/(workspace)/clients/[clientId]/page.tsx` — link to `/records/history?type=client&id=${clientId}`
  - [x] Add "View Record History" action to `src/app/(workspace)/quotes/[quoteId]/page.tsx` — link to `/records/history?type=quote&id=${quoteId}`
  - [x] Add "View Record History" action to `src/app/(workspace)/invoices/[invoiceId]/page.tsx` — link to `/records/history?type=invoice&id=${invoiceId}`
  - [x] Use `variant="outline"` or quiet/tertiary button style (consistent with existing "Reopen for Editing" pattern)
  - [x] Preserve `backTo` context so user can return to originating page

- [x] Task 5: Write tests (AC: 1, 2, 3, 4)
  - [x] Unit test for `getRecordHistory` in `src/features/record-history/server/queries/get-record-history.test.ts`:
    - Builds chain from client with linked quotes and invoices
    - Builds chain from quote with revisions and linked invoices
    - Builds chain from invoice tracing back to source quote
    - Handles entities with no related records (empty chain)
    - Returns error for non-existent entity
    - Denies access when studio doesn't match
  - [x] Component test for `ConnectedRecordHistory` in `src/features/record-history/components/connected-record-history.test.tsx`:
    - Renders record chain in correct order
    - Shows correct status badges for each record
    - Links navigate to correct record pages
    - Current entity is highlighted
    - Expands/collapses revision details
    - Keyboard navigation works correctly
    - Accessible labels present for screen readers
  - [x] Page test for record history route in `src/app/(workspace)/records/history/page.test.tsx`:
    - Renders with valid client/quote/invoice params
    - Shows error for missing params
    - Shows error for non-existent entity

## Dev Notes

### Relevant Architecture Patterns

**Server action/query contract** [Source: architecture.md#API & Communication Patterns]:
- This is a read operation (query), not a mutation — use a query function, not a server action
- Return the standard result envelope: `{ ok: true, data }` or `{ ok: false, error: { code, message } }`
- Auth pattern: `requireSession()` then `ensureStudioAccess(session, studioId)` [Source: src/features/auth/require-session.ts]

**Naming conventions** [Source: architecture.md#Naming Patterns]:
- DB tables: plural snake_case (`quotes`, `quote_revisions`, `invoices`, `clients`)
- DB columns: snake_case (`created_at`, `quote_id`, `client_id`)
- Application types: camelCase (`RecordChain`, `QuoteChainNode`)
- Query names: verb-first camelCase (`getRecordHistory`)
- Files: kebab-case (`get-record-history.ts`, `connected-record-history.tsx`)

**Existing data model relationships** [Source: architecture.md#Data Architecture]:
- `clients` ← `quotes.client_id` (FK)
- `quotes` ← `quote_revisions.quote_id` (FK)
- `quotes` ← `invoices.quote_id` (FK) — invoice tracks source quote
- `invoices` ← `invoices.client_id` (FK) — invoice also links to client
- Service packages → quotes via generated sections/line items (linkage may be in `quote_sections` or through the generation flow)

**Repository pattern** [Source: src/features/invoices/server/invoices-repository.ts]:
- Lazy-import `db` and schema modules to avoid loading DB when `DATABASE_URL` is unset
- Fall back to in-memory store for local dev without a DB
- Use `shouldUseStoreFallback()` checks for connection/auth errors

**Status types** [Source: src/features/invoices/types.ts, src/features/quotes/]:
- Quote status: `"draft" | "accepted" | "invoiced"`
- Invoice status: `"draft" | "sent" | "paid"`
- Quote revision: versioned metadata with timestamps

### Source Tree Components

```
src/features/record-history/                  # NEW feature directory
  components/
    connected-record-history.tsx               # NEW - record chain timeline component
    connected-record-history.test.tsx          # NEW - component tests
  server/
    queries/
      get-record-history.ts                    # NEW - query to build record chain
      get-record-history.test.ts               # NEW - query tests

src/app/(workspace)/records/
  history/
    page.tsx                                   # NEW - record history page route
    page.test.tsx                              # NEW - page tests

src/app/(workspace)/clients/[clientId]/
  page.tsx                                     # MODIFY - add "View Record History" link

src/app/(workspace)/quotes/[quoteId]/
  page.tsx                                     # MODIFY - add "View Record History" link

src/app/(workspace)/invoices/[invoiceId]/
  page.tsx                                     # MODIFY - add "View Record History" link
```

### Key Files to Reference

- `src/features/quotes/server/queries/get-quote.ts` — query pattern for quote with relations
- `src/features/quotes/server/queries/list-quote-revisions.ts` — revision query pattern
- `src/features/invoices/server/queries/get-invoice.ts` — query pattern for invoice with relations
- `src/features/clients/server/queries/get-client.ts` — client query pattern
- `src/features/invoices/server/invoices-repository.ts` — repository pattern with store fallback
- `src/features/invoices/lib/navigation.ts` — navigation helper patterns (`buildInvoiceDetailHref`, `sanitizeInvoiceBackTo`)
- `src/features/quotes/lib/navigation.ts` — quote navigation helpers
- `src/components/app-shell/record-status-badge.tsx` — status badge component for record types
- `src/features/quotes/components/revision-timeline.tsx` — existing revision timeline component (reference for revision display)
- `src/features/invoices/components/conversion-review-panel.tsx` — reference for read-only record display panels
- `src/lib/validation/action-result.ts` — `ActionResult<T>` type definition

### Data Flow for Connected Record History

1. User clicks "View Record History" from a client, quote, or invoice detail page
2. Navigation to `/records/history?type=quote&id=${quoteId}&backTo=...`
3. Page server component calls `getRecordHistory({ entityType, entityId })`
4. Query authenticates, loads the target entity, then follows FK relationships to build the chain:
   - From quote: load client, revisions, linked invoices
   - From invoice: load source quote (via `quoteId`), quote's client, quote's revisions
   - From client: load all quotes, each quote's revisions and invoices
5. Returns `RecordChain` structure with all connected entities
6. `ConnectedRecordHistory` renders the chain as a navigable timeline
7. Each node links to its respective detail page using existing navigation helpers

### RecordChain Type Shape

```typescript
type RecordChainNode = {
  entityType: "client" | "quote" | "quote_revision" | "invoice";
  entityId: string;
  label: string;          // display name
  status?: string;        // quote/invoice status
  timestamp?: string;     // ISO date — created_at or relevant date
  href: string;           // link to detail page
  isCurrent: boolean;     // whether this is the entity user navigated from
  children?: RecordChainNode[]; // e.g., revisions under a quote
  metadata?: Record<string, string>; // e.g., source package names, revision number
};

type RecordChain = {
  client: RecordChainNode;
  quoteChain: {
    quote: RecordChainNode;
    revisions: RecordChainNode[];
    invoices: RecordChainNode[];
  }[];
};
```

### Service Package Linkage Notes

- Quotes are generated from service packages (Story 3.2)
- The generation copies section/line-item structure into `quote_sections` and `quote_line_items`
- If the schema stores a `service_package_id` reference on quote sections, use it to link back
- If no direct FK exists, show package names from the generation context or note that linkage is indirect
- Do NOT block the story on missing FK — show what's available and note limitations

### Previous Story Intelligence (from Story 5.4)

**Dev notes and learnings:**
- Story 5.4 added `reopenInvoiceAction`, `ReopenInvoiceButton`, and updated invoice detail page for non-draft invoice rendering
- Invoice detail page already shows `ConversionReviewPanel` for non-draft invoices (read-only summary)
- The `ConversionReviewPanel` displays invoice data but does NOT show linked record chain — this story fills that gap
- Navigation helpers (`buildInvoiceDetailHref`, `sanitizeInvoiceBackTo`) established in Story 5.4 should be reused
- The `markQuoteAccepted` pattern from quotes is the best reference for status-transition server actions
- Invoice statuses: `"draft" | "sent" | "paid"`; Quote statuses: `"draft" | "accepted" | "invoiced"`
- `setInvoiceStatusInStore()` exists in in-memory store for status transitions

**Files created in 5.4 that this story builds on:**
- `src/features/invoices/lib/navigation.ts` — invoice navigation helpers (reuse `buildInvoiceDetailHref`)
- `src/features/invoices/components/reopen-invoice-button.tsx` — pattern for action buttons on detail pages
- `src/app/(workspace)/invoices/[invoiceId]/page.tsx` — invoice detail page (modify to add history link)

**Files from earlier stories this story builds on:**
- `src/features/quotes/components/revision-timeline.tsx` — existing revision display component
- `src/features/quotes/components/quote-status-chip.tsx` — quote status badge component
- `src/components/app-shell/record-status-badge.tsx` — generic status badge
- `src/features/invoices/components/conversion-review-panel.tsx` — read-only record display pattern

### Git Intelligence

- Recent commits implemented stories 5.1-5.4 (invoice conversion, editing, preview, reopen)
- Invoice infrastructure is fully established: schema, types, repository, queries, forms, store, navigation
- Quote revision infrastructure exists: `quote_revisions` table, `list-quote-revisions.ts` query, `RevisionTimeline` component
- No database migration needed — all FK relationships (`quotes.client_id`, `invoices.quote_id`, `invoices.client_id`, `quote_revisions.quote_id`) already exist
- The `record-history` feature directory is new — this story creates it from scratch
- The architecture planned for this feature at `src/features/record-history/` — follow the planned structure

### Testing Standards

- Unit/component tests co-located as `*.test.ts` or `*.test.tsx` files next to source
- Use Vitest with React Testing Library for component tests
- Follow existing test patterns in `src/features/invoices/server/actions/reopen-invoice.test.ts` and `src/features/quotes/components/revision-timeline.test.tsx`
- E2E tests use Playwright in `tests/e2e/` — optional for this story since core logic is covered by unit/component tests

### NFR Considerations

- NFR1: Record history page must load in <= 2 seconds (95th percentile) — optimize queries to avoid N+1
- NFR4/NFR5: History query must require authentication and block unauthorized access
- NFR8: Record links must correctly preserve client, quote, revision, and invoice relationships
- NFR9: 100% explicit success/failure result for history loading
- NFR11: WCAG 2.1 AA — keyboard-reachable record chain, accessible status labels
- NFR12: Keyboard-only navigation through the record chain

## References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.5] — Story requirements and acceptance criteria
- [Source: _bmad-output/planning-artifacts/epics.md#FR35] — Inspect connected commercial record chain
- [Source: _bmad-output/planning-artifacts/epics.md#FR37] — View connected record history
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries] — `record-history` feature placement
- [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns] — Query patterns and result envelope
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture] — Entity relationships and FK model
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Connected Record History] — UX component specification
- [Source: src/features/quotes/server/queries/get-quote.ts] — Quote query pattern
- [Source: src/features/invoices/server/queries/get-invoice.ts] — Invoice query pattern
- [Source: src/features/quotes/components/revision-timeline.tsx] — Revision timeline component reference
- [Source: src/features/invoices/lib/navigation.ts] — Invoice navigation helpers
- [Source: src/components/app-shell/record-status-badge.tsx] — Status badge component

## Dev Agent Record

### Agent Model Used

opencode/mimo-v2-pro-free

### Debug Log References

### Completion Notes List

- Implemented all 5 tasks following the story specifications exactly
- Task 1: Created `getRecordHistory` as an authenticated record-history query that returns the standard result envelope, applies studio access checks, batches related record loading, and includes source service-package context in quote nodes
- Task 2: Created `ConnectedRecordHistory` with a vertical record chain, current-record highlighting, descriptive navigation links, and working multi-revision expand/collapse behavior
- Task 3: Created the `/records/history` page route with search param validation and explicit user-facing error states for invalid, missing, or inaccessible records
- Task 4: Added "View Record History" entry points to client, quote, and invoice detail pages, preserving backTo context
- Task 5: Expanded unit/component/page coverage to 19 tests, including studio-access denial, source service-package context, revision expansion behavior, descriptive link targets, and record-history error states
- All 491 existing tests pass with no regressions
- ESLint passes with no warnings
- TypeScript typecheck still reports the pre-existing `src/features/clients/types.ts` export error unrelated to this story
- Code review follow-up: preserved record-history orientation by introducing a shared history href helper and allowing quote/invoice navigation helpers to round-trip `/records/history` safely
- Code review follow-up: revision nodes now deep-link into the selected revision view, and invoice nodes expose an explicit source-quote link
- Code review follow-up: quote and invoice nodes now surface troubleshooting context in text, including source packages, generated sections, line items, totals, dates, terms, and payment instructions
- Branch note: the current worktree also contains adjacent Story 5.6 correction-flow changes; this File List stays scoped to Story 5.5 implementation and review fixes

### File List

- `src/lib/navigation/record-history.ts` — NEW - shared safe builder/sanitizer for record-history links and nested back navigation
- `src/lib/navigation/record-history.test.ts` — NEW - navigation coverage for valid and invalid record-history destinations
- `src/features/record-history/types.ts` — NEW/MODIFIED - record-chain node metadata and related-link types for troubleshooting context
- `src/features/record-history/server/queries/get-record-history.ts` — NEW/MODIFIED - authenticated record-history query with history-preserving links, richer troubleshooting metadata, full invoice details, and revision deep links
- `src/features/record-history/server/queries/get-record-history.test.ts` — NEW/MODIFIED - added source-package, source-quote-link, and history-backTo coverage
- `src/features/record-history/components/connected-record-history.tsx` — NEW/MODIFIED - record chain timeline with descriptive metadata, source-quote actions, and revision links
- `src/features/record-history/components/connected-record-history.test.tsx` — NEW/MODIFIED - expanded coverage for troubleshooting details, source-quote links, revision links, and preserved orientation
- `src/app/(workspace)/records/history/page.tsx` — NEW/MODIFIED - passes the current history href into the record-history query
- `src/app/(workspace)/records/history/page.test.tsx` — NEW - page tests for valid params, invalid params, and not-found handling
- `src/app/(workspace)/clients/[clientId]/page.tsx` — MODIFIED - uses shared record-history href builder for consistent backTo preservation
- `src/app/(workspace)/quotes/[quoteId]/page.tsx` — MODIFIED - uses shared record-history href builder for consistent backTo preservation
- `src/app/(workspace)/invoices/[invoiceId]/page.tsx` — MODIFIED - uses shared record-history href builder for consistent backTo preservation
- `src/features/quotes/lib/navigation.ts` — MODIFIED - allows validated record-history backTo values and adds a selected-revision href helper
- `src/features/quotes/lib/navigation.test.ts` — MODIFIED - coverage for record-history backTo handling and revision href building
- `src/features/invoices/lib/navigation.ts` — MODIFIED - allows validated record-history backTo values for invoice detail/preview flows
- `src/features/invoices/lib/navigation.test.ts` — MODIFIED - coverage for record-history backTo handling
- `src/features/quotes/components/revision-timeline.tsx` — MODIFIED - supports opening a selected revision directly from history links
- `src/features/quotes/components/revision-timeline.test.tsx` — MODIFIED - coverage for initially selected revisions
- `src/app/(workspace)/quotes/[quoteId]/revisions/page.tsx` — MODIFIED - reads `selectedRevision` from search params and passes it into the timeline
- `src/app/(workspace)/quotes/[quoteId]/revisions/page.test.tsx` — MODIFIED - verifies selected-revision deep linking
- `_bmad-output/implementation-artifacts/5-5-inspect-connected-record-history-and-trace-invoice-lineage.md` — MODIFIED - review fixes, notes, and final status
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — MODIFIED - story status synced after review workflow

## Senior Developer Review (AI)

### Reviewer
chuck chuck

### Date
2026-03-22

### Outcome
Approve

### Review Notes
- Re-validated all 4 acceptance criteria against the implementation after fixes.
- Fixed revision-node navigation by deep-linking each revision into `src/app/(workspace)/quotes/[quoteId]/revisions/page.tsx` with `selectedRevision` support.
- Fixed invoice backward tracing and troubleshooting visibility by surfacing source-quote actions plus quote/invoice details directly in `src/features/record-history/components/connected-record-history.tsx`.
- Fixed orientation loss by introducing `src/lib/navigation/record-history.ts` and allowing quote/invoice navigation helpers to preserve `/records/history` backTo context safely.
- Expanded automated coverage across record-history queries/components plus quote/invoice navigation helpers and revision timeline flows; targeted review suites now pass with 84 assertions.
- Web fallback reference used during review: Next.js App Router `page` / `searchParams` reference (`https://nextjs.org/docs/app/api-reference/file-conventions/page`).
- Git discrepancy note: the branch still contains adjacent Story 5.6 correction-flow work; that work remains documented in `_bmad-output/implementation-artifacts/5-6-correct-quote-or-invoice-data-during-troubleshooting.md` and was kept out of this story-scoped File List.

## Change Log
- Initial implementation: added connected record history query, UI, route, and entry points for Story 5.5 (2026-03-22)
- Code review follow-up: restored history-preserving navigation, added revision/source-quote deep links, exposed troubleshooting details, and expanded navigation/revision coverage (2026-03-22)
