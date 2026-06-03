# Task: Add the eye-local signal estimation

## Goal

Add a reusable eye-local signal module that normalises the iris/pupil proxy within each
detected eye region, producing per-eye and combined eye-local coordinates in the shared
session model.

## Scope

The eye-local signal module and shared signal types only. No screen gaze (that is `018`/
`019`), no Step 4 demo.

## Required reading

Read before editing:
1. `docs-dev/reference/primary_authoritative/specification.md` §3.4, §7.2 (glossary),
   §6.2, §4 (eye-local fields).
2. Source: the feature module (`012`); the `007b` session model/types.

## Dependencies

This prompt assumes:
- `012_feature_extraction.md` and `007b` are complete (iris proxy + session model).
If features are unavailable, stop and report.

## Context

Reusable logic under `src/lib/`; eye-local types live in the `007b` model.

## Required changes

1. Add a module that outputs normalised eye-local coordinates per eye and combined, with a
   selected-signal-quality value, written to the session model.
2. Ensure shared types clearly distinguish eye-local from screen-gaze and content-mapped
   signals (§6.2).
3. Keep logic framework-agnostic.

## Do not implement

Do not:
- add screen-gaze estimation, WebEyeTrack, or calibration;
- build the Step 4 demo UI (that is `020`);
- present eye-local movement as screen gaze (§6.2).

## Data contracts touched

Adds (writes into the `007b` model): `left_eye_x/y`, `right_eye_x/y`, `combined_eye_x/y`,
`selected_signal_quality`.
Preserves: feature fields and raw-vs-filtered separation; the eye-local/screen-gaze/
content-mapped type separation.
Does not: change export format.

## Acceptance criteria

The task is complete when:
- the module returns per-eye and combined eye-local coordinates with a quality value;
- shared types keep the three signal kinds distinct.

## Automated checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- With the camera running, move the eyes and confirm the eye-local coordinates respond
  plausibly while head pose is roughly steady.
- See `docs-dev/reviews/runtime_qa_checklist.md` (camera rows).

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main` using
this file's exact filename (`017_eye_local_signal.md`) as the commit message, then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
