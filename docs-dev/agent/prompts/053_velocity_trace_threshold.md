# Task: Add the velocity trace with the detection threshold line

## Goal

On Step 6, draw the eye-local **velocity trace** with the saccade-detection speed
threshold rendered as a horizontal line, so the velocity/displacement event logic
is literally visible as the signal crossing a line.

## Scope

Step 6 visualisation only (same demo/file). Reuse the event-detection thresholds
and the existing signal; no new detection maths.

## Required reading

1. `docs-dev/reference/primary_authoritative/specification.md` §3.6, §5, §6.3,
   §2.5, §2.6.
2. Source: `src/demos/step6.tsx`, `src/lib/eventDetection.ts`,
   `src/lib/oneEuroFilter.ts`.

## Dependencies

Assumes `026` (event detection) and `027` (Step 6 demo) are complete. If the Step 6
demo is missing, stop and report.

## Rationale

The subprocess-panel philosophy is to make the algorithm observable. Drawing the
velocity trace with the saccade threshold as a line shows the detection criterion
operating in real time, complementing the existing raw-vs-filtered trace.

## Required changes

1. Compute and draw a rolling **velocity** trace of the filtered eye-local signal
   (reusing the inter-sample speed already used by detection), in the same time base
   as the existing trace.
2. Draw the `saccadeSpeedPerSec` threshold from `DEFAULT_EVENT_DETECTION_THRESHOLDS`
   as a horizontal reference line; shade or mark where the velocity crosses it
   (i.e. where saccade candidates arise).
3. If the `beta`/threshold controls from `051` are present, keep the line in sync
   with the active threshold. Surface detail through the existing master control.

## Do not implement

Do not:
- change event-detection maths (reuse `026`);
- add a second master show/hide control;
- alter the exported schema.

## Data contracts touched

Adds: none (live visualisation only). Preserves the session model.

## Acceptance criteria

- a live velocity trace is drawn with the saccade threshold as a horizontal line;
- threshold crossings visibly correspond to saccade candidates;
- the line reflects the active threshold value.

## Automated checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- On Step 6, fixate then make a quick eye movement; confirm the velocity spikes
  across the threshold line where a saccade candidate is reported.

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main`
using this file's exact filename (`053_velocity_trace_threshold.md`) as the commit
message, then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
