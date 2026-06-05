# Task: Build the scanpath and heatmap visualisation demo

## Goal

Wire the fixation-aggregation library (`043`) into a demo that draws the ordered,
duration-sized **scanpath** and a **heatmap** over a viewing task, foregrounding
the honest caveat that heatmaps over low-accuracy, low-sampling-rate data are
easily over-interpreted.

## Scope

The scanpath/heatmap demo UI only. Reuse `043` and the live event pipeline. Place
it on the filtering/events page (Step 6) or a dedicated visualisation sub-area.

## Required reading

1. `docs-dev/reference/primary_authoritative/specification.md` §3.6, §3.7, §6.3,
   §2.5, §2.6.
2. `docs-dev/reviews/runtime_qa_checklist.md` (camera; toggle rows).
3. Source: `src/lib/fixationAggregation.ts`, `src/demos/step6.tsx`.

## Dependencies

Assumes `043` (aggregation) and `026` (events) are complete; a live or recorded
fixation stream is available. If `043` is missing, stop and report.

## Rationale

The scanpath and heatmap are the visualisations an audience expects; pairing them
with an explicit over-interpretation warning turns a clichéd output into a
methodological point.

## Required changes

1. Collect fixations over a short viewing task and render the **scanpath**
   (ordered nodes sized by dwell, connected by saccade segments) and a toggleable
   **heatmap** overlay, using `043`.
2. Provide a clear caption/panel warning that these visualisations over coarse,
   low-precision data are qualitative and easily over-read (§6.3).
3. Add subprocess panels (fixation list with order/dwell; heatmap parameters) under
   the master control; handle empty/no-face states gracefully.

## Do not implement

Do not:
- add aggregation maths here (reuse `043`);
- present the heatmap as a validated attention map;
- add a second master show/hide control.

## Acceptance criteria

- a duration-sized ordered scanpath and a toggleable heatmap render from fixations;
- an explicit over-interpretation caveat is shown;
- fixation/parameter panels appear only when "Show implementation details" is on.

## Automated checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- View the task, accumulate fixations, and confirm a plausible scanpath and
  heatmap plus the over-interpretation caveat.
- Toggle the master control; confirm the panels show/hide.

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main`
using this file's exact filename (`044_scanpath_heatmap_demo.md`) as the commit
message, then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
