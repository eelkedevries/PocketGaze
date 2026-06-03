# Task: Fit the calibration regression mapping

## Goal

Fit a mapping from features/eye-local signal to screen coordinates using the calibration
samples, and compute calibration-quality (error/consistency) from held-out targets.

## Scope

The mapping fit and quality checks only. No Step 5 demo UI (that is `023`).

## Context

Implements specification §3.5 (regression mapping, calibration-quality checks), §4
(`mapping_model_id`). Uses samples from `021`; produces the mapping used by screen gaze.

## Required changes

1. Fit a transparent regression mapping from the calibration samples to screen x/y.
2. Compute a calibration-quality estimate from held-out/repeated targets and surface a
   warning/recalibration signal when quality is poor.
3. Make the fitted mapping available to the screen-gaze path; keep logic in `src/lib/`.

## Do not implement

Do not:
- build the Step 5 demo UI (that is `023`);
- add filtering/events;
- overclaim accuracy (§6.3).

## Acceptance criteria

The task is complete when:
- a mapping is fitted from calibration samples and applied to produce screen coordinates;
- a calibration-quality value is computed and a poor-quality warning is possible;
- `npm run build` passes.

## Checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main` using
this file's exact filename (`022_regression_mapping.md`) as the commit message, then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
