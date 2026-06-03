# Task: Build the Step 4 signals demo and panels

## Goal

Wire the eye-local (and optional screen-gaze) signals into the Step 4 page: an eye-local
movement trace by default, an optional screen-gaze estimate when available, with the two
signal types visibly and terminologically distinct.

## Scope

Step 4 demo UI only. Reuse modules from `017` and `019`.

## Context

Implements specification §3.4 (Step 4 demo and panels), §6.2 (signal separation), §7.2
(glossary), §2.5, §2.6.

## Required changes

1. Replace the Step 4 live-demo placeholder with a live eye-local movement trace; show an
   optional screen-gaze estimate when available, clearly labelled as a different signal.
2. Add subprocess panels (per-eye and combined eye-local coordinates; screen-gaze
   coordinates with availability/confidence; which signal is selected and why) shown only
   when the master control is enabled.
3. Make the eye-local vs screen-gaze distinction explicit in the UI copy.

## Do not implement

Do not:
- add calibration (Phase F), filtering, or events;
- add a second show/hide control;
- export data.

## Acceptance criteria

The task is complete when:
- Step 4 shows a live eye-local trace and (when available) a distinct screen-gaze estimate;
- the two signals are clearly separated in UI and wording;
- signal panels appear only when "Show implementation details" is enabled;
- `npm run build` passes.

## Checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main` using
this file's exact filename (`020_step4_demo.md`) as the commit message, then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
