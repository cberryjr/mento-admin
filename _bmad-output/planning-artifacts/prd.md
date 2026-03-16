---
workflowType: 'prd'
workflow: 'edit'
date: '2026-03-13'
inputDocuments:
  - /Users/serveradmin/workspace/repos/mento-admin/_bmad-output/planning-artifacts/product-brief-mento-admin-2026-03-13.md
  - /Users/serveradmin/workspace/repos/mento-admin/_bmad-output/brainstorming/brainstorming-session-2026-03-12-164325.md
documentCounts:
  briefCount: 1
  researchCount: 0
  brainstormingCount: 1
  projectDocsCount: 0
classification:
  projectType: web_app
  domain: general
  complexity: low
  projectContext: greenfield
stepsCompleted:
  - step-e-01-discovery
  - step-e-02-review
  - step-e-03-edit
lastEdited: '2026-03-15 17:04:47 MST'
editHistory:
  - date: '2026-03-15 16:31:39 MST'
    changes: 'Clarified the domain model by replacing ambiguous template terminology with service package terminology and explicitly separating service packages, sections, line items, quotes, and invoices.'
  - date: '2026-03-15 16:51:11 MST'
    changes: 'Applied quick validation fixes for completeness and wording: added frontmatter date, explicit vision sentence, MVP out-of-scope list, accessibility baseline, and removed light implementation leakage from web-app requirements.'
  - date: '2026-03-15 17:04:47 MST'
    changes: 'Resolved major validation gaps by rewriting success criteria into measurable KPIs, tightening scope and journeys for traceability, removing service-package tagging from MVP, refining functional requirements, and converting non-functional requirements into measurable BMAD-style statements.'
---

# Product Requirements Document - mento-admin

**Author:** chuck chuck
**Date:** 2026-03-13 15:24:31 MST

## Executive Summary

mento-admin is a focused commercial workflow product for solo and small creative studios that need to turn reusable service packages into clear quotes and then into invoices without the drag of manual documents, spreadsheets, or generic business tools. The MVP is intentionally scoped as a single-studio product so it can prove a real quote-to-invoice workflow, measurable time savings, and stronger client-facing trust before any platform expansion.

The product vision is to help a studio owner spend less time on administrative reconstruction and more time on creative delivery by making quoting fast, consistent, and client-ready. The immediate outcome is a workflow where a studio can reach a send-ready quote preview in minutes, convert accepted quotes into invoices quickly, and rely on reusable commercial structure instead of rebuilding proposals from scratch.

The core problem is not just that quoting is inconvenient; it is that existing workflows interrupt creative work, create pricing inconsistency, and weaken client trust through slow, improvised commercial interactions. mento-admin addresses this by providing a service-package-led quote builder, lightweight client context, client-facing preview, simple accepted-state handling, and fast quote-to-invoice conversion. The intended outcome is a workflow that helps a studio owner respond faster, present work more consistently, and spend less time on administrative work.

### What Makes This Special

The product is differentiated by its narrow fit for how creative studios actually sell work: reusable service packages, stacked proposal structure, light pricing adjustment, preview-first validation, and a clean quote-to-invoice handoff. It aims to deliver that value with less cost and less operational overhead than broader, more generic commercial tools.

The long-term opportunity is larger than quoting speed alone. Once the core workflow is proven and enough historical data exists, the product can evolve into a studio-specific operating layer with deeper commercial workflows, broader business visibility, and estimate intelligence informed by historical quote, invoice, time, and delivery data. That future differentiator is intentionally deferred until the MVP proves the core workflow in real use.

## Project Classification

- Project Type: web application
- Domain: general business workflow for creative studios
- Complexity: low domain complexity
- Project Context: greenfield

## Success Criteria

### User Success

| KPI | Target | Timeframe | Measurement Source |
| --- | --- | --- | --- |
| Time to first send-ready quote preview | Median <= 3 minutes for a first quote built from existing service packages | MVP validation period and ongoing monthly review | Moderated task timing plus quote event timestamps |
| Time to create invoice from accepted quote | Median <= 1 minute | MVP validation period and ongoing monthly review | Conversion event timestamps and workflow audit |
| Professionalism and trust proxy | >= 80% of quotes created in-product are rated send-ready without external document cleanup | Monthly during pilot and early rollout | Studio-owner review against sent-quote sample |
| Workflow replacement | Pilot studio uses mento-admin for real quotes instead of spreadsheet or PDF assembly in >= 2 consecutive monthly cycles | By month 3 | Monthly usage review and operator check-in |

### Business Success

| KPI | Target | Timeframe | Measurement Source |
| --- | --- | --- | --- |
| Pilot validation | 1 studio uses the product in real workflow for 2 consecutive months | By month 3 | Monthly active-studio review |
| Active studios per month | 1-10 active studios | By month 3 of product expansion beyond pilot | Monthly active-studio report |
| Active studios per month | 10-50 active studios | By month 12 of product expansion beyond pilot | Monthly active-studio report |
| Retention | >= 60% of studios active in month 9 are still active in month 12 | By month 12 | Cohort retention review from monthly active studio logs |
| Quote-to-invoice conversion rate | >= 25% of quotes created in-product convert into invoices within 30 days | By month 12 | Linked quote and invoice conversion report |
| Lower-cost positioning | Pilot studio replaces or avoids a paid quoting workflow without increasing monthly quoting or invoicing tool spend | By month 3 | Baseline tool-cost review plus operator confirmation |

### Technical Success

| KPI | Target | Timeframe | Measurement Source |
| --- | --- | --- | --- |
| Core data integrity | 0 Sev-1 data-loss incidents across clients, service packages, quotes, revisions, and invoices | First 90 days of real use | Incident log plus record audit |
| Calculation accuracy | 100% of audited quote and invoice totals match underlying sections, line items, and adjustments | Monthly during pilot and rollout | QA audit sample |
| Quote-to-invoice reliability | 100% of accepted quotes selected for conversion produce a linked invoice record without broken lineage | First 90 days of real use | Conversion audit |
| Core workflow response time | Median page save or load <= 2 seconds and p95 <= 4 seconds under expected single-studio usage | MVP validation period and ongoing monthly review | Application performance reporting |

### Measurable Outcomes

The most important measurable outcomes for the MVP are the user, business, and technical KPIs above. They define whether the workflow is fast enough, trustworthy enough, and commercially useful enough to justify expansion beyond the single-studio pilot.

## Product Scope

### MVP - Minimum Viable Product

The MVP includes only the workflow depth required to prove that a single creative studio can replace a clunky manual quoting process with a faster, more trustworthy commercial workflow. In scope:
- Single-studio authenticated workspace for commercial operations
- Reusable service package library for common studio offerings, structure, and pricing guidance
- Lightweight client records sufficient to support quoting and invoicing
- Quote creation from one or more service packages
- Editing of quote sections, line items, and pricing after generation
- Send-ready quote preview as the core trust checkpoint
- Lightweight internal accepted-state handling
- Quote-to-invoice conversion from accepted quotes
- Real persisted data and connected record history across clients, service packages, quotes, revisions, and invoices

This scope is successful only if it supports a believable end-to-end quote-to-invoice workflow for one studio with measurable speed, trust, and repeat usage.

### Explicitly Out of Scope for MVP

To keep the MVP narrow and traceable, the following are explicitly deferred:

- Service package tagging, taxonomy management, and tag-based discovery
- Full send, share, approval, or reminder automation
- Client portal, client collaboration, or e-signature flows
- Standalone invoice-first workflows as a primary product path
- Payment collection and payment-status operations
- Time and materials tracking
- Profit margin tracking and profitability analysis
- Specialized project management and resource management workflows
- Team-role workflows, collaborator permissions, and broader multi-user collaboration
- Multi-studio tenancy, subscription billing, and platform administration
- AI-assisted estimate intelligence and broader workflow automation
- Advanced analytics beyond core workflow counts needed for MVP validation
- Mobile-first optimization

### Core Domain Model

- Terminology trace: the source brief uses `templates`; this PRD uses `service package` for the same reusable commercial source record.
- Service Package: reusable commercial source record for a common studio offering; contains default sections, line items, and pricing guidance.
- Section: grouped part of a service package or quote that organizes related deliverables, terms, or pricing content.
- Line Item: individual scoped or priced entry inside a section.
- Quote: client-specific commercial record created by combining one or more service packages and then editing the resulting content as needed.
- Invoice: billing record created from an accepted quote and linked back to the source quote and client.

The boundary is intentional: service packages are reusable source records; quotes and invoices are client-specific working records.

### Growth Features (Post-MVP)

Once the MVP proves repeat value, the product can expand into:
- Richer quote sharing, approval, and revision workflows
- More flexible invoice behaviors and downstream commercial operations
- Better reporting and operational visibility
- Broader collaboration and workflow refinement for small teams

These features should only be added after the core MVP proves repeat internal value.

### Vision (Future)

The long-term vision is a broader studio operating layer for creative businesses. Future phases may include:
- Multi-studio support and platform primitives
- Broader studio operations workflows beyond quote-to-invoice
- Margin, resource, and delivery visibility
- Estimate intelligence informed by historical quote, invoice, time, and delivery data

These expansions are contingent on the single-studio MVP proving the core workflow first.

The scope above is realized through the user journeys below, which trace the MVP from first quote creation through revision, conversion, and recovery.

## User Journeys

In the MVP, one authorized studio user may move across multiple roles: seller-operator, quote editor, operations maintainer, and self-serve troubleshooter. The same person can own all four journeys.

### Journey 1 - Seller-operator creates a send-ready quote from an active opportunity

- User type: solo or small creative studio owner responding to a live client opportunity.
- Trigger: a prospect is ready for a quote and speed matters.
- Workflow: select or create the client record -> choose one or more reusable service packages -> generate quote content -> adjust sections, line items, and pricing -> preview -> save as draft.
- Key states: client linked, quote generated, quote edited, preview verified, draft persisted.
- Outcome: a client-facing quote preview is reached in under 3 minutes, with fast page response and confidence that the saved quote can be reopened, revised, accepted, and later converted into an invoice without rework.
- Supports: success criteria `quote preview < 3 minutes`, `send-ready quality >= 80%`, `persistence reliability`, `fast page response`; FRs `FR1-FR3`, `FR5-FR8`, `FR13-FR21`.

### Journey 2 - Commercial editor revises a quote without losing control or trust

- User type: same studio user acting as quote editor after client feedback.
- Trigger: the client requests a scope, deliverable, or pricing change on an existing quote.
- Workflow: reopen the quote -> review current and prior versions -> update sections, line items, or pricing -> regenerate the preview -> save the new current version -> move the accepted quote forward when approved.
- Key states: prior revision visible, current version identified, totals recalculated, revised preview verified, accepted-ready quote persisted.
- Outcome: revisions stay coherent and auditable instead of forcing a rebuild, and an accepted quote remains ready for invoice creation in under 1 minute when the client says yes.
- Supports: success criteria `invoice from quote < 1 minute`, `persistence reliability`, `fast page response`; FRs `FR1-FR3`, `FR16-FR28`.

### Journey 3 - Operations maintainer keeps reusable assets ready for fast quoting

- User type: same studio user acting as lightweight admin and operations maintainer.
- Trigger: between active deals, the user improves the reusable setup that powers future quotes.
- Workflow: create or update service packages, sections, default content, pricing defaults, and minimal client data -> review service package lists -> confirm the right package is ready for the next quote.
- Key states: reusable assets updated, defaults persisted, packages reviewable, client records current.
- Outcome: setup effort stays lightweight but compounds value, so future quotes are faster, more consistent, and easier to assemble because reusable assets save reliably and are ready when needed.
- Supports: success criteria `persistence reliability`, `fast page response`; FRs `FR1-FR3`, `FR4`, `FR5-FR7`, `FR9-FR12`.

### Journey 4 - Self-serve troubleshooter recovers from workflow problems without abandoning the system

- User type: same studio user acting as first-line support for the commercial workflow.
- Trigger: a quote total, client detail, saved record, or quote-to-invoice result looks wrong.
- Workflow: inspect the connected client, service package, quote, revision, and invoice records -> trace the invoice back to its source quote -> identify the incorrect input or state -> correct the record -> save and continue the workflow.
- Key states: issue identified, source record traced, correction saved, workflow resumed.
- Outcome: problems can be diagnosed and corrected without spreadsheets, duplicate documents, or support escalation; continuity is restored, persistence remains trustworthy, and the quote-to-invoice path stays usable under stress.
- Supports: success criteria `persistence reliability`, `fast page response`; FRs `FR1-FR3`, `FR28-FR37`.

### Journey Requirements Summary

- The MVP must support a fast quote workflow built from reusable service packages, lightweight client records, editable quote structure, and a client-facing preview.
- The MVP must preserve workflow continuity across draft, revision, accepted, invoiced, and recovery states.
- The MVP must support reliable persistence for clients, service packages, quotes, revisions, and invoices so the user can trust saved work.
- The MVP must keep the core workflow responsive enough that creating, editing, previewing, saving, and converting records feels faster than the manual process it replaces.
- The MVP must support quote-to-invoice conversion as a direct downstream action from an accepted quote, with a target of under 1 minute.
- The MVP may assume a single authorized studio user can hold multiple roles; separate SaaS admin, support, or client-portal roles are not required for this phase.

## Web Application Specific Requirements

### Project-Type Overview

mento-admin is a desktop-first authenticated web application for one creative studio. MVP decisions must prioritize fast internal workflow execution for quote creation, revision, preview, and invoice generation over public discoverability, real-time collaboration, or multi-studio scale.

### Technical Architecture Considerations

The application must support predictable navigation, reliable persistence, and clear movement between clients, service packages, quotes, revisions, previews, invoices, and PDF outputs. MVP scope excludes public marketing optimization, real-time collaboration, and complex multi-organization behaviors.

Browser support for the MVP should explicitly cover modern Chrome and Safari. This is sufficient for the intended studio-user environment and avoids premature expansion into a broader browser support matrix before the workflow is validated.

The product should be desktop-first in layout and interaction design while remaining usable on smaller screens when needed. Mobile optimization can be deferred to a later phase once the core desktop workflow is proven.

### Browser Matrix

- Primary supported browsers: latest Chrome and Safari
- Target environment: desktop-class browser usage inside a single-studio workflow
- Broader browser coverage is out of scope until the MVP workflow is validated

### Responsive Design

- The interface must be optimized for laptop and desktop use at widths of 1280px and above
- Core workflows must remain usable at widths of 768px and above
- Mobile-first optimization is out of scope for the MVP

### Performance Targets

- Core authenticated pages, standard save actions, quote preview generation, and quote-to-invoice conversion must meet the performance thresholds defined in the Non-Functional Requirements under expected single-studio usage
- Workflow performance must support the user outcomes of first quote preview in under 3 minutes and invoice creation from an existing quote in under 1 minute

### SEO Strategy

SEO is not a priority for the MVP. The product is an authenticated operational application, so product decisions should favor workflow speed, reliability, and simplicity over search-indexing concerns.

### Accessibility Level

- MVP accessibility target: WCAG 2.1 AA for core authenticated workflows
- Core navigation, forms, quote preview, invoice viewing, and PDF-export entry points must align with the accessibility thresholds defined in the Non-Functional Requirements

### Implementation Considerations

The MVP should stay narrow and capability-focused. The product must support:

- Predictable workflow behavior across record creation, editing, preview, revision, acceptance, conversion, and PDF export
- Clear user feedback for loading, save, conversion, export, and error states
- Reliable persistence and connected-record continuity across clients, service packages, quotes, revisions, and invoices

These platform decisions support the phased scoping plan below.

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** problem-solving MVP for a small full-stack team.

The first release exists to prove one thing: a real creative studio can move from service package to send-ready quote to invoice faster and with more trust than in its current manual workflow. The product should validate workflow value first, not platform breadth.

### Phased Plan

| Phase | Purpose | Included Focus | Proof Gate to Advance |
| --- | --- | --- | --- |
| Phase 1 - MVP Workflow Proof | Prove the single-studio quote-to-invoice loop in real use | Core scope defined in `## Product Scope`, with manual-first handling for non-core steps | Advance only when the pilot studio uses the product in real workflow for 2 consecutive months, median time to first send-ready quote preview is <= 3 minutes, median quote-to-invoice conversion is <= 1 minute, >= 80% of audited quotes are send-ready without external cleanup, and no Sev-1 data-loss incidents are recorded |
| Phase 2 - Workflow Depth | Add the next layer of commercial workflow depth once the core loop is proven | Richer quote sharing or approval support, more flexible invoice behaviors, better reporting, and workflow refinements driven by observed usage | Advance only when there are 1-10 active studios by month 3 of expansion, repeat monthly usage is demonstrated, and demand is validated for the next commercial workflow step beyond MVP |
| Phase 3 - Operating Layer Expansion | Expand from a focused workflow product into a broader studio platform | Multi-studio support, broader operational workflows, collaboration, margin or resource visibility, and estimate intelligence from historical commercial and delivery data | Advance only when there are 10-50 active studios by month 12 of expansion, retention is strong, repeated cross-studio patterns justify platform expansion, and enough historical data exists to support estimate-intelligence features credibly |

### Scope Discipline

- Keep non-core steps manual if that protects Phase 1 speed and reliability.
- Do not add platform primitives before single-studio workflow proof exists.
- Do not add estimate intelligence before there is enough historical data to make it credible.
- Judge each phase by measured workflow outcomes, not feature count.

### Risk Mitigation Strategy

**Technical Risks:**  
The biggest technical risk is preserving data integrity and workflow simplicity across quote creation, revision, and conversion into invoices. Mitigation: keep the data model narrow, separate reusable service packages from instantiated quote and invoice records, support a single-studio workflow only, avoid real-time and SaaS complexity, and prioritize correctness in section, line-item, revision, and conversion logic before adding breadth.

**Market Risks:**  
The biggest market risk is that even if the product is cheaper and cleaner than alternatives, a studio may still stick with existing spreadsheets, documents, or habits. Mitigation: focus the MVP on a clear time-saving and trust-building workflow, validate usage through one real studio, and judge success by actual quotes and invoices created rather than enthusiasm alone.

**Resource Risks:**  
The biggest resource risk is overbuilding beyond the narrow workflow before the MVP proves value. Mitigation: keep the team small, hold the scope line around quote and invoice production, defer SaaS primitives and mobile-first optimization, and allow non-core workflow pieces to stay manual initially.

The phased scope above resolves into the capability contract below.

## Functional Requirements

### Workspace & Record Access

- FR1: Authorized studio user can access a single-studio workspace for managing the commercial workflow.
- FR2: Authorized studio user can navigate between clients, service packages, quotes, and invoices within the workspace.
- FR3: Authorized studio user can browse and reopen existing clients, service packages, quotes, and invoices from workspace lists.
- FR4: Authorized studio user can maintain studio name, studio contact details, default quote terms, and default invoice payment instructions used to prefill new quotes and invoices.

### Client Management

- FR5: Authorized studio user can create a client record.
- FR6: Authorized studio user can edit a client record.
- FR7: Authorized studio user can view a client record and its related quotes and invoices.
- FR8: Authorized studio user can associate a client with a quote or invoice.

### Service Package Library

- FR9: Authorized studio user can create a reusable service package.
- FR10: Authorized studio user can edit a reusable service package.
- FR11: Authorized studio user can define sections and line items within a service package.
- FR12: Authorized studio user can define default content and pricing within a service package.
- FR13: Authorized studio user can select one or more service packages when creating a quote.

### Quote Creation & Editing

- FR14: Authorized studio user can create a quote for a client.
- FR15: Authorized studio user can generate a client-specific quote from one or more service packages.
- FR16: Authorized studio user can edit quote content after service package generation without modifying the underlying service packages.
- FR17: Authorized studio user can edit quote line items directly.
- FR18: Authorized studio user can edit quote pricing directly.
- FR19: Authorized studio user can add, remove, and reorder quote sections or line items.
- FR20: Authorized studio user can save a quote as a draft.
- FR21: Authorized studio user can view a client-facing quote preview that includes client details, sections, line items, totals, and terms before the quote is shared or marked accepted.

### Quote Revision & Lifecycle

- FR22: Authorized studio user can revise an existing quote.
- FR23: Authorized studio user can preserve prior quote versions when a quote is revised.
- FR24: Authorized studio user can view prior quote revisions.
- FR25: Authorized studio user can identify the current version of a quote.
- FR26: Authorized studio user can mark a quote as accepted through an internal workflow state.
- FR27: Authorized studio user can view whether a quote is in draft, accepted, or invoiced state.

### Invoice Generation & Management

- FR28: Authorized studio user can generate an invoice from an accepted quote.
- FR29: Authorized studio user can edit invoice content after generation.
- FR30: Authorized studio user can edit invoice line items directly.
- FR31: Authorized studio user can view an invoice in a client-facing layout for manual delivery that includes invoice number, client details, issue date, due date, line items, totals, and payment instructions.
- FR32: Authorized studio user can reopen and update an existing invoice.
- FR33: Authorized studio user can associate an invoice with its source quote and client.

### Workflow Continuity & Troubleshooting

- FR34: Authorized studio user can trace an invoice back to the quote it was created from.
- FR35: Authorized studio user can inspect the client, source service packages, generated quote content, and invoice details used in a connected commercial record chain.
- FR36: Authorized studio user can correct incorrect client data, section content, line items, pricing values, dates, terms, or status fields on a quote or invoice and save the corrected record with updated totals.
- FR37: Authorized studio user can view a connected record history for a client or quote that lists related quotes, revisions, current status, and linked invoices.

The non-functional requirements below define the quality bar for these capabilities.

## Non-Functional Requirements

### Performance

- NFR1: The system shall load 95% of authenticated workspace pages in 2.0 seconds or less under 1 to 5 concurrent users in the supported browser matrix, as measured by browser-based performance tests across clients, service packages, quotes, and invoices, so studio users can move through the core workflow without losing momentum.
- NFR2: The system shall complete 95% of create and update saves for clients, service packages, quotes, revisions, and invoices in 2.0 seconds or less under 1 to 5 concurrent users, as measured by timed end-to-end tests, so routine edits do not interrupt quote building or invoicing.
- NFR3: The system shall complete 95% of quote preview generations and accepted-quote-to-invoice conversions in 2.0 seconds or less under 1 to 5 concurrent users, as measured by end-to-end timing tests, so users can reach a first quote preview in under 3 minutes and create an invoice from an existing quote in under 1 minute.

### Security

- NFR4: The system shall require successful authentication for 100% of access attempts to protected workspace routes and record APIs, as measured by automated access-control tests, so commercial records are available only to studio users.
- NFR5: The system shall block 100% of unauthenticated or unauthorized read and write attempts against client, service package, quote, revision, and invoice records, as measured by negative security tests, so a single studio's commercial data cannot be exposed or altered by invalid sessions.
- NFR6: The system shall protect 100% of authentication and commercial data in transit with HTTPS and 100% of production-stored commercial data with encryption at rest, as measured by deployment configuration review and security scanning, so client and invoice data remain protected during normal operation.

### Reliability

- NFR7: The system shall show 0 silent data-loss defects across 100 consecutive automated create, update, revise, and convert test runs, as measured by persistence verification tests that compare submitted and stored data, so users can trust saved commercial records.
- NFR8: The system shall preserve correct client, source quote, revision, and invoice links in 100% of tested revision and quote-to-invoice flows, as measured by integration tests, so users can trace how each commercial record was produced.
- NFR9: The system shall display an explicit success or failure result for 100% of tested save, preview, export, and conversion actions, as measured by failure-path and state-feedback tests, so users do not mistake incomplete actions for completed work.

### Scalability

- NFR10: The system shall continue to meet NFR1 through NFR3 thresholds with 1 to 5 concurrent users performing a mixed core workflow for 15 continuous minutes, as measured by load testing, so a small studio can use the MVP without material slowdown.

### Accessibility

- NFR11: The system shall pass automated WCAG 2.1 AA checks with 0 critical violations on the workspace shell, client form, service package form, quote editor, quote preview, and invoice view, as measured by accessibility scans in the supported browsers, so core workflows remain accessible to studio users.
- NFR12: The system shall allow 100% completion of create client, create quote, revise quote, preview quote, convert quote to invoice, and export PDF tasks using keyboard-only interaction, as measured by manual accessibility test scripts in latest Chrome and Safari, so users who do not use a mouse can complete the MVP workflow.

### Integration

- NFR13: The system shall generate a PDF for 100% of tested quote previews and invoices, and each PDF shall preserve document title, client details, line items, totals, terms, and payment instructions from the source record, as measured by export verification tests, so manual client delivery remains viable in the MVP.
- Other external integrations, including accounting tools, payment systems, and data-sync integrations, are out of scope for the MVP.
