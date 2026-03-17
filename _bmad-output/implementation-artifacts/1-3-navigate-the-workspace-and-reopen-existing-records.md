# Story 1.3: Navigate the Workspace and Reopen Existing Records

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a studio owner,
I want a clear workspace shell with navigation and browsable record lists,
so that I can move quickly between clients, service packages, quotes, and invoices.

## Acceptance Criteria

1. **Given** an authenticated user enters the workspace **When** the main workspace shell loads **Then** the interface shows persistent navigation to clients, service packages, quotes, invoices, and settings/defaults **And** the current location is clearly indicated.

2. **Given** the user chooses a primary record area **When** the corresponding page opens **Then** the page shows a browsable list or empty state for that record type **And** the next available action is obvious.

3. **Given** at least one client or service package exists in a list **When** the user selects a specific client or service package **Then** the application opens the selected record in its detail view **And** the user can safely return to the prior list context.

4. **Given** the user opens the quotes or invoices area from workspace navigation **When** the area page loads **Then** the interface provides a clear list surface or empty state for that record type **And** the user remains oriented in that workspace area without depending on downstream record-detail workflows.

5. **Given** the workspace shell and record lists are used on supported browsers and breakpoints **When** the user navigates by mouse or keyboard **Then** navigation remains usable, accessible, and responsive in latest Chrome and Safari **And** the layout remains optimized for desktop while still usable at `768px+`.

## Tasks / Subtasks

- [x] Task 1: Build authenticated workspace shell and persistent navigation (AC: #1, #5)
  - [x] 1.1 Implement/update workspace shell route group layout in `src/app/(workspace)/layout.tsx` to provide persistent header and nav chrome
  - [x] 1.2 Implement navigation component in `src/components/app-shell/workspace-nav.tsx` with links for clients, service packages, quotes, invoices, and settings/defaults
  - [x] 1.3 Add current-location indication using `usePathname()` in a client navigation component and set `aria-current="page"` on the active item
  - [x] 1.4 Ensure protected routing assumptions from Story 1.2 remain intact for all workspace routes

- [x] Task 2: Create browsable list and empty-state pages for primary record areas (AC: #2, #4, #5)
  - [x] 2.1 Build list page skeletons for `src/app/(workspace)/clients/page.tsx`, `src/app/(workspace)/service-packages/page.tsx`, `src/app/(workspace)/quotes/page.tsx`, and `src/app/(workspace)/invoices/page.tsx`
  - [x] 2.2 Add reusable empty/loading/feedback states using app feedback primitives in `src/components/feedback/*`
  - [x] 2.3 Include clear primary next action per list surface (for example, create/open actions) with explicit labels
  - [x] 2.4 Return data through server-side queries in feature boundaries (`src/features/*/server/queries`) with standard success/error contracts

- [x] Task 3: Enable record reopen flows with safe return context (AC: #3, #4)
  - [x] 3.1 Implement row/card navigation from client list to `src/app/(workspace)/clients/[clientId]/page.tsx`
  - [x] 3.2 Implement row/card navigation from service package list to `src/app/(workspace)/service-packages/[servicePackageId]/page.tsx`
  - [x] 3.3 Preserve list orientation and safe back path (browser back and explicit in-app back affordance) without losing filter/list state when practical
  - [x] 3.4 Keep quote/invoice list pages orientation-focused and avoid introducing downstream edit/revision logic in this story

- [x] Task 4: Verify accessibility, responsiveness, and quality gates (AC: #5)
  - [x] 4.1 Add/extend unit tests for nav active-state logic and empty-state rendering behavior
  - [x] 4.2 Add integration coverage for authenticated navigation and list/detail reopen behavior
  - [x] 4.3 Add or update Playwright e2e coverage for keyboard navigation across workspace sections and reopen flow for at least clients and service packages
  - [x] 4.4 Verify `lint`, `tsc --noEmit`, `vitest`, and `build` pass after implementation

## Dev Notes

### Developer Context Section

- This story is the first workspace usability layer after auth and is the operational entry point for all later client, package, quote, and invoice workflows.
- Keep scope focused on shell/navigation/list/reopen behavior; do not implement full domain editing logic for quotes, revisions, acceptance, or invoice conversion in this story.
- Preserve clear user orientation at all times: current section, clear next action, and predictable return to prior list context.

### Technical Requirements

- Keep workspace routes authenticated and deny-by-default through existing auth guard patterns established in Story 1.2.
- Use App Router-native navigation with `next/link` and active route detection via `usePathname()` in client-side navigation surfaces.
- Mark only one active navigation item with `aria-current="page"` in each nav set.
- Keep response/data contracts aligned with architecture standards:
  - Success: `{ ok: true, data, meta? }`
  - Failure: `{ ok: false, error: { code, message, fieldErrors? } }`
- Preserve camelCase payloads at application boundaries and ISO 8601 strings for serialized dates.

### Architecture Compliance

- Follow feature-first boundaries and avoid direct DB access from route components.
- Keep route composition in `src/app/(workspace)/*`, reusable shell UI in `src/components/app-shell/*`, and data access in feature/server layers.
- Use `src/features/*/server/queries` for list/detail reads and keep route components thin.
- Do not introduce global app state; use server-first rendering and local component state unless complexity clearly requires a scoped store.

### Library/Framework Requirements

- Continue current baseline stack from Story 1.1:
  - Next.js App Router + TypeScript + Tailwind CSS
  - Zod boundary validation
  - Vitest + React Testing Library + Playwright
- Navigation implementation should follow current Next.js 16 guidance:
  - `next/link` for route navigation
  - `usePathname()` for active section indication in client nav components

### File Structure Requirements

- Align implementation with architecture map paths:
  - `src/app/(workspace)/layout.tsx`
  - `src/app/(workspace)/page.tsx`
  - `src/app/(workspace)/clients/page.tsx`
  - `src/app/(workspace)/service-packages/page.tsx`
  - `src/app/(workspace)/quotes/page.tsx`
  - `src/app/(workspace)/invoices/page.tsx`
  - `src/app/(workspace)/clients/[clientId]/page.tsx`
  - `src/app/(workspace)/service-packages/[servicePackageId]/page.tsx`
  - `src/components/app-shell/workspace-header.tsx`
  - `src/components/app-shell/workspace-nav.tsx`
  - `src/components/feedback/empty-state.tsx`
  - `src/components/feedback/loading-block.tsx`
  - `src/components/feedback/inline-alert.tsx`
- Use kebab-case filenames and keep tests colocated or under `tests/` per architecture standards.

### Testing Requirements

- Validate each acceptance criterion with explicit automated coverage:
  - Workspace nav persists and indicates current location
  - Each record area shows list or empty state with clear next action
  - Client/service-package reopen paths land on detail view and preserve return orientation
  - Keyboard navigation and responsive behavior remain usable on supported browser/breakpoint targets
- Include e2e verification in latest Chrome and Safari-compatible setup for core navigation and reopen paths.
- Keep accessibility checks aligned with WCAG 2.1 AA goals for nav semantics, focus behavior, and readable feedback.

### Previous Story Intelligence

- Story 1.2 established auth and protection foundations that this story must build on instead of replacing:
  - Auth.js credentials and server-side protection expectations are already defined
  - Route protection and error-envelope conventions must remain consistent
  - Existing structure includes auth and server scaffolding; extend cleanly for workspace shell behavior
- Story 1.2 emphasized strictness around explicit, safe feedback and predictable route behavior; keep that rigor for navigation and empty/error/list states.

### Git Intelligence Summary

- The latest implementation commit (`f657ffd`) created project baseline structure and placeholders that should be extended directly:
  - `src/components/app-shell/.gitkeep` indicates intended workspace shell component area
  - `src/components/feedback/.gitkeep` indicates intended feedback/empty/loading primitives area
  - `src/middleware.ts` and auth scaffolding are already present; preserve established route protection behavior
  - Quality gates and test scaffolding (`.github/workflows/ci.yml`, Vitest, Playwright, integration dirs) are already in place and must stay green
- Repository conventions to keep:
  - Kebab-case file naming
  - Strict TypeScript and ESLint compliance
  - Co-located unit tests plus dedicated `tests/integration` and `tests/e2e`

### Latest Tech Information

- Next.js `Link` API (docs version 16.1.7, updated 2026-03-16): use `next/link` as primary client-side navigation primitive for route transitions and prefetch behavior.
- Next.js `usePathname` API (docs version 16.1.7, updated 2026-03-16): active-route detection must run in a Client Component; isolate pathname-dependent UI to avoid hydration mismatch risks in rewrite/proxy scenarios.
- ARIA `aria-current` guidance (MDN, last modified 2025-10-29): only one item in a related nav set should be marked current; use `aria-current="page"` for active page links.

### Project Context Reference

- No `project-context.md` found in repository. Use architecture, PRD, UX specification, sprint status, and prior story artifacts as authoritative context.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.3] - user story statement and acceptance criteria
- [Source: _bmad-output/planning-artifacts/epics.md#Requirements Inventory] - FR2/FR3 and accessibility/performance expectations impacting workspace navigation
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries] - app-shell and workspace route boundaries
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules] - naming, response envelopes, data serialization, and error/loading contracts
- [Source: _bmad-output/planning-artifacts/architecture.md#Requirements to Structure Mapping] - FR-to-feature placement for workspace, clients, service packages, quotes, invoices
- [Source: _bmad-output/planning-artifacts/prd.md#Functional Requirements] - FR1-FR4 workspace and navigation continuity context
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#User Journey Flows] - guided continuity expectations and next-action clarity
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#UX Consistency Patterns] - navigation, feedback, empty/loading state behavior
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Responsive Design & Accessibility] - breakpoint and keyboard/WCAG guidance
- [Source: https://nextjs.org/docs/app/api-reference/components/link] - Next.js Link behavior and active-link implementation examples
- [Source: https://nextjs.org/docs/app/api-reference/functions/use-pathname] - pathname hook behavior and client-component constraint
- [Source: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-current] - active navigation semantics for assistive technology

## Dev Agent Record

### Agent Model Used

openai/gpt-5.3-codex

### Debug Log References

- create-story workflow execution
- dev-story workflow execution
- npm run lint
- npx next typegen
- npx tsc --noEmit
- npm test
- npx playwright test
- npm run build

### Implementation Plan

- Introduce a shared authenticated workspace layout (`src/app/(workspace)/layout.tsx`) with reusable header/nav shell components and active-route semantics.
- Implement server-first list/detail routes for clients and service packages with feature-boundary query functions and explicit back navigation context.
- Provide orientation-focused quote and invoice list surfaces with clear primary actions and reusable feedback primitives.
- Extend proxy protection to all workspace record routes while preserving existing auth redirect behavior.
- Add unit, integration, and e2e test coverage for navigation active state, reopen flows, and keyboard navigation; validate full project quality gates.

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created
- Implemented authenticated workspace shell layout with persistent header and client-side section navigation using `usePathname()` + `aria-current="page"`.
- Added clients, service packages, quotes, invoices, and workspace settings/defaults pages with list or empty-state behavior and clear next actions.
- Implemented client and service package detail reopen flows with explicit in-app back affordances that preserve list orientation.
- Added server query boundaries for all workspace record surfaces using the standard `{ ok, data, meta? }` and `{ ok: false, error }` contracts.
- Expanded automated coverage with unit, integration, and Playwright e2e tests for navigation, reopen paths, and keyboard-based section changes.
- Quality gates passed: `lint`, `tsc --noEmit`, `vitest`, `playwright`, and `build`.

### File List

- _bmad-output/implementation-artifacts/1-3-navigate-the-workspace-and-reopen-existing-records.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
- src/app/(workspace)/layout.tsx
- src/app/(workspace)/workspace/page.tsx
- src/app/(workspace)/clients/page.tsx
- src/app/(workspace)/clients/[clientId]/page.tsx
- src/app/(workspace)/service-packages/page.tsx
- src/app/(workspace)/service-packages/[servicePackageId]/page.tsx
- src/app/(workspace)/quotes/page.tsx
- src/app/(workspace)/invoices/page.tsx
- src/components/app-shell/workspace-header.tsx
- src/components/app-shell/workspace-nav.tsx
- src/components/app-shell/workspace-nav.test.tsx
- src/components/feedback/empty-state.tsx
- src/components/feedback/empty-state.test.tsx
- src/components/feedback/loading-block.tsx
- src/components/feedback/inline-alert.tsx
- src/features/clients/server/queries/client-fixtures.ts
- src/features/clients/server/queries/list-clients.ts
- src/features/clients/server/queries/get-client-by-id.ts
- src/features/service-packages/server/queries/service-package-fixtures.ts
- src/features/service-packages/server/queries/list-service-packages.ts
- src/features/service-packages/server/queries/get-service-package-by-id.ts
- src/features/quotes/server/queries/list-quotes.ts
- src/features/invoices/server/queries/list-invoices.ts
- src/proxy.ts
- tests/integration/auth/proxy.test.ts
- tests/integration/workspace/navigation-reopen.test.tsx
- tests/e2e/auth.spec.ts
- tests/e2e/workspace-navigation.spec.ts
- src/app/workspace/page.tsx (deleted)

## Change Log

- 2026-03-17: Implemented Story 1.3 workspace shell, navigation, record list/detail reopen flows, and full validation coverage; advanced status to `review`.
