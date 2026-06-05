# Task: Add the validation task (separate from calibration)

## Goal

Add a follow-the-dots **validation** task that presents a fresh grid of targets
the calibration mapping has never seen, holds each fixation steady, and records
the concurrent screen-gaze estimate so accuracy and precision can be measured on
held-out points — kept explicitly distinct from calibration.

## Scope

The validation task UI and sample capture only. No metric display or error map
(that is `036`); no mapping fit (that is `022`). Reuse the calibration layout and
the fitted screen-gaze provider.

## Required reading

1. `docs-dev/reference/primary_authoritative/specification.md` §3.5, §6.2, §6.3,
   §4 (calibration/quality rows, task fields), §4.1 (timing convention).
2. Source: `src/demos/calibrationTask.tsx`, `src/lib/calibrationLayout.ts`,
   `src/lib/regressionGaze.ts`, `src/lib/sessionStore.ts`.

## Dependencies

Assumes `021` (follow-the-dots task), `022` (fitted mapping), and the
`RegressionGazeProvider` exist, and a mapping has been fitted before validation
runs. If the calibration task or provider is missing, stop and report.

## Rationale

Validation must use targets the mapping did not see; otherwise "error" only
reflects the fit, not on-screen accuracy. A distinct validation phase is the
field-standard way to report data quality.

## Required changes

1. Add a validation task component (e.g. `src/demos/validationTask.tsx`) that
   presents a target grid **offset from the calibration grid** (e.g. edge
   midpoints and an inner ring distinct from the 9 calibration points), with safe
   margins and phone-suitable target sizes, and a stop/reset control.
2. For each target, after a settle period, capture a short run of the **fitted
   screen-gaze estimate** (provider A), recording target position (CSS px and
   normalised), timestamp from the shared clock, and the estimate samples.
3. Write held-out validation samples to the session model so `036` can compute
   metrics: use `quality` rows tagged `task_phase: 'validation'` plus per-sample
   target/estimate pairs (do not relabel them as calibration).
4. Emit a `stimulus`/event marker per validation target distinct from
   `calibration_target`.

## Do not implement

Do not:
- compute accuracy/precision or draw the error map (that is `036`);
- refit the mapping during validation;
- add a second master show/hide control.

## Data contracts touched

Adds (writes into the `007b` model): `quality` rows with `task_phase: 'validation'`
carrying target (CSS + normalised) and the concurrent estimate; a validation
target marker. Defines no new row type. Preserves the calibration/validation
distinction in `task_phase`. Record the additive use in `current_state.md`.

## Acceptance criteria

- the validation grid runs through targets the calibration never used, with safe
  margins, phone-suitable sizes, and a working stop/reset;
- each target captures the fitted estimate plus target (CSS + normalised) and a
  shared-clock timestamp, written as `validation`-phase rows;
- calibration and validation rows remain distinguishable.

## Automated checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- Calibrate, then run validation on a ~360–414px viewport; confirm the validation
  targets differ from calibration targets and stop/reset works.
- Confirm validation rows are tagged `validation`, not `calibration`.

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main`
using this file's exact filename (`035_validation_task.md`) as the commit message,
then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
