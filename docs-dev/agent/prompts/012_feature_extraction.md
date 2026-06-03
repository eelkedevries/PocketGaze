# Task: Integrate face and eye feature extraction

## Goal

Integrate the chosen landmark library into a reusable feature-extraction module producing
face landmarks, per-eye regions, iris/pupil proxy, eyelid openness, and per-eye quality,
written into the shared session model.

## Scope

The feature-extraction module only. No Step 2 demo UI (that is `013`), no head pose or
gaze.

## Required reading

Read before editing:
1. `docs-dev/reference/primary_authoritative/specification.md` §3.2, §4 (quality and
   blink/eye-state fields), §7.3 (locked library).
2. Source: the `011` decision; camera/timing modules; the `007b` session model.

## Dependencies

This prompt assumes:
- `011_landmark_library_spike.md` is complete and a library is locked in the spec.
- `008`/`009` (camera/timing) and `007b` (session model) are complete.
If the library is not locked, stop and report.

## Context

Reusable logic under `src/lib/`; shared types under `src/types/` per the `007b` model.

## Required changes

1. Add a module that consumes camera frames and outputs face landmarks, left/right eye
   regions, iris/pupil-proxy positions, eyelid-openness, and per-eye quality scores.
2. Self-host any model assets (no external CDN dependency at runtime).
3. Write the relevant outputs into the session model; keep the module framework-agnostic.

## Do not implement

Do not:
- build the Step 2 overlay/demo UI (that is `013`);
- add head pose, eye-local signal, or gaze;
- store or upload frames.

## Data contracts touched

Adds (writes into the `007b` model): `left/right_eye_quality`, `face_quality`,
`left_eye_open`, `right_eye_open`, `blink_state` (and internal landmark/region structures).
Preserves: sample row structure and raw-vs-filtered separation.
Does not: change export format or store raw video.

## Acceptance criteria

The task is complete when:
- the module returns landmarks, per-eye regions, iris proxy, openness, and per-eye quality
  for live frames, written to the session model;
- model assets are self-hosted.

## Automated checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- With the camera running, log/inspect the feature outputs and confirm plausible landmarks,
  eye regions, iris proxy, openness, and per-eye quality.
- Confirm model assets load from the same origin (no external CDN).
- See `docs-dev/reviews/runtime_qa_checklist.md` (camera; build-hygiene rows).

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main` using
this file's exact filename (`012_feature_extraction.md`) as the commit message, then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
