# Task: Build the AOI dwell-analysis demo

## Goal

Wire the AOI metrics library (`045`) into the Step 7 content page: a reading- or
image-viewing task with defined AOIs, reporting per-AOI dwell time, fixation count,
and time-to-first-fixation — the applied output of content-mapped gaze.

## Scope

The AOI demo UI only. Reuse `045`, content mapping (`029`), and the live gaze/event
pipeline. No new AOI maths.

## Required reading

1. `docs-dev/reference/primary_authoritative/specification.md` §3.7, §6.2, §6.3,
   §2.5, §2.6.
2. `docs-dev/reviews/runtime_qa_checklist.md` (mobile; camera; toggle rows).
3. Source: `src/lib/aoiMetrics.ts`, `src/lib/contentCoordinates.ts`,
   `src/demos/step7.tsx`.

## Dependencies

Assumes `045` (AOI metrics), `029` (content mapping), and `026` (fixations) are
complete. If `045` is missing, stop and report.

## Rationale

Dwell, fixation count, and TTFF per AOI are the canonical reading/UX deliverables;
demonstrating them turns Step 7 from "coordinates" into "what gaze data is for".

## Required changes

1. Present a viewing task (reading passage or image) with a few labelled AOIs
   defined in content coordinates; map live fixations into content space and assign
   them to AOIs via `045`.
2. Show a per-AOI results table (dwell, fixation count, TTFF) and a simple AOI
   overlay highlighting which AOI is currently fixated.
3. Add subprocess panels (AOI rectangles in content coords; raw assignment list)
   under the master control; handle no-face/unmapped states gracefully and caution
   that figures are qualitative over coarse data (§6.3).

## Do not implement

Do not:
- add AOI metric maths here (reuse `045`);
- claim validated attention measurement;
- add a second master show/hide control.

## Acceptance criteria

- a viewing task with AOIs reports per-AOI dwell, fixation count, and TTFF;
- the currently-fixated AOI is indicated;
- AOI/assignment panels appear only when "Show implementation details" is enabled.

## Automated checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- Run the task on a phone-sized viewport; look at different AOIs and confirm dwell,
  count, and TTFF update sensibly.
- Toggle the master control; confirm the AOI panels show/hide.

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main`
using this file's exact filename (`046_aoi_dwell_demo.md`) as the commit message,
then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
