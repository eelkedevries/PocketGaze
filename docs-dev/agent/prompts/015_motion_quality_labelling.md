# Task: Add head-motion quality labelling

## Goal

Add head-motion quality labelling (low / moderate / uncertain) and rejection of uncertain
intervals, building on the head-pose module.

## Scope

Motion-quality logic only. No Step 3 demo UI.

## Context

Implements specification §3.3 (motion-quality labelling, uncertain-interval rejection) and
the head-motion labels used by §5 events. Uses head pose from `014`.

## Required changes

1. Add logic that labels samples/intervals by head-motion contamination (low / moderate /
   uncertain) using documented thresholds.
2. Mark uncertain intervals so they can be excluded from later event detection.
3. Keep thresholds documented and configurable; logic in `src/lib/`.

## Do not implement

Do not:
- build the Step 3 demo UI (that is `016`);
- add eye-local signal, gaze, or event detection;
- hard-code device-specific magic numbers without documenting them.

## Acceptance criteria

The task is complete when:
- samples/intervals receive a head-motion label;
- uncertain intervals are flagged for exclusion;
- thresholds are documented;
- `npm run build` passes.

## Checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main` using
this file's exact filename (`015_motion_quality_labelling.md`) as the commit message, then
push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
