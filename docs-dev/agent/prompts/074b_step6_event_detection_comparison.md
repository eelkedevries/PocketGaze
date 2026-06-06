# Task: Event-detection comparison interface on Step 6

## Goal

Using the synthetic trace from `074a`, display true events, detected candidate events,
false positives, missed events, and timing error, with parameters adjustable.

## Scope

A comparison interface on Step 6 over the trace and detector from `074a`. No new detector.

## Required reading

1. `docs-dev/reviews/current-state-audit.md` (Prompt 0) and the Phase 4 readiness note
   (`072`).
2. `074a` (the trace generator and its ground-truth format); the `eventDetection` module.

## Dependencies

Requires `074a` (Prompt 16a). If the trace generator is missing, stop and report.

## Rationale

Comparing detected against true events under adjustable parameters teaches how thresholds
trade false positives against missed events and timing accuracy.

## Required changes

1. Using the trace from `074a`, display true events, detected candidate events, false
   positives, missed events, and timing error, with parameters adjustable.

## Do not implement

Do not:
- introduce a second detector or trace source;
- relabel candidate events with new names (reuse the repository's vocabulary).

## Acceptance criteria

The interface shows detected-versus-true outcomes and responds to parameter changes.

## Automated checks

```bash
npm run build
npm run test
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- On Step 6, adjust parameters and confirm true/detected events, false positives, misses,
  and timing error update accordingly.

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main`
using this file's exact filename (`074b_step6_event_detection_comparison.md`) as the
commit message, then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
