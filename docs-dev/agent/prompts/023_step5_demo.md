# Task: Build the Step 5 calibration demo and panels

## Goal

Wire the calibration task and mapping into the Step 5 page: run the dot task, fit the
mapping, and show a validation/error readout, with calibration subprocess panels.

## Scope

Step 5 demo UI only. Reuse modules from `021` and `022`.

## Required reading

Read before editing:
1. `docs-dev/reference/primary_authoritative/specification.md` §3.5, §2.5, §2.6.
2. `docs-dev/reviews/runtime_qa_checklist.md` (mobile; camera rows).
3. Source: the calibration task (`021`) and mapping (`022`) modules.

## Dependencies

This prompt assumes:
- `021_follow_the_dots_task.md` and `022_regression_mapping.md` are complete.
If any is missing, stop and report.

## Context

Implements the Step 5 demo and panels using the shared master control (§2.5).

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
- add file export.

## Acceptance criteria

The task is complete when:
- Step 5 runs calibration, fits the mapping, and shows an error/validation readout;
- calibration panels appear only when "Show implementation details" is enabled.

## Automated checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- Run the full Step 5 flow on a phone-sized viewport; confirm calibration → mapping → error
  readout, then recalibration when quality is poor.
- Toggle the master control; confirm the calibration panels show/hide.
- See `docs-dev/reviews/runtime_qa_checklist.md` (mobile; camera; toggle rows).

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main` using
this file's exact filename (`023_step5_demo.md`) as the commit message, then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
