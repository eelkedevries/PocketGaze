# Task: Build the Step 3 head-pose demo and panels

## Goal

Wire head pose and motion-quality labelling into the Step 3 page: a live pose readout/
visualisation with a head-motion quality label as the main demo, plus subprocess panels.

## Scope

Step 3 demo UI only. Reuse modules from `014` and `015`.

## Context

Implements specification §3.3 (Step 3 demo and panels), §2.5, §2.6.

## Required changes

1. Replace the Step 3 live-demo placeholder with a live head-pose readout/visualisation and
   a head-motion quality label (low / moderate / uncertain).
2. Add subprocess panels (yaw/pitch/roll and translation values, the derivation, the
   motion-quality thresholding) shown only when the master control is enabled.
3. Make the "motion can masquerade as eye movement" point visible in the demo framing
   (§6.4).

## Do not implement

Do not:
- add eye-local signal, gaze, or events;
- add a second show/hide control;
- export data.

## Acceptance criteria

The task is complete when:
- Step 3 shows live head pose with a motion-quality label;
- pose panels appear only when "Show implementation details" is enabled;
- `npm run build` passes.

## Checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main` using
this file's exact filename (`016_step3_demo.md`) as the commit message, then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
