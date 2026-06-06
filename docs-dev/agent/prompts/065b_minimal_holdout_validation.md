# Task: Implement a minimal held-out validation flow (only if the audit found none)

## Goal

If, and only if, the audit found no validation task, implement the smallest held-out
validation flow Step 5 needs: collect held-out targets, compute accuracy, precision, and
data loss on them, and expose a usable/marginal/poor verdict.

## Scope

A minimal held-out validation flow and its Step 5 surfacing — or, if validation already
exists, no change beyond recording that this prompt was skipped.

## Required reading

1. `docs-dev/reviews/current-state-audit.md` (Prompt 0) — whether validation exists.
2. The validation-metrics and calibration modules; Step 5 structure from `065`.

## Dependencies

Runs only if `057` (audit) found no validation task, after `065` and before `075`
(Prompt 17). If validation already exists, skip and record the skip.

## Rationale

Prompt 17 (`075`) depends on reliable Step 5 validation; this prompt guarantees the
minimum it needs exists, without expanding scope.

## Required changes

1. Run this only if Prompt 0 found no validation task. The audit is expected to find one
   already present, in which case skip this prompt and record that it was skipped.
2. If absent, implement the smallest held-out validation flow Step 5 needs: collect
   targets not used for fitting, compute accuracy, precision, and data loss on them, and
   expose a usable/marginal/poor verdict.
3. Keep it minimal; do not expand scope beyond what Step 5 requires.

## Do not implement

Do not:
- run this at all if validation already exists (skip and record);
- expand beyond the minimal accuracy/precision/data-loss verdict Step 5 needs.

## Acceptance criteria

Held-out validation runs and reports the metrics and verdict and Step 5 no longer marks
validation as pending; OR the prompt is recorded as skipped because validation already
exists.

## Automated checks

```bash
npm run build
npm run test
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- If implemented, run a validation pass and confirm accuracy, precision, data loss, and
  the verdict appear and Step 5 no longer marks validation pending. If skipped, confirm
  the existing validation is what the audit recorded.

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main`
using this file's exact filename (`065b_minimal_holdout_validation.md`) as the commit
message, then push. If the prompt is skipped because validation already exists, record
the skip in the final report and make no commit unless a note is requested.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
