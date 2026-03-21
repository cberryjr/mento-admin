---
title: 'Unblock quote generation so preview Playwright verification can run'
slug: 'unblock-quote-generation-for-preview-playwright-verification'
created: '2026-03-21T13:00:00Z'
status: 'Completed'
stepsCompleted: [1, 2, 3, 4]
tech_stack:
  - 'TypeScript'
  - 'Next.js App Router'
  - 'React Server/Client Components'
  - 'Server Actions'
  - 'Zod'
  - 'Drizzle ORM'
  - 'Tailwind CSS'
  - 'Vitest + Testing Library'
  - 'Playwright'
files_to_modify:
  - 'src/features/quotes/components/generate-quote-button.tsx'
  - 'src/features/quotes/components/generate-quote-button.test.tsx'
  - 'src/features/quotes/server/actions/generate-quote-content.ts'
  - 'src/features/quotes/server/actions/generate-quote-content.test.ts'
  - 'src/features/service-packages/server/service-packages-repository.ts'
  - 'src/features/service-packages/server/queries/get-service-package-by-id.ts'
  - 'src/app/(workspace)/quotes/[quoteId]/page.tsx'
  - 'tests/e2e/quotes.spec.ts'
code_patterns:
  - 'Auth-first actions and queries using requireSession() plus ensureStudioAccess()'
  - 'ActionResult envelopes for expected failures instead of throwing'
  - 'Repository dual-path persistence: Drizzle DB when DATABASE_URL exists, fallback in-memory stores otherwise'
  - 'Feature-first file structure under src/features/* with App Router pages composing feature modules'
  - 'Client mutation components use useTransition and inline success/error states'
test_patterns:
  - 'Vitest unit tests mock auth and server dependencies'
  - 'React Testing Library component tests verify button states and inline feedback'
  - 'Playwright e2e tests exercise the real app flow against seeded local data'
  - 'Fallback stores on globalThis provide deterministic seeded data but can persist across dev server runs'
---

# Tech-Spec: Unblock quote generation so preview Playwright verification can run

**Created:** 2026-03-21T13:00:00Z

## Overview

### Problem Statement

Local Playwright preview verification is blocked because the quote-generation step fails before the preview route is reached, so Story `3.5` cannot be verified end-to-end in the current local environment.

### Solution

Investigate and fix the quote-generation failure across app logic and local seeded/e2e conditions, then verify the preview flow can proceed from generated quote content into the preview route.

### Scope

**In Scope:**
- Diagnose the current quote-generation failure in the local app flow
- Verify seeded data and generation dependencies used by Playwright
- Define the code changes needed to make quote generation succeed reliably for local preview verification
- Include acceptance criteria that prove preview e2e can continue past generation

**Out of Scope:**
- Redesigning the preview UI itself
- Unrelated quote editor refactors
- Broader production hardening beyond the generation/preview verification path unless directly required by the fix

## Context for Development

### Codebase Patterns

- Quote creation and generation follow the auth-first server-action pattern: `requireSession()`, `ensureStudioAccess(...)`, Zod parsing, `ActionResult` success/error envelopes, and route revalidation.
- Persistence uses a dual-path repository pattern: Drizzle-backed reads/writes when `env.DATABASE_URL` is present, otherwise global in-memory fallback stores seeded with local data for clients and service packages.
- Quote creation validates service package selection via the studio-scoped list path (`listServicePackagesForStudio`), while quote generation resolves packages later through the by-id query path (`getServicePackageById`), creating a potential divergence between creation-time and generation-time validity.
- `GenerateQuoteButton` is a client component using `useTransition` and local inline messaging, but it currently manages success locally instead of forcing the parent quote detail page to refresh server-rendered quote sections.
- The quote detail page renders the editor and preview entry points only when server-loaded `quote.sections.length > 0`, so successful generation must propagate back into the page's server state to reveal the next stage.
- Local Playwright flows in `tests/e2e/quotes.spec.ts` depend on seeded fallback records such as `Sunrise Yoga Studio` and `package-brand-launch`, and those fallback stores persist in server memory across dev-server runs.

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `src/features/quotes/server/actions/generate-quote-content.ts` | Primary generation logic, package lookup path, fallback error handling |
| `src/features/quotes/components/generate-quote-button.tsx` | Client mutation UI that currently shows local success/error without a route refresh |
| `src/features/quotes/server/actions/create-quote.ts` | Creation-time validation path used before generation |
| `src/features/quotes/server/queries/get-quote-by-id.ts` | Server query used to reload the quote after generation |
| `src/features/quotes/server/quotes-repository.ts` | Quote DB/fallback repository with `createQuoteRecord`, `saveQuoteSections`, and `setQuoteGeneratedAt` |
| `src/features/quotes/server/store/quotes-store.ts` | In-memory quote/section/line-item fallback state used in local/no-DB paths |
| `src/features/service-packages/server/queries/get-service-package-by-id.ts` | By-id package lookup used during generation |
| `src/features/service-packages/server/service-packages-repository.ts` | Studio list and by-id package repository behavior across DB and fallback paths |
| `src/features/service-packages/server/store/service-packages-store.ts` | Seeded service package fixtures backing local and test flows |
| `tests/e2e/quotes.spec.ts` | Real create -> generate -> edit -> preview path that currently blocks at generation |
| `_bmad-output/implementation-artifacts/3-2-generate-quote-content-from-selected-service-packages.md` | Source story for intended generation behavior |
| `_bmad-output/implementation-artifacts/3-5-review-preview-readiness-and-open-the-quote-preview.md` | Downstream preview verification story and current blocker |

### Technical Decisions

- The spec targets both root-cause app logic and local/e2e reliability, with successful local preview verification as the acceptance target.
- The fix should preserve the existing quote-generation and preview architecture rather than redesigning the preview experience.
- Investigation confirms the strongest UI-level hypothesis is stale page state after successful generation: the button reports success locally, but the quote detail page only reveals the editor after server state refresh.
- Investigation also confirms a repository-level risk: create-time package validation and generate-time package lookup use different resolution paths, so the spec must explicitly address consistency between studio-scoped list results and later by-id lookups.
- Because fallback stores live on `globalThis`, the spec should consider local/dev-server state persistence and e2e isolation as part of the reliability target, not just the action code itself.

## Implementation Plan

### Tasks

- [x] Task 1: Make quote generation deterministic across create-time and generate-time package resolution
  - File: `src/features/quotes/server/actions/generate-quote-content.ts`
  - Action: Refactor package resolution so generation uses the same studio-scoped availability assumptions as quote creation, reducing the mismatch between list-based validation and by-id lookup.
  - Notes: Avoid a second layer of query-only coupling when repository-level or studio-scoped lookups provide a more stable path for server-action internals; preserve existing auth-first `ActionResult` behavior and user-safe error messages.

- [x] Task 2: Harden service package lookup behavior for local DB/fallback consistency
  - File: `src/features/service-packages/server/service-packages-repository.ts`
  - Action: Add or expose a studio-safe lookup path that behaves consistently with `listServicePackagesForStudio` in both DB-backed and fallback-store runs.
  - Notes: The spec should ensure a package visible during quote creation cannot later disappear during generation because of divergent repository semantics.

- [x] Task 3: Refresh quote detail state after successful generation
  - File: `src/features/quotes/components/generate-quote-button.tsx`
  - Action: Update the success path so the quote detail page refreshes or navigates in a way that server-rendered generated sections become visible immediately after the action succeeds.
  - Notes: The current local success state is confined to the button component, while the editor and preview controls are gated by server-loaded `quote.sections.length` in the page.

- [x] Task 4: Preserve user-visible failure clarity on the quote detail page
  - File: `src/app/(workspace)/quotes/[quoteId]/page.tsx`
  - Action: Ensure the page continues to present a coherent generation state after the button refresh behavior changes, including clear empty, success, and failure transitions.
  - Notes: Keep the existing layout and quote lifecycle intact; do not redesign the preview or editor experience.

- [x] Task 5: Add regression coverage for the refreshed generation flow
  - File: `src/features/quotes/components/generate-quote-button.test.tsx`
  - Action: Add component tests for the successful generation path, including the page refresh/navigation side effect and clearing stale error state.
  - Notes: Current tests cover render, pending, and failure only; they do not assert the success transition that local Playwright depends on.

- [x] Task 6: Add regression coverage for repository/action consistency
  - File: `src/features/quotes/server/actions/generate-quote-content.test.ts`
  - Action: Add tests that cover the selected package remaining resolvable in the same studio context used during quote creation and verify generation returns generated sections for the updated path.
  - Notes: Include at least one regression case for the failure class that currently collapses into `Could not generate quote content.` in local runs.

- [x] Task 7: Prove the end-to-end preview path can continue past generation
  - File: `tests/e2e/quotes.spec.ts`
  - Action: Update or stabilize the preview e2e coverage so the flow explicitly verifies that generation succeeds, the editor appears, preview opens, and return navigation still works.
  - Notes: If local state isolation or deterministic setup is required for Playwright reliability, document and add the smallest viable change needed for repeatable local runs.

### Acceptance Criteria

- [x] AC 1: Given a draft quote created from a client and a selected seeded service package, when the user generates quote content in a local development run, then the generation action resolves the selected package through a studio-consistent path and does not fail due to lookup divergence.
- [x] AC 2: Given quote generation succeeds, when the user remains on the quote detail page, then the page refreshes into the generated state and shows the quote editor or generated quote structure without requiring a manual reload.
- [x] AC 3: Given generation cannot resolve one or more selected packages, when the action fails, then the UI returns a specific, user-safe error message instead of collapsing silently into an unexplained local verification blocker.
- [x] AC 4: Given the local preview verification Playwright flow creates a new quote and clicks `Generate quote content`, when generation completes, then the e2e flow can proceed to the editor and open the preview route successfully.
- [x] AC 5: Given the refreshed local generation behavior is implemented, when automated tests run, then component, action, and Playwright coverage together verify the happy path, the package-resolution regression path, and the preview integration path.

## Additional Context

### Dependencies

- Existing quote-generation architecture from Story `3.2` in `_bmad-output/implementation-artifacts/3-2-generate-quote-content-from-selected-service-packages.md`
- Existing preview verification flow from Story `3.5` in `_bmad-output/implementation-artifacts/3-5-review-preview-readiness-and-open-the-quote-preview.md`
- Seeded fallback data in `src/features/service-packages/server/store/service-packages-store.ts` and `src/features/clients/server/store/clients-store.ts`
- Existing auth/session and route revalidation infrastructure used by server actions and App Router pages

### Testing Strategy

- Unit/action tests: cover package-resolution consistency, successful generation payload assembly, and user-safe failure messaging in `src/features/quotes/server/actions/generate-quote-content.test.ts`
- Component tests: cover `GenerateQuoteButton` success refresh behavior, loading state, and failure state in `src/features/quotes/components/generate-quote-button.test.tsx`
- Manual verification: sign in locally, create a quote with `Sunrise Yoga Studio` and `Brand Launch Package`, generate content, confirm the editor appears immediately, then open and exit preview
- E2E verification: run the preview-focused test in `tests/e2e/quotes.spec.ts` and confirm it reaches preview after generation instead of stopping at the inline generation error
- Quality gates: run `npm run lint`, `npm run test`, `npm run build`, and the targeted Playwright preview test once the regression is addressed

### Notes

- Highest-risk area: repository DB/fallback divergence may produce environment-specific behavior where the create flow and generate flow disagree about package availability.
- Secondary risk: fixing only the button refresh could mask a deeper repository inconsistency, so the spec keeps both root-cause and UI propagation in scope.
- Local fallback stores persist on `globalThis`, so repeatable Playwright verification may require explicit attention to dev-server state isolation even if the main bug is fixed.
- Out-of-scope but worth tracking: static seeded related-record views in other features can drift from the live quote store and may create future local-verification confusion.

## Review Notes

- Adversarial review completed
- Findings: 12 total, 7 fixed, 5 skipped
- Resolution approach: auto-fix
