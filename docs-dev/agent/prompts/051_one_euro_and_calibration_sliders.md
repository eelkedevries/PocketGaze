# Task: Add the filter and calibration degradation controls

## Goal

Add two small interactive controls that let the viewer feel a trade-off by
degrading the system: a **One Euro `beta` slider** on the filtering demo (lag vs
jitter) and a **drop-calibration-points** control on the calibration demo (fewer
points → higher validation error).

## Scope

Two demo controls only. Reuse existing filtering, calibration, and validation
modules; no new maths. Touches the Step 6 and Step 5 demos.

## Required reading

1. `docs-dev/reference/primary_authoritative/specification.md` §3.5, §3.6, §6.3,
   §2.5.
2. Source: `src/lib/oneEuroFilter.ts`, `src/demos/step6.tsx`,
   `src/lib/gazeCalibration.ts`, `src/demos/calibrationTask.tsx`,
   `src/demos/step5.tsx`.

## Dependencies

Assumes `024` (One Euro filter) and `022` (calibration fit) are complete; the
calibration dropout control benefits from validation (`035`/`036`) if present but
can fall back to the calibration RMS. If the filter or calibration fit is missing,
stop and report.

## Rationale

Interactive degradation converts passive readers into people who have formed an
intuition: the `beta` slider makes the lag/jitter trade-off felt, and dropping
calibration points makes the value of dense calibration visible in the error.

## Required changes

1. **Step 6 — `beta` slider:** expose the One Euro `beta` (and optionally
   `minCutoff`) as a live control bounded to a documented range; the raw vs filtered
   traces update live so over-/under-smoothing is observable. Default to
   `DEFAULT_ONE_EURO_PARAMS`.
2. **Step 5 — calibration dropout:** let the user reduce the number of calibration
   points used for the fit (e.g. 9 → 5 → 3) and refit, then show validation error
   (or calibration RMS) rising as points are dropped.
3. Both controls are clearly demo controls (not the master toggle); add brief
   captions naming the trade-off.

## Do not implement

Do not:
- add new filtering or calibration maths (reuse existing modules);
- add a second master show/hide control;
- alter the exported schema.

## Data contracts touched

Adds: none (live demo controls only). Preserves the session model.

## Acceptance criteria

- the Step 6 `beta` slider visibly changes the filtered trace's lag/jitter;
- the Step 5 dropout control refits on fewer points and shows error increasing as
  points are dropped;
- both are demo controls, not a second details toggle.

## Automated checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- Move the `beta` slider and watch the filtered trace trade lag against jitter.
- Drop calibration points, refit, and confirm validation/calibration error rises.

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main`
using this file's exact filename (`051_one_euro_and_calibration_sliders.md`) as the
commit message, then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
