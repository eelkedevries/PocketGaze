# Task: Add the warped-grid calibration visualisation

## Goal

On Step 5, visualise the fitted calibration mapping as a **warped grid** — a
deformation field from screen space to gaze space — to give the most intuitive
possible picture of what calibration does, with the warping typically largest at
the edges (previewing the validation error pattern).

## Scope

Step 5 visualisation only (same demo/file). Reuse the fitted mapping; no new
calibration maths.

## Required reading

1. `docs-dev/reference/primary_authoritative/specification.md` §3.5, §6.3, §2.5,
   §2.6.
2. Source: `src/demos/step5.tsx`, `src/lib/regressionGaze.ts`
   (`applyMapping`), `src/lib/gazeCalibration.ts`.

## Dependencies

Assumes `022` (fitted mapping) and `023` (Step 5 demo) are complete. If the fitted
mapping is unavailable, stop and report.

## Rationale

A deformation field is the clearest single picture of what a calibration mapping
does; its larger edge warping previews the edge/corner error seen in validation.

## Required changes

1. After a mapping is fitted, sample a regular grid of screen positions, apply the
   inverse/forward mapping (document the direction shown), and render the resulting
   warped grid over a screen schematic so the deformation is visible.
2. Caption what the warp means (how eye-local input maps to screen position) and
   note that edge warping foreshadows higher edge/corner error (§6.3 — qualitative).
3. Surface any numeric detail through the existing master control; handle the
   "no mapping yet" state with a clear placeholder.

## Do not implement

Do not:
- add new calibration/mapping maths (reuse `022`/`applyMapping`);
- claim the warp is a measured accuracy field;
- add a second master show/hide control.

## Data contracts touched

Adds: none (live visualisation only). Preserves the session model.

## Acceptance criteria

- a warped grid renders from the fitted mapping after calibration;
- a caption explains the deformation and links it to edge error;
- a clear placeholder is shown before any mapping exists.

## Automated checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- Calibrate on Step 5; confirm a warped grid appears and that it deforms more
  toward the edges.

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main`
using this file's exact filename (`054_calibration_warped_grid.md`) as the commit
message, then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
