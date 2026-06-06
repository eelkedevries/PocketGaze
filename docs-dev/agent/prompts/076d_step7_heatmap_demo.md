# Task: Applied AOI examples on Step 7 — heatmap demo

## Goal

Render a heatmap on Step 7 with an explicit "qualitative" caution label, extending the
existing heatmap demo rather than building a second one.

## Scope

The heatmap demo on Step 7. Part of the Prompt 18 series; its own commit.

## Required reading

1. `docs-dev/reviews/current-state-audit.md` (Prompt 0) — whether a heatmap already exists.
2. The Step 7 heatmap demo and the fixation-aggregation module.

## Dependencies

Runs after the Phase 4 readiness gate (`072`). Use real calibrated gaze only when
validation passes; otherwise a clearly labelled pointer mode.

## Rationale

Heatmaps are easily over-interpreted; an explicit qualitative caution keeps the
presentation honest while surfacing existing work.

## Required changes

1. Heatmap demo. If a heatmap already exists, surface/extend it with the caution label.
2. Render the heatmap with an explicit "qualitative" caution label.
3. Use real calibrated gaze only when validation passes; otherwise a clearly labelled
   pointer mode.

## Do not implement

Do not:
- build a second heatmap if one exists;
- present the heatmap as quantitative.

## Acceptance criteria

The heatmap renders with an explicit "qualitative" caution label.

## Automated checks

```bash
npm run build
npm run test
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- On Step 7, confirm the heatmap renders with a visible "qualitative" caution label and
  the input mode is labelled.

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main`
using this file's exact filename (`076d_step7_heatmap_demo.md`) as the commit message,
then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
