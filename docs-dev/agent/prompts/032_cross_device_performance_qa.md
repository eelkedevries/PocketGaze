# Task: Cross-device performance and graceful-degradation QA

## Goal

Verify and improve performance and graceful degradation across the target browsers/devices,
ensuring no demo breaks when a capability or library is unavailable.

## Scope

Performance/robustness verification and targeted fixes only. No new features.

## Required reading

Read before editing:
1. `docs-dev/reference/primary_authoritative/specification.md` §2.8.
2. `docs-dev/reference/secondary_background/overview.md` §6.1; `smartphone_eye_tracking_background.md` §6.
3. `docs-dev/reviews/runtime_qa_checklist.md` (all rows).

## Dependencies

This prompt assumes:
- The step demos (`010`,`013`,`016`,`020`,`023`,`027`,`030`) and export (`031`) are
  complete.
If major demos are missing, stop and report (QA needs something to test).

## Context

Targeted hardening, not new functionality.

## Required changes

1. Verify the demos on the target browsers (Android Chrome/Firefox; document iOS Safari
   status), checking effective frame rate and responsiveness on mid-range hardware.
2. Confirm graceful degradation when `requestVideoFrameCallback`, the camera, or WebGL/WASM
   is unavailable, and when permissions are denied.
3. Apply targeted fixes (e.g. shared pipeline, throttling, releasing the camera) without
   adding features; document any residual limitations.

## Do not implement

Do not:
- add new step features or demos;
- add native-app or cloud code;
- introduce heavy dependencies for micro-optimisation.

## Data contracts touched

Adds: none.
Preserves: all existing data shapes and the export format.
Does not: change schema or behaviour beyond performance/robustness fixes.

## Acceptance criteria

The task is complete when:
- demos run acceptably on the target browsers/devices (results documented);
- missing-capability and denied-permission paths degrade gracefully, never breaking;
- residual limitations are documented.

## Automated checks

```bash
npm run build
npm run test
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- Work through `docs-dev/reviews/runtime_qa_checklist.md` on Android Chrome and Firefox.
- Force missing-capability and denied-permission paths; confirm graceful behaviour.
- Record device/browser results and residual limitations in the final report.

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main` using
this file's exact filename (`032_cross_device_performance_qa.md`) as the commit message,
then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
