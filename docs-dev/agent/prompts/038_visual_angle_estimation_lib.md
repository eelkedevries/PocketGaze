# Task: Add the visual-angle (IPD-based) estimation library

## Goal

Add a pure module that estimates an approximate **viewing distance** and an
**angular scale** (degrees of visual angle per normalised/CSS-pixel unit) from the
inter-ocular landmark separation in the image, an assumed mean inter-pupillary
distance, and the camera's approximate field of view — so downstream code can
express signals in degrees, heavily caveated as estimates.

## Scope

The estimation maths only (pure, unit-tested). No session-model wiring (that is
`039`), no degree display (that is `040`), no explainer (that is `040`).

## Required reading

1. `docs-dev/reference/primary_authoritative/specification.md` §3.3
   (monocular-translation caveat), §6.3 (do not overclaim), §3.4.
2. Source: `src/lib/eyeGeometry.ts` (iris/eye landmark indices), `src/lib/headPose.ts`.

## Dependencies

Assumes `012` (feature extraction provides eye landmarks) exists, but this module
is pure and consumes supplied landmark points, so it is testable in isolation. If
the eye-geometry helpers are missing, stop and report.

## Rationale

Eye tracking is expressed in degrees of visual angle, but a browser cannot read
physical pixel pitch or true viewing distance. Inter-ocular separation in the
image plus an assumed IPD (~63 mm) and an approximate camera FOV yields a usable
**estimate** of distance and angular scale — and a strong teaching point about why
a selfie camera can only approximate dva.

## Required changes

1. Add `src/lib/visualAngle.ts` with documented pure functions:
   - `estimateViewingDistanceMm({ iod_px, image_width_px, assumed_ipd_mm, hfov_deg })`
     using the pinhole relation; sane defaults (`assumed_ipd_mm = 63`, a documented
     default HFOV) overridable;
   - `degreesPerPixel(distance_mm, px_pitch_mm?)` and a normalised-unit variant
     `degreesPerNormalised(distance_mm, screen_dim_mm?)`, with explicit assumptions
     where physical dimensions are unknown;
   - a single `estimateAngularScale(input)` returning distance plus the conversion
     factors and an `is_estimate: true`/assumptions record.
2. Guard degenerate inputs (zero IOD, zero image width) with finite, documented
   fallbacks.
3. Add `node --test` unit tests: a hand-computed distance for known IOD/FOV;
   monotonic distance↔scale behaviour; degenerate inputs return documented values.

## Do not implement

Do not:
- write into the session model (that is `039`);
- display degrees or build the explainer (that is `040`);
- claim metric accuracy — every output is an estimate (§6.3).

## Data contracts touched

Adds: pure functions only. No session-model fields here.

## Acceptance criteria

- viewing-distance and angular-scale estimates are computed from IOD + assumptions;
- assumptions and the `is_estimate` flag are explicit in the output;
- `npm run test` covers the maths (including degenerate inputs) and passes.

## Automated checks

```bash
npm run build
npm run test
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- Confirm the unit tests run (not zero tests) and pass.

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main`
using this file's exact filename (`038_visual_angle_estimation_lib.md`) as the
commit message, then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
