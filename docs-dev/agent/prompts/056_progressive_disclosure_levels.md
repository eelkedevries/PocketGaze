# Task: Add per-step progressive disclosure (concept → mechanism → maths)

## Goal

Add a three-level disclosure ladder to the step pages so a recruiter can skim the
**concept**, an engineer can read the **mechanism**, and a specialist can drill into
the **maths** — extending the existing two-level (master control) model without
adding a second global toggle.

## Scope

A reusable disclosure pattern and its application to the step content model. No
tracking code. Builds on the existing master control and step-page shell.

## Required reading

1. `docs-dev/reference/primary_authoritative/specification.md` §2.5, §2.6, §7.1.
2. Source: `src/components/StepPage.tsx`,
   `src/context/ImplementationDetailsContext.tsx`, `src/steps.ts`,
   `src/demos/registry.ts`.

## Dependencies

Assumes the step shell and master control (`001`/`006`) exist; ideally the step
content (`004`/`005`) is in place to populate the levels. If the step shell is
missing, stop and report.

## Rationale

Progressive disclosure serves the project's dual audience: portfolio reviewers want
the concept; eye-tracking specialists want the least-squares fit or the Euler
decomposition. A per-step concept/mechanism/maths ladder reconciles both without
cluttering the default view.

## Required changes

1. Define a small, reusable disclosure structure (e.g. a `levels` field on the step
   content model or a `DisclosureSection` component) supporting three tiers:
   **concept** (always visible), **mechanism** (expandable), **maths** (expandable,
   and/or gated behind the existing master control).
2. Apply it to at least the explanatory sections of the step pages so each step can
   expose concept-only by default and reveal mechanism/maths on demand; integrate
   the deepest tier with the existing master "Show implementation details" control
   rather than introducing a new global toggle (per-section expand/collapse is
   acceptable as a local affordance).
3. Keep the §2.6 section order intact; ensure keyboard accessibility for the
   expanders (labels, focus, roles); British English.

## Do not implement

Do not:
- add a second global show/hide control (local per-section expanders are fine, but
  the deepest tier reuses the master control);
- add tracking or demo logic;
- reorder the repeated step-page sections.

## Data contracts touched

Adds: optional `levels`/disclosure fields to the step content model (`src/steps.ts`)
— additive and non-tracking. Preserves the session model. Record the content-model
addition in `current_state.md`.

## Acceptance criteria

- step pages expose a concept tier by default with expandable mechanism and maths
  tiers, the deepest reusing the master control;
- no second global toggle is introduced and the §2.6 order is preserved;
- expanders are keyboard-accessible and labelled.

## Automated checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- On a step page, confirm concept text shows by default and mechanism/maths expand;
  confirm the deepest tier follows the master control and expanders are reachable by
  keyboard.
- See `docs-dev/reviews/runtime_qa_checklist.md` (shell; toggle rows).

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main`
using this file's exact filename (`056_progressive_disclosure_levels.md`) as the
commit message, then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
