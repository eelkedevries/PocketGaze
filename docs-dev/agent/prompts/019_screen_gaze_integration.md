# Task: Integrate optional screen-gaze estimation

## Goal

Add an optional screen-gaze estimation path (per the `018` decision), producing screen x/y
with availability and confidence, kept strictly distinct from the eye-local signal.

## Scope

The screen-gaze module only. No calibration UI (that is Phase F), no Step 4 demo UI (that
is `020`).

## Context

Implements specification §3.4 (screen-gaze estimation), §6.2 (signal separation), and the
§4 screen-gaze fields (`gaze_x/y`, `gaze_available`, `gaze_confidence`). Conditional on the
`018` go decision; if no-go, implement the chosen fallback instead.

## Required changes

1. Add a screen-gaze module that outputs `gaze_x/y`, `gaze_available`, and
   `gaze_confidence`, self-hosting any assets.
2. Ensure the eye-local and screen-gaze signals remain separate in code and types; never
   relabel eye-local as screen gaze.
3. Make screen gaze degrade cleanly to "unavailable" when no valid mapping/model exists.

## Do not implement

Do not:
- build the calibration task (Phase F) or the Step 4 demo UI (`020`);
- present screen gaze as validated/accurate without calibration (§6.2, §6.3);
- add a second show/hide control.

## Acceptance criteria

The task is complete when:
- the module produces screen-gaze fields with availability/confidence (or the `018`
  fallback);
- eye-local and screen-gaze signals stay distinct;
- `npm run build` passes.

## Checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main` using
this file's exact filename (`019_screen_gaze_integration.md`) as the commit message, then
push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
