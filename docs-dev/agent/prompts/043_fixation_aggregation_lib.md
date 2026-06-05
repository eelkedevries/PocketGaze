# Task: Add the fixation-aggregation library (scanpath and heatmap)

## Goal

Add a pure module that aggregates detected fixation events into the data structures
behind the two canonical eye-tracking visualisations: an ordered, duration-weighted
**scanpath** and a **fixation/heatmap density** field, with deterministic unit
tests.

## Scope

The aggregation maths only (pure). No rendering and no demo (that is `044`).

## Required reading

1. `docs-dev/reference/primary_authoritative/specification.md` §3.6, §3.7, §6.3.
2. Source: `src/lib/eventDetection.ts` (fixation events), `src/types/session.ts`.

## Dependencies

Assumes `026` (event detection) is complete (fixation candidates available). Pure
over supplied fixations, so testable in isolation. If event types are missing,
stop and report.

## Rationale

Scanpaths and heatmaps are the iconic gaze visualisations; separating the
aggregation maths from rendering keeps it testable and lets `044` focus on drawing
(and on the over-interpretation caveat).

## Required changes

1. Add `src/lib/fixationAggregation.ts`:
   - `scanpath(fixations)` → ordered nodes `{ x, y, durationMs, order }` plus
     inter-node saccade segments;
   - `heatmap(fixations, grid, sigma)` → a normalised density grid (duration- or
     count-weighted) via a documented Gaussian accumulation;
   - small helpers (bounds, total dwell) as needed.
2. Use normalised coordinates; keep weighting (duration vs count) an explicit,
   documented parameter.
3. Add `node --test` tests: scanpath order and durations preserved; heatmap density
   peaks at a clustered fixation and integrates as expected; empty input returns
   documented empty structures.

## Do not implement

Do not:
- render canvases or build the demo (that is `044`);
- imply heatmaps are validated attention maps (§6.3 — handled in `044`'s framing).

## Data contracts touched

Adds: pure functions; no session-model fields.

## Acceptance criteria

- ordered scanpath nodes/segments and a normalised heatmap grid are produced from
  fixations;
- weighting is parameterised and documented;
- `npm run test` covers the aggregation and passes.

## Automated checks

```bash
npm run build
npm run test
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- Confirm the aggregation unit tests run (not zero tests) and pass.

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main`
using this file's exact filename (`043_fixation_aggregation_lib.md`) as the commit
message, then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
