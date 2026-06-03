# Task: Build the Step 6 filtering/events demo and panels

## Goal

Wire filtering, suppression, and event detection into the Step 6 page: show raw vs filtered
traces together and cautiously-labelled candidate events, with subprocess panels.

## Scope

Step 6 demo UI only. Reuse modules from `024`–`026`.

## Required reading

Read before editing:
1. `docs-dev/reference/primary_authoritative/specification.md` §3.6, §5, §2.5, §2.6.
2. `docs-dev/reviews/runtime_qa_checklist.md` (camera; toggle rows).
3. Source: the filter (`024`), suppression (`025`), and event (`026`) modules.

## Dependencies

This prompt assumes:
- `024_one_euro_filter.md`, `025_blink_quality_suppression.md`, and
  `026_event_detection.md` are complete.
If any is missing, stop and report.

## Context

Implements the Step 6 demo and panels using the shared master control (§2.5).

## Required changes

1. Replace the Step 6 live-demo placeholder with overlaid raw vs filtered traces and
   candidate events (fixation/saccade candidates, blinks, tracking loss) using cautious
   wording.
2. Add subprocess panels (filter parameters; blink-suppressed intervals; quality
   thresholds; the event logic; event confidences) shown only when the master control is
   enabled.
3. Make the over/under-smoothing trade-off visible in the framing.

## Do not implement

Do not:
- add content mapping or export;
- add a second show/hide control;
- present events as validated.

## Acceptance criteria

The task is complete when:
- Step 6 shows raw vs filtered traces and candidate events;
- filtering/event panels appear only when "Show implementation details" is enabled.

## Automated checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- Open Step 6, start the camera, and confirm raw vs filtered traces plus candidate events
  with cautious labels.
- Toggle the master control; confirm the filtering/event panels show/hide.
- See `docs-dev/reviews/runtime_qa_checklist.md` (camera; toggle rows).

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main` using
this file's exact filename (`027_step6_demo.md`) as the commit message, then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
