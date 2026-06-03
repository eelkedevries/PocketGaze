# Task: Technical spike — choose the head-pose method

## Goal

Compare candidate browser-local head-pose methods and decide which to use for estimating
head rotation (yaw/pitch/roll) and approximate translation, then record the decision in the
specification.

## Scope

A time-boxed technical spike and a written decision. Guarded/throwaway prototype code only;
no production head-pose module.

## Required reading

Read before editing:
1. `docs-dev/reference/primary_authoritative/specification.md` §3.3, §7.3 (head-pose row),
   §9, §2.8.
2. `docs-dev/reference/secondary_background/overview.md` §1.3.
3. Source: the feature module (`012`) providing landmarks.

## Dependencies

This prompt assumes:
- `012_feature_extraction.md` is complete (landmarks available).
If landmarks are unavailable, stop and report.

## Context

Unblocks `014b`. This split keeps method choice separate from implementation, matching the
landmark (`011`) and WebEyeTrack (`018`) spikes.

## Required changes

1. Compare candidate methods: pose output from the chosen landmark library; OpenCV.js
   `solvePnP`; and a Procrustes-style landmark-normalisation approach.
2. Assess: browser support, bundle size, performance on mid-range Android phones, output
   stability, whether yaw/pitch/roll and approximate translation are usable, implementation
   complexity, and whether it is good enough for the portfolio demo.
3. Record the recommendation and rationale in specification §7.3/§9 (bump the spec version),
   noting the monocular-translation caveat.

## Do not implement

Do not:
- build the production head-pose module (that is `014b`);
- add motion-quality labelling or the Step 3 demo;
- attempt phone IMU access (out of scope for browser).

## Data contracts touched

Adds: none (decision only).
Preserves: the `007b` session model.
Does not: change the export schema.

## Acceptance criteria

The task is complete when:
- a justified head-pose method is recorded in the spec (version bumped);
- bundle-size, performance, and stability implications are documented.

## Automated checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- If a guarded prototype was used, confirm it does not ship in the production build.
- Confirm the spec records the method decision and version bump.

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main` using
this file's exact filename (`014_head_pose_method_spike.md`) as the commit message, then
push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
