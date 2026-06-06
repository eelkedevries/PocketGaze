# Task: Synthetic sampling-rate replay on Step 1

## Goal

Replay one synthetic saccade sampled at 30, 60, 250, and 1000 Hz, showing how event
timing, duration, and peak velocity degrade at lower rates, driven by a labelled
synthetic main-sequence saccade.

## Scope

An interactive multi-rate replay on Step 1, built as an extension of the existing Step 1
limitation figure if one exists. No real tracking.

## Required reading

1. `docs-dev/reviews/current-state-audit.md` (Prompt 0) and the Phase 4 readiness note
   (`072`).
2. The Step 1 limitation panel / sampling-rate figure (`src/components/LimitationPanels.tsx`).

## Dependencies

Runs after the Phase 4 readiness gate (`072`) says Phase 4 may begin. If the gate has not
passed, stop and report.

## Rationale

Showing the same saccade at four rates makes the sampling-rate limitation tangible; basing
it on a main-sequence-consistent profile keeps it physiologically plausible.

## Required changes

1. Replay one synthetic saccade sampled at 30, 60, 250, and 1000 Hz, showing how event
   timing, duration, and peak velocity degrade at lower rates.
2. Generate the saccade from a plausible, parameterised velocity profile consistent with
   the main sequence (a realistic amplitude to peak-velocity/duration relationship), not
   an arbitrary curve; label it clearly as synthetic.
3. If the Step 1 limitation panel already contains a coarse-versus-fine SVG figure, build
   the interactive multi-rate replay as an extension of that illustration rather than a
   parallel one.

## Do not implement

Do not:
- use an arbitrary (non-main-sequence) velocity curve;
- build a parallel figure if the existing one can be extended.

## Acceptance criteria

The multi-rate replay is present and interactive on Step 1, driven by a labelled synthetic
main-sequence saccade, and does not duplicate the existing static figure.

## Automated checks

```bash
npm run build
npm run test
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- On Step 1, confirm the replay runs at each rate, the degradation is visible, and the
  saccade is labelled synthetic.

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main`
using this file's exact filename (`073a_step1_sampling_rate_replay.md`) as the commit
message, then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
