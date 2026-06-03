# Task: Cross-device performance and graceful-degradation QA

## Goal

Verify and improve performance and graceful degradation across the target browsers/devices,
ensuring no demo breaks when a capability or library is unavailable.

## Scope

Performance/robustness verification and targeted fixes only. No new features.

## Context

Implements specification §2.8 (performance and device targets) and background §6 (browser/
mobile constraints), §6.1 (Pipeline 1 verification checklist).

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

## Acceptance criteria

The task is complete when:
- demos run acceptably on the target browsers/devices (results documented);
- missing-capability and denied-permission paths degrade gracefully, never breaking;
- residual limitations are documented;
- `npm run build` passes.

## Checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main` using
this file's exact filename (`032_cross_device_performance_qa.md`) as the commit message,
then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
