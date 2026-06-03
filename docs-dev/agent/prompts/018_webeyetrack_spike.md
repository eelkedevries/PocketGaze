# Task: Technical spike — WebEyeTrack screen gaze

## Goal

Evaluate whether WebEyeTrack can be self-hosted and used for browser-local screen-gaze
estimation in PocketGaze, and record a go/no-go decision in the specification.

## Scope

A time-boxed spike and a written decision. Guarded/throwaway prototype code only; no
production integration.

## Context

Resolves the open decision in specification §3.4, §7.3, and §9. Pre-use checks are in
background §9. Gates `019`.

## Required changes

1. Verify licence and reuse terms; whether weights/assets can be self-hosted (no required
   external service); browser compatibility and performance on mid-range phones; and
   whether timestamps, confidence/quality, and per-eye/export fields are exposed.
2. Record a clear go/no-go recommendation and update specification §3.4/§7.3/§9 (bump the
   version). If no-go, note the fallback (eye-local only, or WebGazer baseline).

## Do not implement

Do not:
- build the production screen-gaze integration (that is `019`);
- ship WebEyeTrack assets unless licence and self-hosting are confirmed;
- add calibration or the Step 4 demo.

## Acceptance criteria

The task is complete when:
- a go/no-go decision with rationale is recorded in the spec (version bumped);
- self-hosting, licence, browser support, and exposed fields are documented;
- `npm run build` passes.

## Checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main` using
this file's exact filename (`018_webeyetrack_spike.md`) as the commit message, then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
