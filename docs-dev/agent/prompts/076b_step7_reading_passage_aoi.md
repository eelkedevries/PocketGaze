# Task: Applied AOI examples on Step 7 — reading passage with AOIs

## Goal

Add a reading-passage demo on Step 7 whose input is mapped to passage AOIs, with the input
mode labelled.

## Scope

A new reading-passage-with-AOIs demo on Step 7. Part of the Prompt 18 series; its own
commit.

## Required reading

1. `docs-dev/reviews/current-state-audit.md` (Prompt 0).
2. The Step 7 AOI infrastructure and the content-coordinate mapping module.

## Dependencies

Runs after the Phase 4 readiness gate (`072`). Reuses the AOI mapping established in
`076a`. Use real calibrated gaze only when validation passes; otherwise a clearly labelled
pointer mode.

## Rationale

A reading passage is a familiar applied AOI scenario that demonstrates content-mapped gaze
without overclaiming accuracy.

## Required changes

1. Add a reading passage with AOIs (new).
2. Map the input to passage AOIs and label the mode.
3. Use real calibrated gaze only when validation passes; otherwise a clearly labelled
   pointer mode.

## Do not implement

Do not:
- present pointer-mode data as calibrated gaze;
- overclaim word-level accuracy.

## Acceptance criteria

Input is mapped to passage AOIs and the mode is labelled.

## Automated checks

```bash
npm run build
npm run test
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- On Step 7, confirm the reading passage maps input to its AOIs and the input mode is
  labelled.

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main`
using this file's exact filename (`076b_step7_reading_passage_aoi.md`) as the commit
message, then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
