# Task: Add candidate event detection

## Goal

Detect candidate fixations and saccade-like events from the filtered, quality-checked
signal, attaching confidence and head-motion labels, using cautious candidate wording, with
deterministic unit tests.

## Scope

Event-detection logic only. No Step 6 demo UI (that is `027`).

## Required reading

Read before editing:
1. `docs-dev/reference/primary_authoritative/specification.md` §3.6, §5 (event vocabulary),
   §6.3.
2. Source: the filter (`024`), suppression/quality (`025`), motion labels (`015`); the
   `007b` model.

## Dependencies

This prompt assumes:
- `024_one_euro_filter.md`, `025_blink_quality_suppression.md`, and
  `015_motion_quality_labelling.md` are complete.
If any is missing, stop and report.

## Context

Pure, deterministic logic — unit-tested with `node --test`.

## Required changes

1. Detect `fixation_candidate` and `saccade_candidate` events via documented velocity/
   displacement criteria, excluding blink/`tracking_lost`/uncertain-motion intervals.
2. Apply head-motion context to label `saccade_head_still` vs
   `saccade_during_head_movement` vs `uncertain_head_motion`, and attach `event_confidence`.
3. Emit `event` rows with `event_type`, `event_start_ms`, `event_end_ms`,
   `event_confidence`, `head_motion_label`; add `node --test` tests on synthetic traces.

## Do not implement

Do not:
- build the Step 6 demo UI (that is `027`);
- present events as validated rather than candidates (§6.3);
- add content mapping or export.

## Data contracts touched

Adds (writes into the `007b` model): `event` rows with `event_type`, `event_start_ms`,
`event_end_ms`, `event_confidence`, `head_motion_label` (using the §5 vocabulary).
Preserves: sample rows; raw/filtered separation.
Does not: change export format.

## Acceptance criteria

The task is complete when:
- candidate fixations and saccades are detected with confidence and head-motion labels;
- invalid intervals are excluded and emitted events use the §5 vocabulary;
- `npm run test` covers detection and passes.

## Automated checks

```bash
npm run build
npm run test
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- Confirm the detection unit tests run (not zero tests) and pass.
- In the app, fixate then make a quick eye movement; confirm plausible candidate events.

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main` using
this file's exact filename (`026_event_detection.md`) as the commit message, then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
