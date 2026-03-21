# Story 4.1: Reopen an Existing Quote for Revision

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a studio owner,
I want to reopen an existing quote and enter a revision workflow,
so that I can respond to client changes without rebuilding the quote from scratch.

## Acceptance Criteria

1. Given one or more quotes already exist, when the user selects a quote to revise, then the application opens the latest persisted quote content in a revision-ready state and the linked client context remains visible.
2. Given the selected quote has prior saved work, when the revision flow opens, then the user sees that they are continuing from an existing quote rather than creating a brand-new one and the workflow preserves orientation within the quote lifecycle.
3. Given the quote is reopened for revision, when the user begins editing, then the quote remains available for controlled updates through the established quote editor and the workflow continues to respect accessibility and guided editing expectations.
4. Given the quote cannot be loaded correctly, when the user attempts to reopen it, then the application shows a clear failure state with recovery guidance and no ambiguous partial-load state is presented as successful.

## Tasks / Subtasks

- [x] Establish the reopen-to-revise entry experience and lifecycle orientation (AC: 1, 2)
  - [x] Add or refine the quote reopen entry path so an existing quote can explicitly enter a revision-ready flow without regressing the existing draft reopen path.
  - [x] Show clear revision-ready messaging so the user understands they are continuing an existing quote, not starting a new draft.
  - [x] Keep linked client context and visible quote lifecycle state on the reopened experience.
- [x] Create a controlled revision-entry primitive before relaxing any existing draft-only guards (AC: 1, 2, 3)
  - [x] Preserve the current draft reopen/edit path as-is for `draft` quotes.
  - [x] Preferred default for Story 4.1: layer revision-ready orientation on reopened existing draft quotes instead of broadening non-draft editability.
  - [x] Keep `accepted` and `invoiced` quotes outside the editable revision path in Story 4.1 unless later product artifacts explicitly expand scope.
  - [x] Do not invent a new persisted quote status such as `revising` in this story.
- [x] Reuse and extend the current quote loading and editing flow (AC: 1, 3)
  - [x] Extend quote detail loading and page composition so authorized users can reopen the latest persisted quote safely for revision-oriented editing.
  - [x] Reuse the existing `QuoteStructureEditor`, preview-readiness rules, and navigation helpers instead of introducing a second quote-editing surface.
  - [x] Implement only the minimum server-side mechanism needed for revision entry; do not remove draft-only mutation guards until the explicit revision-entry path is in place.
  - [x] Do not bundle full version-history persistence from Stories 4.2-4.4 into this story unless a very small enabling primitive is required.
- [x] Add explicit failure and recovery handling for reopen attempts (AC: 4)
  - [x] Replace bare expected-failure handling with a user-facing recovery state that explains what failed and what the user can do next.
  - [x] Keep normalized `Quote not found.` behavior for unauthorized, cross-studio, or truly missing records.
  - [x] Render recovery UI only for operational failures such as `Could not load quote.` rather than for all failed detail loads.
- [x] Protect prior quote workflow behavior with automated coverage (AC: 1, 2, 3, 4)
  - [x] Add or extend unit/integration coverage for reopen behavior, authz, and failure handling.
  - [x] Add a dedicated quote detail page test to cover draft reopen with revision-ready orientation, blocked non-draft editability, and operational failure rendering.
  - [x] Extend quote UI tests for lifecycle orientation, client visibility, and accessibility cues.
  - [x] Extend end-to-end quote coverage so draft reopen, editor behavior, and preview readiness continue to work after revision-entry changes.

## Dev Notes

- Story 4.1 is the first Epic 4 story and should create the revision-ready reopen experience that later stories build on for version preservation, history, and acceptance lifecycle behavior. [Source: _bmad-output/planning-artifacts/epics.md#Epic 4: Quote Revision and Acceptance Lifecycle]
- Scope boundary: implement reopen/revision orientation and the minimum enabling plumbing only. Do not treat Story 4.1 as the place to finish immutable revision history, current-version comparison UI, or invoice/acceptance workflow completion. [Source: _bmad-output/planning-artifacts/epics.md#Story 4.1: Reopen an Existing Quote for Revision]
- Product intent: revisions must feel like controlled continuation after client feedback, not like rebuilding from scratch. Current version, client context, and next safe action should stay obvious. [Source: _bmad-output/planning-artifacts/prd.md#Journey 2 - Commercial editor revises a quote without losing control or trust] [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Revise Quote With Continuity]
- Existing implementation reality: quote reopen already works for drafts through the quotes list and quote detail route, but non-draft quotes currently fall back to read-only rendering and there is no dedicated revision route, revision model, or revision history UI yet. [Source: src/app/(workspace)/quotes/page.tsx] [Source: src/app/(workspace)/quotes/[quoteId]/page.tsx] [Source: src/features/quotes/server/queries/get-quote-by-id.ts]
- Carry forward the proven Story 3.6 reopen behaviors: preserve row status badges, `updatedAt`-based list ordering, shared date formatting, explicit save/retry messaging, and the unsaved-changes guard while layering in revision entry. [Source: _bmad-output/implementation-artifacts/3-6-save-and-reopen-quote-drafts.md]

### Technical Requirements

- Preserve the standard result envelope shape: `{ ok: true, data, meta? }` or `{ ok: false, error: { code, message, fieldErrors? } }`. [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules]
- Keep quote access behind `requireSession()` and studio-scoped authorization checks; unauthorized access must continue returning a normalized `Quote not found.` response to avoid IDOR-style leakage. [Source: src/features/quotes/server/queries/get-quote-by-id.ts] [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security]
- Current mutation guards are draft-only in the existing quote edit actions. Keep those guards in place for Story 4.1 and route any revision-ready experience back through the existing draft-safe mutation path rather than weakening guardrails globally. [Source: src/features/quotes/server/actions/update-quote-sections.ts] [Source: src/features/quotes/server/actions/add-quote-section.ts] [Source: src/features/quotes/server/actions/reorder-quote-sections.ts]
- Status boundary for Story 4.1: treat reopened existing drafts as the editable revision workflow, keep accepted and invoiced quotes outside that editable path, and do not add a new persisted `revising` status. [Source: src/features/quotes/types.ts] [Source: _bmad-output/planning-artifacts/prd.md#Journey 2 - Commercial editor revises a quote without losing control or trust]
- Reuse the existing quote-editor path where possible: `QuoteStructureEditor`, shared preview-readiness logic, and quote navigation helpers already support the established quote-editing workflow. [Source: src/features/quotes/components/quote-structure-editor.tsx] [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- Preserve client-specific quote-instance editing boundaries. Reopening a quote must never mutate underlying reusable service packages. [Source: _bmad-output/planning-artifacts/prd.md#Core Domain Model] [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Additional Pattern Rules]
- `getQuoteById()` currently refreshes the estimate breakdown snapshot on read. If reopen behavior changes this query path, preserve that behavior intentionally or refactor it explicitly rather than dropping it by accident. [Source: src/features/quotes/server/queries/get-quote-by-id.ts] [Source: src/features/quotes/server/quotes-repository.ts]
- `saveQuoteSections()` currently deletes and rewrites sections and line items in place. That is compatible with current draft editing but is not a substitute for later immutable revision history. Keep Story 4.1 implementation compatible with Story 4.2 rather than hard-coding overwrite-only assumptions into the revision workflow. [Source: src/features/quotes/server/quotes-repository.ts]
- Failure branching must stay deliberate: keep normalized `Quote not found.` for missing/unauthorized records, but render a recoverable user-facing failure state for operational load failures such as `Could not load quote.`. [Source: src/features/quotes/server/queries/get-quote-by-id.ts] [Source: src/app/(workspace)/quotes/[quoteId]/page.tsx]
- If this story requires new persistence primitives, note the existing quote schema/migration drift around `estimateBreakdownSnapshot` and reconcile it cleanly instead of adding more schema drift. [Source: src/server/db/schema/quotes.ts]

### Architecture Compliance

- Keep route composition in `src/app/(workspace)/quotes` and business logic in `src/features/quotes/server`; do not move quote persistence or auth checks into route components. [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries]
- Keep server actions as the mutation boundary and reserve route handlers for explicit HTTP-only surfaces; this story should stay within the established App Router server-first model. [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns]
- Follow architecture naming rules: database objects stay snake_case, application-facing models stay camelCase, filenames stay kebab-case. Future revision persistence should follow patterns like `quote_revisions`, `quote_id`, and `created_at`. [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules]
- Keep revision/workflow-event persistence separate from UI-only state if any new primitive is added. Do not hide revision continuity in client-only Zustand state. [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries]
- Architecture already reserves revision-oriented paths and components such as `src/app/(workspace)/quotes/[quoteId]/revisions`, `revision-timeline.tsx`, lifecycle actions, and `quote_revisions` persistence. Use those decisions as guardrails, but do not pretend those primitives already exist in runtime code. [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries]

### Library and Framework Requirements

- Stay on the current repo stack for this story: Next.js App Router (`next` 16.1.6), React 19, Drizzle ORM 0.45.1, `next-auth` 4.24.13 with `@auth/core` 0.34.3, Zod 4.3.6, Zustand 5.0.12, Tailwind 4. [Source: package.json] [Source: _bmad-output/planning-artifacts/architecture.md#Core Architectural Decisions]
- Latest registry check on 2026-03-21 showed: `next` 16.2.1, `next-auth` 4.24.13, `drizzle-orm` 0.45.1, `zustand` 5.0.12, `zod` 4.3.6. Only `next` is behind by a small patch/minor step, so do not bundle a framework upgrade into Story 4.1 unless an implementation blocker requires it. [Source: package.json]
- Latest `next` still requires Node `>=20.9.0`; keep implementation compatible with that baseline. [Source: _bmad-output/planning-artifacts/architecture.md#Starter Template Evaluation]
- Keep the existing targeted Zustand approach for complex quote workflow state. Do not introduce broader global state just to support revision entry. [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]

### File Structure Requirements

- Prioritized existing files to inspect or update:
  - `src/app/(workspace)/quotes/page.tsx`
  - `src/app/(workspace)/quotes/[quoteId]/page.tsx`
  - `src/features/quotes/lib/navigation.ts`
  - `src/features/quotes/server/queries/get-quote-by-id.ts`
  - `src/features/quotes/components/quote-structure-editor.tsx`
  - `src/features/quotes/components/quote-structure-view.tsx`
  - `src/features/quotes/server/actions/update-quote-sections.ts`
  - `src/features/quotes/server/actions/update-quote-line-item.ts`
  - `src/features/quotes/server/actions/add-quote-section.ts`
  - `src/features/quotes/server/actions/remove-quote-section.ts`
  - `src/features/quotes/server/actions/add-quote-line-item.ts`
  - `src/features/quotes/server/actions/remove-quote-line-item.ts`
  - `src/features/quotes/server/actions/reorder-quote-sections.ts`
  - `src/features/quotes/server/actions/reorder-quote-line-items.ts`
  - `src/features/quotes/server/quotes-repository.ts`
  - `src/features/quotes/types.ts`
- Optional new file only if a dedicated reopen action is truly needed:
  - `src/features/quotes/server/actions/reopen-quote-for-revision.ts`
- Additional persistence/test extension points only if required:
  - `src/server/db/schema/...`
  - `drizzle/migrations/...`
  - `src/app/(workspace)/quotes/[quoteId]/page.test.tsx`
  - `tests/e2e/quotes.spec.ts`
- Prefer feature-local placement for new revision helpers or components. Avoid generic dumping-ground files such as `helpers.ts` or `misc.ts`. [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules]
- If a user-facing reopen failure state is added, prefer existing feedback primitives/patterns such as `InlineAlert`, `EmptyState`, or clearly feature-local UI rather than bespoke one-off patterns. [Source: src/app/(workspace)/quotes/page.tsx] [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Feedback Patterns]

### Testing Requirements

- Preserve Story 3.6 behavior: users must still be able to save a draft, return to the quotes list, reopen it, and see the latest persisted content. [Source: _bmad-output/planning-artifacts/prd.md#Journey 1 - Seller-operator creates a send-ready quote from an active opportunity]
- Add or extend coverage for reopening an existing quote into a revision-ready state, keeping linked client context visible, and preserving clear lifecycle orientation. [Source: _bmad-output/planning-artifacts/epics.md#Story 4.1: Reopen an Existing Quote for Revision]
- Add a new `src/app/(workspace)/quotes/[quoteId]/page.test.tsx` to cover draft reopen with revision-ready orientation, blocked non-draft editability, and operational failure rendering. [Source: src/app/(workspace)/quotes/[quoteId]/page.tsx]
- Add or extend server-side coverage so existing draft editing keeps working, revision-ready reopen does not weaken draft-only mutation guards, and non-draft quotes stay blocked/read-only in Story 4.1. [Source: src/features/quotes/server/actions/update-quote-sections.ts] [Source: src/features/quotes/server/actions/add-quote-section.ts] [Source: src/features/quotes/server/actions/reorder-quote-sections.ts]
- Add or extend query/detail coverage for normalized auth/not-found behavior versus recoverable load failures when quote reopen fails. [Source: src/features/quotes/server/queries/get-quote-by-id.ts]
- Keep quote editor behavior stable: preview readiness, auto-save-on-blur, reorder behavior, unsaved-change guard, and explicit success/failure feedback should not regress. [Source: src/features/quotes/components/quote-structure-editor.tsx] [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Feedback Patterns]
- Extend `tests/e2e/quotes.spec.ts` so revision entry changes do not break draft reopen or preview flows and so blocked invoiced behavior is covered explicitly. [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries]
- Keep changes aligned with NFR2, NFR3, NFR5, and NFR8: save/update speed, preview continuity, protected access, and traceable linkage must remain intact. [Source: _bmad-output/planning-artifacts/prd.md#Non-Functional Requirements]

### Project Structure Notes

- Existing reopen path today: quotes list -> quote detail -> draft editor.
- Current quote detail route shows the editor only when `quote.status === "draft"` and generated content exists; non-draft quotes render read-only content. This is the main gap Story 4.1 must address or route around. [Source: src/app/(workspace)/quotes/[quoteId]/page.tsx]
- Current detail page already loads client context, selected service package names, preview gating state, and estimate breakdown context. Preserve those strengths when adding revision-ready behavior. [Source: src/app/(workspace)/quotes/[quoteId]/page.tsx]
- Quote summaries already surface status and updated date from the quotes list. If revision entry starts from the list, preserve this quick-orientation behavior. [Source: src/app/(workspace)/quotes/page.tsx]
- Keep the BMAD planning artifacts plus the current quote implementation as the authority set for this story because no `project-context.md` exists in the repo.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 4: Quote Revision and Acceptance Lifecycle]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.1: Reopen an Existing Quote for Revision]
- [Source: _bmad-output/planning-artifacts/prd.md#Journey 2 - Commercial editor revises a quote without losing control or trust]
- [Source: _bmad-output/planning-artifacts/prd.md#Quote Revision & Lifecycle]
- [Source: _bmad-output/planning-artifacts/prd.md#Non-Functional Requirements]
- [Source: _bmad-output/planning-artifacts/architecture.md#Core Architectural Decisions]
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules]
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Revise Quote With Continuity]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Feedback Patterns]
- [Source: src/app/(workspace)/quotes/page.tsx]
- [Source: src/app/(workspace)/quotes/[quoteId]/page.tsx]
- [Source: src/features/quotes/server/queries/get-quote-by-id.ts]
- [Source: src/features/quotes/server/quotes-repository.ts]
- [Source: src/features/quotes/components/quote-structure-editor.tsx]
- [Source: src/server/db/schema/quotes.ts]
- [Source: package.json]

## Dev Agent Record

### Agent Model Used

openai/gpt-5.4

### Debug Log References

- BMAD create-story workflow executed on 2026-03-21.
- BMAD dev-story workflow executed on 2026-03-21.
- All 332 unit tests pass (61 test files, 0 failures).
- TypeScript compilation clean (no errors).
- Targeted quote workflow review regression tests pass (25 tests, 0 failures).
- ESLint passes on the modified quote workflow files.

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created.
- Story status set to `ready-for-dev`.
- No `project-context.md` was found; planning artifacts and current quote implementation were used instead.
- Implemented revision-ready entry experience via `saved=revised` query parameter on quote detail page.
- Added recovery UI for operational load failures (distinguishes from "Quote not found." 404 behavior).
- Extended `buildQuoteDetailHref` with optional `saved` param; added `buildQuoteRevisionReadyHref` helper.
- Preserved all existing draft-only mutation guards in server actions (update-quote-sections, add-quote-section, reorder-quote-sections, etc.).
- No new persisted quote status added; `accepted`/`invoiced` quotes remain read-only.
- Added 9 page tests + 9 navigation tests covering revision orientation, non-draft blocking, operational failure, and client context visibility.
- Wired an explicit draft-only `Revise` entry from the quotes list without changing the existing `Open` path.
- Preserved revision-ready orientation through preview navigation and back-to-editor return links.
- Treat linked client load failures as recoverable quote-load failures instead of rendering a partial success state.
- Added regression coverage for the new revise entry, preview-return behavior, and linked-client failure handling.

### File List

- `_bmad-output/implementation-artifacts/4-1-reopen-an-existing-quote-for-revision.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified — story status synced after review)
- `src/app/(workspace)/quotes/page.tsx` (modified: added explicit draft-only revise entry alongside the existing open path)
- `src/app/(workspace)/quotes/page.test.tsx` (modified: verifies revise entry wiring and draft-only availability)
- `src/app/(workspace)/quotes/[quoteId]/page.tsx` (modified: error handling, revision-ready messaging)
- `src/app/(workspace)/quotes/[quoteId]/preview/page.tsx` (modified: preserves revision-ready navigation through preview redirects and return links)
- `src/app/(workspace)/quotes/[quoteId]/preview/page.test.tsx` (new: verifies revision-ready preview return and blocked-preview redirects)
- `src/features/quotes/lib/navigation.ts` (modified: extended `buildQuoteDetailHref`, added `buildQuoteRevisionReadyHref`)
- `src/features/quotes/components/quote-structure-editor.tsx` (modified: preserves revision-ready preview hrefs from the editor)
- `src/app/(workspace)/quotes/[quoteId]/page.test.tsx` (modified: adds linked-client failure recovery and revision-preview href coverage)
- `src/features/quotes/lib/navigation.test.ts` (modified: verifies preview href preservation for revision-ready flows)
- `tests/e2e/quotes.spec.ts` (modified: adds revision-entry and preview-return regression coverage)

### Change Log

- Added revision-ready entry experience with `saved=revised` query parameter (2026-03-21)
- Added recovery UI for operational quote load failures (2026-03-21)
- Extended navigation helpers with `buildQuoteRevisionReadyHref` (2026-03-21)
- Added page and navigation test coverage for AC 1-4 (2026-03-21)
- Applied code-review fixes for explicit revise entry wiring, preview-return orientation, linked-client recovery handling, story file list completeness, and additional regression coverage (2026-03-21)

## Senior Developer Review (AI)

### Reviewer

- Reviewer: chuck chuck
- Date: 2026-03-21
- Outcome: Approved after fixes

### Review Notes

- Added an explicit draft-only `Revise` entry on `src/app/(workspace)/quotes/page.tsx` so users can intentionally enter the revision-ready flow without losing the existing generic reopen path.
- Preserved `saved=revised` across preview navigation and return links in `src/app/(workspace)/quotes/[quoteId]/page.tsx`, `src/app/(workspace)/quotes/[quoteId]/preview/page.tsx`, and `src/features/quotes/components/quote-structure-editor.tsx` so lifecycle orientation survives the preview checkpoint.
- Changed `src/app/(workspace)/quotes/[quoteId]/page.tsx` to render recovery UI when linked client context fails to load, removing the prior ambiguous `Unknown client` partial-success state.
- Extended automated coverage across `src/app/(workspace)/quotes/page.test.tsx`, `src/app/(workspace)/quotes/[quoteId]/page.test.tsx`, `src/app/(workspace)/quotes/[quoteId]/preview/page.test.tsx`, `src/features/quotes/lib/navigation.test.ts`, and `tests/e2e/quotes.spec.ts` to cover revise entry wiring, preview-return continuity, and linked-client failure handling.
- Review web references captured: Next.js `Link` docs confirm query-bearing hrefs are the supported navigation mechanism, and Next.js `notFound()` docs confirm normalized 404 handling by terminating route rendering for missing/unauthorized records.

### Validation

- `npm test -- "src/app/(workspace)/quotes/page.test.tsx" "src/app/(workspace)/quotes/[quoteId]/page.test.tsx" "src/app/(workspace)/quotes/[quoteId]/preview/page.test.tsx" "src/features/quotes/lib/navigation.test.ts"`
- `npx eslint "src/app/(workspace)/quotes/page.tsx" "src/app/(workspace)/quotes/page.test.tsx" "src/app/(workspace)/quotes/[quoteId]/page.tsx" "src/app/(workspace)/quotes/[quoteId]/page.test.tsx" "src/app/(workspace)/quotes/[quoteId]/preview/page.tsx" "src/app/(workspace)/quotes/[quoteId]/preview/page.test.tsx" "src/features/quotes/lib/navigation.ts" "src/features/quotes/lib/navigation.test.ts" "src/features/quotes/components/quote-structure-editor.tsx" "tests/e2e/quotes.spec.ts"`
