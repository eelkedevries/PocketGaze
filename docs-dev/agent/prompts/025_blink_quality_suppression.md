# Task: Add blink suppression and quality thresholding

## Goal

Mark/exclude samples during eye closure (blinks) and flag invalid/uncertain samples using
confidence/quality fields, so invalid data does not reach event detection, with
deterministic unit tests.

## Scope

Blink suppression and quality thresholding only. No event detection (that is `026`).

## Required reading

Read before editing:
1. `docs-dev/reference/primary_authoritative/specification.md` §3.6, §4 (blink/eye-state
   fields), §5 (`tracking_lost`).
2. Source: the feature/eye-state outputs (`012`); the filter (`024`); the `007b` model.

## Dependencies

This prompt assumes:
- `012_feature_extraction.md` (eye-state) and `024_one_euro_filter.md` are complete.
If they are missing, stop and report.

## Context

Pure, deterministic logic — unit-tested with `node --test`.

## Required changes

1. Detect eye-closure intervals and mark samples as blink (`blink_state`).
2. Apply quality thresholds to flag invalid/uncertain samples and emit `tracking_lost`
   where tracking is unavailable/below threshold.
3. Document thresholds; add `node --test` tests (blink interval detection; threshold
   behaviour on synthetic quality series).

## Do not implement

Do not:
- add velocity/displacement event detection (that is `026`);
- build the Step 6 demo UI (that is `027`);
- silently drop raw data.

## Data contracts touched

Adds (writes into the `007b` model): `blink_state`; `tracking_lost` events; validity flags
driven by quality thresholds.
Preserves: raw and filtered signal columns.
Does not: change export format.

## Acceptance criteria

The task is complete when:
- blink intervals are marked and excluded from downstream validity;
- low-quality samples are flagged and `tracking_lost` is emitted appropriately;
- thresholds are documented and `npm run test` covers them and passes.

## Automated checks

```bash
npm run build
npm run test
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- Confirm the suppression unit tests run (not zero tests) and pass.
- Blink / look away in the app; confirm samples are marked blink / `tracking_lost`.

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main` using
this file's exact filename (`025_blink_quality_suppression.md`) as the commit message, then
push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
