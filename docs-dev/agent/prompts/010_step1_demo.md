# Task: Build the Step 1 live demo and timing panels

## Goal

Wire the camera and timing modules into the Step 1 page: a live preview with a frame-rate/
timing readout as the main demo, and timing subprocess panels under the master control.

## Scope

Step 1 demo UI only. Reuse the modules from `008` and `009`.

## Required reading

Read before editing:
1. `docs-dev/reference/primary_authoritative/specification.md` §3.1, §2.5, §2.6.
2. `docs-dev/reviews/runtime_qa_checklist.md` (camera rows).
3. Source: the camera (`008`) and timing (`009`) modules; `src/components/StepPage.tsx`.

## Dependencies

This prompt assumes:
- `008_camera_access.md` and `009_frame_timing.md` are complete.
- The camera and timing modules exist under `src/lib/`.
If any is missing, stop and report.

## Context

Implements the Step 1 demo and panels using the shared master control (§2.5).

## Required changes

1. Replace the Step 1 live-demo placeholder with a camera preview plus a live readout of
   effective frame rate and per-frame timing.
2. Add implementation/subprocess panels (frame timeline, capture vs processing timestamps,
   dropped/repeated-frame indicators) shown only when the master control is enabled.
3. Handle camera-denied/unsupported states gracefully within the demo.

## Do not implement

Do not:
- add feature extraction, head pose, or gaze;
- add a second show/hide control;
- add file export.

## Acceptance criteria

The task is complete when:
- Step 1 shows a working camera preview with live FPS/timing;
- the timing panels appear only when "Show implementation details" is enabled;
- denied/unsupported camera is handled gracefully.

## Automated checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- Open Step 1, start the camera, and confirm preview + live FPS/timing.
- Enable "Show implementation details"; confirm the timing panels appear (and hide when
  disabled).
- Deny the camera; confirm a graceful state. Stop the camera; confirm the stream releases.
- See `docs-dev/reviews/runtime_qa_checklist.md` (camera; toggle rows).

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main` using
this file's exact filename (`010_step1_demo.md`) as the commit message, then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
