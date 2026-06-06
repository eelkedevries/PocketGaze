# Task: Synthetic event-detection trace on Step 6

## Goal

Add a known-ground-truth synthetic trace generator on Step 6 that feeds the project's real
event-detection module, with controllable parameters and an explicit ground-truth event
format.

## Scope

A synthetic trace generator wired to the existing `eventDetection` module on Step 6. No
re-implementation of the detector.

## Required reading

1. `docs-dev/reviews/current-state-audit.md` (Prompt 0) and the Phase 4 readiness note
   (`072`).
2. The `eventDetection` module and its documented thresholds (the hybrid I-VT/I-DT rule).

## Dependencies

Runs after the Phase 4 readiness gate (`072`). Prompt 16b (`074b`) consumes this trace.

## Rationale

Teaching against a known ground truth, fed into the detector the site actually uses,
demonstrates the real algorithm rather than a toy stand-in.

## Required changes

1. Add a known-ground-truth synthetic trace generator with controllable sampling rate,
   noise, smoothing, velocity and dispersion thresholds, minimum fixation duration, blink
   interval, and head-motion contamination.
2. Use an explicit ground-truth event format (typed fixation/saccade/blink intervals) and
   an additive-noise model stated in the UI.
3. The generator must feed the project's real event-detection logic — the existing
   `eventDetection` module and its documented thresholds, a hybrid I-VT (velocity) and
   I-DT (dispersion) rule — so the demo teaches the detector the site actually uses, not a
   toy re-implementation; expose the same threshold parameters that module accepts.

## Do not implement

Do not:
- re-implement event detection separately from the existing module;
- leave the noise model or ground-truth format undocumented in the UI.

## Acceptance criteria

The trace can be generated with these parameters and rendered, its ground truth is
explicit, and it drives the real event-detection module rather than a separate one.

## Automated checks

```bash
npm run build
npm run test
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- On Step 6, generate a trace, confirm the parameters take effect, the ground truth is
  shown, and the existing detector runs on it.

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main`
using this file's exact filename (`074a_step6_synthetic_event_trace.md`) as the commit
message, then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
