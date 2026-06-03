# Task: Add the One Euro filter with raw-signal preservation

## Goal

Add an adaptive One Euro filter for the eye/gaze/head signals while preserving the raw
(minimally processed) signals alongside the filtered ones, with deterministic unit tests.

## Scope

The filtering module only. No blink suppression (that is `025`), event detection (`026`),
or Step 6 demo (`027`).

## Required reading

Read before editing:
1. `docs-dev/reference/primary_authoritative/specification.md` §3.6, §4.1 (raw vs filtered
   in separate columns), §4 (`filter_name`).
2. Source: the signal modules (`017`/`019`); the `007b` session model.

## Dependencies

This prompt assumes:
- `017_eye_local_signal.md` (and `019` if applicable) and `007b` are complete.
If the signals/session model are missing, stop and report.

## Context

Pure, deterministic logic — unit-tested with `node --test`.

## Required changes

1. Add a One Euro filter module applied to the relevant signals, with documented,
   configurable parameters.
2. Keep raw and filtered signals as **separate columns** in the session model so both are
   exportable (per §4.1).
3. Retain the filter name and parameters for the export; add `node --test` tests (step
   response; lag/jitter behaviour on synthetic input).

## Do not implement

Do not:
- add blink suppression, quality thresholding, or event detection;
- build the Step 6 demo UI (that is `027`);
- discard the raw signal.

## Data contracts touched

Adds (writes into the `007b` model): filtered signal columns alongside the raw columns;
`filter_name` and parameters.
Preserves: the raw signal columns unchanged.
Does not: change export format or row types.

## Acceptance criteria

The task is complete when:
- the filter produces filtered columns while the raw columns remain available;
- filter parameters are documented and retained;
- `npm run test` covers the filter and passes.

## Automated checks

```bash
npm run build
npm run test
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- Confirm the filter unit tests run (not zero tests) and pass.
- With live signals, confirm the filtered trace is smoother than the raw trace without gross
  lag during rapid movement.

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main` using
this file's exact filename (`024_one_euro_filter.md`) as the commit message, then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
