# Task: Add head-pose estimation

## Goal

Add a reusable head-pose module estimating head rotation (yaw/pitch/roll) and an
approximate translation (position/distance) from face landmarks.

## Scope

The head-pose module only. No motion-quality labelling (that is `015`) or Step 3 demo.

## Context

Implements specification §3.3 and the §4 head-pose fields (`head_yaw/pitch/roll`,
`head_tx/ty/tz`). Uses landmarks from `012`. Head-pose method (library pose vs OpenCV.js
`solvePnP`) is open in §7.3 — choose and record the choice.

## Required changes

1. Add a module computing yaw/pitch/roll and approximate translation from the landmark
   output, with typed results and a `head_pose_quality` estimate.
2. Record the chosen method in specification §7.3 (bump the version) and note the monocular
   translation caveat.
3. Keep logic in `src/lib/`, separate from presentation.

## Do not implement

Do not:
- add motion-quality labelling or interval rejection (that is `015`);
- build the Step 3 demo UI (that is `016`);
- attempt phone IMU access (out of scope for browser).

## Acceptance criteria

The task is complete when:
- the module returns yaw/pitch/roll, approximate translation, and a pose-quality value;
- the chosen method is recorded in the spec;
- `npm run build` passes.

## Checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main` using
this file's exact filename (`014_head_pose_estimation.md`) as the commit message, then
push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
