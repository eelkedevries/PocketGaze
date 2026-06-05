# Task: Build the smooth-pursuit demo

## Goal

Wire the smooth-pursuit module (`041`) into a live demo: a target moves along its
path while the calibrated gaze estimate tries to track it, showing the live
pursuit-gain readout and a target-vs-gaze trace, framed as a qualitative
validation of the gaze signal.

## Scope

The smooth-pursuit demo UI only. Reuse `041` and the existing camera/gaze stack.
Place it where it reads naturally (Step 4 signals page or the Step 5 calibration
page after a mapping is fitted).

## Required reading

1. `docs-dev/reference/primary_authoritative/specification.md` §3.4, §3.6, §6.3,
   §2.5, §2.6.
2. `docs-dev/reviews/runtime_qa_checklist.md` (camera; mobile rows).
3. Source: `src/lib/smoothPursuit.ts`, `src/demos/step4.tsx`/`step5.tsx`,
   `src/lib/regressionGaze.ts`.

## Dependencies

Assumes `041` (pursuit lib), `017` (eye-local), and `019`/`022` (a usable
screen-gaze estimate, ideally calibrated) are complete. If `041` or a gaze signal
is missing, stop and report.

## Rationale

A moving target the gaze must follow is visually compelling, doubles as a
qualitative validation, and motivates the point that pursuit requires a moving
stimulus and is measured by gain.

## Required changes

1. Animate the pursuit target along the `041` path; sample the concurrent gaze
   estimate; render target and gaze together (live trace or overlaid dots).
2. Show a live **pursuit-gain** readout and mean tracking error, with cautious
   wording (candidate, uncalibrated/estimated as applicable).
3. Add subprocess panels (target vs gaze velocity, windowed gain) under the master
   control; handle no-face/uncalibrated states gracefully.
4. Make explicit in the framing that pursuit cannot be evoked without a moving
   target.

## Do not implement

Do not:
- add pursuit metric maths here (reuse `041`);
- present gain as a validated measurement;
- add a second master show/hide control.

## Acceptance criteria

- a moving target is tracked by the live gaze estimate with a live pursuit-gain
  readout and target-vs-gaze trace;
- gain/velocity panels appear only when "Show implementation details" is enabled;
- uncalibrated/no-face states degrade gracefully.

## Automated checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- Calibrate, run the pursuit demo, follow the target, and confirm a plausible gain
  near 1 when tracking well and lower when lagging.
- Toggle the master control; confirm the velocity/gain panels show/hide.

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main`
using this file's exact filename (`042_smooth_pursuit_demo.md`) as the commit
message, then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
