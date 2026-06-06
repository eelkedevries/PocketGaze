# Task: Calibration-drift demonstration on Step 5 (gated on validation)

## Goal

If Step 5 validation is reliable, demonstrate calibration drift by inviting small,
comfortable changes and re-measuring validation error; otherwise build only the
instructional shell, clearly marked pending validation support.

## Scope

A drift demonstration on Step 5 (or an instructional shell). Depends on reliable
validation from Prompt 8/8b (`065`/`065b`).

## Required reading

1. `docs-dev/reviews/current-state-audit.md` (Prompt 0) and the Phase 4 readiness note
   (`072`).
2. Step 5 structure (`065`) and the validation flow (`065b` or the existing one).

## Dependencies

Runs after the Phase 4 readiness gate (`072`) and depends on reliable Step 5 validation. If
validation is not trustworthy, implement only the shell.

## Rationale

Drift after posture/lighting/distance changes is a real limitation; demonstrating it with
re-measured validation error teaches recalibration — but only if validation is reliable.

## Required changes

1. If validation is present and trustworthy, implement it: after calibration, invite small,
   comfortable changes (move slightly closer, tilt the phone, shift posture, change
   lighting), then re-measure and display validation error.
2. Frame changes as optional and gentle; do not instruct awkward or sustained postures.
3. If validation is not reliable yet, implement only the instructional shell, marked
   pending validation support; do not fabricate a drift result.

## Do not implement

Do not:
- instruct awkward or sustained postures;
- fabricate a drift result when validation is not reliable.

## Acceptance criteria

Either a working drift demo re-measures validation error with safe framing, or an
instructional shell is in place clearly marked pending validation support.

## Automated checks

```bash
npm run build
npm run test
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- On Step 5, confirm either the drift demo re-measures validation error after a gentle
  change, or the shell is present and clearly marked pending validation support.

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main`
using this file's exact filename (`075_step5_calibration_drift_demo.md`) as the commit
message, then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
