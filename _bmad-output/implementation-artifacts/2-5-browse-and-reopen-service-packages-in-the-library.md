# Story 2.5: Browse and Reopen Service Packages in the Library

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a studio owner,
I want to browse and reopen service packages from the library,
so that I can review and maintain reusable commercial sources before quote creation.

## Acceptance Criteria

1. **Given** one or more service packages exist **When** the user opens the service package library **Then** the interface shows a browsable list with clear package identity and summary information **And** records can be reopened reliably from the list.

2. **Given** an existing service package is chosen from the library **When** the record opens **Then** the latest persisted service package definition is displayed **And** the user can safely return to the library context.

3. **Given** no service packages match the current list state or none exist yet **When** the library is shown **Then** the user sees a clear empty or no-results state **And** the next step to create or refine packages is obvious.

4. **Given** the service package library is used with keyboard navigation and supported browsers **When** the user searches, reviews, or opens packages **Then** the interactions remain accessible, responsive, and clear **And** the current library and record state is communicated without ambiguity.

## Tasks / Subtasks

- [ ] Task 1: Extract and enhance the service package list into a dedicated component (AC: #1, #4)
  - [ ] 1.1 Add `src/features/service-packages/components/service-package-list.tsx` as a client component that receives `ServicePackageSummary[]` data and renders the browsable list with clear package identity (name, category, starting price, short description) and an `updatedAt` display using the shared `formatDate()` utility from `@/lib/format/dates`.
  - [ ] 1.2 Render a record count (e.g., "3 service packages") in the list header area so users can assess library size at a glance.
  - [ ] 1.3 Add a search input that filters the list client-side by matching against `name`, `category`, `startingPriceLabel`, and `shortDescription` fields using case-insensitive substring matching; keep the filter in local component state.
  - [ ] 1.4 Preserve the existing link pattern: each list item links to `/service-packages/${id}?backTo=/service-packages` for safe reopen and return navigation.
  - [ ] 1.5 Add accessible keyboard focus styling consistent with existing workspace patterns (`focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900`), and ensure the search input has a programmatically associated label.

- [ ] Task 2: Handle empty and no-results states (AC: #3)
  - [ ] 2.1 When no service packages exist at all, render the existing `<EmptyState>` component with a "Create service package" CTA linking to `/service-packages/new`, matching the current behavior.
  - [ ] 2.2 When service packages exist but the search filter produces zero matches, render a distinct no-results state with clear text such as "No service packages match your search" and a one-action clear-filter control so the user can reset without losing orientation.
  - [ ] 2.3 Ensure both empty and no-results states are accessible and announce their purpose through text, not layout cues alone.

- [ ] Task 3: Update the service packages page to compose the new list component (AC: #1, #2, #3, #4)
  - [ ] 3.1 Refactor `src/app/(workspace)/service-packages/page.tsx` to delegate list rendering to the new `ServicePackageList` component, passing `servicePackages` data and a "Create service package" action link.
  - [ ] 3.2 Keep the page as a server component that loads data via the existing `listServicePackages()` query and passes the result to the client list component.
  - [ ] 3.3 Preserve the existing error state rendering using `<InlineAlert>` when the query fails.
  - [ ] 3.4 Preserve the "Create service package" CTA in the page header area, accessible from both the populated list header and the empty state.

- [ ] Task 4: Confirm the reopen and back-navigation flow (AC: #2)
  - [ ] 4.1 Verify that clicking a service package in the list navigates to the detail page at `/service-packages/[servicePackageId]?backTo=/service-packages` and that the detail page renders the latest persisted package definition.
  - [ ] 4.2 Verify that the detail page back link reads `backTo` from search params and returns the user to `/service-packages`, preserving orientation.
  - [ ] 4.3 No changes are needed to `src/app/(workspace)/service-packages/[servicePackageId]/page.tsx` unless a regression is discovered during testing; the reopen and back-navigation flow is already implemented by Story 2.3.

- [ ] Task 5: Add tests for browse, search, empty, no-results, and reopen behaviors (AC: #1, #2, #3, #4)
  - [ ] 5.1 Add component tests for `ServicePackageList` in `src/features/service-packages/components/service-package-list.test.tsx` covering: list rendering with correct identity fields and `updatedAt`, record count display, search filtering with matching and non-matching input, no-results state with clear-filter action, keyboard focus styles on list items, and accessible search input label.
  - [ ] 5.2 Update `tests/integration/workspace/navigation-reopen.test.tsx` to verify the new list component renders correctly with seeded data, including the search input presence and link targets with `backTo` context.
  - [ ] 5.3 Add or extend Playwright coverage in `tests/e2e/service-packages.spec.ts` for: library page loads with seeded packages visible, search filters the list correctly, no-results state appears for non-matching search, clearing search restores the full list, clicking a package navigates to the detail page, and back-navigation returns to the library.
  - [ ] 5.4 Add Playwright keyboard accessibility coverage: Tab into the search input, type a filter term, Tab through filtered results, Enter to open a package, and verify the back link returns to the library.
  - [ ] 5.5 Verify `npm run lint`, `npm run test`, and `npm run build` pass.

## Dev Notes

### Developer Context Section

- Story 2.5 is a UI-focused browsing story. It improves the service package library page to make it a proper browsable, searchable list surface rather than the minimal inline list from Story 2.3. No new persistence, schema, repository, or server action work is needed.
- The current service package list is rendered inline in `src/app/(workspace)/service-packages/page.tsx` as a simple `<ul>` with `<li>` + `<Link>` items. This story extracts that into a dedicated `ServicePackageList` component, adds client-side search filtering, record count display, `updatedAt` visibility, and a proper no-results state.
- The reopen flow (list -> detail -> back to list) is already fully functional from Story 2.3. This story only needs to confirm it works correctly with the new list component, not re-implement it.
- Story 2.6 (define service catalog taxonomy and complexity matrix) is the next story in Epic 2. Keep the search and filter implementation simple and client-side; do not introduce server-side search, pagination, or taxonomy-based filtering in this story.

### Technical Requirements

- The `ServicePackageList` component must be a `"use client"` component because it manages local search state. The page remains a server component that passes data down.
- Search filtering must happen in local component state using a controlled input. Filter against `name`, `category`, `startingPriceLabel`, and `shortDescription` with case-insensitive substring matching. Do not call the server on every keystroke.
- Use the existing `ServicePackageSummary` type from `src/features/service-packages/types.ts` as the data contract for list items. This type already includes `updatedAt` -- display it using `formatDate()` from `@/lib/format/dates`.
- Do not modify the list query `listServicePackages()`, the repository, or the database schema. The current query returns all packages sorted by name, which is sufficient for client-side filtering at MVP scale.
- Do not introduce pagination, server-side search, or Zustand state. The in-memory filter on the client component is the right level of complexity for 1-5 concurrent users with a small number of service packages.
- Preserve the `?backTo=/service-packages` query parameter on all list item links so the detail page back-navigation continues to work.
- The search input must have a visible `<label>` or `aria-label` for accessibility. Use `htmlFor` association or a visible label element, consistent with existing form patterns.
- The no-results state must be distinct from the empty state: empty state means zero packages exist (shows create CTA), no-results state means packages exist but the filter matched none (shows clear-filter action).

### Architecture Compliance

- Respect feature-first boundaries:
  - New list component in `src/features/service-packages/components/service-package-list.tsx`
  - Route composition in `src/app/(workspace)/service-packages/page.tsx` (server component)
  - No changes to `src/features/service-packages/server/*` (queries, actions, repository are unchanged)
- Follow the established server-first App Router pattern: the page loads data server-side and passes it to a client component for interactive rendering.
- Reuse existing shared components: `<EmptyState>` for zero-packages state, `<InlineAlert>` for query errors.
- Reuse `formatDate()` from `@/lib/format/dates` for `updatedAt` display, consistent with `ClientRecordSummary`.
- Do not import cross-feature components. The `ServicePackageList` is feature-owned and should not be used by other features.
- Do not introduce a new UI library, component framework, or global state store. The search filter is pure local component state.
- Keep the list page composition pattern consistent with the clients page: server component delegates list rendering to a feature component.

### Library/Framework Requirements

- Use the current project-approved stack without version changes:
  - `next` `16.1.6` in project (latest registry: `16.2.0`)
  - `react` and `react-dom` `19.2.3` in project (latest registry: `19.2.4`)
  - `next-auth` `4.24.13`
  - `drizzle-orm` `0.45.1`
  - `drizzle-kit` `0.31.9` in project (latest registry: `0.31.10`)
  - `zod` `4.3.6`
  - `@playwright/test` `1.58.2`
  - `vitest` `4.1.0`
- Stay on the architecture-pinned versions. The version drift is patch-level only and does not affect this story.
- Use React controlled input (`useState` + `onChange`) for the search filter. Do not add `use-debounce` or similar libraries; client-side filtering on a small dataset is instant.
- Use Tailwind CSS classes consistent with the existing workspace styling. Follow the established card/list patterns: `divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white`.

### File Structure Requirements

- Expected primary touch points:
  - `src/features/service-packages/components/service-package-list.tsx` (new)
  - `src/features/service-packages/components/service-package-list.test.tsx` (new)
  - `src/app/(workspace)/service-packages/page.tsx` (modify)
  - `tests/integration/workspace/navigation-reopen.test.tsx` (modify)
  - `tests/e2e/service-packages.spec.ts` (modify)
- Files that should NOT change:
  - `src/app/(workspace)/service-packages/[servicePackageId]/page.tsx` (detail page is already correct)
  - `src/app/(workspace)/service-packages/new/page.tsx` (create flow is unchanged)
  - `src/features/service-packages/server/*` (no server-side changes needed)
  - `src/features/service-packages/types.ts` (types are already sufficient)
  - `src/features/service-packages/schemas/*` (no schema changes needed)
  - `src/server/db/schema/*` (no database changes needed)
- Keep file names kebab-case. Co-locate the component test with the component.
- If the current clients page (`src/app/(workspace)/clients/page.tsx`) does NOT get an equivalent list component extraction in this story, that is fine. Keep this story focused on service packages only. The clients page can follow the same pattern in a future story if desired.

### Testing Requirements

- Cover all acceptance-criteria paths explicitly:
  - Populated list renders each package with name, category, starting price, short description (if present), and updated date
  - Record count is displayed and accurate
  - Search input filters the list correctly by name, category, price label, and description
  - No-results state appears when search matches nothing, with a clear-filter action
  - Empty state appears when no packages exist, with a create CTA
  - Clicking a package navigates to the correct detail page with `backTo` context
  - Back-navigation from the detail page returns to the library
  - Keyboard-only flow: focus search, type filter, tab to results, enter to open
- Add accessibility checks for the search input label, focus states on list items, and meaningful text in empty/no-results states.
- Update existing navigation-reopen integration test to verify compatibility with the extracted list component.
- Existing tests in `tests/e2e/workspace-navigation.spec.ts` should continue to pass without modification (they click link text that will still be rendered by the new component).
- Existing tests in `tests/e2e/service-packages.spec.ts` should continue to pass because the create and edit flows navigate via `/service-packages/new` and seeded package IDs, not through the list component.
- Verify `npm run lint`, `npm run test`, and `npm run build` pass.

### Previous Story Intelligence

- Story 2.3 established the full service package create/edit baseline: authenticated server actions, repository with fallback store, controlled form with explicit feedback, and the library page with inline list rendering. Story 2.5 builds only on the library page UI, not on the server-side foundation.
- Story 2.3 code review applied fixes for: dead export removal, vitest config for `.test.tsx` integration tests, navigation-reopen test with auth mocks, `focus-visible` on the detail back link, `aria-describedby` chaining on textarea during errors, and `text-zinc-900` on input fields. These fixes are already in the codebase.
- Story 2.4 (define service package structure, default content, and pricing) is at `ready-for-dev` status but has not been implemented yet. Story 2.5 does not depend on Story 2.4. Both stories can proceed independently: 2.4 modifies the form/detail/schema/repository for structured packages, while 2.5 modifies only the library list page.
- Story 2.2 added `ClientRecordSummary` which uses `formatDate()` for `updatedAt` display and `formatStatus()` for status badges. Reuse `formatDate()` for the service package `updatedAt` display in the list.
- The safest component interaction pattern in the codebase is the controlled-input model from `client-form.tsx` and `service-package-form.tsx`: local `useState` for form values, `onChange` for updates, no external state management. Apply the same pattern for the search input.

### Git Intelligence Summary

- Commit `2ee18dc` (Story 2.3) is the most directly relevant commit. It replaced fixture-only pages with repository-backed create/edit flows and established the current inline list rendering in `page.tsx` that this story will refactor. The list markup, link patterns, and `backTo` context are all from this commit.
- Commit `3c2ca6f` (Story 2.2) added `ClientRecordSummary` with the `formatDate()` utility and related-record display patterns. This is the pattern reference for displaying `updatedAt` in list items.
- Commit `ed09778` (Story 2.1) established the client create/edit baseline with repository, actions, forms, and tests. The clients page list rendering follows the same inline pattern as service packages.
- The seeded service package data in the fallback store includes two packages visible to `default-studio`: "Brand Launch Package" (Branding, $2,400) and "Content Sprint Package" (Content, $1,200). Tests can rely on these seeded records.

### Latest Tech Information

- Latest registry check results:
  - `next`: `16.2.0` latest, project pinned to `16.1.6`
  - `react`: `19.2.4` latest, project pinned to `19.2.3`
  - `react-dom`: `19.2.4` latest, project pinned to `19.2.3`
  - `drizzle-orm`: `0.45.1` latest and current in project
  - `drizzle-kit`: `0.31.10` latest, project pinned to `0.31.9`
  - `zod`: `4.3.6` latest and current in project
  - `@playwright/test`: `1.58.2` latest and current in project
  - `vitest`: `4.1.0` latest and current in project
- Guidance for this story: stay on pinned versions. No version changes are needed for this UI-only browsing story. The version drift is patch-level and does not impact any API or behavior used here.

### Project Context Reference

- No `project-context.md` exists in the repository.
- Authoritative context for this story: epics file, PRD, architecture, UX specification, sprint status, Story 2.3 file, Story 2.4 file, and the current implementation under `src/app/(workspace)/service-packages`, `src/features/service-packages`, `src/features/clients` (for pattern reference), and shared formatting utilities.

### Project Structure Notes

- The current list rendering is inline in `src/app/(workspace)/service-packages/page.tsx`. The clients page follows the same inline pattern. Extracting the list into a dedicated component is an improvement to the existing pattern, not a deviation from it.
- The `ServicePackageSummary` type already includes `updatedAt` but the page does not display it. Story 2.5 surfaces this field without changing the type contract.
- The list query already returns `meta.total` but the page does not use it. Story 2.5 can use this value for the record count display, or derive the count from the array length (they are equivalent since there is no pagination).
- No new routes, no new API endpoints, no new database tables. This story is entirely UI composition and component extraction work.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.5] - canonical story statement and acceptance criteria
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 2] - cross-story context for client and service-package foundation work
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries] - expected route, feature, and component file placement
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules] - naming, response envelopes, component boundaries
- [Source: _bmad-output/planning-artifacts/architecture.md#Architectural Boundaries] - feature-first component ownership rules
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Search and Filtering Patterns] - simple search, lightweight filters, no-results guidance
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Empty States and Loading States] - empty state with next action, meaningful text
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Navigation Patterns] - persistent top-level navigation, linked-record navigation, clear back paths
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Responsive Strategy] - desktop-first layout, tablet-safe fallback
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Accessibility Strategy] - WCAG 2.1 AA, keyboard reachability, visible focus states, programmatic labels
- [Source: src/app/(workspace)/service-packages/page.tsx] - current inline list rendering that this story will refactor
- [Source: src/app/(workspace)/service-packages/[servicePackageId]/page.tsx] - detail page with backTo and saved notice (no changes needed)
- [Source: src/features/service-packages/types.ts] - ServicePackageSummary type with updatedAt field
- [Source: src/features/service-packages/server/queries/list-service-packages.ts] - list query returning ActionResult with meta.total
- [Source: src/features/service-packages/server/service-packages-repository.ts] - repository with listServicePackagesForStudio sorted by name ASC
- [Source: src/features/service-packages/components/service-package-form.tsx] - controlled form pattern reference
- [Source: src/features/clients/components/client-record-summary.tsx] - formatDate() usage and RecordListItem pattern reference
- [Source: src/lib/format/dates.ts] - shared formatDate utility
- [Source: src/components/feedback/empty-state.tsx] - shared EmptyState component
- [Source: src/components/feedback/inline-alert.tsx] - shared InlineAlert component
- [Source: tests/e2e/service-packages.spec.ts] - existing CRUD e2e tests (no list page coverage yet)
- [Source: tests/e2e/workspace-navigation.spec.ts] - existing reopen flow e2e coverage
- [Source: tests/integration/workspace/navigation-reopen.test.tsx] - existing integration test for list link targets
- [Source: src/features/service-packages/server/store/service-packages-store.ts] - seeded test data: package-brand-launch and package-content-sprint

## Dev Agent Record

### Agent Model Used

anthropic/claude-opus-4-6

### Debug Log References

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created
- Story 2.5 is a UI-only browsing enhancement. No server-side, schema, repository, or migration changes needed. The story extracts the inline list into a component, adds client-side search, record count, updatedAt display, and proper no-results handling.

### File List
