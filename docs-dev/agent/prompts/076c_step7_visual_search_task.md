# Task: Applied AOI examples on Step 7 — visual-search task

## Goal

Add a visual-search task on Step 7 that distinguishes target from distractor AOIs, with the
input mode labelled.

## Scope

A new visual-search demo on Step 7. Part of the Prompt 18 series; its own commit.

## Required reading

1. `docs-dev/reviews/current-state-audit.md` (Prompt 0).
2. The Step 7 AOI infrastructure and the AOI metrics module.

## Dependencies

Runs after the Phase 4 readiness gate (`072`). Use real calibrated gaze only when
validation passes; otherwise a clearly labelled pointer mode.

## Rationale

A visual-search task demonstrates target-versus-distractor AOI analysis, a classic applied
eye-tracking paradigm.

## Required changes

1. Add a visual-search task (new).
2. Distinguish target from distractor AOIs.
3. Use real calibrated gaze only when validation passes; otherwise a clearly labelled
   pointer mode.

## Do not implement

Do not:
- present pointer-mode data as calibrated gaze;
- overclaim search-performance accuracy.

## Acceptance criteria

The task runs and distinguishes target from distractor AOIs.

## Automated checks

```bash
npm run build
npm run test
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- On Step 7, run the visual-search task and confirm it distinguishes target from
  distractor AOIs and labels the mode.

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main`
using this file's exact filename (`076c_step7_visual_search_task.md`) as the commit
message, then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
