# Sprint Change Proposal - 2026-03-17

## 1) Issue Summary

### Trigger

During implementation planning (with Story `1.2` now `ready-for-dev`), the owner provided a new specification at `docs/rodo-spec.md` describing a formalized service catalog and estimation model.

### Problem Statement

Current planning artifacts support reusable service packages and quote/invoice workflows, but they do not yet explicitly model the owner-defined catalog matrix and quote output contract needed for operational consistency:

- service categories
- complexity levels (Standard, Advanced, Premium)
- production variables (quantity, duration, resolution, revisions, urgency)
- deterministic quote output structure (estimated hours, role breakdown, internal cost, final price after margin, deliverables)

### Supporting Evidence

- `docs/rodo-spec.md` defines 7 service categories and 3 complexity levels.
- `docs/rodo-spec.md` requires quote-engine outputs: hours, roles, internal cost, final price, deliverables.
- Existing PRD/epics/architecture mention service packages and pricing guidance, but not a first-class catalog complexity matrix plus explicit estimate output contract.

## 2) Impact Analysis

### Epic Impact

- **Epic 1:** No structural change required; remains valid.
- **Epic 2:** Requires extension to define service catalog taxonomy and complexity matrix as reusable source rules.
- **Epic 3:** Requires extension to implement transparent deterministic estimate breakdown in quote flow.
- **Epic 4/5:** No core scope change; downstream continuity and troubleshooting likely benefit from estimate snapshot traceability.

### Story Impact

- Existing Story `1.2` can continue (auth/protection), but should not block planning updates.
- Add new stories:
  - **Story 2.6**: Define Service Catalog Taxonomy and Complexity Matrix
  - **Story 3.7**: Generate Transparent Estimate Breakdown for Quotes

### Artifact Conflicts

- **PRD**: Needs explicit FR coverage for catalog matrix + estimate output contract.
- **Epics**: Needs new stories in Epic 2 and Epic 3.
- **Architecture**: Needs explicit model and persistence strategy for complexity/profile inputs and estimate snapshots.
- **UX**: Needs explicit interaction patterns for complexity/variables and estimate breakdown visibility.

### Technical Impact

- Domain/schema additions for category profile + complexity + production variable storage.
- Calculator pipeline updates for deterministic role-hours/cost/margin/final price output.
- Quote lifecycle updates for persisting estimate snapshots for reproducibility/auditability.
- Test additions for estimation correctness, transparency, and accessibility of computed feedback.

## 3) Recommended Approach

### Selected Path

**Hybrid:** Option 1 (Direct Adjustment) + targeted Option 3 (MVP guardrail review)

### Rationale

- No rollback required; implementation is still early and compatible with additive planning corrections.
- Owner spec is aligned with product direction, but needs explicit planning codification before deeper quote work.
- Keeps MVP narrow by implementing deterministic rule-based pricing/estimation now, while deferring advanced AI pricing intelligence.

### Effort / Risk / Timeline

- **Effort:** Medium
- **Risk:** Medium
- **Timeline impact:** Low-to-medium (front-loads planning precision; reduces downstream rework risk)

## 4) Detailed Change Proposals

### A) PRD Changes

**Artifact:** `_bmad-output/planning-artifacts/prd.md`

#### A.1 Functional requirements extension

OLD (representative):
- FR9-FR13 cover reusable service packages and quote selection.
- FR14-FR21 cover quote generation/editing/preview.

NEW:
- Add FRs that explicitly require:
  - standardized service category and complexity matrix
  - production-variable capture for quote estimation
  - deterministic estimate output contract (`estimatedHours`, `roleBreakdown`, `internalCost`, `marginApplied`, `finalPrice`, `deliverables`)

Rationale:
- Aligns product requirements with owner-defined quote engine behavior.

#### A.2 MVP boundary clarification

OLD:
- AI-assisted estimate intelligence is deferred post-MVP.

NEW:
- Clarify that MVP includes deterministic rule-based estimate/pricing calculation; AI optimization remains post-MVP.

Rationale:
- Prevents scope confusion while meeting owner’s operational needs.

### B) Epic/Story Changes

**Artifact:** `_bmad-output/planning-artifacts/epics.md`

#### B.1 New Story 2.6 (Epic 2)

OLD:
- Epic 2 ends at Story 2.5.

NEW:
- Add **Story 2.6: Define Service Catalog Taxonomy and Complexity Matrix**
  - Define category profiles
  - Define Standard/Advanced/Premium tiers
  - Define deliverable templates and variable defaults

Rationale:
- Establishes reusable source-layer consistency before quote-generation complexity increases.

#### B.2 New Story 3.7 (Epic 3)

OLD:
- Epic 3 ends at Story 3.6.

NEW:
- Add **Story 3.7: Generate Transparent Estimate Breakdown for Quotes**
  - Compute/persist role-hours, internal cost, margin, final price, deliverables
  - Display transparent breakdown in quote workflow

Rationale:
- Converts owner spec into operational quote behavior and user trust signal.

### C) Architecture Changes

**Artifact:** `_bmad-output/planning-artifacts/architecture.md`

#### C.1 Data and calculation architecture update

OLD:
- Service packages and quote generation are defined; estimate snapshot model is implicit.

NEW:
- Add explicit architecture decisions for:
  - catalog profile/complexity representation
  - production variable inputs
  - persisted estimate snapshot per quote revision
  - deterministic recomputation rules and traceability

Rationale:
- Ensures reproducible, auditable commercial calculations.

### D) UX Specification Changes

**Artifact:** `_bmad-output/planning-artifacts/ux-design-specification.md`

#### D.1 Guided workflow extension

OLD:
- Guided quote flow includes client, package, edit, readiness, preview.

NEW:
- Add explicit steps and UI constraints for:
  - complexity level selection
  - production variable entry
  - estimate breakdown panel showing computed outputs and their drivers

Rationale:
- Makes quote logic transparent and confidence-building in the primary workflow.

#### D.2 Accessibility extension

OLD:
- General accessible feedback and guided flow requirements.

NEW:
- Add explicit requirement that estimate changes are keyboard-traceable and announced textually.

Rationale:
- Keeps NFR accessibility intact as pricing complexity grows.

## 5) Implementation Handoff

### Scope Classification

**Moderate** - backlog reorganization plus cross-artifact updates required.

### Handoff Recipients and Responsibilities

- **Product Owner / Scrum Master**
  - Insert new stories (2.6, 3.7), sequence backlog, and update sprint tracking.
- **Product Manager**
  - Approve PRD requirement language and MVP boundary wording.
- **Solution Architect**
  - Finalize data-model and estimate snapshot architecture details.
- **UX Designer**
  - Add complexity/variable/estimate-breakdown interaction and accessibility rules.
- **Development Team**
  - Implement approved stories after planning artifacts are updated.

### Success Criteria

- Planning artifacts updated consistently (PRD, Epics, Architecture, UX).
- New stories accepted into sprint backlog with clear acceptance criteria.
- No ambiguity remains about MVP deterministic estimation vs post-MVP AI pricing.
- Story 1.2 can proceed without contradiction and future quote stories have explicit estimate contracts.
