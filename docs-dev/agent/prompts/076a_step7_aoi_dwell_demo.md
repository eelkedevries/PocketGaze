# Task: Applied AOI examples on Step 7 — AOI dwell-time demo

## Goal

Show dwell time per AOI on Step 7 for the active input mode, extending the existing AOI
dwell demo rather than building a second one.

## Scope

The AOI dwell-time demo on Step 7. Part of the Prompt 18 series; each sub-prompt is its own
commit.

## Required reading

1. `docs-dev/reviews/current-state-audit.md` (Prompt 0) — whether an AOI dwell demo
   already exists.
2. The Step 7 AOI / dwell demo and the AOI metrics module.

## Dependencies

Runs after the Phase 4 readiness gate (`072`). Across the 18-series: use real calibrated
gaze only when validation passes; otherwise a clearly labelled pointer mode.

## Rationale

Dwell time per AOI is a core applied metric; surfacing the existing demo avoids
duplicating built work.

## Required changes

1. AOI dwell-time demo. If a dwell demo already exists, surface/extend it.
2. Use real calibrated gaze only when validation passes; otherwise a clearly labelled
   pointer mode.

## Do not implement

Do not:
- build a second dwell demo if one exists;
- present pointer-mode data as calibrated gaze.

## Acceptance criteria

Dwell time per AOI is shown for the active mode (extended, not duplicated).

## Automated checks

```bash
npm run build
npm run test
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- On Step 7, confirm dwell time per AOI is shown and the active input mode is labelled.

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main`
using this file's exact filename (`076a_step7_aoi_dwell_demo.md`) as the commit message,
then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
