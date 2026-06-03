# Task: Add the One Euro filter with raw-signal preservation

## Goal

Add an adaptive One Euro filter for the eye/gaze/head signals while preserving the raw
(minimally processed) signals alongside the filtered ones.

## Scope

The filtering module only. No blink suppression (that is `025`), event detection (`026`),
or Step 6 demo (`027`).

## Context

Implements specification §3.6 (adaptive filtering, raw preservation) and §4 (raw vs
filtered kept distinct; `filter_name` and parameters retained).

## Required changes

1. Add a One Euro filter module applied to the relevant signals, with documented,
   configurable parameters.
2. Keep raw and filtered signals as distinct outputs so both are exportable.
3. Retain the filter name and parameters for the export; keep logic in `src/lib/`.

## Do not implement

Do not:
- add blink suppression, quality thresholding, or event detection;
- build the Step 6 demo UI (that is `027`);
- discard the raw signal.

## Acceptance criteria

The task is complete when:
- the filter produces a filtered signal while the raw signal remains available;
- filter parameters are documented and retained;
- `npm run build` passes.

## Checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main` using
this file's exact filename (`024_one_euro_filter.md`) as the commit message, then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
