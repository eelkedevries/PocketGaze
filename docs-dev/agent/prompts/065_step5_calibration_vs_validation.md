# Task: Structure Step 5 around calibration versus validation

## Goal

Organise Step 5 so model fitting and held-out validation are clearly separate, present
the field's metric set and a usable/marginal/poor verdict, and prompt recalibration
after posture/phone/lighting/distance changes.

## Scope

Step 5 structure and copy, and surfacing of an existing validation task's metrics if one
is present. No validation logic is built here.

## Required reading

1. `docs-dev/reviews/current-state-audit.md` (Prompt 0) — whether a held-out validation
   task already exists and what metrics it reports.
2. `src/steps.ts` (Step 5) and the validation/calibration modules.

## Dependencies

Assumes `057` (audit) and `059` (Step 5 wording). Prompt 8b (`065b`) implements
validation only if the audit found none.

## Rationale

Calibration fit consistency is not on-screen accuracy or precision; structurally
separating fitting from held-out validation, and reporting accuracy and precision in the
field's own terms, is the core data-quality competence to demonstrate.

## Required changes

1. Organise Step 5 so model fitting and held-out validation are clearly separate.
2. Present the metric set: accuracy, precision as RMS-S2S, BCEA, data loss, drift,
   latency, visual angle.
3. Present a usable/marginal/poor verdict and a recalibration prompt after
   posture/phone/lighting/distance changes.
4. If the audit found a validation task (the project likely already has one: held-out
   validation with accuracy, RMS-S2S precision, and BCEA), build the structure around it
   and surface its metrics. If it did not, present the calibration structure, mark
   validation explicitly as not yet implemented (do not present it as working), and note
   that Prompt 8b (`065b`) will add it.

## Do not implement

Do not:
- build any validation logic here (that is `065b`, and only if needed);
- present validation as working if it is not.

## Acceptance criteria

Step 5 structurally separates fitting from validation; validation is either surfaced (if
present) or clearly marked pending; no validation logic was built here.

## Automated checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- Open Step 5 and confirm fitting and validation are visually separate, the metric set
  and verdict appear, and validation is either surfaced or clearly marked pending.

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main`
using this file's exact filename (`065_step5_calibration_vs_validation.md`) as the
commit message, then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
