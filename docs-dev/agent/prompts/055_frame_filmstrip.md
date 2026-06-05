# Task: Add the frame filmstrip with timestamps

## Goal

On Step 1, present a frame as a **sample**: a filmstrip of recent frames with their
timestamps, highlighting any dropped or repeated frames, making frame-level timing
concrete and giving the sampling-rate point (`048`) a natural home.

## Scope

Step 1 visualisation only (same demo/file). Reuse the timing fields already written
to the session model; no new timing maths.

## Required reading

1. `docs-dev/reference/primary_authoritative/specification.md` §3.1, §4 (timing
   fields), §4.1, §2.5, §2.6.
2. Source: `src/demos/step1.tsx`, `src/lib/frameTiming.ts`,
   `src/lib/frameStats.ts`, `src/lib/sessionStore.ts`.

## Dependencies

Assumes `009` (frame timing) and `010` (Step 1 demo) are complete. If the Step 1
demo is missing, stop and report.

## Rationale

Treating a frame as a discrete sample with a timestamp is the conceptual core of
Step 1; a filmstrip with dropped/repeated frames marked makes irregular timing
visible rather than abstract.

## Required changes

1. Render a horizontal filmstrip of the most recent N frames as cells annotated
   with `time_ms` / `frame_id` (and `video_frame_time` where available), drawn from
   the recent sample rows.
2. Visually flag dropped and repeated frames (using the existing
   dropped/repeated indicators); on the rAF fallback path, note that these cannot
   be observed.
3. Keep the existing FPS/timing readout; surface the filmstrip in the demo or its
   master-controlled panels without a second toggle.

## Do not implement

Do not:
- store or display raw video frames (timestamps/metadata only — §2.7);
- add new timing maths (reuse `009`/`frameStats`);
- add a second master show/hide control.

## Data contracts touched

Adds: none (renders existing timing fields). Preserves the session model; stores no
raw video.

## Acceptance criteria

- a filmstrip shows recent frames with timestamps/frame ids;
- dropped/repeated frames are visually flagged (or noted as unobservable on the
  fallback path);
- no raw video frame imagery is stored or displayed.

## Automated checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- Start the camera on Step 1; confirm the filmstrip populates with timestamps and
  that any dropped/repeated frames are flagged.

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main`
using this file's exact filename (`055_frame_filmstrip.md`) as the commit message,
then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
