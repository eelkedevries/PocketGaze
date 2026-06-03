# Task: Add head-motion quality labelling

## Goal

Add head-motion quality labelling (low / moderate / uncertain) and rejection of uncertain
intervals, building on the head-pose module, with deterministic unit tests.

## Scope

Motion-quality logic only. No Step 3 demo UI.

## Required reading

Read before editing:
1. `docs-dev/reference/primary_authoritative/specification.md` §3.3, §5 (head-motion
   labels), §4.
2. Source: the head-pose module (`014b`); the `007b` session model.

## Dependencies

This prompt assumes:
- `014b_head_pose_estimation.md` is complete (head pose in the session model).
If head pose is unavailable, stop and report.

## Context

Pure, deterministic logic — unit-tested with `node --test` (§ testing policy).

## Required changes

1. Add logic that labels samples/intervals by head-motion contamination (low / moderate /
   uncertain) using documented thresholds.
2. Mark uncertain intervals so they can be excluded from later event detection.
3. Keep thresholds documented and configurable; add `node --test` unit tests for the
   labelling given synthetic pose sequences.

## Do not implement

Do not:
- build the Step 3 demo UI (that is `016`);
- add eye-local signal, gaze, or event detection;
- hard-code device-specific magic numbers without documenting them.

## Data contracts touched

Adds (writes into the `007b` model): `head_motion_label` on samples/intervals.
Preserves: head-pose fields and raw-vs-filtered separation.
Does not: change export format.

## Acceptance criteria

The task is complete when:
- samples/intervals receive a head-motion label;
- uncertain intervals are flagged for exclusion;
- thresholds are documented and `npm run test` covers the labelling and passes.

## Automated checks

```bash
npm run build
npm run test
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- Confirm the labelling unit tests run (not zero tests) and pass.
- With the camera running, move the head and confirm the label shifts low→moderate→uncertain
  as expected.

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main` using
this file's exact filename (`015_motion_quality_labelling.md`) as the commit message, then
push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
