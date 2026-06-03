# Task: Add the eye-local signal estimation

## Goal

Add a reusable eye-local signal module that normalises the iris/pupil proxy within each
detected eye region, producing per-eye and combined eye-local coordinates.

## Scope

The eye-local signal module and shared signal types only. No screen gaze (that is `018`/
`019`), no Step 4 demo.

## Context

Implements specification §3.4 (eye-local signal), §7.2 (glossary), and the §4 eye-local
field group (`left/right/combined_eye_x/y`). Uses features from `012`.

## Required changes

1. Add a module that outputs normalised eye-local coordinates per eye and combined, with a
   selected-signal-quality value.
2. Add shared signal types under `src/types/` that clearly distinguish eye-local from
   screen-gaze and content-mapped signals (§6.2).
3. Keep logic in `src/lib/`, framework-agnostic.

## Do not implement

Do not:
- add screen-gaze estimation, WebEyeTrack, or calibration;
- build the Step 4 demo UI (that is `020`);
- present eye-local movement as screen gaze (§6.2).

## Acceptance criteria

The task is complete when:
- the module returns per-eye and combined eye-local coordinates with a quality value;
- shared types separate the three signal kinds;
- `npm run build` passes.

## Checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main` using
this file's exact filename (`017_eye_local_signal.md`) as the commit message, then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
