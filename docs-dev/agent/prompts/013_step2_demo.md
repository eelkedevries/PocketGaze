# Task: Build the Step 2 feature-overlay demo and panels

## Goal

Wire feature extraction into the Step 2 page: a live overlay of landmarks/eye regions/iris
proxy as the main demo, with feature subprocess panels under the master control.

## Scope

Step 2 demo UI only. Reuse the module from `012`.

## Context

Implements specification §3.2 (Step 2 demo and panels), §2.5, §2.6.

## Required changes

1. Replace the Step 2 live-demo placeholder with a camera preview overlaying landmarks,
   left/right eye regions, and the iris/pupil proxy, plus per-eye open/closed and quality
   indicators.
2. Add subprocess panels (raw landmark set, per-eye region markers, eye-aspect-ratio/
   openness values, per-eye quality) shown only when the master control is enabled.
3. Handle low-quality/occluded states gracefully.

## Do not implement

Do not:
- add head pose, eye-local signal, or gaze;
- add a second show/hide control;
- export data.

## Acceptance criteria

The task is complete when:
- Step 2 shows live feature overlays on the camera preview;
- feature panels appear only when "Show implementation details" is enabled;
- degraded tracking is handled gracefully;
- `npm run build` passes.

## Checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main` using
this file's exact filename (`013_step2_demo.md`) as the commit message, then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
