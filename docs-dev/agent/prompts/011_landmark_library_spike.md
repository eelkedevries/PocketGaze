# Task: Technical spike — choose the landmark library

## Goal

Evaluate Human vs MediaPipe FaceLandmarker (Web) and decide which to use for browser-local
face/eye/iris/eyelid feature extraction, then record the decision in the specification.

## Scope

A time-boxed technical spike and a written decision. Minimal throwaway/guarded prototype
code is acceptable; no production feature integration.

## Required reading

Read before editing:
1. `docs-dev/reference/primary_authoritative/specification.md` §7.3, §9, §3.2.
2. `docs-dev/reference/secondary_background/smartphone_eye_tracking_background.md` §9.
3. Source: the camera (`008`) and timing (`009`) modules.

## Dependencies

This prompt assumes:
- `008_camera_access.md` and `009_frame_timing.md` are complete (a live frame source for
  prototyping).
If the camera/timing modules are missing, stop and report.

## Context

Unblocks `012`. Pre-use checks are in background §9.

## Required changes

1. Compare the candidates on: licence/self-hosting, model hosting, browser support and
   performance on mid-range phones, separate left/right eye access, iris/pupil proxy, and
   blink/eye-state availability.
2. Record the recommendation and rationale, and update specification §7.3/§9 to move the
   feature-library choice from open to locked (bump the spec version).
3. Note any model assets that must be self-hosted (no external CDN reliance).

## Do not implement

Do not:
- build the production feature-extraction module (that is `012`);
- add overlays or the Step 2 demo;
- commit large model binaries without confirming licence and the build-size limit.

## Data contracts touched

Adds: none (decision only).
Preserves: the `007b` session model.
Does not: change the export schema.

## Acceptance criteria

The task is complete when:
- a clear, justified library choice is recorded in the specification (version bumped);
- self-hosting and browser-support implications are documented.

## Automated checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- If a guarded prototype was used, confirm it is removed or clearly gated and does not ship
  in the production build.
- Confirm the spec records the decision and version bump.

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main` using
this file's exact filename (`011_landmark_library_spike.md`) as the commit message, then
push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
