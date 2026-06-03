# Task: Add browser camera access with a consent flow

## Goal

Add a shared, reusable camera-access module using `getUserMedia`, with a clear
permission/consent flow and graceful failure, as the foundation for Step 1+ demos.

## Scope

Camera acquisition only. No frame timing, feature extraction, or per-step demo UI yet.

## Context

Implements specification §3.1 (capture), §2.7 (privacy/consent), §2.8 (graceful
degradation). Place reusable logic under `src/lib/` per §2.3.

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

## Acceptance criteria

The task is complete when:
- a user action starts the front camera and shows a live preview;
- denial/unavailability shows a clear, non-breaking message;
- stopping releases the camera stream;
- `npm run build` passes.

## Checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main` using
this file's exact filename (`008_camera_access.md`) as the commit message, then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
