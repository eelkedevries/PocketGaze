# Task: Fit the calibration regression mapping

## Goal

Fit a mapping from features/eye-local signal to screen coordinates using the calibration
samples, and compute calibration-quality (error/consistency) from held-out targets, with
deterministic unit tests.

## Scope

The mapping fit and quality checks only. No Step 5 demo UI (that is `023`).

## Required reading

Read before editing:
1. `docs-dev/reference/primary_authoritative/specification.md` §3.5, §6.3, §4
   (`mapping_model_id`).
2. Source: the calibration samples from `021`; the screen-gaze module (`019`); the `007b`
   session model.

## Dependencies

This prompt assumes:
- `021_follow_the_dots_task.md` is complete (calibration samples available).
If samples are unavailable, stop and report.

## Context

Pure, deterministic logic — unit-tested with `node --test`.

## Required changes

1. Fit a transparent regression mapping from the calibration samples to screen x/y.
2. Compute a calibration-quality estimate from held-out/repeated targets and surface a
   warning/recalibration signal when quality is poor.
3. Make the fitted mapping available to the screen-gaze path; add `node --test` tests using
   synthetic samples (known mapping recovered; held-out error computed).

## Do not implement

Do not:
- build the Step 5 demo UI (that is `023`);
- add filtering/events;
- overclaim accuracy (§6.3).

## Data contracts touched

Adds: `mapping_model_id` and the fitted-mapping reference used by screen gaze; a
calibration-quality value.
Preserves: calibration rows and the signal-type separation.
Does not: change export format.

## Acceptance criteria

The task is complete when:
- a mapping is fitted from calibration samples and applied to produce screen coordinates;
- a calibration-quality value is computed and a poor-quality warning is possible;
- `npm run test` covers the fit and passes.

## Automated checks

```bash
npm run build
npm run test
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- Confirm the mapping unit tests run (not zero tests) and pass.
- After running calibration in the app, confirm an error/quality value is produced and a
  poor-quality case triggers a recalibration prompt.

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main` using
this file's exact filename (`022_regression_mapping.md`) as the commit message, then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
