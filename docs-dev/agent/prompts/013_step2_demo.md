# Task: Build the Step 2 feature-overlay demo and panels

## Goal

Wire feature extraction into the Step 2 page: a live overlay of landmarks/eye regions/iris
proxy as the main demo, with feature subprocess panels under the master control.

## Scope

Step 2 demo UI only. Reuse the module from `012`.

## Required reading

Read before editing:
1. `docs-dev/reference/primary_authoritative/specification.md` §3.2, §2.5, §2.6.
2. `docs-dev/reviews/runtime_qa_checklist.md` (camera rows).
3. Source: the feature module (`012`); `src/components/StepPage.tsx`.

## Dependencies

This prompt assumes:
- `012_feature_extraction.md` is complete (feature module under `src/lib/`).
- `008`/`009` (camera/timing) are complete.
If any is missing, stop and report.

## Context

Implements the Step 2 demo and panels using the shared master control (§2.5).

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
- add file export.

## Acceptance criteria

The task is complete when:
- Step 2 shows live feature overlays on the camera preview;
- feature panels appear only when "Show implementation details" is enabled;
- degraded tracking is handled gracefully.

## Automated checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- Open Step 2, start the camera, and confirm live landmark/eye/iris overlays.
- Cover an eye / look away; confirm graceful degradation and quality indicators.
- Toggle the master control; confirm the feature panels show/hide.
- See `docs-dev/reviews/runtime_qa_checklist.md` (camera; toggle rows).

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main` using
this file's exact filename (`013_step2_demo.md`) as the commit message, then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
