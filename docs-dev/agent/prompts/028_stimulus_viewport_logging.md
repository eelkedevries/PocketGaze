# Task: Add stimulus and viewport logging

## Goal

Add logging of stimulus identity/position/time and of the viewport/screen context (size,
orientation, device-pixel ratio) needed to interpret screen coordinates.

## Scope

Stimulus and viewport/screen logging only. No content-coordinate mapping (that is `029`) or
Step 7 demo (`030`).

## Context

Implements specification §3.7 (stimulus logging, viewport/screen logging), §4 `stimulus`
rows and task fields (`target_id`, `task_phase`).

## Required changes

1. Log stimulus events (identity, position, timestamp) in a consistent coordinate system.
2. Log viewport/screen size, orientation, and device-pixel ratio, updating when they
   change.
3. Emit `stimulus` rows/fields per §4; keep logic reusable in `src/lib/`.

## Do not implement

Do not:
- map gaze to content coordinates or handle scroll/zoom (that is `029`);
- build the Step 7 demo UI (that is `030`);
- add export (that is `031`).

## Acceptance criteria

The task is complete when:
- stimulus events and viewport/screen context are logged with timestamps;
- coordinate systems are consistent and documented;
- `npm run build` passes.

## Checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main` using
this file's exact filename (`028_stimulus_viewport_logging.md`) as the commit message, then
push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
