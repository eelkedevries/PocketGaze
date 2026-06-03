# Task: Build the Step 1 live demo and timing panels

## Goal

Wire the camera and timing modules into the Step 1 page: a live preview with a frame-rate/
timing readout as the main demo, and timing subprocess panels under the master control.

## Scope

Step 1 demo UI only. Reuse the modules from `008` and `009`.

## Context

Implements specification §3.1 (Step 1 demo and panels), §2.5 (master control), §2.6 (page
structure).

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
- export data.

## Acceptance criteria

The task is complete when:
- Step 1 shows a working camera preview with live FPS/timing;
- the timing panels appear only when "Show implementation details" is enabled;
- denied/unsupported camera is handled gracefully;
- `npm run build` passes.

## Checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main` using
this file's exact filename (`010_step1_demo.md`) as the commit message, then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
