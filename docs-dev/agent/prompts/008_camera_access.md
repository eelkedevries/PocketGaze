# Task: Add browser camera access with a consent flow

## Goal

Add a shared, reusable camera-access module using `getUserMedia`, with a clear
permission/consent flow and graceful failure, as the foundation for Step 1+ demos.

## Scope

Camera acquisition only. No frame timing, feature extraction, or per-step demo UI yet.

## Required reading

Read before editing:
1. `docs-dev/reference/primary_authoritative/specification.md` §3.1, §2.7, §2.8.
2. `docs-dev/reviews/runtime_qa_checklist.md` (camera rows).
3. Source: `src/lib/` (where the module goes), the session model from `007b`.

## Dependencies

This prompt assumes:
- `007b_shared_data_session_model.md` is complete (session model under `src/lib`/`src/types`).
If the session model is missing, stop and report rather than improvising a new data shape.

## Context

Place reusable logic under `src/lib/` per §2.3, separate from React presentation.

## Required changes

1. Add a camera module that requests the front camera via `getUserMedia`, exposes the
   stream/video element, and releases the stream when stopped.
2. Add a consent/permission UI state: prompt before access, handle granted/denied, and show
   a clear message when the camera is unavailable or denied (no broken page).
3. Do not auto-start the camera on page load; start only on explicit user action.

## Do not implement

Do not:
- add frame-timing logic or `requestVideoFrameCallback` (that is `009`);
- add feature extraction or tracking;
- store or upload any frames.

## Data contracts touched

Adds: none to the export schema (camera lifecycle only).
Preserves: the `007b` session model untouched.
Does not: store frames or raw video.

## Acceptance criteria

The task is complete when:
- a user action starts the front camera and shows a live preview;
- denial/unavailability shows a clear, non-breaking message;
- stopping releases the camera stream.

## Automated checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- Start the camera via the user action; confirm the preview appears.
- Deny permission; confirm a clear, non-breaking error state.
- Stop the camera; confirm the OS/browser camera indicator turns off (stream released).
- Confirm the camera does not auto-start on load.
- See `docs-dev/reviews/runtime_qa_checklist.md` (camera rows).

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main` using
this file's exact filename (`008_camera_access.md`) as the commit message, then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
