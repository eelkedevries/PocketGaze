# Task: Build the Step 6 filtering/events demo and panels

## Goal

Wire filtering, suppression, and event detection into the Step 6 page: show raw vs filtered
traces together and cautiously-labelled candidate events, with subprocess panels.

## Scope

Step 6 demo UI only. Reuse modules from `024`–`026`.

## Context

Implements specification §3.6 (Step 6 demo and panels), §5 (candidate labelling), §2.5,
§2.6.

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
- filtering/event panels appear only when "Show implementation details" is enabled;
- `npm run build` passes.

## Checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main` using
this file's exact filename (`027_step6_demo.md`) as the commit message, then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
