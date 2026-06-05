# Task: Add the validation metrics library

## Goal

Add a pure, framework-agnostic module that computes the data-quality metrics the
eye-tracking field actually reports — **accuracy** (mean target–estimate offset),
**precision** (sample-to-sample RMS, "RMS-S2S"), and **BCEA** (bivariate contour
ellipse area) — from a set of fixations on known validation targets, with
deterministic unit tests.

## Scope

The metrics library only. No validation task, no demo wiring, no degree-unit
conversion (that is `040`). Pure logic under `src/lib/`.

## Required reading

1. `docs-dev/reference/primary_authoritative/specification.md` §3.5, §6.3 (do not
   overclaim accuracy), §4.3 (tracking-quality fields).
2. Source: `src/lib/eyeLocalSignal.ts`, `src/lib/gazeCalibration.ts` (existing
   maths conventions), `src/types/session.ts`.

## Dependencies

Assumes `007b` (session model) exists. No camera/tracking modules required (this
is pure maths over supplied samples). If the session model is missing, stop and
report.

## Rationale

Calibration RMS (`022`) measures internal fit consistency; it does **not** measure
on-screen accuracy or precision. Reporting accuracy and precision separately — in
the field's own terms — is the core data-quality competence this project must
demonstrate.

## Required changes

1. Add `src/lib/validationMetrics.ts` with pure functions over arrays of
   `{ target: {x,y}, estimate: {x,y} }` (accuracy) and over per-target arrays of
   estimate samples (precision):
   - `accuracy(samples)` → mean and median Euclidean offset (normalised units);
   - `precisionRmsS2S(samples)` → root-mean-square inter-sample distance;
   - `bcea(samples, p?)` → bivariate contour ellipse area (default P = 0.68),
     guarding degenerate covariance.
   - `perTargetMetrics(targets)` → accuracy/precision/BCEA per target plus an
     aggregate summary.
2. Keep all outputs in normalised screen units; document that degree conversion is
   layered on later (`040`).
3. Add `node --test` unit tests: known-offset accuracy; zero precision for a
   constant series; a hand-checked BCEA on a small synthetic cloud; degenerate
   inputs return finite, documented values (not NaN).

## Do not implement

Do not:
- build the validation task or any demo (that is `035`/`036`);
- convert to degrees (that is `040`);
- present these as measured device accuracy figures (§6.3).

## Data contracts touched

Adds: pure functions only; no session-model fields here. (Validation rows are
written in `035`.)

## Acceptance criteria

- accuracy, RMS-S2S precision, and BCEA are computed from supplied samples;
- degenerate inputs are handled with documented finite values;
- `npm run test` covers the metrics and passes.

## Automated checks

```bash
npm run build
npm run test
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- Confirm the metrics unit tests run (not zero tests) and pass.

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main`
using this file's exact filename (`034_validation_metrics_lib.md`) as the commit
message, then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
