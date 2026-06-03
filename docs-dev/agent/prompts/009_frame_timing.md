# Task: Add frame timing and dropped/repeated-frame checks

## Goal

Add per-frame timing on top of the camera module using
`HTMLVideoElement.requestVideoFrameCallback` with a fallback, and detect dropped/repeated
frames, writing timing into the shared session model.

## Scope

Frame timing and frame-quality checks only. No feature extraction.

## Required reading

Read before editing:
1. `docs-dev/reference/primary_authoritative/specification.md` §3.1, §4 (timing fields),
   §4.1 (`time_ms` convention).
2. `docs-dev/reviews/runtime_qa_checklist.md` (camera rows).
3. Source: the camera module from `008`; the session model from `007b`.

## Dependencies

This prompt assumes:
- `008_camera_access.md` is complete (camera module under `src/lib/`).
- `007b_shared_data_session_model.md` is complete (timing fields exist in the model).
If either is missing, stop and report.

## Context

Builds on the camera module; keep timing logic in a reusable `src/lib/` module.

## Required changes

1. Drive a per-frame callback via `requestVideoFrameCallback` where available, with a
   documented fallback (e.g. `requestAnimationFrame`) when it is not.
2. Compute and expose the timing fields, effective vs nominal frame rate, and
   dropped/repeated-frame indicators, written into the session model.
3. Keep `time_ms` as milliseconds from session start, shared with other subsystems.

## Do not implement

Do not:
- add feature extraction, head pose, or gaze;
- build the Step 1 demo UI (that is `010`);
- add file export.

## Data contracts touched

Adds (writes into the `007b` model): `time_ms`, `frame_id`, `video_frame_time`,
`capture_time`, `processing_latency_ms`.
Preserves: existing sample row structure and raw-vs-filtered separation.
Does not: change export format or add raw-video storage.

## Acceptance criteria

The task is complete when:
- a per-frame callback runs with `requestVideoFrameCallback` (and falls back cleanly);
- timing fields and effective FPS are computed and written to the session model;
- dropped/repeated frames are detected.

## Automated checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- With the camera running, confirm a live per-frame callback and a plausible effective FPS.
- Force a fallback path (a browser without `requestVideoFrameCallback`, or a guard) and
  confirm timing still works.
- See `docs-dev/reviews/runtime_qa_checklist.md` (camera; capability-missing rows).

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main` using
this file's exact filename (`009_frame_timing.md`) as the commit message, then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
