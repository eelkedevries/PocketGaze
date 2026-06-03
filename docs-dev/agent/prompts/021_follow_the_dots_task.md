# Task: Build the follow-the-dots calibration task

## Goal

Add a mobile-friendly follow-the-dots calibration task that presents dots at known screen
positions and records calibration samples (target position, timestamp, and the concurrent
signal) into the shared session model.

## Scope

The calibration task UI and sample capture only. No mapping fit (that is `022`) and no
Step 5 demo wiring beyond the task itself.

## Required reading

Read before editing:
1. `docs-dev/reference/primary_authoritative/specification.md` §3.5, §6.2, §4 (calibration
   rows, task fields), §4.1 (timing convention).
2. Source: the eye-local (`017`) / screen-gaze (`019`) signals; the `007b` session model;
   the timing module (`009`).

## Dependencies

This prompt assumes:
- `017_eye_local_signal.md` is complete (and `019` if screen gaze is in scope).
- `009_frame_timing.md` and `007b` are complete (shared timing clock + session model).
If the signals or timing clock are missing, stop and report.

## Context

Targets phones; coordinate systems and timing must be explicit.

## Required changes

1. Present dots at known positions with **safe margins from viewport edges** and **target
   sizes suitable for phones**; include a clear sequence and a **stop/reset button**.
2. Log **orientation and viewport changes** during the task; timestamp every sample from
   the **shared timing clock** (`time_ms`, ms from session start).
3. Save each target position in **both CSS pixels and normalised screen coordinates**, and
   capture the concurrent signal, keeping the **calibration target, raw eye-local signal,
   and (later) fitted screen-gaze estimate clearly distinct**.
4. Emit `calibration` rows and `calibration_target` events into the session model.

## Do not implement

Do not:
- fit the regression mapping or compute error (that is `022`);
- add filtering/events;
- add a second show/hide control.

## Data contracts touched

Adds (writes into the `007b` model): `calibration` rows; `calibration_target` events;
`target_x`, `target_y` (CSS px), normalised target coordinates, `target_id`, `task_phase`.
Preserves: the eye-local/screen-gaze separation; the shared timing clock.
Does not: change export format.

## Acceptance criteria

The task is complete when:
- the dot task runs through its sequence at known positions with safe margins and
  phone-suitable targets, and has a working stop/reset;
- samples capture target (CSS + normalised), timestamp (shared clock), and concurrent
  signal; orientation/viewport changes are logged.

## Automated checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- Run the task on a ~360–414px viewport; confirm dots sit within safe margins and are easy
  to fixate; confirm stop/reset works.
- Rotate the viewport mid-task; confirm the change is logged and the task stays usable.
- See `docs-dev/reviews/runtime_qa_checklist.md` (mobile; camera rows).

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main` using
this file's exact filename (`021_follow_the_dots_task.md`) as the commit message, then
push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
