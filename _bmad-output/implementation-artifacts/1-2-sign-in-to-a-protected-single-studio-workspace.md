# Story 1.2: Sign In to a Protected Single-Studio Workspace

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a studio owner,
I want to sign in and reach a protected workspace,
so that only authorized access is allowed to commercial records and workflow actions.

## Acceptance Criteria

1. **Given** an unauthenticated visitor opens a protected workspace route **When** access is attempted **Then** the application denies access and redirects the user to the sign-in flow **And** protected content is not rendered or exposed.

2. **Given** a valid studio owner credential exists **When** the user signs in successfully **Then** an authenticated session is established with the approved Auth.js credentials-based flow **And** the user is taken into the single-studio workspace.

3. **Given** an invalid or unauthorized credential is submitted **When** sign-in is attempted **Then** the request is rejected with clear, safe feedback **And** no protected record access is granted.

4. **Given** the user is authenticated **When** they navigate within the protected workspace **Then** server-side authorization checks protect routes, server actions, and record APIs **And** unauthenticated or unauthorized access attempts are blocked consistently.

## Tasks / Subtasks

- [x] Task 1: Add Auth.js credentials foundation and configuration (AC: #2, #3)
  - [x] 1.1 Install authentication dependencies: `next-auth@4.24.13` and `@auth/core@0.34.3`
  - [x] 1.2 Create Auth.js configuration in `src/features/auth/auth-options.ts` with Credentials provider and explicit `authorize` function contract
  - [x] 1.3 Add secure session wiring in `src/features/auth/session.ts` and `src/server/auth/auth.ts`
  - [x] 1.4 Add API route handler for auth callbacks at `src/app/api/auth/[...nextauth]/route.ts`
  - [x] 1.5 Validate env requirements for auth secrets and callback URL through `src/lib/env.ts`

- [x] Task 2: Implement sign-in experience and protected route enforcement (AC: #1, #2, #3, #4)
  - [x] 2.1 Create sign-in page at `src/app/(auth)/sign-in/page.tsx` with accessible credentials form
  - [x] 2.2 Implement safe error handling for invalid credentials (no sensitive leakage)
  - [x] 2.3 Protect workspace routes with deny-by-default gate in route protection layer (preferred: `proxy.ts`; keep `src/middleware.ts` only if required by existing project baseline)
  - [x] 2.4 Enforce server-side auth checks helper in `src/features/auth/require-session.ts` for server actions and route handlers
  - [x] 2.5 Redirect authenticated users away from sign-in to workspace landing

- [x] Task 3: Add authorization guardrails for protected read/write paths (AC: #4)
  - [x] 3.1 Add simple single-studio RBAC/permission helpers in `src/server/auth/permissions.ts`
  - [x] 3.2 Apply auth check utilities to at least one protected API route and one server action path as implementation pattern examples
  - [x] 3.3 Ensure unauthorized attempts return standardized error envelope and correct HTTP status (`401`/`403`)

- [x] Task 4: Test and verify authentication behavior end-to-end (AC: #1, #2, #3, #4)
  - [x] 4.1 Add unit tests for credential validation and auth helper behavior
  - [x] 4.2 Add integration tests for protected route/API behavior (unauthenticated, invalid credentials, authenticated)
  - [x] 4.3 Add Playwright e2e spec for sign-in and protected workspace access flow
  - [x] 4.4 Verify lint, type-check, tests, and build all pass with auth changes

## Dev Notes

### Developer Context Section

- This story is the security gate for all downstream stories in Epic 1 and must be implemented before workspace navigation and defaults management.
- Keep scope tight: credentials-based sign-in, session establishment, protected route/access enforcement, and safe feedback only.
- Do not implement multi-tenant logic, social providers, invite flows, or role-management UX in this story.

### Technical Requirements

- Use Auth.js credentials-based authentication per architecture standards.
- Enforce deny-by-default for protected workspace paths and protected mutation/read boundaries.
- Keep response contracts consistent with architecture envelope:
  - Success: `{ ok: true, data, meta? }`
  - Failure: `{ ok: false, error: { code, message, fieldErrors? } }`
- Serialize dates as ISO strings and use camelCase in application payloads.

### Architecture Compliance

- Follow feature-first boundaries:
  - Auth feature code in `src/features/auth/*`
  - Cross-cutting auth infra in `src/server/auth/*`
  - Auth HTTP callback in `src/app/api/auth/[...nextauth]/route.ts`
- Do not place auth business logic directly in route components.
- Preserve server-first model; avoid unnecessary client-side global state for auth.

### Library/Framework Requirements

- Required auth versions from architecture:
  - `next-auth@4.24.13`
  - `@auth/core@0.34.3`
- Continue using existing stack initialized in Story 1.1:
  - Next.js App Router + TypeScript
  - Zod-based env and boundary validation
  - Vitest + RTL + Playwright

### File Structure Requirements

- Create and/or update only paths aligned with architecture map for auth:
  - `src/app/(auth)/sign-in/page.tsx`
  - `src/app/api/auth/[...nextauth]/route.ts`
  - `src/features/auth/auth-options.ts`
  - `src/features/auth/session.ts`
  - `src/features/auth/require-session.ts`
  - `src/server/auth/auth.ts`
  - `src/server/auth/permissions.ts`
- Keep route guarding aligned with current Next.js guidance:
  - Next.js 16 deprecates `middleware` naming in favor of `proxy` convention.

### Testing Requirements

- Add tests that directly prove each AC:
  - Unauthenticated access to protected route is redirected/blocked.
  - Valid credentials create session and enter workspace.
  - Invalid credentials show safe failure state.
  - Protected API/server action paths enforce server-side auth.
- Add one e2e auth flow in `tests/e2e/auth.spec.ts`.
- Keep regression suite green (`lint`, `tsc --noEmit`, `vitest`, `build`, relevant Playwright spec).

### Previous Story Intelligence

- Story 1.1 established foundational patterns that must be reused:
  - Centralized environment parsing/validation via `src/lib/env.ts`
  - Standard API success envelope (`ok/data`) with explicit status behavior
  - CI quality gates and local validation commands already wired
  - Existing scaffold includes `src/server/auth/index.ts` and route-protection placeholder, so extend rather than replace structure
- Story 1.1 review correction changed placeholder matcher and highlighted strictness around route behavior and explicit payload contracts. Keep this level of precision in auth responses and redirects.

### Git Intelligence Summary

- Recent commits indicate foundational baseline is complete and pushed (`f657ffd`).
- Current repository conventions to maintain:
  - Kebab-case filenames
  - Strict TypeScript + ESLint pass requirement
  - Co-located unit tests and dedicated integration/e2e directories

### Latest Tech Information

- Next.js guidance: `middleware` naming is deprecated in favor of `proxy` file convention. If introducing new guard file, prefer `proxy.ts`; if keeping existing `src/middleware.ts`, plan migration-safe approach.
- NextAuth credentials provider behavior:
  - `authorize(credentials)` returns user object for success
  - returns `null` for invalid credentials (safe failure)
  - credentials provider with JWT session behavior is expected pattern
  - avoid exposing raw auth errors in UI

### Project Context Reference

- No `project-context.md` found in repository. Rely on architecture, PRD, UX specification, sprint status, and completed Story 1.1 as authoritative context.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.2] - user story and acceptance criteria
- [Source: _bmad-output/planning-artifacts/epics.md#Requirements Inventory] - FR/NFR mapping for authentication and protection
- [Source: _bmad-output/planning-artifacts/architecture.md#Core Architectural Decisions] - Auth.js credentials and RBAC decisions
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries] - auth file locations and route/API boundaries
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules] - response envelopes, naming, and validation boundaries
- [Source: _bmad-output/planning-artifacts/prd.md#Functional Requirements] - FR1-FR3 workspace access context
- [Source: _bmad-output/planning-artifacts/prd.md#Non-Functional Requirements] - NFR4/NFR5/NFR11 security and accessibility requirements
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Accessibility Strategy] - keyboard and accessible flow expectations
- [Source: https://next-auth.js.org/providers/credentials] - Auth.js credentials provider contract
- [Source: https://nextjs.org/docs/messages/middleware-to-proxy] - Next.js middleware-to-proxy guidance

## Dev Agent Record

### Agent Model Used

openai/gpt-5.3-codex

### Debug Log References

- create-story workflow execution
- npm install next-auth@4.24.13 @auth/core@0.34.3
- npm test
- npm run lint
- npx tsc --noEmit
- npm run build
- npx playwright test

### Implementation Plan

- Red: Added failing auth unit/integration tests plus new Playwright auth flow before implementation.
- Green: Implemented credentials auth options, session helpers, sign-in UX, auth callback route, proxy guard, and protected API/server action examples.
- Refactor: Introduced shared permission helpers and explicit session contract typing for server-side enforcement.
- Validation: Passed lint, type-check, Vitest suite, Next.js build, and Playwright e2e suite.

### Completion Notes List

- Implemented Auth.js credentials-based sign-in with JWT session callbacks and safe invalid-credential handling.
- Added protected route enforcement using `src/proxy.ts`, plus authenticated redirect behavior away from `/sign-in`.
- Added server-side authorization primitives (`requireSession`, RBAC helpers) and applied them to protected API and server action paths.
- Added unit/integration/e2e coverage for credential auth, proxy route guarding, protected API responses, and sign-in to workspace flow.
- Verified regression quality gates with `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build`, and `npx playwright test`.

### File List

- _bmad-output/implementation-artifacts/1-2-sign-in-to-a-protected-single-studio-workspace.md
- package.json
- package-lock.json
- playwright.config.ts
- src/lib/env.ts
- src/lib/errors/error-codes.ts
- src/server/auth/index.ts
- src/server/auth/auth.ts
- src/server/auth/permissions.ts
- src/types/next-auth.d.ts
- src/features/auth/auth-options.ts
- src/features/auth/session.ts
- src/features/auth/require-session.ts
- src/features/auth/sign-in-form.tsx
- src/features/auth/auth-options.test.ts
- src/features/auth/require-session.test.ts
- src/features/workspace/actions/update-workspace-name.ts
- src/app/api/auth/[...nextauth]/route.ts
- src/app/api/workspace/overview/route.ts
- src/app/(auth)/sign-in/page.tsx
- src/app/(workspace)/workspace/page.tsx
- src/proxy.ts
- src/middleware.ts (deleted)
- tests/integration/auth/proxy.test.ts
- tests/integration/auth/sign-in-form-flow.test.tsx
- tests/integration/api/workspace-overview-route.test.ts
- tests/e2e/auth.spec.ts

## Senior Developer Review (AI)

### Reviewer

- Reviewer: chuck chuck
- Date: 2026-03-21
- Outcome: Changes requested issues resolved; story is now ready as done.

### Findings Resolved in Review

- Fixed incorrect path claim in File List by using the real workspace route path: `src/app/(workspace)/workspace/page.tsx`.
- Added explicit invalid-credentials integration coverage for sign-in UX behavior and safe error handling in `tests/integration/auth/sign-in-form-flow.test.tsx`.
- Added Safari/WebKit coverage in Playwright config to align with supported browser expectations in `playwright.config.ts`.
- Preserved query parameters in unauthenticated redirect callback URLs in `src/proxy.ts` and added regression coverage in `tests/integration/auth/proxy.test.ts`.

### Validation Evidence

- `npm run lint`
- `npx vitest run tests/integration/auth/proxy.test.ts tests/integration/auth/sign-in-form-flow.test.tsx src/features/auth/sign-in-form.test.ts`

## Change Log

- 2026-03-17: Implemented Story 1.2 auth foundation, sign-in flow, protected route/API/server action authorization, and full validation coverage.
- 2026-03-21: Completed adversarial review fixes for Story 1.2 (File List path correction, invalid-credentials integration test, WebKit browser coverage, callbackUrl query preservation, and proxy regression assertions).
