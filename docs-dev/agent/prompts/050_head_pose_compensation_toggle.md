# Task: Add the head-pose-compensation on/off contrast

## Goal

Add an interactive toggle that disables head-pose compensation in the gaze path so
the viewer can watch the estimate drift when the head moves — making the "head/phone
motion masquerades as eye movement" claim demonstrable rather than asserted.

## Scope

A compensation on/off control plus the minimal compensation term it switches. Reuse
the existing gaze, head-pose, and calibration modules. One demo (Step 3 or the
Step 4/5 gaze demo, wherever the contrast is clearest).

## Required reading

1. `docs-dev/reference/primary_authoritative/specification.md` §3.3, §3.4, §6.2,
   §6.4, §2.5.
2. Source: `src/lib/headPose.ts`, `src/lib/regressionGaze.ts`,
   `src/lib/eyeLocalSignal.ts`, `src/demos/step3.tsx`/`step4.tsx`/`step5.tsx`.

## Dependencies

Assumes `014b` (head pose), `017` (eye-local), and `019`/`022` (a gaze estimate)
are complete. If head pose or a gaze estimate is missing, stop and report.

## Rationale

"Sliders that degrade" teach causal structure better than prose. Letting the viewer
remove head-pose compensation and watch the estimate drift directly demonstrates why
Step 3 exists.

## Required changes

1. Add a minimal head-pose **compensation term** in the gaze/eye-local path (e.g.
   adjusting the eye-local signal or estimate by the head-pose contribution), with a
   documented, simple model — clearly labelled as illustrative, not a full
   geometric correction.
2. Add a UI toggle "Head-pose compensation: on/off"; with it off, the estimate uses
   the uncompensated signal so motion-induced drift is visible.
3. Show a short caption contrasting the two states; keep the compensation off by
   default only if that matches the page's pedagogy, otherwise default on.
4. Handle no-face/uncalibrated states gracefully.

## Do not implement

Do not:
- claim the illustrative compensation is a rigorous geometric correction;
- add a second master show/hide control (this is a demo control);
- alter the exported schema.

## Data contracts touched

Adds: none required (a live, in-demo transformation). Preserves the session model
and signal-type separation (§6.2).

## Acceptance criteria

- a visible toggle switches head-pose compensation on/off in the gaze path;
- with compensation off, head movement visibly drifts the estimate; with it on, the
  drift is reduced;
- the control is clearly a demo control, not a second details toggle.

## Automated checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- Calibrate, fixate a point, then move your head with compensation off (drift) and
  on (reduced drift); confirm the contrast is visible.

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main`
using this file's exact filename (`050_head_pose_compensation_toggle.md`) as the
commit message, then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
