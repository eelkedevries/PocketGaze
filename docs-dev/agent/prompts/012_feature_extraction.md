# Task: Integrate face and eye feature extraction

## Goal

Integrate the chosen landmark library into a reusable feature-extraction module producing
face landmarks, per-eye regions, iris/pupil proxy, eyelid openness, and per-eye quality.

## Scope

The feature-extraction module only. No Step 2 demo UI (that is `013`), no head pose or
gaze.

## Context

Implements specification §3.2; uses the library locked in `011`. Reusable logic under
`src/lib/`; shared types under `src/types/`.

## Required changes

1. Add a module that consumes camera frames (from `008`/`009`) and outputs face landmarks,
   left/right eye regions, iris/pupil-proxy positions, eyelid-openness, and per-eye quality
   scores, with stable typed outputs.
2. Self-host any model assets (no external CDN dependency at runtime).
3. Keep the module framework-agnostic and separate from presentation.

## Do not implement

Do not:
- build the Step 2 overlay/demo UI (that is `013`);
- add head pose, eye-local signal, or gaze;
- store or upload frames.

## Acceptance criteria

The task is complete when:
- the module returns landmarks, per-eye regions, iris proxy, openness, and per-eye quality
  for live frames;
- model assets are self-hosted;
- `npm run build` passes.

## Checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main` using
this file's exact filename (`012_feature_extraction.md`) as the commit message, then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
