# Task: Add blink suppression and quality thresholding

## Goal

Mark/exclude samples during eye closure (blinks) and flag invalid/uncertain samples using
confidence/quality fields, so invalid data does not reach event detection.

## Scope

Blink suppression and quality thresholding only. No event detection (that is `026`).

## Context

Implements specification §3.6 (blink suppression, quality-thresholding), §4 blink/eye-state
fields (`left/right_eye_open`, `blink_state`), and the `tracking_lost` label (§5). Uses
eye-state from `012` and quality from earlier modules.

## Required changes

1. Detect eye-closure intervals and mark samples as blink (`blink_state`).
2. Apply quality thresholds to flag invalid/uncertain samples and emit `tracking_lost`
   where tracking is unavailable/below threshold.
3. Document thresholds; keep logic in `src/lib/`.

## Do not implement

Do not:
- add velocity/displacement event detection (that is `026`);
- build the Step 6 demo UI (that is `027`);
- silently drop raw data.

## Acceptance criteria

The task is complete when:
- blink intervals are marked and excluded from downstream validity;
- low-quality samples are flagged and `tracking_lost` is emitted appropriately;
- thresholds are documented;
- `npm run build` passes.

## Checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main` using
this file's exact filename (`025_blink_quality_suppression.md`) as the commit message, then
push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
