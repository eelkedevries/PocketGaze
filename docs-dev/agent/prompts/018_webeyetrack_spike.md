# Task: Technical spike — WebEyeTrack screen gaze

## Goal

Evaluate whether WebEyeTrack can be self-hosted and used for browser-local screen-gaze
estimation in PocketGaze, and record a go/no-go decision in the specification.

## Scope

A time-boxed spike and a written decision. Guarded/throwaway prototype code only; no
production integration.

## Required reading

Read before editing:
1. `docs-dev/reference/primary_authoritative/specification.md` §3.4, §7.3, §9.
2. `docs-dev/reference/secondary_background/smartphone_eye_tracking_background.md` §9.
3. Source: camera/timing/feature modules; the `007b` session model.

## Dependencies

This prompt assumes:
- `012_feature_extraction.md` and `008`/`009` are complete (a live source for prototyping).
If they are missing, stop and report.

## Context

Resolves the open decision in spec §3.4/§7.3/§9 and gates `019`. Pre-use checks: background §9.

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

## Data contracts touched

Adds: none (decision only).
Preserves: the `007b` session model.
Does not: change the export schema.

## Acceptance criteria

The task is complete when:
- a go/no-go decision with rationale is recorded in the spec (version bumped);
- self-hosting, licence, browser support, and exposed fields are documented.

## Automated checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- If a guarded prototype was used, confirm it does not ship in the production build.
- Confirm the spec records the go/no-go decision and version bump.

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main` using
this file's exact filename (`018_webeyetrack_spike.md`) as the commit message, then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
