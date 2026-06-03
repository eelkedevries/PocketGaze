# Task: Add head-pose estimation

## Goal

Implement the head-pose method chosen in `014`, producing yaw/pitch/roll and an approximate
translation with a pose-quality value, written into the shared session model.

## Scope

The head-pose module only. No motion-quality labelling (that is `015`) or Step 3 demo.

## Required reading

Read before editing:
1. `docs-dev/reference/primary_authoritative/specification.md` §3.3, §7.3 (locked method),
   §4 (head-pose fields).
2. Source: the `014` decision; the feature module (`012`); the `007b` session model.

## Dependencies

This prompt assumes:
- `014_head_pose_method_spike.md` is complete and a method is locked in the spec.
- `012_feature_extraction.md` and `007b` are complete.
If the method is not locked, stop and report.

## Context

Implements the locked method as a reusable `src/lib/` module.

## Required changes

1. Add a module computing yaw/pitch/roll and approximate translation from the landmark
   output, with a `head_pose_quality` estimate.
2. Write the head-pose fields into the session model; document the monocular-translation
   caveat.
3. Keep logic in `src/lib/`, separate from presentation.

## Do not implement

Do not:
- add motion-quality labelling or interval rejection (that is `015`);
- build the Step 3 demo UI (that is `016`);
- attempt phone IMU access.

## Data contracts touched

Adds (writes into the `007b` model): `head_yaw`, `head_pitch`, `head_roll`, `head_tx`,
`head_ty`, `head_tz`, `head_pose_quality`.
Preserves: sample row structure and raw-vs-filtered separation.
Does not: change export format.

## Acceptance criteria

The task is complete when:
- the module returns yaw/pitch/roll, approximate translation, and a pose-quality value,
  written to the session model.

## Automated checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- With the camera running, turn/tilt the head and confirm plausible yaw/pitch/roll changes
  and a sane pose-quality value.
- See `docs-dev/reviews/runtime_qa_checklist.md` (camera rows).

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main` using
this file's exact filename (`014b_head_pose_estimation.md`) as the commit message, then
push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
