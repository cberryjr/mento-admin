---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
inputDocuments:
  - /Users/serveradmin/workspace/repos/mento-admin/_bmad-output/planning-artifacts/prd.md
  - /Users/serveradmin/workspace/repos/mento-admin/_bmad-output/planning-artifacts/architecture.md
  - /Users/serveradmin/workspace/repos/mento-admin/_bmad-output/planning-artifacts/ux-design-specification.md
---

# mento-admin - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for mento-admin, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: Authorized studio user can access a single-studio workspace for managing the commercial workflow.
FR2: Authorized studio user can navigate between clients, service packages, quotes, and invoices within the workspace.
FR3: Authorized studio user can browse and reopen existing clients, service packages, quotes, and invoices from workspace lists.
FR4: Authorized studio user can maintain studio name, studio contact details, default quote terms, and default invoice payment instructions used to prefill new quotes and invoices.
FR5: Authorized studio user can create a client record.
FR6: Authorized studio user can edit a client record.
FR7: Authorized studio user can view a client record and its related quotes and invoices.
FR8: Authorized studio user can associate a client with a quote or invoice.
FR9: Authorized studio user can create a reusable service package.
FR10: Authorized studio user can edit a reusable service package.
FR11: Authorized studio user can define sections and line items within a service package.
FR12: Authorized studio user can define default content and pricing within a service package.
FR13: Authorized studio user can select one or more service packages when creating a quote.
FR14: Authorized studio user can create a quote for a client.
FR15: Authorized studio user can generate a client-specific quote from one or more service packages.
FR16: Authorized studio user can edit quote content after service package generation without modifying the underlying service packages.
FR17: Authorized studio user can edit quote line items directly.
FR18: Authorized studio user can edit quote pricing directly.
FR19: Authorized studio user can add, remove, and reorder quote sections or line items.
FR20: Authorized studio user can save a quote as a draft.
FR21: Authorized studio user can view a client-facing quote preview that includes client details, sections, line items, totals, and terms before the quote is shared or marked accepted.
FR22: Authorized studio user can revise an existing quote.
FR23: Authorized studio user can preserve prior quote versions when a quote is revised.
FR24: Authorized studio user can view prior quote revisions.
FR25: Authorized studio user can identify the current version of a quote.
FR26: Authorized studio user can mark a quote as accepted through an internal workflow state.
FR27: Authorized studio user can view whether a quote is in draft, accepted, or invoiced state.
FR28: Authorized studio user can generate an invoice from an accepted quote.
FR29: Authorized studio user can edit invoice content after generation.
FR30: Authorized studio user can edit invoice line items directly.
FR31: Authorized studio user can view an invoice in a client-facing layout for manual delivery that includes invoice number, client details, issue date, due date, line items, totals, and payment instructions.
FR32: Authorized studio user can reopen and update an existing invoice.
FR33: Authorized studio user can associate an invoice with its source quote and client.
FR34: Authorized studio user can trace an invoice back to the quote it was created from.
FR35: Authorized studio user can inspect the client, source service packages, generated quote content, and invoice details used in a connected commercial record chain.
FR36: Authorized studio user can correct incorrect client data, section content, line items, pricing values, dates, terms, or status fields on a quote or invoice and save the corrected record with updated totals.
FR37: Authorized studio user can view a connected record history for a client or quote that lists related quotes, revisions, current status, and linked invoices.

### NonFunctional Requirements

NFR1: The system shall load 95% of authenticated workspace pages in 2.0 seconds or less under 1 to 5 concurrent users in the supported browser matrix, as measured by browser-based performance tests across clients, service packages, quotes, and invoices, so studio users can move through the core workflow without losing momentum.
NFR2: The system shall complete 95% of create and update saves for clients, service packages, quotes, revisions, and invoices in 2.0 seconds or less under 1 to 5 concurrent users, as measured by timed end-to-end tests, so routine edits do not interrupt quote building or invoicing.
NFR3: The system shall complete 95% of quote preview generations and accepted-quote-to-invoice conversions in 2.0 seconds or less under 1 to 5 concurrent users, as measured by end-to-end timing tests, so users can reach a first quote preview in under 3 minutes and create an invoice from an existing quote in under 1 minute.
NFR4: The system shall require successful authentication for 100% of access attempts to protected workspace routes and record APIs, as measured by automated access-control tests, so commercial records are available only to studio users.
NFR5: The system shall block 100% of unauthenticated or unauthorized read and write attempts against client, service package, quote, revision, and invoice records, as measured by negative security tests, so a single studio's commercial data cannot be exposed or altered by invalid sessions.
NFR6: The system shall protect 100% of authentication and commercial data in transit with HTTPS and 100% of production-stored commercial data with encryption at rest, as measured by deployment configuration review and security scanning, so client and invoice data remain protected during normal operation.
NFR7: The system shall show 0 silent data-loss defects across 100 consecutive automated create, update, revise, and convert test runs, as measured by persistence verification tests that compare submitted and stored data, so users can trust saved commercial records.
NFR8: The system shall preserve correct client, source quote, revision, and invoice links in 100% of tested revision and quote-to-invoice flows, as measured by integration tests, so users can trace how each commercial record was produced.
NFR9: The system shall display an explicit success or failure result for 100% of tested save, preview, export, and conversion actions, as measured by failure-path and state-feedback tests, so users do not mistake incomplete actions for completed work.
NFR10: The system shall continue to meet NFR1 through NFR3 thresholds with 1 to 5 concurrent users performing a mixed core workflow for 15 continuous minutes, as measured by load testing, so a small studio can use the MVP without material slowdown.
NFR11: The system shall pass automated WCAG 2.1 AA checks with 0 critical violations on the workspace shell, client form, service package form, quote editor, quote preview, and invoice view, as measured by accessibility scans in the supported browsers, so core workflows remain accessible to studio users.
NFR12: The system shall allow 100% completion of create client, create quote, revise quote, preview quote, convert quote to invoice, and export PDF tasks using keyboard-only interaction, as measured by manual accessibility test scripts in latest Chrome and Safari, so users who do not use a mouse can complete the MVP workflow.
NFR13: The system shall generate a PDF for 100% of tested quote previews and invoices, and each PDF shall preserve document title, client details, line items, totals, terms, and payment instructions from the source record, as measured by export verification tests, so manual client delivery remains viable in the MVP.

### Additional Requirements

- Starter template requirement: initialize the project with the approved Next.js starter via `npx create-next-app@latest mento-admin --ts --eslint --tailwind --app --src-dir --import-alias "@/*" --use-npm`; this should be reflected in Epic 1 Story 1.
- Runtime and platform baseline: use a TypeScript-first Next.js App Router application on Node.js 20.9+ with a `src/` directory, Tailwind CSS, ESLint, and Vercel-aligned deployment conventions.
- Data and validation baseline: use managed PostgreSQL as the system of record with Drizzle ORM, Drizzle Kit migrations, normalized relational modeling, explicit foreign keys and lifecycle fields, and Zod validation at server action and route boundaries.
- Authentication and authorization baseline: implement Auth.js credentials-based authentication with simple single-studio RBAC, deny-by-default protection for workspace routes and mutations, studio-scoped authorization checks, and server-side enforcement for acceptance, conversion, preview/export, and other protected actions.
- Application communication pattern: use Next.js Server Actions for authenticated mutations and Route Handlers for explicit HTTP endpoints such as auth callbacks, preview rendering, PDF export, and health checks.
- State and workflow handling: keep a server-first rendering model with local component state by default and use targeted Zustand state only for complex quote-editor draft workflows.
- Deployment and operations baseline: host on Vercel with managed PostgreSQL, GitHub Actions CI/CD, environment-variable-driven configuration, Sentry monitoring, Resend email support, and app-owned workflow event logging for KPI tracking.
- Testing baseline: use Vitest, React Testing Library, and Playwright to cover unit, component, integration, accessibility, and core end-to-end workflow validation.
- Output and integration requirement: support deterministic quote and invoice PDF generation and preserve traceable lineage across clients, service packages, quotes, revisions, invoices, and workflow events.
- Browser and layout requirement: optimize for desktop-first use, explicitly support latest Chrome and Safari, target 1280px+ as the primary workspace, keep core workflows usable at 768px+, and treat mobile as minimally usable rather than fully optimized in MVP.
- Accessibility requirement from UX: maintain WCAG 2.1 AA behavior across core workflows with keyboard-reachable controls, persistent labels, visible focus states, text-based feedback, accessible overlays, and linear readability for tables, quote structures, revision history, and connected record chains.
- Guided workflow requirement from UX: structure quote creation as a guided sequence with visible progress, safe backward navigation, readiness gating before preview, and preview as the main trust checkpoint before the quote is considered ready.
- Editing and continuity requirement from UX: clearly distinguish reusable service packages from editable quote-instance content, provide inline validation and immediate totals recalculation, preserve draft continuity, make revision history and current-version status explicit, and keep quote-to-invoice carryover transparent.
- Recovery and feedback requirement from UX: provide explicit save, failure, conversion, export, and recovery messaging; keep correction loops local; preserve progress when fields are incomplete; and expose connected record links among client, quote, revision, and invoice records.

### FR Coverage Map

FR1: Epic 1 - Access single-studio workspace
FR2: Epic 1 - Navigate workspace areas
FR3: Epic 1 - Browse and reopen workspace records
FR4: Epic 1 - Maintain studio defaults
FR5: Epic 2 - Create client records
FR6: Epic 2 - Edit client records
FR7: Epic 2 - View client details and related records
FR8: Epic 3 - Associate client with quote workflow
FR9: Epic 2 - Create reusable service packages
FR10: Epic 2 - Edit reusable service packages
FR11: Epic 2 - Define service package sections and line items
FR12: Epic 2 - Define default service package content and pricing
FR13: Epic 3 - Select service packages during guided quote setup
FR14: Epic 3 - Create quote for a client
FR15: Epic 3 - Generate quote from service packages
FR16: Epic 3 - Edit generated quote without changing sources
FR17: Epic 3 - Edit quote line items
FR18: Epic 3 - Edit quote pricing
FR19: Epic 3 - Add, remove, and reorder quote structure
FR20: Epic 3 - Save quote as draft
FR21: Epic 3 - View client-facing quote preview
FR22: Epic 4 - Revise existing quote
FR23: Epic 4 - Preserve prior quote versions
FR24: Epic 4 - View prior quote revisions
FR25: Epic 4 - Identify current quote version
FR26: Epic 4 - Mark quote as accepted
FR27: Epic 4 - View quote lifecycle status
FR28: Epic 5 - Generate invoice from accepted quote
FR29: Epic 5 - Edit invoice after generation
FR30: Epic 5 - Edit invoice line items
FR31: Epic 5 - View client-facing invoice layout
FR32: Epic 5 - Reopen and update existing invoice
FR33: Epic 5 - Associate invoice with source quote and client
FR34: Epic 5 - Trace invoice back to source quote
FR35: Epic 5 - Inspect connected commercial record chain
FR36: Epic 5 - Correct quote or invoice data and save updated totals
FR37: Epic 5 - View connected record history

## Epic List

### Epic 1: Workspace Access, Delivery Baseline, and Studio Setup
Establish a secure single-studio workspace where the studio owner can sign in, navigate the product, and maintain studio defaults that power downstream quote and invoice work.
**FRs covered:** FR1, FR2, FR3, FR4

### Epic 2: Client and Service Package Foundation
Give the studio owner the reusable commercial foundation they need by managing clients and service packages that can be reused in future quote workflows.
**FRs covered:** FR5, FR6, FR7, FR9, FR10, FR11, FR12

### Epic 3: Guided Quote Creation, Editing, and Preview
Enable the studio owner to start a quote with the correct client context, generate it from selected service packages, refine the quote directly, save draft progress, and reach a trustworthy client-facing preview.
**FRs covered:** FR8, FR13, FR14, FR15, FR16, FR17, FR18, FR19, FR20, FR21

### Epic 4: Quote Revision and Acceptance Lifecycle
Allow the studio owner to revise quotes without losing prior versions, identify the current version clearly, and move the correct quote version into accepted state.
**FRs covered:** FR22, FR23, FR24, FR25, FR26, FR27

### Epic 5: Invoice Conversion, Record Continuity, and Troubleshooting
Allow the studio owner to convert accepted quotes into invoices, edit and review invoices, and trace connected commercial records across clients, quotes, revisions, and invoices when follow-through or troubleshooting is needed.
**FRs covered:** FR28, FR29, FR30, FR31, FR32, FR33, FR34, FR35, FR36, FR37

## Epic 1: Workspace Access, Delivery Baseline, and Studio Setup

Establish a secure single-studio workspace where the studio owner can sign in, navigate the product, and maintain studio defaults that power downstream quote and invoice work.

### Story 1.1: Set Up Initial Project from Starter Template

As a studio owner,
I want the product initialized with a working application foundation and automated quality checks,
So that I can reliably access and evolve the workspace on a safe baseline.

**Acceptance Criteria:**

**Given** the project has not yet been initialized
**When** the foundation story is implemented
**Then** the application is created with the approved Next.js starter using TypeScript, App Router, Tailwind CSS, ESLint, `src/` layout, and the `@/*` import alias
**And** dependencies are installed and the repository includes baseline configuration for local, preview, and production environments.

**Given** the foundation is in place
**When** a change is proposed for the application
**Then** a GitHub Actions workflow runs lint, type checks, test commands, and build verification automatically
**And** failures block the change from being treated as deployment-ready.

**Given** the application is deployed to the target platform
**When** a preview or production environment starts
**Then** environment configuration is read through centralized validation
**And** a health-check endpoint or equivalent deployment verification path confirms the app is running.

**Given** the workspace will later store protected commercial records
**When** the initial platform baseline is created
**Then** Vercel-oriented deployment, managed PostgreSQL connectivity scaffolding, Sentry setup hooks, and test framework wiring are present at a baseline level
**And** later stories can add feature-specific schema and auth behavior without replacing the foundation.

### Story 1.2: Sign In to a Protected Single-Studio Workspace

As a studio owner,
I want to sign in and reach a protected workspace,
So that only authorized access is allowed to commercial records and workflow actions.

**Acceptance Criteria:**

**Given** an unauthenticated visitor opens a protected workspace route
**When** access is attempted
**Then** the application denies access and redirects the user to the sign-in flow
**And** protected content is not rendered or exposed.

**Given** a valid studio owner credential exists
**When** the user signs in successfully
**Then** an authenticated session is established with the approved Auth.js credentials-based flow
**And** the user is taken into the single-studio workspace.

**Given** an invalid or unauthorized credential is submitted
**When** sign-in is attempted
**Then** the request is rejected with clear, safe feedback
**And** no protected record access is granted.

**Given** the user is authenticated
**When** they navigate within the protected workspace
**Then** server-side authorization checks protect routes, server actions, and record APIs
**And** unauthenticated or unauthorized access attempts are blocked consistently.

### Story 1.3: Navigate the Workspace and Reopen Existing Records

As a studio owner,
I want a clear workspace shell with navigation and browsable record lists,
So that I can move quickly between clients, service packages, quotes, and invoices.

**Acceptance Criteria:**

**Given** an authenticated user enters the workspace
**When** the main workspace shell loads
**Then** the interface shows persistent navigation to clients, service packages, quotes, invoices, and settings/defaults
**And** the current location is clearly indicated.

**Given** the user chooses a primary record area
**When** the corresponding page opens
**Then** the page shows a browsable list or empty state for that record type
**And** the next available action is obvious.

**Given** at least one client or service package exists in a list
**When** the user selects a specific client or service package
**Then** the application opens the selected record in its detail view
**And** the user can safely return to the prior list context.

**Given** the user opens the quotes or invoices area from workspace navigation
**When** the area page loads
**Then** the interface provides a clear list surface or empty state for that record type
**And** the user remains oriented in that workspace area without depending on downstream record-detail workflows.

**Given** the workspace shell and record lists are used on supported browsers and breakpoints
**When** the user navigates by mouse or keyboard
**Then** navigation remains usable, accessible, and responsive in latest Chrome and Safari
**And** the layout remains optimized for desktop while still usable at `768px+`.

### Story 1.4: Manage Studio Defaults for Quote and Invoice Prefill

As a studio owner,
I want to maintain studio defaults for commercial documents,
So that new quotes and invoices start with the right business details and terms.

**Acceptance Criteria:**

**Given** an authenticated user opens the studio defaults area
**When** the defaults form is displayed
**Then** the form includes studio name, studio contact details, default quote terms, and default invoice payment instructions
**And** fields are labeled clearly with accessible validation behavior.

**Given** valid defaults are entered
**When** the user saves the form
**Then** the defaults are persisted successfully
**And** the user receives explicit confirmation that the saved defaults will prefill future quotes and invoices.

**Given** invalid or incomplete required input is submitted
**When** save is attempted
**Then** inline validation explains what must be corrected
**And** previously entered progress is preserved.

**Given** saved defaults already exist
**When** the user returns later to the defaults area
**Then** the latest persisted values are loaded for review and editing
**And** subsequent quote and invoice stories can consume those values as prefills.

## Epic 2: Client and Service Package Foundation

Give the studio owner the reusable commercial foundation they need by managing clients and service packages that can be reused in future quote workflows.

### Story 2.1: Create and Edit Client Records

As a studio owner,
I want to create and update client records,
So that my quote and invoice workflows start with accurate client information.

**Acceptance Criteria:**

**Given** the user opens the client creation flow
**When** valid client details are entered and saved
**Then** a new client record is persisted successfully
**And** the user receives explicit confirmation that the client is ready for future quote and invoice use.

**Given** an existing client record is opened
**When** the user updates client details and saves changes
**Then** the revised client information is persisted
**And** subsequent workflows can use the latest saved values.

**Given** required client information is missing or invalid
**When** the user attempts to save the client form
**Then** inline validation identifies the specific fields that need correction
**And** already entered values remain available for correction.

**Given** the client form is used in supported browsers and keyboard navigation
**When** the user moves through fields, actions, and validation states
**Then** the interaction remains accessible and usable
**And** focus, labels, and error messaging remain clear.

### Story 2.2: View Client Records with Related Quote and Invoice Context

As a studio owner,
I want to view a client record together with its related quotes and invoices,
So that I can understand the commercial context for that client in one place.

**Acceptance Criteria:**

**Given** at least one client exists
**When** the user opens a client detail view
**Then** the page displays the client’s saved details
**And** it includes clearly labeled regions for related quotes and invoices.

**Given** a client has no related quotes or invoices yet
**When** the detail view loads
**Then** the interface shows a clear empty state for related commercial records
**And** the next available action remains obvious.

**Given** the client detail view is reopened later
**When** the page loads
**Then** the latest persisted client data and any available related record summaries are shown
**And** the relationship between the client and those records remains clear.

**Given** populated related quotes or invoices exist for the client
**When** the user reviews those summaries
**Then** the interface shows enough identifying information to support later linked-record workflows
**And** the response remains aligned with the core performance targets.

### Story 2.3: Create and Edit Reusable Service Packages

As a studio owner,
I want to create and update reusable service packages,
So that I can prepare quotes from repeatable commercial building blocks instead of starting from scratch.

**Acceptance Criteria:**

**Given** the user opens the service package creation flow
**When** valid package information is entered and saved
**Then** a reusable service package record is persisted successfully
**And** it is available in the service package library for future quote workflows.

**Given** an existing service package is opened
**When** the user edits package details and saves changes
**Then** the updated service package is persisted
**And** later quote generation can use the latest saved package definition.

**Given** required service package fields are incomplete or invalid
**When** the user attempts to save the package
**Then** inline validation identifies what must be corrected
**And** in-progress values are preserved.

**Given** reusable service packages are a source record type
**When** the user is viewing or editing a package
**Then** the interface makes it clear that the package is reusable source content
**And** later quote editing will occur on generated quote content rather than on the package itself.

### Story 2.4: Define Service Package Structure, Default Content, and Pricing

As a studio owner,
I want to define sections, line items, default content, and pricing inside a service package,
So that generated quotes begin from a realistic commercial structure.

**Acceptance Criteria:**

**Given** a service package is being created or edited
**When** the user adds sections and line items
**Then** the package stores the defined structure successfully
**And** the section and line-item hierarchy can be reviewed when the package is reopened.

**Given** the user enters default descriptive content and pricing guidance for package elements
**When** the package is saved
**Then** those defaults are persisted as part of the service package
**And** they are available to later quote-generation stories.

**Given** the user needs to revise package structure
**When** sections or line items are updated
**Then** the changes are saved without corrupting the rest of the package definition
**And** the updated package remains reusable.

**Given** the package editor includes structured and priced content
**When** totals or structured defaults change
**Then** the interface provides clear, accessible feedback about the saved structure
**And** the editing experience remains usable on supported desktop and tablet breakpoints.

### Story 2.5: Browse and Reopen Service Packages in the Library

As a studio owner,
I want to browse and reopen service packages from the library,
So that I can review and maintain reusable commercial sources before quote creation.

**Acceptance Criteria:**

**Given** one or more service packages exist
**When** the user opens the service package library
**Then** the interface shows a browsable list with clear package identity and summary information
**And** records can be reopened reliably from the list.

**Given** an existing service package is chosen from the library
**When** the record opens
**Then** the latest persisted service package definition is displayed
**And** the user can safely return to the library context.

**Given** no service packages match the current list state or none exist yet
**When** the library is shown
**Then** the user sees a clear empty or no-results state
**And** the next step to create or refine packages is obvious.

**Given** the service package library is used with keyboard navigation and supported browsers
**When** the user searches, reviews, or opens packages
**Then** the interactions remain accessible, responsive, and clear
**And** the current library and record state is communicated without ambiguity.

## Epic 3: Guided Quote Creation, Editing, and Preview

Enable the studio owner to start a quote with the correct client context, generate it from selected service packages, refine the quote directly, save draft progress, and reach a trustworthy client-facing preview.

### Story 3.1: Start a New Quote with Client Association and Service Package Selection

As a studio owner,
I want to start a new quote with the correct client and selected service packages,
So that generation begins from the right commercial context.

**Acceptance Criteria:**

**Given** the user chooses `New Quote` from the workspace
**When** the quote setup flow opens
**Then** the user can select an existing client or create/link the correct client context for the quote
**And** the quote is associated with that client before service package selection and generation proceed.

**Given** a valid client association exists and one or more service packages are available
**When** the user reviews the package-selection step
**Then** they can choose one or more reusable service packages for the quote
**And** the selected set is retained for subsequent quote generation.

**Given** no service packages exist or none match the current filter state
**When** the package-selection step is shown
**Then** the interface explains how to create or refine service packages
**And** any in-progress quote setup context is preserved.

**Given** a client is required for quote creation
**When** the user tries to continue without a valid client association
**Then** the interface blocks forward progress with clear inline guidance
**And** any previously entered quote setup progress is preserved.

**Given** a valid client association is made
**When** the quote setup step is completed
**Then** a new quote draft context is created for that client
**And** later generation and editing steps use the linked client details.

**Given** the guided quote flow is used with keyboard and supported browsers
**When** the user moves through client selection and continuation controls
**Then** the interaction remains accessible and clearly staged
**And** the current step and next step are obvious.

### Story 3.2: Generate Quote Content from Selected Service Packages

As a studio owner,
I want to generate a quote from one or more selected service packages,
So that I can begin from reusable commercial structure instead of rebuilding content manually.

**Acceptance Criteria:**

**Given** a quote has a valid client association and one or more selected service packages
**When** the user confirms generation
**Then** the system creates client-specific quote content from the selected packages
**And** the resulting quote contains generated sections, line items, and initial pricing guidance.

**Given** selected service packages contain reusable source content
**When** quote content is generated
**Then** the quote becomes an editable instance separate from the underlying service packages
**And** the source packages remain unchanged.

**Given** generation succeeds
**When** the user enters the editing stage
**Then** the generated quote structure is immediately available for review and refinement
**And** the user receives clear success feedback.

**Given** generation fails or required source data is incomplete
**When** the user attempts to generate the quote
**Then** the interface explains what blocked generation
**And** the user can correct the issue without losing the selected client or package context.

### Story 3.3: Edit Quote Sections and Line Items

As a studio owner,
I want to edit generated quote sections and line items,
So that I can tailor the quote to the specific client opportunity.

**Acceptance Criteria:**

**Given** a generated quote exists
**When** the user edits section content or line-item details
**Then** the quote instance is updated successfully
**And** the underlying service package source records remain unchanged.

**Given** the user needs to add or remove quote content
**When** they add a section or line item, or remove an existing one
**Then** the quote structure updates correctly
**And** the revised structure is reflected in the editing surface.

**Given** required content becomes incomplete during editing
**When** the user leaves a section or line item in an invalid state
**Then** inline validation identifies the affected area
**And** the user can continue correcting the quote without losing draft continuity.

**Given** the quote editor is used with keyboard navigation
**When** the user moves through editable sections and line items
**Then** the editing flow remains accessible and understandable
**And** source-versus-instance boundaries stay explicit in the UI.

### Story 3.4: Adjust Quote Pricing, Ordering, and Totals

As a studio owner,
I want to adjust pricing and reorganize quote content with immediate totals feedback,
So that the quote reflects the right commercial structure before preview.

**Acceptance Criteria:**

**Given** a generated quote contains editable sections and line items
**When** the user updates pricing values directly
**Then** the quote stores the revised pricing on the quote instance
**And** recalculated totals are shown immediately.

**Given** the user wants to reorganize the quote
**When** they reorder sections or line items
**Then** the quote reflects the new presentation order
**And** the saved sequence is preserved when the quote is reopened.

**Given** a pricing or ordering change affects totals or quote completeness
**When** the edit is made
**Then** the interface gives clear feedback about the recalculated result
**And** the user can see whether the quote is closer to preview readiness.

**Given** invalid pricing input or a failed update occurs
**When** the user attempts the change
**Then** the system returns explicit error feedback
**And** no silent data loss or ambiguous save state occurs.

### Story 3.5: Review Preview Readiness and Open the Quote Preview

As a studio owner,
I want to see whether the quote is ready for preview and open a client-facing preview,
So that I can validate the quote before treating it as send-ready.

**Acceptance Criteria:**

**Given** a quote draft is being edited
**When** the user reviews readiness status
**Then** the interface shows whether required quote information is complete for preview
**And** missing or incorrect items are described in clear text.

**Given** readiness issues exist
**When** the user selects a reported issue
**Then** the interface takes the user to the relevant correction point
**And** forward progress remains blocked only until the quote is preview-ready.

**Given** the quote satisfies preview requirements
**When** the user opens the client-facing preview
**Then** the preview displays client details, sections, line items, totals, and terms in a polished client-facing layout
**And** the preview reflects the latest saved or generated quote state.

**Given** the preview is opened on supported browsers and screen sizes
**When** the user reviews the quote by mouse or keyboard
**Then** the preview remains accessible, readable, and aligned with the desktop-first presentation goals
**And** it serves as a trustworthy checkpoint before later sharing or acceptance steps.

### Story 3.6: Save and Reopen Quote Drafts

As a studio owner,
I want to save quote drafts and reopen them later,
So that I can preserve in-progress work without rebuilding the quote.

**Acceptance Criteria:**

**Given** a quote has been started or edited
**When** the user saves it as a draft
**Then** the current client association, generated structure, edits, pricing, and quote status are persisted successfully
**And** the user receives explicit confirmation that the draft was saved.

**Given** a saved draft quote exists
**When** the user reopens it from the quotes area
**Then** the latest persisted draft state is loaded
**And** the user can continue editing, previewing, or revising from that point.

**Given** a save operation fails
**When** the user attempts to save the quote draft
**Then** the interface shows an explicit failure state with safe recovery guidance
**And** the user is not misled into thinking the draft was saved.

**Given** repeated quote saves occur during normal editing
**When** the workflow is exercised under expected MVP usage
**Then** draft persistence remains aligned with the documented reliability and performance targets
**And** the quote remains available for later revision and invoice-conversion stories.

## Epic 4: Quote Revision and Acceptance Lifecycle

Allow the studio owner to revise quotes without losing prior versions, identify the current version clearly, and move the correct quote version into accepted state.

### Story 4.1: Reopen an Existing Quote for Revision

As a studio owner,
I want to reopen an existing quote and enter a revision workflow,
So that I can respond to client changes without rebuilding the quote from scratch.

**Acceptance Criteria:**

**Given** one or more quotes already exist
**When** the user selects a quote to revise
**Then** the application opens the latest persisted quote content in a revision-ready state
**And** the linked client context remains visible.

**Given** the selected quote has prior saved work
**When** the revision flow opens
**Then** the user sees that they are continuing from an existing quote rather than creating a brand-new one
**And** the workflow preserves orientation within the quote lifecycle.

**Given** the quote is reopened for revision
**When** the user begins editing
**Then** the quote remains available for controlled updates through the established quote editor
**And** the workflow continues to respect accessibility and guided editing expectations.

**Given** the quote cannot be loaded correctly
**When** the user attempts to reopen it
**Then** the application shows a clear failure state with recovery guidance
**And** no ambiguous partial-load state is presented as successful.

### Story 4.2: Save a Revised Quote While Preserving Prior Versions

As a studio owner,
I want each quote revision saved without overwriting prior versions,
So that I can preserve a trustworthy history of changes over time.

**Acceptance Criteria:**

**Given** an existing quote has been reopened for revision
**When** the user saves the revised quote
**Then** the system persists the updated version successfully
**And** at least one prior version remains preserved as history.

**Given** a prior version already exists
**When** a new revision is saved
**Then** the system records the newer version as distinct from earlier ones
**And** the saved revision does not corrupt or erase previous revision data.

**Given** the save operation fails during revision
**When** the user attempts to save the revised quote
**Then** the application shows explicit failure feedback
**And** the user is not told the revision was saved unless persistence actually succeeded.

**Given** revision saves occur repeatedly over time
**When** quote history is exercised in normal workflow use
**Then** quote lineage remains reliable and traceable
**And** the behavior remains aligned with the documented reliability targets.

### Story 4.3: View Revision History and Identify the Current Quote Version

As a studio owner,
I want to review prior quote revisions and clearly identify the current version,
So that I can understand what changed and which version is active.

**Acceptance Criteria:**

**Given** a quote has multiple saved versions
**When** the user opens revision history
**Then** the interface lists prior revisions in a clear and understandable format
**And** the current version is explicitly identified.

**Given** the user inspects an earlier quote version
**When** they review revision details
**Then** the historical version can be viewed without replacing or confusing the active current version
**And** orientation is preserved.

**Given** a quote has only one version so far
**When** the user opens revision history
**Then** the interface communicates that the quote has no prior revisions yet
**And** the current version remains clear.

**Given** revision history is used with keyboard navigation or assistive technology
**When** the user moves through versions and status labels
**Then** the current and prior states are programmatically distinguishable
**And** the interaction remains accessible.

### Story 4.4: Mark Quotes as Accepted and Show Lifecycle Status

As a studio owner,
I want to mark the correct quote version as accepted and see lifecycle status clearly,
So that I know when a quote is ready to move into invoicing.

**Acceptance Criteria:**

**Given** a quote is in a revisable draft state
**When** the user marks the quote as accepted through the internal workflow
**Then** the quote status updates successfully to accepted
**And** the accepted state is visible wherever that quote is viewed.

**Given** a quote has lifecycle states such as draft, accepted, or invoiced
**When** the user views quote lists, quote detail, or revision context
**Then** the current lifecycle state is displayed clearly
**And** the status remains consistent across related views.

**Given** the user attempts an invalid or unauthorized acceptance action
**When** the state change is submitted
**Then** the action is rejected with explicit feedback
**And** the prior valid status remains unchanged.

**Given** a quote has been marked accepted
**When** the user later continues into downstream invoice work
**Then** the accepted status makes the next valid action obvious
**And** the quote is ready for the invoice-conversion epic without requiring hidden state knowledge.

## Epic 5: Invoice Conversion, Record Continuity, and Troubleshooting

Allow the studio owner to convert accepted quotes into invoices, edit and review invoices, and trace connected commercial records across clients, quotes, revisions, and invoices when follow-through or troubleshooting is needed.

### Story 5.1: Convert an Accepted Quote into a Linked Invoice Draft

As a studio owner,
I want to convert an accepted quote into an invoice draft,
So that invoicing feels like the natural next step after quote approval.

**Acceptance Criteria:**

**Given** a quote is in accepted state
**When** the user chooses to convert it into an invoice
**Then** the system creates a new invoice draft from that accepted quote
**And** the invoice is linked to both the source quote and the client.

**Given** the accepted quote contains client details, line items, totals, and terms
**When** invoice conversion succeeds
**Then** the invoice draft carries over the relevant commercial data transparently
**And** the user can review what came from the quote.

**Given** a quote is not in the correct state for conversion
**When** the user attempts to create an invoice from it
**Then** the action is blocked with explicit feedback
**And** no invalid invoice record is created.

**Given** invoice conversion is part of the core MVP flow
**When** the workflow is exercised under expected usage
**Then** the conversion path remains aligned with the target time and reliability requirements
**And** the resulting invoice is ready for later editing and client-facing review.

### Story 5.2: Edit Invoice Content and Line Items After Generation

As a studio owner,
I want to edit invoice content and line items after conversion,
So that the final invoice reflects the billing details I need to send.

**Acceptance Criteria:**

**Given** an invoice draft has been generated from an accepted quote
**When** the user edits invoice fields, line items, dates, payment instructions, or related content
**Then** the invoice draft is updated successfully
**And** the edited values are stored on the invoice record.

**Given** invoice line items affect commercial totals
**When** the user changes invoice line items or pricing-related values
**Then** totals are recalculated correctly
**And** the updated totals are shown clearly.

**Given** invalid or incomplete invoice edits are entered
**When** the user attempts to save changes
**Then** inline validation identifies the affected fields or sections
**And** previously entered progress is preserved for correction.

**Given** the invoice editor is used on supported browsers and with keyboard interaction
**When** the user moves through invoice editing controls
**Then** the editing experience remains accessible and understandable
**And** explicit success or failure feedback is provided for save actions.

### Story 5.3: Review the Client-Facing Invoice Layout and Export-Ready Output

As a studio owner,
I want to review the invoice in a client-facing layout,
So that I can confirm it is ready for manual delivery.

**Acceptance Criteria:**

**Given** an invoice exists
**When** the user opens the client-facing invoice view
**Then** the layout displays invoice number, client details, issue date, due date, line items, totals, and payment instructions
**And** the presentation is suitable for manual client delivery.

**Given** the user reviews the invoice before delivery
**When** the client-facing layout loads
**Then** it reflects the latest saved invoice state
**And** the relationship to the underlying invoice record remains clear.

**Given** quote and invoice PDF output is required for MVP
**When** the user exports or prepares the invoice for PDF output
**Then** the generated output preserves the displayed commercial content faithfully
**And** the export path remains explicit and reliable.

**Given** the invoice layout is opened on supported browsers and accessible flows
**When** the user reviews it by mouse or keyboard
**Then** the layout remains readable, accessible, and aligned with the product’s desktop-first quality goals
**And** important status or field meaning is not communicated by color alone.

### Story 5.4: Reopen and Update an Existing Invoice

As a studio owner,
I want to reopen an existing invoice and update it safely,
So that I can maintain accurate billing records after the invoice is created.

**Acceptance Criteria:**

**Given** one or more invoices already exist
**When** the user reopens an invoice from the invoices area or a linked record view
**Then** the latest persisted invoice state is loaded successfully
**And** the linked client and source quote context remain available.

**Given** an existing invoice is reopened
**When** the user updates invoice content and saves changes
**Then** the updated invoice state is persisted successfully
**And** the user receives explicit confirmation of the update.

**Given** the update action fails
**When** the user attempts to save the reopened invoice
**Then** the application shows explicit failure feedback
**And** the user is not misled into thinking the invoice was updated.

**Given** invoices may be revisited repeatedly over time
**When** the user returns to an existing invoice later
**Then** the most recent saved values are shown
**And** continuity with the original quote lineage is preserved.

### Story 5.5: Inspect Connected Record History and Trace Invoice Lineage

As a studio owner,
I want to inspect connected record history and trace invoices back to their source quote,
So that I can understand how each commercial record was produced.

**Acceptance Criteria:**

**Given** a client, quote, revision, and invoice chain exists
**When** the user opens connected record history from a client, quote, or invoice context
**Then** the interface shows related quotes, revisions, statuses, and linked invoices in a clear record chain
**And** the relationship among those records is understandable.

**Given** an invoice was created from an accepted quote
**When** the user traces that invoice backward
**Then** the source quote can be identified and opened
**And** the client relationship remains visible.

**Given** the user needs to inspect how a commercial record was assembled
**When** they review connected details
**Then** the interface exposes the linked client, source service-package context, generated quote content, and invoice details needed for troubleshooting
**And** the user can move among those records without losing orientation.

**Given** connected history is used with keyboard navigation or assistive technology
**When** the user reviews the record chain
**Then** order, status, and source relationships are programmatically clear
**And** the interaction remains accessible.

### Story 5.6: Correct Quote or Invoice Data During Troubleshooting

As a studio owner,
I want to correct incorrect quote or invoice data during troubleshooting,
So that I can recover from workflow problems without leaving the system.

**Acceptance Criteria:**

**Given** a quote or invoice contains incorrect client data, section content, line items, pricing values, dates, terms, or status fields
**When** the user updates the incorrect values and saves
**Then** the affected record is corrected successfully
**And** any dependent totals are recalculated accurately.

**Given** the user identified the issue from a connected record chain
**When** they navigate to the relevant editable record
**Then** the workflow allows correction without forcing duplicate record creation
**And** continuity with related records is preserved.

**Given** a correction introduces invalid data or cannot be saved
**When** the user attempts to persist the correction
**Then** the application returns explicit validation or failure feedback
**And** the user is guided toward recovery without silent data loss.

**Given** troubleshooting is part of the trust model for the MVP
**When** corrected records are reopened later
**Then** the saved corrections remain visible and traceable
**And** the workflow remains usable without external spreadsheets or document reconstruction.
