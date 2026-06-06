# Task: Make input mode explicit and visible

## Goal

Each demo should know and show its input — pointer, simulated, eye-local, or calibrated
gaze — with the indicator reflecting the actual mode, and the mode driving warnings and
exported metadata so pointer/simulated data is identifiable.

## Scope

The pursuit, gaze-contingent, scanpath, and AOI demos (at least), their input-mode
indicators, the warnings they raise, and the export metadata. No change to the
underlying tracking maths.

## Required reading

1. `docs-dev/reviews/current-state-audit.md` (Prompt 0) — which demos exist and what
   input each uses.
2. The demo components and the demo registry; the export metadata code.

## Dependencies

Assumes `057` (audit). If a listed demo does not exist, note it and apply the change to
those that do.

## Rationale

Mislabelling pointer or simulated data as gaze is a credibility risk; a truthful,
mode-aware indicator that also tags exports lets a reader tell real gaze from a stand-in.

## Required changes

1. Each demo knows and shows its input: pointer, simulated, eye-local, or calibrated
   gaze.
2. The indicator must reflect the actual mode (not fixed text).
3. The mode must drive warnings and exported metadata so pointer/simulated data is
   identifiable. Applies at least to the pursuit, gaze-contingent, scanpath, and AOI
   demos.

## Do not implement

Do not:
- hard-code a fixed indicator;
- change the tracking or gaze-estimation maths.

## Acceptance criteria

Each demo's indicator tracks its real input mode, and the mode is reflected in warnings
and export metadata.

## Automated checks

```bash
npm run build
npm run test
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- Switch each demo's input where possible and confirm the indicator, warnings, and
  exported metadata change to match the active mode.

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main`
using this file's exact filename (`062_explicit_input_mode.md`) as the commit message,
then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
