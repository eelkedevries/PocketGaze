# Task: Integrate the visual-angle estimate into the pipeline

## Goal

Wire the visual-angle estimator (`038`) into the live feature pipeline so each
sample carries an estimated viewing distance and angular scale, and use that scale
to promote head-pose translation (especially `tz`) from "relative/unscaled" to
**roughly metric**, with the estimate clearly flagged as approximate.

## Scope

Session-model integration and head-pose translation scaling only. No degree
display in demos (that is `040`), no explainer (that is `040`).

## Required reading

1. `docs-dev/reference/primary_authoritative/specification.md` §3.3, §6.3, §4.3.
2. Source: `src/lib/featureExtraction.ts`, `src/lib/headPose.ts`,
   `src/lib/visualAngle.ts`, `src/types/session.ts`.

## Dependencies

Assumes `038` (visual-angle lib), `012` (features with eye landmarks), `014b`
(head pose) are complete. If `038` or head pose is missing, stop and report.

## Rationale

Once an approximate viewing distance exists, head-pose translation can be expressed
in roughly metric units rather than arbitrary ones, and an angular scale becomes
available to later steps — all as documented estimates, not measurements (§6.3).

## Required changes

1. In the feature pipeline, compute the angular-scale estimate per frame from the
   eye landmarks (image IOD + assumptions) and write additive fields to the sample
   row: `viewing_distance_mm`, `deg_per_norm_x`, `deg_per_norm_y`, and an
   `angular_scale_is_estimate` flag.
2. Use the estimated scale to convert head-pose translation into approximate
   millimetres (`head_tx/ty/tz` remain raw; add `head_tx_mm/ty_mm/tz_mm` or a
   clearly named scaled variant) without removing the raw values.
3. Keep all additions optional/blank when no face/landmarks are present (blank ≠ 0).
4. Document the monocular/assumption caveat in `headPose.ts`/`visualAngle.ts`
   comments and ensure existing tests still pass; add a small test if a new pure
   helper is introduced here.

## Do not implement

Do not:
- display degrees in any demo (that is `040`);
- present the metric translation as accurate (§3.3, §6.3);
- remove or overwrite the raw `head_tx/ty/tz` fields.

## Data contracts touched

Adds (writes into the `007b` model, additive): `viewing_distance_mm`,
`deg_per_norm_x`, `deg_per_norm_y`, `angular_scale_is_estimate`, and scaled
translation fields (`head_*_mm`). Preserves raw head-pose fields and raw/filtered
separation. Record the additions in `current_state.md`.

## Acceptance criteria

- each tracked sample carries an estimated viewing distance and angular scale,
  flagged as an estimate;
- head-pose translation is available in approximate mm alongside the raw values;
- fields are blank (not 0) when no face is detected.

## Automated checks

```bash
npm run build
npm run test
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- With the camera running, move closer/further and confirm the estimated viewing
  distance changes plausibly; confirm raw head-pose fields are unchanged.

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main`
using this file's exact filename (`039_dva_session_integration.md`) as the commit
message, then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
