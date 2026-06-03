# Task: Add candidate event detection

## Goal

Detect candidate fixations and saccade-like events from the filtered, quality-checked
signal, attaching confidence and head-motion labels, using cautious candidate wording.

## Scope

Event-detection logic only. No Step 6 demo UI (that is `027`).

## Context

Implements specification §3.6 (velocity/displacement detection, confidence scoring) and the
§5 event vocabulary. Uses filtered signals (`024`), suppression/quality (`025`), and
head-motion labels (`015`).

## Required changes

1. Detect `fixation_candidate` and `saccade_candidate` events via documented velocity/
   displacement criteria, excluding blink/`tracking_lost`/uncertain-motion intervals.
2. Apply head-motion context to label `saccade_head_still` vs
   `saccade_during_head_movement` vs `uncertain_head_motion`, and attach
   `event_confidence`.
3. Emit `event` rows with `event_type`, `event_start_ms`, `event_end_ms`,
   `event_confidence`, `head_motion_label`; keep logic in `src/lib/`.

## Do not implement

Do not:
- build the Step 6 demo UI (that is `027`);
- present events as validated rather than candidates (§6.3);
- add content mapping or export.

## Acceptance criteria

The task is complete when:
- candidate fixations and saccades are detected with confidence and head-motion labels;
- invalid intervals are excluded;
- emitted events use the §5 vocabulary;
- `npm run build` passes.

## Checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main` using
this file's exact filename (`026_event_detection.md`) as the commit message, then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
