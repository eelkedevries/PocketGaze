# Task: Build the follow-the-dots calibration task

## Goal

Add a follow-the-dots calibration task that presents dots at known screen positions and
records calibration samples (target position, timestamp, and the corresponding signal).

## Scope

The calibration task UI and sample capture only. No mapping fit (that is `022`) and no
Step 5 demo wiring beyond the task itself.

## Context

Implements specification §3.5 (follow-the-dots), §4 `calibration` rows and
`calibration_target` events (`target_x/y`, `target_id`). Uses signals from Phase E.

## Required changes

1. Present dots at known, full-area screen positions with clear timing/sequence.
2. Capture calibration samples pairing each target (position, id, timestamp) with the
   concurrent eye-local/screen-gaze signal.
3. Expose the captured samples for the mapping step; keep them in the export structure.

## Do not implement

Do not:
- fit the regression mapping or compute error (that is `022`);
- add filtering/events;
- add a second show/hide control.

## Acceptance criteria

The task is complete when:
- the dot task runs through its sequence at known positions;
- calibration samples (target + signal + timestamp) are captured and accessible;
- `npm run build` passes.

## Checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main` using
this file's exact filename (`021_follow_the_dots_task.md`) as the commit message, then
push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
