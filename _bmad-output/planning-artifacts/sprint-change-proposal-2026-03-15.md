---
date: 2026-03-15
project: mento-admin
workflow: correct-course
mode: batch
author: chuck chuck
scope_classification: Moderate
status: approved
approved_on: 2026-03-15
routed_to:
  - Product Owner / Scrum Master
  - UX / Product
  - Development Team
source_documents:
  - /Users/serveradmin/workspace/repos/mento-admin/_bmad-output/planning-artifacts/prd.md
  - /Users/serveradmin/workspace/repos/mento-admin/_bmad-output/planning-artifacts/epics.md
  - /Users/serveradmin/workspace/repos/mento-admin/_bmad-output/planning-artifacts/architecture.md
  - /Users/serveradmin/workspace/repos/mento-admin/_bmad-output/planning-artifacts/ux-design-specification.md
  - /Users/serveradmin/workspace/repos/mento-admin/_bmad-output/planning-artifacts/implementation-readiness-report-2026-03-15.md
---

# Sprint Change Proposal

## Section 1: Issue Summary

The implementation-readiness review identified planning-level issues that do not change MVP scope, but do create avoidable implementation ambiguity.

- `Story 1.3` currently implies quote and invoice reopen behavior before those feature workflows exist in later epics.
- `Story 2.5` mixes service-package library browsing with quote-setup selection, even though quote setup belongs to Epic 3.
- `_bmad-output/planning-artifacts/ux-design-specification.md` still contains mixed `template` / `service package` terminology and a few future-state references such as `send` and `deposit` that could be misread as MVP requirements.

This issue was discovered during `_bmad-output/planning-artifacts/implementation-readiness-report-2026-03-15.md` while reviewing epic independence, story sequencing, and UX alignment.

## Section 2: Impact Analysis

### Epic Impact

- `Epic 1`: narrow `Story 1.3` so it covers workspace shell navigation, list access, and route-level orientation without depending on later quote or invoice detail workflows.
- `Epic 2`: clarify `Story 2.2` so related-record empty states are the baseline; reframe `Story 2.5` to service-package library browsing and reopening only.
- `Epic 3`: absorb service-package selection for quote setup by updating `Story 3.1` and moving `FR13` coverage into this epic.
- `Epic 5`: no story text change required for this proposal, but invoice reopening ownership remains correctly located in `Story 5.4` rather than Epic 1.

### Story Impact

- `Story 1.3` requires acceptance-criteria refinement.
- `Story 2.2` requires acceptance-criteria refinement.
- `Story 2.5` requires title, story, and acceptance-criteria refinement.
- `Story 3.1` requires title, story, and acceptance-criteria expansion.
- FR coverage mapping at the top of `epics.md` must move `FR13` from Epic 2 to Epic 3.

### Artifact Conflicts

- `prd.md`: no change required; it already defines the correct MVP scope and terminology.
- `architecture.md`: no structural change required; it already supports the corrected story placement.
- `ux-design-specification.md`: targeted terminology and scope-guard wording updates required.

### Technical Impact

- No code rollback required.
- No infrastructure, CI/CD, deployment, schema, or API changes required.
- No `sprint-status.yaml` or `sprint-status.yml` file exists in the workspace, so no sprint-status artifact can be updated at this time.

## Section 3: Recommended Approach

### Chosen Path

`Direct Adjustment`

### Rationale

This is the lowest-risk correction because it preserves the PRD, MVP scope, architecture, and epic order while fixing the actual source of delivery risk: story sequencing ambiguity and UX terminology drift.

- Effort estimate: `Low`
- Risk level: `Low`
- Timeline impact: minimal planning-only delay before sprint planning

Rollback is not justified because the issue is not a flawed implementation path. PRD MVP review is not justified because the MVP remains achievable as written.

## Section 4: Detailed Change Proposals

### Stories and Epic Mapping

#### Proposal 1: Move FR13 Ownership from Epic 2 to Epic 3

Artifact: `_bmad-output/planning-artifacts/epics.md`
Section: `FR Coverage Map` and `Epic FRs covered`

OLD:

```text
FR13: Epic 2 - Select service packages for quote setup

Epic 2 FRs covered: FR5, FR6, FR7, FR9, FR10, FR11, FR12, FR13
Epic 3 FRs covered: FR8, FR14, FR15, FR16, FR17, FR18, FR19, FR20, FR21
```

NEW:

```text
FR13: Epic 3 - Select service packages during guided quote setup

Epic 2 FRs covered: FR5, FR6, FR7, FR9, FR10, FR11, FR12
Epic 3 FRs covered: FR8, FR13, FR14, FR15, FR16, FR17, FR18, FR19, FR20, FR21
```

Rationale: package selection creates value only inside the quote setup flow, so ownership should sit with the quote epic rather than the reusable library epic.

#### Proposal 2: Narrow Story 1.3 to Workspace Navigation and Current-Epic Reopen Behavior

Artifact: `_bmad-output/planning-artifacts/epics.md`
Story: `Story 1.3`
Section: `Acceptance Criteria`

OLD:

```text
Given at least one record exists in a list
When the user selects a specific client, service package, quote, or invoice
Then the application reopens the selected record in its detail view
And the user can safely return to the prior list context.
```

NEW:

```text
Given at least one client or service package exists in a list
When the user selects a specific client or service package
Then the application opens the selected record in its detail view
And the user can safely return to the prior list context.

Given the user opens the quotes or invoices area from workspace navigation
When the area page loads
Then the interface provides a clear list surface or empty state for that record type
And the user remains oriented in that workspace area without depending on downstream record-detail workflows.
```

Rationale: Epic 1 should prove workspace navigation, route access, and current-epic record reopening without forcing quote and invoice detail behavior before later epics create those workflows.

#### Proposal 3: Clarify Story 2.2 Around Empty-State Baseline

Artifact: `_bmad-output/planning-artifacts/epics.md`
Story: `Story 2.2`
Section: `Acceptance Criteria`

OLD:

```text
Given at least one client exists
When the user opens a client detail view
Then the page displays the client’s saved details
And it includes linked summaries or lists of related quotes and invoices.

Given the user selects a related quote or invoice from the client view
When the linked record is opened
Then the application navigates to the chosen record successfully
And the relationship to the source client remains clear.
```

NEW:

```text
Given at least one client exists
When the user opens a client detail view
Then the page displays the client’s saved details
And it includes clearly labeled regions for related quotes and invoices.

Given a client has no related quotes or invoices yet
When the detail view loads
Then the interface shows a clear empty state for related commercial records
And the next available action remains obvious.

Given the client detail view is reopened later
When the page loads
Then the latest persisted client data and any available related record summaries are shown
And the relationship between the client and those records remains clear.
```

Rationale: Epic 2 should establish the client-detail surface and related-record context without depending on later quote and invoice navigation behaviors for completion.

#### Proposal 4: Reframe Story 2.5 as Library Browsing and Reopening Only

Artifact: `_bmad-output/planning-artifacts/epics.md`
Story: `Story 2.5`
Sections: `Title`, `User Story`, `Acceptance Criteria`

OLD:

```text
Title: Browse and Select Service Packages for Quote Setup

As a studio owner,
I want to browse the service package library and select one or more packages for quote setup,
So that I can assemble future quotes quickly from the right reusable sources.

Given the user is preparing to start a new quote
When they use the package selection experience
Then they can choose one or more reusable service packages
And the selected set is retained for subsequent quote generation.

Given the service package picker is used with keyboard navigation and supported browsers
When the user searches, reviews, or selects packages
Then the interactions remain accessible, responsive, and clear
And the selection state is communicated without ambiguity.
```

NEW:

```text
Title: Browse and Reopen Service Packages in the Library

As a studio owner,
I want to browse and reopen service packages from the library,
So that I can review and maintain reusable commercial sources before quote creation.

Given one or more service packages exist
When the user opens the service package library
Then the interface shows a browsable list with clear package identity and summary information
And records can be reopened reliably from the list.

Given an existing service package is chosen from the library
When the record opens
Then the latest persisted service package definition is displayed
And the user can safely return to the library context.

Given no service packages match the current list state or none exist yet
When the library is shown
Then the user sees a clear empty or no-results state
And the next step to create or refine packages is obvious.

Given the service package library is used with keyboard navigation and supported browsers
When the user searches, reviews, or opens packages
Then the interactions remain accessible, responsive, and clear
And the current library and record state is communicated without ambiguity.
```

Rationale: Epic 2 should stop at reusable library management. Quote-setup selection belongs to the quote workflow in Epic 3.

#### Proposal 5: Expand Story 3.1 to Include Service Package Selection During Quote Setup

Artifact: `_bmad-output/planning-artifacts/epics.md`
Story: `Story 3.1`
Sections: `Title`, `User Story`, `Acceptance Criteria`

OLD:

```text
Title: Start a New Quote with Client Association

As a studio owner,
I want to start a new quote and associate it with the correct client,
So that the quote begins with the right commercial context.

Given the user chooses `New Quote` from the workspace
When the quote setup flow opens
Then the user can select an existing client or create/link the correct client context for the quote
And the quote is associated with that client before generation proceeds.
```

NEW:

```text
Title: Start a New Quote with Client Association and Service Package Selection

As a studio owner,
I want to start a new quote with the correct client and selected service packages,
So that generation begins from the right commercial context.

Given the user chooses `New Quote` from the workspace
When the quote setup flow opens
Then the user can select an existing client or create/link the correct client context for the quote
And the quote is associated with that client before service package selection and generation proceed.

Given a valid client association exists and one or more service packages are available
When the user reviews the package-selection step
Then they can choose one or more reusable service packages for the quote
And the selected set is retained for subsequent quote generation.

Given no service packages exist or none match the current filter state
When the package-selection step is shown
Then the interface explains how to create or refine service packages
And any in-progress quote setup context is preserved.
```

Rationale: this places `FR13` inside the guided quote workflow where it is independently valuable and immediately connected to quote generation.

### UI/UX Specification Updates

#### Proposal 6: Normalize Terminology to `service packages`

Artifact: `_bmad-output/planning-artifacts/ux-design-specification.md`
Sections: Executive Summary, Core User Experience, Design System Foundation, Visual Design Foundation

OLD:

```text
maintaining reusable templates
clients, templates, quotes, invoices, defaults, and history
template maintenance
template selection
```

NEW:

```text
maintaining reusable service packages
clients, service packages, quotes, invoices, defaults, and history
service package maintenance
service package selection
```

Rationale: the PRD and architecture already standardized on `service packages`; the UX spec should match to avoid implementation and backlog terminology drift.

#### Proposal 7: Tighten MVP Flow Wording and Mark `send` / `deposit` as Post-MVP

Artifact: `_bmad-output/planning-artifacts/ux-design-specification.md`
Sections: `2.5 Experience Mechanics`, `Design Direction`, `Create Send-Ready Quote` flow text and diagram labels

OLD:

```text
...choose the relevant templates or line items needed for the quote.
In the future workflow, that quote may then progress to send, acceptance, deposit, and invoice stages...
...with later workflow phases such as send, acceptance, deposit, and invoice treated as downstream states.
Quote ready for later send or acceptance
```

NEW:

```text
...choose the relevant service packages or quote-specific line items needed for the quote.
After preview, the MVP workflow may continue through internal acceptance and later invoice conversion; send and deposit remain post-MVP considerations.
...with later MVP workflow phases focused on preview, internal acceptance, and invoice conversion, while send and deposit remain post-MVP.
Quote ready for later acceptance
```

Rationale: this preserves the intended future context without allowing post-MVP concepts to leak into current implementation scope.

## Section 5: Implementation Handoff

### Scope Classification

`Moderate` - backlog reorganization and artifact corrections are needed, but no fundamental replan is required.

### Handoff Recipients and Responsibilities

- `Product Owner / Scrum Master`
  - update `epics.md` with the approved story and FR coverage changes
  - confirm story ordering, dependencies, and acceptance criteria remain implementation-ready
- `UX / Product`
  - update `ux-design-specification.md` terminology and MVP scope wording
  - confirm quote-flow language matches the PRD and architecture
- `Development Team`
  - defer implementation of affected stories until corrected artifacts are approved
  - implement only from the revised story set after backlog alignment

### Success Criteria

- `Story 1.3`, `Story 2.2`, `Story 2.5`, and `Story 3.1` are updated as proposed or equivalent approved revisions.
- `FR13` ownership is moved to Epic 3.
- UX terminology consistently uses `service package` / `service packages`.
- `send` and `deposit` are clearly marked post-MVP in the UX artifact.
- The implementation-readiness workflow is rerun and no longer flags forward-dependency ambiguity or terminology drift.

## Approval and Handoff Log

- Proposal approval received on `2026-03-15`.
- Scope classification finalized as `Moderate`.
- Routed to `Product Owner / Scrum Master` for backlog and story adjustments.
- Routed to `UX / Product` for terminology and MVP-scope wording cleanup in the UX specification.
- Routed to `Development Team` to hold affected implementation work until revised planning artifacts are approved and adopted.
