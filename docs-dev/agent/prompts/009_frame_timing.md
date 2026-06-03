# Task: Add frame timing and dropped/repeated-frame checks

## Goal

Add per-frame timing on top of the camera module using
`HTMLVideoElement.requestVideoFrameCallback` with a fallback, and detect dropped/repeated
frames.

## Scope

Frame timing and frame-quality checks only. No feature extraction.

## Context

Implements specification §3.1 (timing) and the §4 timing field group (`time_ms`,
`frame_id`, `video_frame_time`, `capture_time`, `processing_latency_ms`). Builds on the
camera module from `008`.

## Required changes

1. Drive a per-frame callback via `requestVideoFrameCallback` where available, with a
   documented fallback (e.g. `requestAnimationFrame`) when it is not.
2. Compute and expose the timing fields, effective vs nominal frame rate, and
   dropped/repeated-frame indicators.
3. Keep timing logic in a reusable `src/lib/` module separate from React presentation.

## Do not implement

Do not:
- add feature extraction, head pose, or gaze;
- build the Step 1 demo UI (that is `010`);
- persist or export data yet.

## Acceptance criteria

The task is complete when:
- a per-frame callback runs with `requestVideoFrameCallback` (and falls back cleanly);
- timing fields and effective FPS are computed and observable (e.g. via console/state);
- dropped/repeated frames are detected;
- `npm run build` passes.

## Checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main` using
this file's exact filename (`009_frame_timing.md`) as the commit message, then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
