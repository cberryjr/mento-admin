---
title: 'Improve form text readability across settings and raw workspace forms'
slug: 'improve-form-text-readability-across-settings-and-raw-workspace-forms'
created: '2026-03-23T17:57:33Z'
status: 'Completed'
stepsCompleted: [1, 2, 3, 4]
tech_stack:
  - 'Next.js App Router'
  - 'React 19'
  - 'TypeScript'
  - 'Tailwind CSS v4'
  - 'Vitest'
  - 'Testing Library'
files_to_modify:
  - 'src/components/ui/input.tsx'
  - 'src/components/ui/textarea.tsx'
  - 'src/features/studio-defaults/components/studio-defaults-form.tsx'
  - 'src/features/clients/components/client-form.tsx'
  - 'src/features/quotes/components/quote-setup-form.tsx'
  - 'src/features/service-packages/components/service-package-form.tsx'
  - 'src/features/quotes/components/quote-editor-section.tsx'
  - 'src/features/service-packages/components/service-package-list.tsx'
  - 'src/features/studio-defaults/components/studio-defaults-form.test.tsx'
  - 'src/features/clients/components/client-form.test.tsx'
  - 'src/features/quotes/components/quote-setup-form.test.tsx'
  - 'src/features/service-packages/components/service-package-form.test.tsx'
  - 'src/features/service-packages/components/service-package-list.test.tsx'
  - 'src/features/quotes/components/quote-editor-section.test.tsx'
code_patterns:
  - 'Prefer shared ui primitives with forwardRef and cn helpers over one-off field styling'
  - 'Keep zinc-based focus-visible outline pattern consistent across forms'
  - 'Preserve accessibility wiring with labels, aria-invalid, and aria-describedby'
  - 'Keep dense inline editors visually compact even when improving text readability'
test_patterns:
  - 'Colocated Vitest plus Testing Library component tests'
  - 'Assertions by label, role, and visible text'
  - 'Style assertions for focus-visible classes on form controls'
  - 'Behavior tests for preserving values, validation messaging, and submit flows'
---

# Tech-Spec: Improve form text readability across settings and raw workspace forms

**Created:** 2026-03-23T17:57:33Z

## Overview

### Problem Statement

Some workspace forms, starting with the settings page, render input text too lightly because they bypass the shared form controls and use lighter or incomplete styling. That makes entered content harder to read than the rest of the product and creates an inconsistent form experience across pages.

### Solution

Audit the workspace UI for raw text inputs and textareas, standardize them on the shared readable form styling where appropriate, and tighten any related text or placeholder classes so form content matches the readability of the stronger pages.

### Scope

**In Scope:**
- Settings/defaults form readability fixes
- Other obvious workspace forms still using direct `<input>` or `<textarea>` markup
- Reusable styling alignment with shared form controls
- Verification of readable text in normal, focus, disabled, and error-adjacent states

**Out of Scope:**
- Broader visual redesign
- Layout or spacing changes unrelated to readability
- Non-form contrast work outside this sweep
- Introducing a brand-new design system

## Context for Development

### Codebase Patterns

- Shared controls already exist in `src/components/ui/input.tsx` and `src/components/ui/textarea.tsx` and use `forwardRef`, `cn`, zinc borders, dark text, and `focus-visible:outline-*` classes as the standard field baseline.
- Several feature forms duplicate the same `FIELD_CLASS_NAME` string or use raw `<input>` and `<textarea>` markup directly instead of the shared primitives.
- Component forms preserve accessibility through explicit labels, `aria-invalid`, `aria-describedby`, and inline error copy. The readability sweep must keep those semantics unchanged.
- The quote editor uses denser inline editing than the settings and create/edit forms, so readability improvements there should preserve compact table-like interaction instead of forcing full-size inputs.
- Existing readable precedent already appears in shared-primitives consumers like invoice and correction forms, so the work should align with current product patterns rather than inventing a new form treatment.

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `src/app/(workspace)/settings/page.tsx` | Workspace settings entry point that hosts the settings form card |
| `src/features/studio-defaults/components/studio-defaults-form.tsx` | Highest-priority settings form using raw inputs and textareas |
| `src/components/ui/input.tsx` | Shared readable input primitive and likely baseline for text input styling |
| `src/components/ui/textarea.tsx` | Shared readable textarea primitive and likely baseline for multiline fields |
| `src/features/clients/components/client-form.tsx` | Client form that duplicates shared input classes with raw inputs |
| `src/features/quotes/components/quote-setup-form.tsx` | Quote setup flow with raw title, search, and terms fields |
| `src/features/service-packages/components/service-package-form.tsx` | Large nested form with repeated raw input and textarea usage |
| `src/features/quotes/components/quote-editor-section.tsx` | Compact inline quote editor with custom raw field styling that may need targeted readability improvements |
| `src/features/service-packages/components/service-package-list.tsx` | Search surface with duplicated raw search input styling |
| `src/features/studio-defaults/components/studio-defaults-form.test.tsx` | Settings form test coverage for labels, values, and save behavior |
| `src/features/clients/components/client-form.test.tsx` | Existing focus-visible and validation coverage for client form fields |
| `src/features/quotes/components/quote-setup-form.test.tsx` | Quote setup behavior coverage for staged form interactions |

### Technical Decisions

- Treat this as a consistency sweep anchored in shared text-entry primitives, with `studio-defaults-form` as the first concrete target.
- Include obvious workspace-related raw text-entry surfaces that are close in pattern and low-to-moderate risk: client form, quote setup form, service package form, service package list search, and possibly quote inline editors where compact behavior can be preserved.
- Do not widen scope into radios, checkboxes, or broader page redesign unless required to keep text readability consistent.
- Prefer centralizing improvements in `Input` and `Textarea` where possible, then reduce duplicated field class strings in feature components.
- Preserve current behavior contracts in tests, especially focus-visible styling, inline validation, staged flows, and autosave/editor interactions.

## Implementation Plan

### Tasks

- [x] Task 1: Tighten the shared readable baseline for text-entry primitives
  - File: `src/components/ui/input.tsx`
  - Action: Confirm the shared input primitive carries the final readable text-entry defaults for filled text, placeholder text, focus state, and disabled state while still allowing feature-level overrides through `className`.
  - Notes: Keep the existing `forwardRef`, `cn`, zinc palette, and `focus-visible:outline-*` conventions intact.
  - File: `src/components/ui/textarea.tsx`
  - Action: Mirror the same readable baseline for multiline fields so textarea content matches the stronger pages visually.
  - Notes: Preserve the current primitive API and compatibility with existing consumers.

- [x] Task 2: Fix the settings page by migrating the studio defaults form onto the shared field primitives
  - File: `src/features/studio-defaults/components/studio-defaults-form.tsx`
  - Action: Replace raw `<input>` and `<textarea>` controls with the shared `Input` and `Textarea` components, keeping current IDs, labels, validation wiring, and success/error behavior unchanged.
  - Notes: This is the clearest reproduction of the light-text issue and should become the reference implementation for the sweep.

- [x] Task 3: Sweep straightforward create/search forms that duplicate raw text-entry styling
  - File: `src/features/clients/components/client-form.tsx`
  - Action: Replace duplicated raw text inputs with the shared `Input` primitive and remove redundant field class duplication where possible.
  - Notes: Preserve create vs edit behavior, delayed `aria-invalid` behavior, notice rendering, and router refresh/navigation flow.
  - File: `src/features/quotes/components/quote-setup-form.tsx`
  - Action: Convert the quote title, package search, and optional terms fields to shared text-entry primitives while leaving radio and checkbox controls unchanged.
  - Notes: Keep stage transitions, inline validation, and selected-package behavior untouched.
  - File: `src/features/service-packages/components/service-package-list.tsx`
  - Action: Align the search input with the shared readable input treatment instead of its duplicated raw class string.
  - Notes: Preserve query state, filtering behavior, and the current accessible label.

- [x] Task 4: Standardize the large nested service package form without changing its behavior model
  - File: `src/features/service-packages/components/service-package-form.tsx`
  - Action: Replace or align repeated raw text and textarea controls with the shared readable baseline across package metadata, complexity tiers, sections, and line items.
  - Notes: Preserve nested field paths, currency parsing, dynamic add/remove/reorder controls, existing selects, and current focus-visible behavior that tests already cover.

- [x] Task 5: Improve readability in dense inline quote editing without losing the compact editor interaction model
  - File: `src/features/quotes/components/quote-editor-section.tsx`
  - Action: Darken inline field text, placeholder, and focus treatment for raw compact inputs and textareas so quote editing matches the rest of the workspace more closely.
  - Notes: Do not expand spacing or replace compact controls in a way that breaks Enter-to-save, Escape-to-revert, blur autosave, drag-and-drop, or table density.

- [x] Task 6: Update regression coverage for readability-related form changes
  - File: `src/features/studio-defaults/components/studio-defaults-form.test.tsx`
  - Action: Add or update assertions that the settings form still renders accessible labels and preserves entered values after moving to shared primitives.
  - Notes: Keep tests behavior-focused rather than snapshot-driven.
  - File: `src/features/clients/components/client-form.test.tsx`
  - Action: Preserve or update focus/readability class assertions after the shared primitive migration.
  - Notes: Ensure the form still exposes the same labels and invalid-state behavior.
  - File: `src/features/quotes/components/quote-setup-form.test.tsx`
  - Action: Confirm quote setup still exposes the same labeled fields and submission behavior after field primitive changes.
  - Notes: Keep staged flow assertions intact.
  - File: `src/features/service-packages/components/service-package-form.test.tsx`
  - Action: Update any focus-visible or field-rendering assertions affected by the shared readability sweep.
  - Notes: Preserve nested interaction coverage.
  - File: `src/features/service-packages/components/service-package-list.test.tsx`
  - Action: Retain the search-field accessibility and focus behavior checks after the input alignment.
  - Notes: Confirm filtering behavior remains unchanged.
  - File: `src/features/quotes/components/quote-editor-section.test.tsx`
  - Action: Add or update assertions only if compact editor field classes or semantics change as part of the readability fix.
  - Notes: Preserve autosave and keyboard-interaction coverage.

### Acceptance Criteria

- [x] AC 1: Given a user opens `/settings`, when the studio defaults form renders, then every text input and textarea shows dark readable entered text and readable placeholder/focus styling consistent with the shared form controls.
- [x] AC 2: Given a user opens other in-scope workspace forms that use text-entry fields, when they interact with client, quote setup, service package, and service package search fields, then the text-entry styling matches the shared readable baseline without changing the existing form behavior.
- [x] AC 3: Given a user triggers validation or disabled states on updated forms, when the fields render errors or pending UI, then labels, `aria-invalid`, `aria-describedby`, disabled styling, and inline notices remain intact and readable.
- [x] AC 4: Given a user edits quote content in the compact inline editor, when they type, focus, save, or reset values, then text readability improves while the dense layout and existing keyboard/autosave interactions remain unchanged.
- [x] AC 5: Given the updated form components and tests are run, when the relevant Vitest suites execute, then the existing component behavior still passes with assertions updated only where the readability treatment intentionally changed.

## Additional Context

### Dependencies

- No new external libraries are required.
- The work depends on the existing shared form primitives in `src/components/ui/input.tsx` and `src/components/ui/textarea.tsx` remaining the single source of truth for default text-entry styling.
- The sweep depends on existing feature form semantics staying stable so current routes, server actions, and validation behavior do not need to change.
- Test updates depend on the current Vitest and Testing Library setup already used by colocated component tests.

### Testing Strategy

- Run targeted component tests for the settings, client, quote setup, service package, list-search, and quote editor form surfaces touched by the sweep.
- Run the broader frontend test suite if any shared primitive changes affect multiple consumers beyond the directly edited files.
- Manually verify `/settings`, `/clients/new`, `/quotes/new`, `/service-packages`, `/service-packages/new`, and an existing quote detail page to confirm text readability, placeholder contrast, focus states, disabled states, and unchanged interactions.
- Specifically verify that radios, checkboxes, selects, and non-form page sections were not unintentionally restyled as part of the sweep.

### Notes

- User requested a sweep beyond the settings page so long as it remains focused on obvious raw workspace form controls.
- Highest risk: `src/features/service-packages/components/service-package-form.tsx` and `src/features/quotes/components/quote-editor-section.tsx` are large, interaction-heavy surfaces, so readability changes there should stay incremental and behavior-preserving.
- Known limitation: this spec does not broaden into full contrast auditing for every page element; it is intentionally focused on text-entry readability.
- Future consideration: if raw form field duplication continues to spread, a follow-up refactor could introduce a small shared field wrapper pattern for labels, errors, and helper text in addition to the existing primitives.

## Review Notes

- Adversarial review completed
- Findings: 12 total, 1 fixed (F1: added disabled state classes to service-package-form constant), 11 skipped (noise/out-of-scope)
- Resolution approach: skip
