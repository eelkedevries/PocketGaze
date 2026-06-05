# Task: Build the gaze-contingent (moving-window) demo

## Goal

Add a gaze-contingent demo — a spotlight / moving-window reveal that follows the
live gaze estimate — to make latency and the frame-based-vs-gaze-contingent
distinction tangible, since this is the path where per-event latency becomes
correctness-critical rather than presentational.

## Scope

The gaze-contingent demo UI only. Reuse the calibrated gaze estimate and filtering;
no new tracking maths. Place it on the signals or filtering page, or a dedicated
sub-area.

## Required reading

1. `docs-dev/reference/primary_authoritative/specification.md` §3.1 (timing), §3.4,
   §3.6, §6.3, §2.5, §2.6.
2. `docs-dev/reviews/runtime_qa_checklist.md` (camera; toggle rows).
3. Source: `src/lib/regressionGaze.ts`, `src/lib/oneEuroFilter.ts`,
   `src/lib/frameTiming.ts`, an existing step demo for the camera loop pattern.

## Dependencies

Assumes a calibrated screen-gaze estimate (`019`/`022`) and filtering (`024`) are
complete. If a usable gaze estimate is missing, stop and report.

## Rationale

A gaze-contingent reveal is interactive and methodologically rich: it directly
motivates end-to-end latency (capture → inference → filter → render) and shows why,
unlike offline analysis, gaze-contingent display cannot tolerate lag.

## Required changes

1. Render content (text/image) masked by a window/spotlight centred on the live
   filtered gaze estimate; the window follows gaze in real time.
2. Show an estimated **end-to-end latency** readout (capture-to-render, reusing the
   existing timing fields where available) and let the user feel the lag.
3. Add subprocess panels (window radius; smoothing in use; latency breakdown) under
   the master control; degrade gracefully when uncalibrated/no-face (e.g. fall back
   to a pointer stand-in clearly labelled as not-gaze).

## Do not implement

Do not:
- add new gaze or filtering maths (reuse existing modules);
- imply the window position is precise without calibration (§6.2/§6.3);
- add a second master show/hide control.

## Acceptance criteria

- a spotlight/window follows the live gaze estimate over content;
- an end-to-end latency readout is shown;
- latency/window panels appear only when "Show implementation details" is enabled;
- uncalibrated/no-face states degrade gracefully and honestly.

## Automated checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- Calibrate and move your gaze; confirm the window follows with visible latency,
  and the latency readout is plausible.
- Toggle the master control; confirm the latency/window panels show/hide.

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main`
using this file's exact filename (`047_gaze_contingent_demo.md`) as the commit
message, then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
