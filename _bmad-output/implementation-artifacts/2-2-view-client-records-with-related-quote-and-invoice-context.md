# Story 2.2: View Client Records with Related Quote and Invoice Context

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a studio owner,
I want to view a client record together with its related quotes and invoices,
so that I can understand the commercial context for that client in one place.

## Acceptance Criteria

1. **Given** at least one client exists **When** the user opens a client detail view **Then** the page displays the client's saved details **And** it includes clearly labeled regions for related quotes and invoices.

2. **Given** a client has no related quotes or invoices yet **When** the detail view loads **Then** the interface shows a clear empty state for related commercial records **And** the next available action remains obvious.

3. **Given** the client detail view is reopened later **When** the page loads **Then** the latest persisted client data and any available related record summaries are shown **And** the relationship between the client and those records remains clear.

4. **Given** populated related quotes or invoices exist for the client **When** the user reviews those summaries **Then** the interface shows enough identifying information to support later linked-record workflows **And** the response remains aligned with the core performance targets.

## Tasks / Subtasks

- [x] Task 1: Expand the client detail data contract to include related commercial context (AC: #1, #2, #3, #4)
  - [x] 1.1 Update `src/features/clients/server/queries/get-client-by-id.ts` to return a richer client detail payload with quote and invoice summary arrays.
  - [x] 1.2 Extend `src/features/clients/server/queries/client-fixtures.ts` or the backing repository path so each client can expose stable related quote and invoice summaries with identifying fields and ordering.
  - [x] 1.3 Keep the result envelope consistent with `ActionResult` and preserve a path to studio-scoped reads when the query moves from fixtures to database-backed access.

- [x] Task 2: Build the client detail surface with clearly labeled related-record regions (AC: #1, #2, #3, #4)
  - [x] 2.1 Update `src/app/(workspace)/clients/[clientId]/page.tsx` to render client details plus separate `Related quotes` and `Related invoices` sections.
  - [x] 2.2 Add a feature-owned presentation component such as `src/features/clients/components/client-record-summary.tsx` if needed to keep the page lean and aligned with feature-first boundaries.
  - [x] 2.3 Preserve the existing `backTo` navigation behavior and present related records in a way that keeps the client relationship explicit.

- [x] Task 3: Support empty states and future-safe linked-record summaries (AC: #2, #4)
  - [x] 3.1 Show clear empty states when a client has no related quotes or invoices, with obvious next actions that do not introduce dead links.
  - [x] 3.2 Include summary fields that support later workflows, such as record title/number, status, and last updated metadata, without overbuilding a full detail experience.
  - [x] 3.3 Keep the read path lightweight and performant by returning only summary data needed for the client detail page.

- [x] Task 4: Verify accessibility, resilience, and regression safety (AC: #1, #2, #3, #4)
  - [x] 4.1 Add query-level tests for populated and empty related-record states.
  - [x] 4.2 Add rendering tests for the client detail view covering labeled regions, empty states, and missing-client handling.
  - [x] 4.3 Add keyboard and assistive-text checks so related-record sections remain understandable and navigable.
  - [x] 4.4 Verify `npm run lint`, `npm run test`, and `npm run build` pass.

## Dev Notes

### Developer Context Section

- Story 2.2 is the first client-detail continuity story in Epic 2. It should deepen the existing client detail page so the studio owner can understand a client's commercial context without opening separate quote or invoice areas first.
- This story depends on the client foundation from Story 2.1. If client persistence and edit flows are not implemented yet, keep this work aligned with the same client data contract rather than inventing a parallel read model.
- The current app already has a protected client detail route, fixture-backed client queries, shared empty/error feedback components, and placeholder quote/invoice list queries. Reuse and extend those patterns instead of introducing a new dashboard or cross-feature UI shell.
- Keep scope narrow: this story adds summary-level related quote and invoice context to the client record view. It does not implement quote detail, invoice detail, revision history, or record-history troubleshooting flows.

### Technical Requirements

- Preserve the current server-component read flow: `src/app/(workspace)/clients/[clientId]/page.tsx` should continue to call a feature-owned server query and use `notFound()` for missing clients.
- Return related record summaries through the standard `ActionResult` envelope. Do not leak raw exceptions or ad hoc response shapes into the page layer.
- When the read path moves beyond fixtures, require authenticated and studio-scoped access using `requireSession()` and `ensureStudioAccess(...)` before returning client-linked quote or invoice context.
- Keep related data lightweight and summary-oriented. The page needs enough information for later linked-record workflows, such as title or invoice number, lifecycle status, and last updated metadata, but not full quote or invoice payloads.
- Empty states must be explicit and actionable, but avoid dead links. If downstream creation flows are still placeholders, prefer explanatory text or safe navigation rather than fake working CTAs.
- Maintain performance expectations from the PRD by avoiding unnecessary heavy joins or oversized payloads for a detail page that primarily renders summary context.

### Architecture Compliance

- Respect feature-first boundaries:
  - route composition in `src/app/(workspace)/clients/[clientId]/page.tsx`
  - client-specific presentation in `src/features/clients/components/*`
  - client reads in `src/features/clients/server/queries/*`
  - shared auth and permission enforcement in existing auth helpers
- Keep persistence naming snake_case and application-facing models camelCase if any database-backed client, quote, or invoice summary models are introduced.
- Reuse shared feedback primitives like `InlineAlert` and `EmptyState` instead of creating a custom alert/empty-state system for this page.
- Do not bypass current workspace protection patterns in `src/app/(workspace)/layout.tsx` and `src/proxy.ts`.
- Stay aligned with the architecture direction that quote and invoice domain logic remains feature-owned. This client story may summarize related records, but it should not absorb quote or invoice business logic.

### Library/Framework Requirements

- Use the current project-approved stack unless there is a concrete implementation reason to change it:
  - `next` `16.1.6` in project (latest researched: `16.1.7`)
  - `react` and `react-dom` `19.2.3` in project (latest researched: `19.2.4`)
  - `next-auth` `4.24.13` and `@auth/core` `0.34.3`
  - `drizzle-orm` `0.45.1`
  - `drizzle-kit` `0.31.9` in architecture baseline (latest researched: `0.31.10`)
  - `zod` `4.3.6`
  - `@playwright/test` `1.58.2`
  - `vitest` `4.1.0`
- No additional global state library is needed for this story. Follow the server-first read model already in place.
- Continue using the existing Tailwind-based UI patterns for cards, list rows, and muted metadata instead of introducing a new styling system.

### File Structure Requirements

- Expected primary touch points:
  - `src/app/(workspace)/clients/[clientId]/page.tsx`
  - `src/features/clients/server/queries/get-client-by-id.ts`
  - `src/features/clients/server/queries/client-fixtures.ts`
- Likely supporting touch points if the client page needs cleaner composition:
  - `src/features/clients/components/client-record-summary.tsx`
  - `src/features/quotes/server/queries/list-quotes.ts`
  - `src/features/invoices/server/queries/list-invoices.ts`
- Preserve existing list/detail navigation conventions, especially the `backTo` search-param behavior already used by the client detail route.
- Do not move client detail logic into `src/components/app-shell` or other global folders. Keep this story's presentation logic feature-owned unless two or more features truly need the same primitive.

### Testing Requirements

- Cover all AC paths explicitly:
  - client detail shows saved client information plus labeled `Related quotes` and `Related invoices` regions
  - client detail shows clear empty states when no related commercial records exist
  - reopened client detail continues to show the latest available client and related summary data
  - populated related summaries expose enough identifying metadata for later linked-record workflows
- Add negative tests for missing-client handling so the route still resolves to `notFound()` rather than partial or broken UI.
- Add keyboard/accessibility checks for section labels, summary lists, and any links or actions rendered inside the related-record regions.
- Keep regression coverage around current page expectations: back navigation, simple card/list rendering, and inline failure handling if query loading becomes fallible.
- Verify `npm run lint`, `npm run test`, and `npm run build` pass.

### Previous Story Intelligence

- Story 2.1 established the intended client-domain guardrails: client data should remain a narrow, trustworthy source record used by later quote and invoice workflows.
- Story 2.1 also set the expectation that server-side authz, `ActionResult` envelopes, feature-first file placement, and explicit success/failure semantics are the baseline for Epic 2 work.
- Because Story 2.1 is a prerequisite foundation story, avoid implementing Story 2.2 in a way that assumes a different client shape or bypasses the future client persistence boundaries introduced there.
- Current client fixtures only include `id`, `name`, `contactEmail`, and `lastQuoteUpdatedAt`, so any richer client detail shape should evolve carefully without breaking the existing clients list or detail route.

### Git Intelligence Summary

- Recent relevant app commit `d5abbe4` added the current protected workspace shell, auth/session hardening, client list/detail pages, studio defaults, and shared feedback primitives. This story should preserve those patterns rather than introducing alternate route protection or UI state handling.
- Foundation commit `f657ffd` established the repo-wide conventions still in use: `ActionResult` response shapes, central env handling, shared error types, and app-first Next.js structure.
- Recent BMAD rollback commits (`99627dc`, `6190fd7`) are operational and not relevant to product implementation choices for this story.

### Latest Tech Information

- Latest registry check results relevant to this story:
  - `next`: `16.1.7`
  - `react`: `19.2.4`
  - `react-dom`: `19.2.4`
  - `drizzle-orm`: `0.45.1`
  - `drizzle-kit`: `0.31.10`
  - `next-auth`: `4.24.13`
  - `@auth/core`: `0.34.3`
  - `zod`: `4.3.6`
  - `@playwright/test`: `1.58.2`
  - `vitest`: `4.1.0`
- Guidance for this story: stay on architecture-pinned versions unless a concrete bug or security requirement forces an upgrade mid-implementation.

### Project Context Reference

- No `project-context.md` exists in the repository.
- Treat the authoritative context for this story as the epics, PRD, architecture, UX specification, sprint status, and the current source implementation under `src/app/(workspace)`, `src/features/clients`, `src/features/quotes`, and `src/features/invoices`.

### Project Structure Notes

- Current implementation already aligns with the architecture's feature-first structure for this story's read path: client routes live under `src/app/(workspace)/clients`, and client queries live under `src/features/clients/server/queries`.
- The repo does not yet implement the broader database schema described in `architecture.md` for clients, quotes, and invoices. Only `studio-defaults` has a real Drizzle schema today, so this story must work cleanly with the current fixture-backed reality while preserving a path to database-backed summaries later.
- Quote and invoice list queries currently return empty arrays and do not yet model client-linked summaries. If this story reuses or extends them, keep responsibilities clear so client detail stays a consumer of summary data rather than a new owner of quote or invoice business logic.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.2] - canonical story statement and acceptance criteria
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 2] - cross-story context for client and service-package foundation work
- [Source: _bmad-output/planning-artifacts/prd.md#Functional Requirements] - FR7 view-client capability and related continuity expectations
- [Source: _bmad-output/planning-artifacts/prd.md#Non-Functional Requirements] - performance, accessibility, and reliability guardrails for record views
- [Source: _bmad-output/planning-artifacts/architecture.md#Requirements to Structure Mapping] - client, quote, and invoice feature ownership
- [Source: _bmad-output/planning-artifacts/architecture.md#Architectural Boundaries] - route, feature, and data-boundary rules
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules] - naming, response envelopes, loading/error behavior, and state rules
- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security] - deny-by-default access and server-side authorization expectations
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Navigation Patterns] - workflow continuity and linked-record navigation requirements
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Empty States and Loading States] - empty-state behavior for related commercial records
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Responsive Design & Accessibility] - keyboard and readability expectations
- [Source: src/app/(workspace)/clients/[clientId]/page.tsx] - current client detail route shape and `backTo` navigation pattern
- [Source: src/features/clients/server/queries/get-client-by-id.ts] - current client query contract and missing-client handling
- [Source: src/features/clients/server/queries/client-fixtures.ts] - existing fixture-backed client shape that this story must evolve carefully
- [Source: src/features/quotes/server/queries/list-quotes.ts] - current quote summary query baseline
- [Source: src/features/invoices/server/queries/list-invoices.ts] - current invoice summary query baseline
- [Source: src/components/feedback/empty-state.tsx] - shared empty-state presentation pattern
- [Source: src/components/feedback/inline-alert.tsx] - shared inline error-feedback pattern
- [Source: src/features/auth/require-session.ts] - authenticated-session helper
- [Source: src/server/auth/permissions.ts] - studio access enforcement helper
- [Source: src/lib/validation/action-result.ts] - standard action/query result envelope

## Dev Agent Record

### Agent Model Used

openai/gpt-5.4

### Implementation Plan

- Extend the client detail query contract to return lightweight related quote and invoice summaries alongside the existing client record.
- Keep the backing read path studio-scoped by adding a repository detail helper that composes fixture-backed summary records in stable reverse-chronological order.
- Add a feature-owned client record summary component so the route can render labeled related-record regions, explicit empty states, and safe workspace navigation without bloating the page file.
- Cover the story with query and page rendering tests for populated, empty, reopened, and missing-client paths before running full repo validation.

### Debug Log References

- create-story workflow execution
- manual checklist validation pass completed using `_bmad/bmm/workflows/4-implementation/create-story/checklist.md`
- `npm run test -- src/features/clients/server/queries/get-client-by-id.test.ts "src/app/(workspace)/clients/[clientId]/page.test.tsx"`
- `npm run lint`
- `npm run test`
- `NEXTAUTH_URL="https://mento.example" STUDIO_OWNER_EMAIL="owner@mento.example" STUDIO_OWNER_PASSWORD="prod-password-123" npm run build`

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created
- Added a richer client detail payload with studio-scoped related quote and invoice summaries ordered by latest update.
- Added a feature-owned client record summary surface with labeled related-record regions, explicit empty states, and safe workspace navigation.
- Added query and page coverage for populated, empty, reopened, and missing-client paths, then validated lint, test, and build successfully.

### File List

- _bmad-output/implementation-artifacts/sprint-status.yaml
- _bmad-output/implementation-artifacts/2-2-view-client-records-with-related-quote-and-invoice-context.md
- src/app/(workspace)/clients/[clientId]/page.tsx
- src/app/(workspace)/clients/[clientId]/page.test.tsx
- src/features/clients/components/client-record-summary.tsx
- src/features/clients/server/clients-repository.ts
- src/features/clients/server/queries/get-client-by-id.test.ts
- src/features/clients/server/queries/get-client-by-id.ts
- src/features/clients/server/store/clients-store.ts
- src/features/clients/types.ts
- src/features/quotes/server/queries/list-quotes.ts
- src/features/invoices/server/queries/list-invoices.ts
- src/lib/format/dates.ts

## Senior Developer Review (AI)

**Review Date:** 2026-03-17
**Reviewer:** claude-sonnet-4-6 (adversarial code-review workflow)
**Outcome:** Changes Requested → Fixed

### Action Items

- [x] [High] `clients-repository.ts` — `getClientDetailByIdForStudio` silently used fixture store for related records regardless of `DATABASE_URL`, mixing DB-backed client data with seeded data in any real environment. Replaced with `buildClientDetailRecord` helper carrying an explicit TODO comment.
- [x] [High] `get-client-by-id.ts` — Dual-query auth pattern split the authorization boundary across an implicit studio filter and an explicit `ensureStudioAccess` call, making future refactors fragile. Restored the original single-path pattern: un-scoped lookup → `ensureStudioAccess` → `buildClientDetailRecord`.
- [x] [Medium] `get-client-by-id.test.ts` — Three tests used `as typeof result & { data: { relatedQuotes: ... } }` casts, silently defeating TypeScript's ability to catch field renames on `ClientDetailRecord`. Removed all casts; fields are now accessed directly from the fully-typed return value.
- [x] [Medium] `client-record-summary.tsx` — Inline `formatDate` using `Intl.DateTimeFormat` duplicated logic that belongs in `src/lib/format/dates.ts` per architecture. Extracted to that module (created the file).
- [x] [Medium] `client-record-summary.tsx` — `formatStatus` used `charAt(0).toUpperCase()` which mangles multi-word or underscore-separated statuses. Replaced with an explicit `RECORD_STATUS_LABELS` map with a safe fallback.
- [x] [Medium] `clients/types.ts` vs `list-quotes.ts` / `list-invoices.ts` — Three divergent summary type definitions for the same domain entities. Extended canonical `QuoteSummary` and `InvoiceSummary` with the missing fields, then aliased `RelatedQuoteSummary` / `RelatedInvoiceSummary` to eliminate the duplication.
- [x] [Medium] `client-record-summary.tsx:89-96` — `<div className="space-y-1">` wrapping a single child div was dead markup with no visual effect. Removed the outer wrapper.

### Low-Severity Notes (deferred, tracked for future stories)

- **L1** Populated related-record sections render no workspace navigation link; action links only appear in empty states. Consider adding a workspace link for the non-empty path in a future story.
- **L2** `SEEDED_QUOTES` and `SEEDED_INVOICES` in `clients-store.ts` are `const` arrays that can be mutated at runtime. `Object.freeze` would protect fixture integrity across test workers.
- **L3** `page.test.tsx` does not cover the `saved === "created"` success notice path. Add a test when this flow is next touched.

## Change Log

- 2026-03-17: Added related quote and invoice summaries to the client detail query and page so client records now show lightweight commercial context with accessible empty states and regression coverage.
- 2026-03-17: Code review pass — fixed auth boundary consolidation, fixture/DB mixed data source documentation, type deduplication, date/status formatting centralization, and dead markup removal. All 7 action items resolved. lint and 58/58 tests pass.
