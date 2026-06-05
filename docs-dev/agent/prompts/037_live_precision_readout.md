# Task: Add a live precision readout during fixation

## Goal

Add a reusable live **precision** indicator that computes rolling sample-to-sample
RMS (and optionally BCEA) over a short trailing window of the current gaze/eye
signal, so data quality is observable in real time — the standard way precision is
judged in practice.

## Scope

A small reusable readout (logic + a compact display component). No new task, no
new demo page; surface it where a live signal already runs (e.g. Step 4 and/or
Step 5).

## Required reading

1. `docs-dev/reference/primary_authoritative/specification.md` §3.6, §6.3, §2.5.
2. Source: `src/lib/validationMetrics.ts` (reuse `precisionRmsS2S`/`bcea`),
   `src/demos/step4.tsx`, `src/demos/step5.tsx`.

## Dependencies

Assumes `034` (metrics) is complete and a live signal exists (`017` eye-local;
`019` screen gaze). If `034` is missing, stop and report.

## Rationale

A live RMS-S2S figure lets a viewer feel how stillness, lighting, and head motion
change precision, connecting the abstract metric to the live image.

## Required changes

1. Add a small rolling-window precision helper (fixed-length ring buffer feeding
   `precisionRmsS2S`; optional BCEA), reusing `034` — no duplicated maths.
2. Add a compact `LivePrecision` display component showing the current rolling
   RMS-S2S (normalised units; degrees added later by `040`), with a clear "lower
   is steadier" caption and a sensible window length (documented).
3. Mount it in at least one live demo (Step 4 eye-local trace, or Step 5 after
   calibration), without disturbing existing controls.

## Do not implement

Do not:
- convert to degrees (that is `040`);
- present the figure as validated device precision (§6.3);
- add a second master show/hide control.

## Data contracts touched

Adds: none to the export schema (a live derived readout only). Preserves the
session model.

## Acceptance criteria

- a live rolling RMS-S2S precision figure updates from the current signal;
- the window length and units are documented in the UI;
- the helper reuses `034` (no duplicated metric maths).

## Automated checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- Start the camera; hold still then move/look away and confirm the precision
  figure rises and falls plausibly.

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main`
using this file's exact filename (`037_live_precision_readout.md`) as the commit
message, then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
