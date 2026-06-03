# Task: Build the Step 5 calibration demo and panels

## Goal

Wire the calibration task and mapping into the Step 5 page: run the dot task, fit the
mapping, and show a validation/error readout, with calibration subprocess panels.

## Scope

Step 5 demo UI only. Reuse modules from `021` and `022`.

## Context

Implements specification §3.5 (Step 5 demo and panels), §2.5, §2.6.

## Required changes

1. Replace the Step 5 live-demo placeholder with the follow-the-dots task followed by a
   fitted mapping and a simple validation/error readout.
2. Add subprocess panels (calibration samples target-vs-estimate; the fitted mapping;
   held-out error/consistency) shown only when the master control is enabled.
3. Offer recalibration when quality is poor.

## Do not implement

Do not:
- add filtering/events or content mapping;
- add a second show/hide control;
- export data.

## Acceptance criteria

The task is complete when:
- Step 5 runs calibration, fits the mapping, and shows an error/validation readout;
- calibration panels appear only when "Show implementation details" is enabled;
- `npm run build` passes.

## Checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main` using
this file's exact filename (`023_step5_demo.md`) as the commit message, then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
