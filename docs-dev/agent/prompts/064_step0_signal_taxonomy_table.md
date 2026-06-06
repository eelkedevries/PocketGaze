# Task: Add the signal-taxonomy claims table to Step 0

## Goal

Add a table near the top of Step 0 that, for each signal type, states what it is,
whether it needs calibration, whether it needs validation, what it supports, and — in
an explicit column — what it does not support.

## Scope

A single claims table on Step 0 in `src/steps.ts` (or the Step 0 component),
complementing the existing Step 0 glossary. No logic changes.

## Required reading

1. `docs-dev/reviews/current-state-audit.md` (Prompt 0).
2. `src/steps.ts` (Step 0 glossary from Prompt 3 / `060`).

## Dependencies

Assumes `060` (the extended glossary) so the table complements rather than duplicates
it. If the glossary is missing, stop and report.

## Rationale

A "does not support" column makes the validity boundaries explicit and prevents readers
inferring capabilities the signals cannot provide.

## Required changes

1. Add a table near the top of Step 0 stating, for each of eye-local signal, screen-gaze
   estimate, content-mapped coordinate, and candidate event: what it is, whether it
   needs calibration, whether it needs validation, what it supports, and what it does
   not support.
2. Make the table complement the existing Step 0 glossary (Prompt 3 / `060`) rather than
   replacing it.

## Do not implement

Do not:
- replace or duplicate the Step 0 glossary;
- omit the explicit "does not support" column.

## Acceptance criteria

Step 0 contains the table with an explicit "does not support" column.

## Automated checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- Confirm the table renders near the top of Step 0, lists all four signal types, and
  shows an explicit "does not support" column.

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main`
using this file's exact filename (`064_step0_signal_taxonomy_table.md`) as the commit
message, then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
