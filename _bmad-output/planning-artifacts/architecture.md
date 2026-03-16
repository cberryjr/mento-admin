---
stepsCompleted:
  - 1
  - 2
  - 3
  - 4
  - 5
  - 6
  - 7
  - 8
inputDocuments:
  - /Users/serveradmin/workspace/repos/mento-admin/_bmad-output/planning-artifacts/prd.md
  - /Users/serveradmin/workspace/repos/mento-admin/_bmad-output/planning-artifacts/ux-design-specification.md
  - /Users/serveradmin/workspace/repos/mento-admin/_bmad-output/planning-artifacts/product-brief-mento-admin-2026-03-13.md
workflowType: 'architecture'
project_name: 'mento-admin'
user_name: 'chuck chuck'
lastStep: 8
status: 'complete'
completedAt: '2026-03-15 18:03:30 MST'
date: '2026-03-15 17:37:24 MST'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
The product defines 37 functional requirements across seven architectural capability groups: workspace access and navigation, client management, service package management, quote creation and editing, quote revision and lifecycle, invoice generation and management, and workflow continuity/troubleshooting.

Architecturally, these requirements imply a system built around a small number of tightly related business entities with explicit relationships and lifecycle transitions. The core domain is not just CRUD; it includes transformation flows such as generating quotes from reusable service packages, preserving revisions over time, marking quote status changes, converting accepted quotes into invoices, and maintaining traceable lineage across related records. This means the architecture will need clear domain boundaries between reusable source records and generated working records, plus consistent rules for editing, recalculation, persistence, and record linking.

**Non-Functional Requirements:**
The non-functional requirements strongly shape the architecture:

- Performance targets require authenticated pages, saves, quote previews, and quote-to-invoice conversions to complete within 2 seconds for 95% of operations under 1 to 5 concurrent users.
- Security requires authenticated access to protected routes and APIs, blocking unauthorized access attempts, HTTPS in transit, and encryption at rest in production.
- Reliability requires zero silent data-loss defects in tested workflows, preservation of quote/invoice lineage, and explicit success/failure feedback for key actions.
- Accessibility requires WCAG 2.1 AA support for core workflows, including keyboard-only completion of major user tasks.
- Integration requirements are intentionally narrow, with PDF generation required but other external integrations out of scope.

These requirements point to an architecture optimized for correctness, fast interaction loops, trustworthy persistence, and operational clarity rather than large-scale distributed complexity.

**Scale & Complexity:**
This is a medium-complexity project: product scope is intentionally narrow, but the workflow has meaningful domain and interaction complexity because several related records must remain consistent through generation, editing, revision, conversion, and export.

- Primary domain: authenticated full-stack web application for single-studio commercial workflow
- Complexity level: medium
- Estimated architectural components: 9 core components

The complexity is driven less by traffic scale and more by workflow trust, record relationships, revision handling, and UI interaction quality.

### Technical Constraints & Dependencies

Known constraints and dependencies from the loaded documents include:

- Single-studio workspace only for MVP; no multi-tenancy or subscription platform requirements yet
- Desktop-first usage model, optimized for 1280px+ and usable at 768px+
- Supported browser scope is latest Chrome and Safari
- No offline requirement
- No real-time collaboration requirement
- No external accounting, payment, or sync integrations in MVP
- PDF output is required for quote previews and invoices
- Core workflow must distinguish reusable service packages from editable quote and invoice instances
- UX requires guided sequence flows, inline validation, explicit workflow states, linked record visibility, and recoverable error handling

These constraints favor a simpler deployment and runtime model while requiring careful handling of domain logic, UI state, and persistence integrity.

### Cross-Cutting Concerns Identified

The following concerns will affect multiple architectural components:

- Authentication and authorization across protected routes and record APIs
- Data integrity for clients, service packages, quotes, revisions, invoices, and their relationships
- Pricing and totals calculation consistency across quote and invoice editing flows
- Record lifecycle/state management for draft, accepted, invoiced, and revision states
- Revision/version preservation and current-version identification
- PDF generation fidelity and consistency with source records
- Accessibility and keyboard operability for workflow-critical interactions
- Responsive behavior across desktop, tablet, and mobile-safe fallback layouts
- Explicit user feedback for save, conversion, preview, export, and error states
- Traceability and troubleshooting support across connected commercial records

## Starter Template Evaluation

### Primary Technology Domain

Full-stack web application based on project requirements analysis

### Starter Options Considered

**1. Official Next.js starter via `create-next-app`**
- Verified current version: `create-next-app 16.1.6` and `Next.js 16.1.6`
- Officially maintained by the Next.js team
- Current defaults include TypeScript, Tailwind CSS, ESLint, App Router, and Turbopack
- Best aligned with a Vercel-first deployment path and a narrow MVP that still needs strong UI and server-side workflow support
- Leaves room to add the exact database, auth, analytics, email, PDF, and testing choices deliberately in later architecture decisions

**2. Create T3 App via `create-t3-app`**
- Verified current version: `create-t3-app 7.40.0`
- Maintained and still actively documented
- Strong option for a type-safe full-stack architecture with optional tRPC, Drizzle or Prisma, auth, and Tailwind
- Good fit when the team already wants a more opinionated full-stack convention set from day one
- Slightly heavier than needed for this MVP because it front-loads more architectural decisions than the current scope requires

**3. Supabase Next.js starter**
- Current Supabase quickstart still uses `create-next-app` with the `with-supabase` example
- Includes a useful auth-ready and TypeScript-ready starting point
- Less aligned with the chosen infrastructure direction because it couples the project to Supabase auth and database conventions instead of a Vercel-managed Postgres baseline
- Better fit if Supabase were already the preferred backend platform

### Selected Starter: Official Next.js starter with `create-next-app`

**Rationale for Selection:**
This starter is the best fit for mento-admin because it aligns with the chosen technical preferences while keeping the foundation current, official, and flexible. The product needs a desktop-first, full-stack workflow application with rich forms, accessible interactions, PDF generation, and reliable server-backed business logic, but it does not yet need a heavily opinionated SaaS starter or extra platform abstractions.

Using the official Next.js starter gives us a clean baseline for Vercel deployment, App Router conventions, server and client component boundaries, and modern TypeScript development, while allowing us to add PostgreSQL access, authentication, analytics, email, PDF generation, and testing in a deliberate architecture-first way.

**Initialization Command:**

```bash
npx create-next-app@latest mento-admin --ts --eslint --tailwind --app --src-dir --import-alias "@/*" --use-npm
```

**Architectural Decisions Provided by Starter:**

**Language & Runtime:**
TypeScript-first Next.js application on the current Next.js runtime, with Node.js 20.9+ required by the official tooling.

**Styling Solution:**
Tailwind CSS included by default, which gives a practical base for a Geist-inspired design system and later component work such as shadcn/ui-style patterns if desired.

**Build Tooling:**
Official Next.js build pipeline with App Router support and Turbopack-enabled local development defaults.

**Testing Framework:**
No full testing stack is included by default. This keeps the starter lightweight, but means test tooling should be added intentionally in later architectural decisions or early implementation stories.

**Code Organization:**
App Router project structure with a `src/` directory and import alias support. This establishes file-system routing, modern layout conventions, and a clean path alias baseline for shared modules.

**Development Experience:**
Built-in hot reload, TypeScript support, ESLint, modern dev server behavior, and strong ecosystem compatibility with Vercel-hosted deployment patterns.

**Note:** Project initialization using this command should be the first implementation story.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Database access layer: `Drizzle ORM 0.45.1`
- Migration tooling: `Drizzle Kit 0.31.9`
- Validation strategy: `Zod 4.3.6` at server action and route boundaries
- Authentication approach: `Auth.js / next-auth 4.24.13` with `@auth/core 0.34.3`
- API interaction pattern: Next.js `Server Actions + Route Handlers`
- Authorization model: simple single-studio RBAC
- Deployment baseline: `Vercel` with managed PostgreSQL

**Important Decisions (Shape Architecture):**
- Frontend state model: server-first rendering, local component state, targeted `Zustand 5.0.11` only for quote-editor workflow state
- Monitoring and error tracking: `@sentry/nextjs 10.43.0`
- Email delivery: `Resend 6.9.3`
- CI/CD baseline: `GitHub Actions` plus Vercel preview and production deployments
- Analytics strategy: app-owned event logging for KPI and workflow metrics
- Caching strategy: minimal caching first, with explicit invalidation only where safe

**Deferred Decisions (Post-MVP):**
- External product analytics platform such as PostHog, deferred because MVP KPI tracking can be handled by app-owned events
- Redis or distributed caching, deferred because correctness and traceability are more important than aggressive optimization in Phase 1
- Fine-grained multi-role permissions, deferred because MVP scope is single-studio and can start with a simple owner/admin model
- Public API standardization or broader service-to-service communication patterns, deferred because MVP is a single Next.js application boundary

### Data Architecture

The application will use PostgreSQL as the system of record with a normalized relational schema tailored to the commercial workflow domain.

**Decisions:**
- Database: managed PostgreSQL
- ORM and schema layer: `Drizzle ORM 0.45.1`
- Migration tooling: `Drizzle Kit 0.31.9`
- Validation layer: `Zod 4.3.6`
- Modeling approach: normalized relational schema with explicit foreign keys and lifecycle fields
- Caching: minimal caching first, preferring fresh reads for trust-sensitive workflow data

**Rationale:**
This domain depends on explicit relationships among clients, service packages, quotes, revisions, invoices, and event records. A relational schema best supports lineage, revision tracking, financial totals, and auditability. Drizzle is selected because it keeps SQL and schema intent visible, fits a TypeScript-first architecture, and avoids unnecessary abstraction for a workflow-centric MVP. Zod complements this by enforcing request and mutation validation at application boundaries.

**Primary modeled entities:**
- Studio user
- Client
- Service package
- Service package section
- Service package line item
- Quote
- Quote section
- Quote line item
- Quote revision metadata
- Invoice
- Workflow event / audit event

**Migration strategy:**
Schema changes are managed through Drizzle Kit migrations and applied through controlled deployment workflows. Database constraints remain authoritative for integrity, while application validation prevents invalid input from reaching persistence boundaries.

### Authentication & Security

The application will use `Auth.js / next-auth 4.24.13` as the authentication framework, with a simple single-studio RBAC model for MVP access control.

**Decisions:**
- Authentication framework: `next-auth 4.24.13` with `@auth/core 0.34.3`
- Authorization model: simple single-studio RBAC
- Session strategy: authenticated session-based access for protected routes and actions
- Protected surface: all workspace routes, record APIs, server actions, exports, and workflow mutations
- Encryption and transport: HTTPS in transit and encrypted managed database storage in production

**Rationale:**
The product is an authenticated internal workflow application, not a public SaaS platform. Auth.js fits the Next.js ecosystem well and supports the needed flexibility without introducing heavy vendor dependence. A simple owner/admin-style RBAC model matches MVP scope while leaving room for future team-role expansion.

**Security patterns:**
- Deny-by-default protection for workspace routes and server-side mutations
- Studio-scoped authorization checks in all record access paths
- Server-side enforcement for quote acceptance, invoice conversion, and export actions
- No trust in client-side role or status assertions
- Explicit success and failure messaging for protected actions

### API & Communication Patterns

The application will use Next.js App Router-native communication patterns, centered on server actions for authenticated mutations and route handlers for explicit HTTP endpoints.

**Decisions:**
- Primary mutation pattern: server actions
- HTTP/API boundary: route handlers
- Validation boundary: Zod schemas at every action and route input
- Error handling: structured domain-safe errors with user-friendly UI messaging
- Rate limiting: lightweight rate limiting only on externally callable endpoints in MVP
- Service communication: in-process application modules, not separate services

**Rationale:**
This is a single-app MVP with tightly coupled workflow logic. Server actions reduce ceremony for authenticated mutations and fit form-heavy guided workflows well. Route handlers remain appropriate for PDF export endpoints, auth callbacks, webhooks, and any explicit HTTP integrations. This approach preserves a clean internal architecture without prematurely introducing a separate API platform layer.

**Error handling standards:**
- Domain validation errors returned in a field-aware format for inline correction
- Operational failures logged server-side and surfaced with safe user feedback
- Conversion, save, preview, and export flows must always produce explicit success/failure outcomes

### Frontend Architecture

The frontend will follow a server-first App Router architecture with local component state by default and targeted client-side workflow state only where interaction complexity demands it.

**Decisions:**
- Rendering model: server-first with client components only where interactivity requires them
- State strategy: local component state by default
- Workflow store: targeted `Zustand 5.0.11` for quote editor and similar complex staged interactions
- Data fetching model: server-rendered reads where practical, with client fetches only where interaction needs them
- Form and validation model: server-backed forms with inline validation feedback
- Styling foundation: starter-provided Tailwind CSS, extended into a Geist-inspired design system direction

**Rationale:**
Most of the application is structured workflow UI, record views, and forms. A server-first architecture keeps data access and security boundaries clear. The quote editor is the one place likely to justify a scoped client-side workflow store because it includes staged editing, totals recalculation, readiness checks, and local continuity concerns. Avoiding a broad global store keeps the system simpler and easier for AI agents to implement consistently.

**Performance approach:**
- Optimize the quote builder and preview path first
- Prefer smaller client bundles by keeping non-interactive views server-rendered
- Defer broad client caching until concrete hotspots appear
- Preserve accessibility and correctness ahead of aggressive optimization

### Infrastructure & Deployment

The MVP infrastructure will be optimized for a small, fast-moving team with straightforward operational complexity.

**Decisions:**
- Hosting: `Vercel`
- Database: managed PostgreSQL
- CI/CD: `GitHub Actions` plus Vercel preview/production deployment flow
- Error monitoring: `@sentry/nextjs 10.43.0`
- Email service: `Resend 6.9.3`
- Analytics: app-owned workflow event logging
- Environment configuration: environment-variable-driven configuration across local, preview, and production environments

**Rationale:**
This stack matches the selected starter and deployment preferences while keeping operations simple. Vercel aligns naturally with Next.js App Router. GitHub Actions provides a clear quality gate for linting, type checks, tests, and build verification. Sentry covers production error visibility, while Resend provides a clean email path without overcomplicating the app’s runtime design. App-owned event logging supports KPI measurement directly against domain workflows, which is more valuable than pageview analytics for this product.

**Environment categories:**
- Local development
- Preview / branch environments
- Production

**Operational priorities:**
- reliable schema migration execution
- safe environment secret handling
- explicit deployment verification
- visibility into user-facing workflow failures

### Decision Impact Analysis

**Implementation Sequence:**
1. Initialize the Next.js foundation from the selected starter
2. Configure environment handling and deployment targets
3. Establish PostgreSQL connection, Drizzle schema layout, and migration workflow
4. Implement authentication and protected application shell
5. Define core domain schema for clients, service packages, quotes, revisions, invoices, and workflow events
6. Build server action and route handler conventions with Zod validation
7. Implement the quote workflow UI with server-first rendering and targeted Zustand only where required
8. Add PDF export, email delivery hooks, and workflow event logging
9. Add CI/CD checks, Sentry instrumentation, and production hardening

**Cross-Component Dependencies:**
- Authentication and authorization decisions affect all data access and workflow routes
- Data model decisions affect quote generation, revision tracking, invoice conversion, analytics, and troubleshooting views
- Server action patterns depend on Zod validation and authenticated session handling
- Frontend workflow state depends on how quote editing and totals recalculation are modeled in the domain layer
- Event logging depends on stable domain events from save, preview, accept, convert, and export flows
- Monitoring and deployment quality depend on clear server/client boundaries and explicit error handling conventions

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:**
15 areas where AI agents could make different choices across naming, project organization, API contracts, event semantics, and async UX behavior.

### Naming Patterns

**Database Naming Conventions:**
- PostgreSQL tables use plural snake_case nouns: `clients`, `service_packages`, `quotes`, `quote_revisions`, `workflow_events`
- Columns use snake_case: `created_at`, `updated_at`, `client_id`, `quote_id`
- Primary keys use `id`; foreign keys use singular entity name plus `_id`
- Indexes use `idx_<table>_<column>` and unique indexes use `uq_<table>_<column>`
- Database naming stays in the persistence layer; do not leak snake_case into application models unless a library boundary requires it

**API Naming Conventions:**
- Route segments use lowercase kebab-case and plural resource names: `/api/quotes`, `/api/service-packages/[packageId]`
- Dynamic params use camelCase names in code: `params.quoteId`
- Query parameters use camelCase: `clientId`, `includeArchived`, `createdAfter`
- Mutation names use verb-first camelCase: `createQuote`, `updateInvoiceStatus`, `convertQuoteToInvoice`

**Code Naming Conventions:**
- React components, TypeScript types, and Zod schemas use PascalCase: `QuoteEditor`, `InvoiceSummary`, `CreateQuoteInputSchema`
- Functions, variables, hooks, and selectors use camelCase: `calculateQuoteTotals`, `useQuoteDraft`, `selectInvoiceStatus`
- Filenames use kebab-case: `quote-editor.tsx`, `invoice-summary.tsx`, `create-quote.ts`
- Avoid mixed naming inside one layer; translate once at the boundary and stay consistent inside that layer

### Structure Patterns

**Project Organization:**
- Organize application code by feature/domain first
- Keep route wiring in `src/app`, reusable feature logic in feature folders, shared primitives in clearly shared locations
- Co-locate unit and component tests with source as `*.test.ts` or `*.test.tsx`
- Keep broader end-to-end or workflow tests in top-level `tests/`
- Shared code belongs in a dedicated shared module only when at least two features depend on it

**File Structure Patterns:**
- Static assets live in `public/`
- Environment parsing and config access are centralized rather than read ad hoc across the app
- Server-only modules are separated from client-safe modules
- Documentation stays in `docs/` or BMAD output locations, not mixed into runtime source folders
- Do not create generic dumping grounds like `helpers.ts` or `misc.ts` when feature-local placement is clearer

### Format Patterns

**API Response Formats:**
- Route handlers return a discriminated envelope:
  - success: `{ ok: true, data, meta? }`
  - failure: `{ ok: false, error: { code, message, fieldErrors? } }`
- Server actions follow the same logical success/error contract even when no HTTP response object is involved
- Status code usage is consistent: `200/201` success, `400` validation, `401` unauthenticated, `403` unauthorized, `404` not found, `409` conflict, `500` unexpected failure

**Data Exchange Formats:**
- JSON fields use camelCase
- Dates and times are serialized as ISO 8601 strings
- Boolean values remain `true` and `false`, never `1` and `0`
- Optional values are omitted unless `null` is semantically meaningful
- Single resources are returned as objects, not single-item arrays

### Communication Patterns

**Event System Patterns:**
- Domain and workflow events use lowercase dot.case names: `quote.created`, `quote.accepted`, `invoice.generated`
- Event payloads include a stable baseline: `eventName`, `occurredAt`, `actorUserId`, `entityType`, `entityId`, `metadata`
- Add `eventVersion` only when payload compatibility must be managed explicitly
- Emit audit or analytics events only after the underlying write succeeds

**State Management Patterns:**
- Default to local component state; use Zustand only for complex workflow state such as quote editing drafts
- Use immutable state updates
- Name actions with verb-first camelCase: `setActiveSection`, `recalculateTotals`, `submitQuote`
- Use narrow selectors or selector hooks rather than broad state reads

### Process Patterns

**Error Handling Patterns:**
- Validate external input at the boundary with Zod, then enforce domain invariants on the server
- Separate user-correctable validation errors from operational failures
- Never expose raw provider, database, or stack errors directly to the UI
- Log structured server-side errors with enough context to trace the workflow that failed
- Protected routes and mutations perform authentication and authorization checks before domain work begins

**Loading State Patterns:**
- Use explicit local async flags such as `isLoading`, `isSaving`, `isSubmitting`, and `isGeneratingPdf`
- Scope loading UI to the affected action or surface whenever possible
- Disable repeat submissions while a mutation is in flight
- Automatic retry is allowed for safe reads only; writes require explicit user retry
- Every save, convert, preview, and export path must end with a clear success or failure state

### Enforcement Guidelines

**All AI Agents MUST:**
- keep PostgreSQL naming in snake_case and application-facing naming in camelCase
- follow feature-first placement, colocated tests, and centralized shared-module rules
- use the standard ok/error contract, ISO date serialization, dot.case events, and explicit local async state naming

**Pattern Enforcement:**
- Check naming, placement, and response contracts during review before merging
- Treat intentional deviations as explicit architecture exceptions and document them in `architecture.md`
- Update this patterns section before adopting a new cross-cutting convention

### Pattern Examples

**Good Examples:**
- `quote_revisions` table with columns like `quote_id` and `created_at`
- `src/app/api/quotes/[quoteId]/route.ts` reading `params.quoteId`
- `src/features/quotes/server/create-quote.ts` returning `{ ok: true, data: { quoteId, createdAt, status } }`
- Event payload with `eventName: "quote.accepted"` and ISO timestamp fields
- `quote-editor.tsx` exporting `QuoteEditor`

**Anti-Patterns:**
- Mixing `quote_id`, `quoteId`, and `QuoteID` inside the same application layer
- Creating generic folders or files like `utils/helpers.ts` for unrelated domain logic
- Returning raw thrown errors or inconsistent JSON shapes across endpoints
- Using `QuoteAccepted` in one module and `quote.accepted` in another
- Automatically retrying write-heavy actions like quote save or invoice conversion

## Project Structure & Boundaries

### Complete Project Directory Structure

```text
mento-admin/
├── .env.example
├── .github/
│   └── workflows/
│       └── ci.yml
├── .gitignore
├── README.md
├── drizzle.config.ts
├── eslint.config.mjs
├── instrumentation.ts
├── next.config.ts
├── package-lock.json
├── package.json
├── postcss.config.mjs
├── sentry.client.config.ts
├── sentry.server.config.ts
├── tsconfig.json
├── drizzle/
│   └── migrations/
├── docs/
├── public/
│   ├── icons/
│   ├── images/
│   └── pdf/
├── tests/
│   ├── e2e/
│   │   ├── accessibility.spec.ts
│   │   ├── auth.spec.ts
│   │   ├── clients.spec.ts
│   │   ├── invoice-conversion.spec.ts
│   │   └── quotes.spec.ts
│   ├── fixtures/
│   ├── helpers/
│   └── integration/
│       ├── api/
│       ├── db/
│       └── pdf/
└── src/
    ├── app/
    │   ├── (auth)/
    │   │   └── sign-in/
    │   │       └── page.tsx
    │   ├── (workspace)/
    │   │   ├── clients/
    │   │   │   ├── [clientId]/
    │   │   │   │   └── page.tsx
    │   │   │   ├── new/
    │   │   │   │   └── page.tsx
    │   │   │   └── page.tsx
    │   │   ├── invoices/
    │   │   │   ├── [invoiceId]/
    │   │   │   │   └── page.tsx
    │   │   │   └── page.tsx
    │   │   ├── quotes/
    │   │   │   ├── [quoteId]/
    │   │   │   │   ├── invoice/
    │   │   │   │   │   └── page.tsx
    │   │   │   │   ├── preview/
    │   │   │   │   │   └── page.tsx
    │   │   │   │   ├── revisions/
    │   │   │   │   │   └── page.tsx
    │   │   │   │   └── page.tsx
    │   │   │   ├── new/
    │   │   │   │   └── page.tsx
    │   │   │   └── page.tsx
    │   │   ├── service-packages/
    │   │   │   ├── [servicePackageId]/
    │   │   │   │   └── page.tsx
    │   │   │   ├── new/
    │   │   │   │   └── page.tsx
    │   │   │   └── page.tsx
    │   │   ├── settings/
    │   │   │   └── page.tsx
    │   │   ├── layout.tsx
    │   │   └── page.tsx
    │   ├── api/
    │   │   ├── auth/
    │   │   │   └── [...nextauth]/
    │   │   │       └── route.ts
    │   │   ├── health/
    │   │   │   └── route.ts
    │   │   ├── invoices/
    │   │   │   └── [invoiceId]/
    │   │   │       └── pdf/
    │   │   │           └── route.ts
    │   │   └── quotes/
    │   │       └── [quoteId]/
    │   │           ├── pdf/
    │   │           │   └── route.ts
    │   │           └── preview/
    │   │               └── route.ts
    │   ├── globals.css
    │   ├── layout.tsx
    │   └── not-found.tsx
    ├── components/
    │   ├── app-shell/
    │   │   ├── record-status-badge.tsx
    │   │   ├── workspace-header.tsx
    │   │   └── workspace-nav.tsx
    │   ├── feedback/
    │   │   ├── empty-state.tsx
    │   │   ├── inline-alert.tsx
    │   │   └── loading-block.tsx
    │   └── ui/
    │       ├── button.tsx
    │       ├── card.tsx
    │       ├── dialog.tsx
    │       ├── input.tsx
    │       ├── select.tsx
    │       ├── table.tsx
    │       └── toast.tsx
    ├── features/
    │   ├── auth/
    │   │   ├── auth-options.ts
    │   │   ├── require-session.ts
    │   │   └── session.ts
    │   ├── clients/
    │   │   ├── client-form.test.tsx
    │   │   ├── components/
    │   │   │   ├── client-form.tsx
    │   │   │   ├── client-list.tsx
    │   │   │   └── client-record-summary.tsx
    │   │   ├── schemas/
    │   │   │   └── client-schema.ts
    │   │   └── server/
    │   │       ├── actions/
    │   │       │   ├── create-client.ts
    │   │       │   └── update-client.ts
    │   │       ├── mappers.ts
    │   │       └── queries/
    │   │           ├── get-client.ts
    │   │           └── list-clients.ts
    │   ├── invoices/
    │   │   ├── components/
    │   │   │   ├── conversion-review-panel.tsx
    │   │   │   ├── invoice-form.tsx
    │   │   │   ├── invoice-preview.tsx
    │   │   │   └── payment-instructions-card.tsx
    │   │   ├── invoice-form.test.tsx
    │   │   ├── schemas/
    │   │   │   ├── create-invoice-schema.ts
    │   │   │   └── update-invoice-schema.ts
    │   │   └── server/
    │   │       ├── actions/
    │   │       │   ├── create-invoice-from-quote.ts
    │   │       │   └── update-invoice.ts
    │   │       ├── calculators/
    │   │       │   └── invoice-totals.ts
    │   │       ├── mappers.ts
    │   │       └── queries/
    │   │           ├── get-invoice.ts
    │   │           └── list-invoices.ts
    │   ├── pdf/
    │   │   ├── invoice-pdf.tsx
    │   │   ├── pdf-renderer.ts
    │   │   └── quote-pdf.tsx
    │   ├── quotes/
    │   │   ├── components/
    │   │   │   ├── guided-flow-header.tsx
    │   │   │   ├── preview-readiness-panel.tsx
    │   │   │   ├── quote-preview.tsx
    │   │   │   ├── quote-status-chip.tsx
    │   │   │   ├── quote-structure-editor.tsx
    │   │   │   ├── revision-timeline.tsx
    │   │   │   └── totals-summary.tsx
    │   │   ├── quote-structure-editor.test.tsx
    │   │   ├── schemas/
    │   │   │   ├── create-quote-schema.ts
    │   │   │   ├── quote-preview-schema.ts
    │   │   │   └── revise-quote-schema.ts
    │   │   ├── server/
    │   │   │   ├── actions/
    │   │   │   │   ├── convert-quote-to-invoice.ts
    │   │   │   │   ├── create-quote.ts
    │   │   │   │   ├── mark-quote-accepted.ts
    │   │   │   │   ├── revise-quote.ts
    │   │   │   │   └── save-quote-draft.ts
    │   │   │   ├── calculators/
    │   │   │   │   └── quote-totals.ts
    │   │   │   ├── mappers.ts
    │   │   │   ├── queries/
    │   │   │   │   ├── get-quote.ts
    │   │   │   │   ├── get-quote-preview.ts
    │   │   │   │   ├── list-quote-revisions.ts
    │   │   │   │   └── list-quotes.ts
    │   │   │   └── serializers/
    │   │   │       └── quote-preview-payload.ts
    │   │   └── store/
    │   │       └── quote-draft-store.ts
    │   ├── record-history/
    │   │   ├── components/
    │   │   │   └── connected-record-history.tsx
    │   │   └── server/
    │   │       └── queries/
    │   │           └── get-record-history.ts
    │   ├── service-packages/
    │   │   ├── components/
    │   │   │   ├── service-package-form.tsx
    │   │   │   ├── service-package-list.tsx
    │   │   │   └── service-package-picker.tsx
    │   │   ├── schemas/
    │   │   │   └── service-package-schema.ts
    │   │   ├── server/
    │   │   │   ├── actions/
    │   │   │   ├── mappers.ts
    │   │   │   └── queries/
    │   │   └── service-package-form.test.tsx
    │   └── studio-defaults/
    │       ├── components/
    │       │   └── studio-defaults-form.tsx
    │       ├── schemas/
    │       │   └── studio-defaults-schema.ts
    │       └── server/
    │           ├── actions/
    │           │   └── update-studio-defaults.ts
    │           └── queries/
    │               └── get-studio-defaults.ts
    ├── lib/
    │   ├── env.ts
    │   ├── errors/
    │   │   ├── app-error.ts
    │   │   └── error-codes.ts
    │   ├── format/
    │   │   ├── currency.ts
    │   │   └── dates.ts
    │   ├── utils/
    │   │   └── cn.ts
    │   └── validation/
    │       └── action-result.ts
    ├── server/
    │   ├── analytics/
    │   │   ├── log-workflow-event.ts
    │   │   └── workflow-event-schema.ts
    │   ├── auth/
    │   │   ├── auth.ts
    │   │   └── permissions.ts
    │   ├── db/
    │   │   ├── client.ts
    │   │   ├── index.ts
    │   │   └── schema/
    │   │       ├── clients.ts
    │   │       ├── invoices.ts
    │   │       ├── quote-revisions.ts
    │   │       ├── quotes.ts
    │   │       ├── service-packages.ts
    │   │       ├── studio-defaults.ts
    │   │       ├── users.ts
    │   │       └── workflow-events.ts
    │   ├── email/
    │   │   └── resend.ts
    │   ├── monitoring/
    │   │   └── sentry.ts
    │   └── pdf/
    │       └── render-pdf.ts
    ├── styles/
    │   └── tokens.css
    └── middleware.ts
```

### Architectural Boundaries

**API Boundaries:**
- `src/app/(workspace)` contains authenticated UI routes only; mutations happen through feature-local server actions
- `src/app/api` is reserved for HTTP-specific boundaries: Auth.js callbacks, PDF generation, preview rendering, and operational health checks
- `src/middleware.ts` protects workspace routes before page rendering
- Database access is never called directly from route components; it is mediated through `src/features/*/server` and `src/server/db`

**Component Boundaries:**
- `src/components/ui` contains shared design-system primitives only
- `src/components/app-shell` contains reusable shell and navigation chrome
- `src/features/*/components` contains feature-owned UI that should not be imported cross-feature unless it is promoted intentionally
- Zustand is isolated to `src/features/quotes/store` because quote drafting is the only approved complex client workflow state

**Service Boundaries:**
- Feature-specific business logic lives in `src/features/*/server`
- Cross-cutting infrastructure lives in `src/server/*` for auth, db, analytics, monitoring, email, and PDF rendering
- Shared formatting, error contracts, and validation helpers live in `src/lib/*`
- Quote-to-invoice conversion crosses feature boundaries through an explicit quote action that creates invoice records, rather than direct UI-layer mutation

**Data Boundaries:**
- Drizzle schema files in `src/server/db/schema` are the source of truth for persistence modeling
- Database naming remains snake_case in schema and SQL-facing code; application-facing models and payloads remain camelCase
- Revision and workflow-event data are separate persistence concerns, not embedded ad hoc inside quote or invoice UI state
- PDF and preview routes read from persisted records and serializers rather than raw client draft state

### Requirements to Structure Mapping

**Feature/Epic Mapping:**
- Workspace & Record Access (`FR1-FR4`) -> `src/app/(workspace)`, `src/components/app-shell`, `src/features/auth`, `src/features/studio-defaults`
- Client Management (`FR5-FR8`) -> `src/features/clients`, `src/app/(workspace)/clients`
- Service Package Library (`FR9-FR13`) -> `src/features/service-packages`, `src/app/(workspace)/service-packages`
- Quote Creation & Editing (`FR14-FR21`) -> `src/features/quotes`, `src/app/(workspace)/quotes`, `src/app/api/quotes/[quoteId]/preview`
- Quote Revision & Lifecycle (`FR22-FR27`) -> `src/features/quotes/server/actions`, `src/features/quotes/components/revision-timeline.tsx`, `src/app/(workspace)/quotes/[quoteId]/revisions`
- Invoice Generation & Management (`FR28-FR33`) -> `src/features/invoices`, `src/app/(workspace)/invoices`, `src/app/api/invoices/[invoiceId]/pdf`
- Workflow Continuity & Troubleshooting (`FR34-FR37`) -> `src/features/record-history`, `src/server/analytics`, `src/server/db/schema/workflow-events.ts`

**Cross-Cutting Concerns:**
- Authentication and authorization -> `src/features/auth`, `src/server/auth`, `src/middleware.ts`, `src/app/api/auth`
- Validation and action contracts -> `src/features/*/schemas`, `src/lib/validation`, feature server actions
- Monitoring and operational error visibility -> `src/server/monitoring`, Sentry config files, CI pipeline
- PDF generation -> `src/features/pdf`, `src/server/pdf`, PDF route handlers
- Studio defaults and shared commercial settings -> `src/features/studio-defaults`, `src/server/db/schema/studio-defaults.ts`

### Integration Points

**Internal Communication:**
- UI routes compose feature components and call feature-local server actions
- Feature server actions validate with Zod, enforce auth, call queries/calculators/mappers, persist through Drizzle, then return the standard result envelope
- Shared app-shell components reflect workflow state but do not own domain mutations
- Record history and analytics read workflow events and related records without duplicating quote or invoice domain logic

**External Integrations:**
- Auth.js handles authentication callbacks through `src/app/api/auth/[...nextauth]/route.ts`
- Vercel-managed PostgreSQL connects through `src/server/db`
- Resend integration is isolated in `src/server/email/resend.ts`
- Sentry instrumentation is isolated in root config plus `src/server/monitoring/sentry.ts`

**Data Flow:**
- Form input -> feature schema validation -> server action -> Drizzle persistence -> workflow event logging -> revalidation/refresh -> UI success or failure state
- Quote preview -> persisted quote query -> preview serializer -> preview route/page render
- Quote conversion -> accepted quote read -> invoice creation action -> linked invoice persistence -> continuity views update

### File Organization Patterns

**Configuration Files:**
- Root files define build, lint, TypeScript, Sentry, Drizzle, and CI behavior
- Environment variables are documented in `.env.example` and consumed through `src/lib/env.ts`
- Infrastructure-specific config remains at root, not scattered through feature folders

**Source Organization:**
- App Router files describe navigation and composition
- Domain features own their components, schemas, tests, actions, queries, and mappers
- Cross-feature infrastructure remains in `src/server`; cross-feature helpers remain in `src/lib`
- Shared design primitives stay separate from feature-specific workflow UI

**Test Organization:**
- Unit and component tests stay co-located with feature code
- Integration tests stay in `tests/integration` for database, PDF, and API boundary coverage
- End-to-end flows stay in `tests/e2e` for auth, quote creation, revision, invoice conversion, and accessibility smoke coverage

**Asset Organization:**
- Static UI assets remain in `public/icons` and `public/images`
- Generated or template PDF assets live under `public/pdf` only when they are static; runtime PDF rendering stays in code
- No feature should hide static assets in arbitrary source folders

### Development Workflow Integration

**Development Server Structure:**
- `src/app` provides route composition, while features remain independently implementable for parallel AI agent work
- The quote workflow can be developed largely inside `src/features/quotes` with stable contracts to clients, service packages, invoices, and record history
- Shared shell, auth, db, and result-envelope contracts reduce merge conflicts across agents

**Build Process Structure:**
- CI validates lint, type safety, unit tests, integration tests, and targeted e2e flows before deployment
- Drizzle migrations run as explicit deployment steps, separate from UI builds
- Sentry and env validation hook into build and runtime startup paths

**Deployment Structure:**
- Vercel preview and production deployments use the same source tree with environment-specific config values
- PostgreSQL migrations and secret-backed services are environment-aware but structurally identical across local, preview, and production
- Health, auth, preview, and PDF route handlers give deployment-specific operations clear boundaries

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
The architecture is coherent end to end. The selected foundation of Next.js App Router, TypeScript, Tailwind CSS, Drizzle ORM, Zod, Auth.js, Vercel-managed PostgreSQL, Sentry, Resend, React PDF, and a Vitest/RTL/Playwright test stack works together without any obvious platform conflicts for the MVP scope. The credentials-based Auth.js choice is compatible with a single-studio internal application, while React PDF fits the requirement for deterministic quote and invoice export. The testing stack supports unit, component, integration, accessibility, and core workflow validation in ways that map directly to the PRD's reliability and speed goals.

**Pattern Consistency:**
The implementation patterns reinforce the core architectural decisions instead of fighting them. Snake_case persistence plus camelCase application models aligns cleanly with Drizzle and TypeScript. Feature-first structure with co-located tests supports the chosen App Router plus server-action architecture. The ok/error response contract, dot.case event naming, and explicit local async state rules all fit the workflow-heavy nature of the product and reduce ambiguity for parallel AI implementation.

**Structure Alignment:**
The project structure supports the architectural decisions well. Shared infrastructure is isolated in `src/server` and `src/lib`, while feature logic remains in feature-owned directories that map directly to the product domains. The boundaries around auth, database access, PDF generation, record history, and quote-local Zustand state are clear and consistent with the chosen patterns. The structure is specific enough to guide implementation without forcing premature service decomposition.

### Requirements Coverage Validation ✅

**Epic/Feature Coverage:**
All major feature areas in the PRD are represented architecturally: workspace access, studio defaults, client management, service package management, quote creation, quote revision, invoice generation, and workflow continuity. The structure also supports the UX-defined hero workflow around staged quote building, preview validation, revision continuity, and quote-to-invoice follow-through.

**Functional Requirements Coverage:**
All functional requirement groups are architecturally supported:
- `FR1-FR4` through authenticated workspace routes, app-shell structure, and studio-defaults modules
- `FR5-FR8` through client feature routes, forms, queries, and linked-record summaries
- `FR9-FR13` through service-package modules and selection components
- `FR14-FR21` through quote generation, editing, preview, and draft-saving boundaries
- `FR22-FR27` through revision handling, lifecycle actions, status display, and history components
- `FR28-FR33` through invoice conversion, invoice editing, client-facing invoice views, and linked record persistence
- `FR34-FR37` through record-history queries, workflow events, and connected commercial record tracing

**Non-Functional Requirements Coverage:**
The architecture addresses the NFR set credibly:
- Performance is supported by server-first rendering, narrow MVP scope, minimal caching, and Vercel/Postgres deployment simplicity
- Security is covered by Auth.js credentials auth, route protection, deny-by-default server checks, HTTPS, and encrypted managed storage assumptions
- Reliability is supported through Drizzle-backed persistence, explicit workflow-event tracking, quote/invoice lineage modeling, and standardized success/failure contracts
- Accessibility is covered by the UX constraints plus Playwright and keyboard-driven validation expectations
- Integration needs are covered by explicit PDF rendering architecture and narrow external dependency boundaries

### Implementation Readiness Validation ✅

**Decision Completeness:**
The architecture now documents the major implementation-defining choices with enough specificity for agent consistency. Critical decisions are versioned where relevant, and the previously open gaps are now resolved with explicit standards for credentials auth, React PDF, and `Vitest + React Testing Library + Playwright`.

**Structure Completeness:**
The project tree is concrete rather than generic. It defines route locations, feature ownership, shared infrastructure areas, test placement, PDF boundaries, and schema ownership. AI agents have clear physical boundaries for where to add code and how related modules should communicate.

**Pattern Completeness:**
The most common conflict points are covered: naming, route and file organization, response shapes, event conventions, state handling, error handling, and loading behavior. The patterns are concrete enough to prevent common cross-agent inconsistencies while still leaving room for implementation inside the approved boundaries.

### Gap Analysis Results

**Critical Gaps:**
- None remaining

**Important Gaps:**
- No implementation-blocking gaps remain after standardizing auth, PDF generation, and testing
- Operational policies such as backup cadence, database restore rehearsal, and production alert routing are still worth documenting later, but they do not block MVP implementation

**Nice-to-Have Gaps:**
- A future analytics event taxonomy document would help reporting consistency
- A seed-data or demo-data strategy would improve local development and QA speed
- A short ADR for credential bootstrap and owner-account provisioning could further reduce ambiguity

### Validation Issues Addressed

The following readiness issues were identified and resolved during validation:
- Authentication method standardized to Auth.js credentials-based login for a single-studio owner/admin workflow
- PDF generation standardized to React PDF for deterministic quote and invoice output
- Test strategy standardized to `Vitest + React Testing Library + Playwright` for unit, component, and end-to-end validation

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**✅ Architectural Decisions**
- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed

**✅ Implementation Patterns**
- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented

**✅ Project Structure**
- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** high

**Key Strengths:**
- The stack is intentionally narrow and internally consistent for a single-studio MVP
- The quote-first workflow is deeply reflected in both feature boundaries and UX-driven structure
- The naming, format, communication, and process rules are explicit enough to reduce agent drift
- Record lineage, preview/export, revision continuity, and testing strategy are all aligned with the trust-heavy product requirements

**Areas for Future Enhancement:**
- Document owner-account bootstrap and long-term credential recovery policy
- Expand analytics event taxonomy once KPI reporting becomes more detailed
- Revisit broader RBAC and background-job patterns if the product grows beyond the MVP's single-studio operational model

### Implementation Handoff

**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented
- Use implementation patterns consistently across all components
- Respect project structure and boundaries
- Refer to this document for all architectural questions

**First Implementation Priority:**
Initialize the project with the approved starter command, then add the baseline infrastructure for Drizzle, Auth.js credentials auth, environment validation, and the test stack before implementing product features.

```bash
npx create-next-app@latest mento-admin --ts --eslint --tailwind --app --src-dir --import-alias "@/*" --use-npm
```
