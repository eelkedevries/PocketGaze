# Task: Add the AOI dwell-metrics library

## Goal

Add a pure module that computes per-area-of-interest (AOI) metrics from fixations
mapped into content coordinates: **dwell time**, **fixation count**, and
**time-to-first-fixation** (TTFF), with deterministic unit tests.

## Scope

The AOI metrics maths only (pure). No demo and no AOI authoring UI (that is `046`).

## Required reading

1. `docs-dev/reference/primary_authoritative/specification.md` §3.7, §6.2, §6.3,
   §4 (content-mapped fields).
2. Source: `src/lib/contentCoordinates.ts`, `src/lib/eventDetection.ts`,
   `src/lib/fixationAggregation.ts`, `src/types/session.ts`.

## Dependencies

Assumes `029` (content mapping) and `026` (fixation events) are complete; pure
over supplied fixations + AOI rectangles, so testable in isolation. If content
mapping is missing, stop and report.

## Rationale

Step 7 maps gaze to content but stops short of the applied output. Dwell, fixation
count, and TTFF per AOI are the standard reading/UX deliverables and close the loop
from "where on the content" to "what gaze data is for".

## Required changes

1. Add `src/lib/aoiMetrics.ts`:
   - an AOI as a named content-space rectangle;
   - `assignFixationsToAois(fixations, aois)` (a fixation falls in the first AOI
     containing its content coordinate; document overlap handling);
   - `aoiMetrics(fixations, aois)` → per-AOI `{ dwellMs, fixationCount, ttffMs }`
     plus totals; TTFF relative to task start.
2. Use content-relative coordinates; treat fixations with
   `content_mapping_available = false` as unassigned (documented).
3. Add `node --test` tests: dwell/count summed correctly; TTFF is the first
   in-AOI fixation onset; fixations outside all AOIs are excluded; empty inputs
   return documented zeros/blanks.

## Do not implement

Do not:
- build the demo or AOI overlay (that is `046`);
- present metrics as validated attention measures (§6.3).

## Data contracts touched

Adds: pure functions; optionally AOI-summary rows may be written by `046` (not
here). No schema change in this prompt.

## Acceptance criteria

- per-AOI dwell, fixation count, and TTFF are computed from content-mapped
  fixations;
- unmapped/out-of-AOI fixations are handled per documentation;
- `npm run test` covers the metrics and passes.

## Automated checks

```bash
npm run build
npm run test
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- Confirm the AOI unit tests run (not zero tests) and pass.

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main`
using this file's exact filename (`045_aoi_metrics_lib.md`) as the commit message,
then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
