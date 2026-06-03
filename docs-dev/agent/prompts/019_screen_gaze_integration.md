# Task: Integrate optional screen-gaze estimation

## Goal

Add an optional screen-gaze estimation path (per the `018` decision), producing screen x/y
with availability and confidence in the shared session model, kept strictly distinct from
the eye-local signal.

## Scope

The screen-gaze module only. No calibration UI (that is Phase F), no Step 4 demo UI (that
is `020`).

## Required reading

Read before editing:
1. `docs-dev/reference/primary_authoritative/specification.md` §3.4, §6.2, §6.3, §4
   (screen-gaze fields).
2. Source: the `018` decision; the eye-local module (`017`); the `007b` session model.

## Dependencies

This prompt assumes:
- `018_webeyetrack_spike.md` is complete with a recorded go/no-go.
- `017_eye_local_signal.md` and `007b` are complete.
If `018` is not decided, stop and report. If `018` was no-go, implement the recorded
fallback instead of WebEyeTrack.

## Context

Screen gaze must remain a separate signal from eye-local (§6.2).

## Required changes

1. Add a screen-gaze module that outputs `gaze_x/y`, `gaze_available`, and
   `gaze_confidence` into the session model, self-hosting any assets.
2. Keep eye-local and screen-gaze separate in code and types; never relabel eye-local as
   screen gaze.
3. Make screen gaze degrade cleanly to "unavailable" when no valid mapping/model exists.

## Do not implement

Do not:
- build the calibration task (Phase F) or the Step 4 demo UI (`020`);
- present screen gaze as validated/accurate without calibration (§6.2, §6.3);
- add a second show/hide control.

## Data contracts touched

Adds (writes into the `007b` model): `gaze_x`, `gaze_y`, `gaze_available`,
`gaze_confidence`.
Preserves: eye-local fields and their separation from screen gaze.
Does not: change export format or store raw video.

## Acceptance criteria

The task is complete when:
- the module produces screen-gaze fields with availability/confidence (or the `018`
  fallback);
- eye-local and screen-gaze signals stay distinct.

## Automated checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- Confirm screen gaze reports "unavailable" before calibration exists.
- If assets are used, confirm they load same-origin (no external CDN).
- See `docs-dev/reviews/runtime_qa_checklist.md` (camera; build-hygiene rows).

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main` using
this file's exact filename (`019_screen_gaze_integration.md`) as the commit message, then
push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
