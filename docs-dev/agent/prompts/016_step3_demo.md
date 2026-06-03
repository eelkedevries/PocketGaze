# Task: Build the Step 3 head-pose demo and panels

## Goal

Wire head pose and motion-quality labelling into the Step 3 page: a live pose readout/
visualisation with a head-motion quality label as the main demo, plus subprocess panels.

## Scope

Step 3 demo UI only. Reuse modules from `014b` and `015`.

## Required reading

Read before editing:
1. `docs-dev/reference/primary_authoritative/specification.md` §3.3, §6.4, §2.5, §2.6.
2. `docs-dev/reviews/runtime_qa_checklist.md` (camera rows).
3. Source: the head-pose (`014b`) and motion-quality (`015`) modules.

## Dependencies

This prompt assumes:
- `014b_head_pose_estimation.md` and `015_motion_quality_labelling.md` are complete.
If any is missing, stop and report.

## Context

Implements the Step 3 demo and panels using the shared master control (§2.5).

## Required changes

1. Replace the Step 3 live-demo placeholder with a live head-pose readout/visualisation and
   a head-motion quality label (low / moderate / uncertain).
2. Add subprocess panels (yaw/pitch/roll and translation values, the derivation, the
   motion-quality thresholding) shown only when the master control is enabled.
3. Make the "motion can masquerade as eye movement" point visible in the demo framing
   (§6.4).

## Do not implement

Do not:
- add eye-local signal, gaze, or events;
- add a second show/hide control;
- add file export.

## Acceptance criteria

The task is complete when:
- Step 3 shows live head pose with a motion-quality label;
- pose panels appear only when "Show implementation details" is enabled.

## Automated checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- Open Step 3, start the camera, and confirm a live pose readout and motion-quality label.
- Toggle the master control; confirm the pose panels show/hide.
- See `docs-dev/reviews/runtime_qa_checklist.md` (camera; toggle rows).

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main` using
this file's exact filename (`016_step3_demo.md`) as the commit message, then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
