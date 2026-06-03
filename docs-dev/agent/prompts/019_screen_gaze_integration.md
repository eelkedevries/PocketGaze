# Task: Integrate optional screen-gaze estimation (provider interface + regression provider)

## Goal

Add the screen-gaze provider abstraction (per the `018b` decision): a common
`ScreenGazeProvider` interface, a registry/selector defaulting to provider **A**, and
provider **A** itself — a custom regression mapping that applies a fitted eye-local → screen
mapping — producing screen x/y with availability and confidence in the shared session model,
kept strictly distinct from the eye-local signal.

## Scope

The provider interface + registry + provider **A** (regression mapping apply) only. The
WebEyeTrack adapter (provider **B**) is `019b`; calibration fitting is `022`; the Step 4 demo
and its selector are `020`. No calibration UI here, no Step 4 demo UI.

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

1. Define a framework-agnostic `ScreenGazeProvider` interface (id, label,
   `requiresCalibration`, optional `init`/`dispose`, and `estimate(input)`), a shared
   `ScreenGazeInput`/`ScreenGazeEstimate` shape, and a helper mapping an estimate to the §4
   screen-gaze fields (`gaze_x_raw`, `gaze_y_raw`, `gaze_available`, `gaze_confidence`,
   `signal_type: 'screen_gaze'`).
2. Add a registry/selector holding the available providers with a selected provider,
   defaulting to provider **A**.
3. Add provider **A**: a custom regression mapping that, given a fitted linear
   eye-local → screen mapping, applies it to the eye-local signal (`017`); with no mapping it
   reports `gaze_available: false`. (Fitting the mapping is `022`.)
4. Keep eye-local and screen-gaze separate in code and types; never relabel eye-local as
   screen gaze.

## Do not implement

Do not:
- install `webeyetrack`/TensorFlow.js or build provider **B** (that is `019b`);
- fit the calibration mapping (`022`) or build the Step 4 demo UI/selector (`020`);
- present screen gaze as validated/accurate without calibration (§6.2, §6.3);
- add a second show/hide control.

## Data contracts touched

Writes into the `007b` model: `gaze_x_raw`, `gaze_y_raw`, `gaze_available`,
`gaze_confidence`, `signal_type` (`screen_gaze`).
Preserves: eye-local fields and their separation from screen gaze.
Does not: change export format or store raw video.

## Acceptance criteria

The task is complete when:
- a `ScreenGazeProvider` interface, a registry defaulting to provider **A**, and provider
  **A** exist; provider **A** applies a fitted mapping and degrades to "unavailable" with no
  mapping;
- the estimate maps to the §4 screen-gaze fields; eye-local and screen-gaze stay distinct.

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
