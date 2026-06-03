# Task: Add stimulus and viewport logging

## Goal

Add logging of stimulus identity/position/time and of the viewport/screen context (size,
orientation, device-pixel ratio) needed to interpret screen coordinates, into the shared
session model.

## Scope

Stimulus and viewport/screen logging only. No content-coordinate mapping (that is `029`) or
Step 7 demo (`030`).

## Required reading

Read before editing:
1. `docs-dev/reference/primary_authoritative/specification.md` §3.7, §4 (`stimulus` rows,
   task fields), §4.1 (timing convention).
2. Source: the `007b` session model; the timing module (`009`).

## Dependencies

This prompt assumes:
- `007b_shared_data_session_model.md` and `009_frame_timing.md` are complete.
If the session model or timing clock are missing, stop and report.

## Context

Coordinate systems must be consistent and documented.

## Required changes

1. Log stimulus events (identity, position, timestamp from the shared clock) in a
   consistent coordinate system.
2. Log viewport/screen size, orientation, and device-pixel ratio, updating when they
   change.
3. Emit `stimulus` rows/fields per §4 into the session model; keep logic reusable in
   `src/lib/`.

## Do not implement

Do not:
- map gaze to content coordinates or handle scroll/zoom (that is `029`);
- build the Step 7 demo UI (that is `030`);
- add file export (that is `031`).

## Data contracts touched

Adds (writes into the `007b` model): `stimulus` rows; `target_id`, `task_phase`; viewport/
screen/orientation/DPR context.
Preserves: the shared timing clock; existing row types.
Does not: change export format.

## Acceptance criteria

The task is complete when:
- stimulus events and viewport/screen context are logged with timestamps;
- coordinate systems are consistent and documented.

## Automated checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- Trigger stimulus events and confirm they log with id/position/time.
- Resize/rotate the viewport; confirm size/orientation/DPR updates are logged.

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main` using
this file's exact filename (`028_stimulus_viewport_logging.md`) as the commit message, then
push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
