# Task: Add the WebEyeTrack screen-gaze provider (provider B)

## Goal

Add provider **B**, an opt-in WebEyeTrack adapter implementing the `ScreenGazeProvider`
interface from `019`, and register it (non-default) so the screen-gaze layer offers both
providers per the `018b` decision.

## Scope

The WebEyeTrack adapter, the provider registry assembly (A default + B opt-in), and the
self-hosting carve-out in the spec. No Step 4 demo UI/selector (`020`), no calibration (`022`).

## Required reading

Read before editing:
1. `docs-dev/reference/primary_authoritative/specification.md` §2.7, §3.4, §6.2, §7.3 (`018b`).
2. Source: `019` (the `ScreenGazeProvider` interface + registry); the `webeyetrack` package
   type definitions.

## Dependencies

This prompt assumes:
- `019_screen_gaze_integration.md` is complete (interface + registry + provider A).
- A published `webeyetrack` npm package exists (`webeyetrack@0.0.2`, MIT).
If the interface or package is missing, stop and report.

## Context

WebEyeTrack hardcodes runtime CDN fetches for its models and cannot be self-hosted without
forking. The user chose to allow this as a documented opt-in exception (§2.7); B is dynamically
imported so its TensorFlow.js runtime loads only when selected.

## Required changes

1. Install `webeyetrack` and add an adapter implementing `ScreenGazeProvider` that wraps the
   library, mapping its `normPog`/`gazeState` result to the shared `ScreenGazeEstimate`.
2. Load the package with a dynamic import inside `init()` so neither WebEyeTrack nor
   TensorFlow.js is pulled into the default bundle.
3. Assemble the provider registry with provider A registered first (default) and B opt-in.
4. Record the self-hosting CDN exception for B in the spec (§2.7, §7.3, §8) and bump the
   version.

## Do not implement

Do not:
- make B the default or load it eagerly into the main bundle;
- build the Step 4 demo UI/selector (`020`) or calibration (`022`);
- imply screen gaze is precise without calibration (§6.2);
- send raw camera frames anywhere (only the CDN model fetch is permitted).

## Data contracts touched

Adds: none beyond `019` (B writes the same §4 `gaze_*` fields via the shared helper).
Preserves: the eye-local/screen-gaze separation; the §4 schema.
Does not: change the export format.

## Acceptance criteria

The task is complete when:
- a WebEyeTrack provider implements `ScreenGazeProvider`, loaded via dynamic import;
- the registry exposes both providers with A as default;
- the spec records the documented CDN self-hosting exception for B (version bumped).

## Automated checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
npm run test
```

## Manual verification

- Confirm the default bundle does not include TensorFlow.js until provider B is selected.
- Confirm provider B reports unavailable until initialised, and degrades cleanly on error.
- Live WebEyeTrack behaviour needs a real device/camera (see
  `docs-dev/reviews/runtime_qa_checklist.md`).

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main` using this
file's exact filename (`019b_webeyetrack_provider.md`) as the commit message, then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
