# Task: Build the Step 7 content-mapping demo and panels

## Goal

Wire stimulus/viewport logging and content mapping into the Step 7 page: contrast screen
coordinates with content-relative coordinates for content that scrolls/moves/transforms.

## Scope

Step 7 demo UI only. Reuse modules from `028` and `029`.

## Context

Implements specification §3.7 (Step 7 demo and panels), §6.2, §2.5, §2.6.

## Required changes

1. Replace the Step 7 live-demo placeholder with a demo contrasting screen vs content-
   relative coordinates over scrollable/movable content.
2. Add subprocess panels (logged stimulus identity/position/time; viewport/DPR/orientation;
   element coordinates; scroll/zoom/transform log) shown only when the master control is
   enabled.
3. Make the "screen coordinates can mislead" point visible in the framing.

## Do not implement

Do not:
- add data export (that is `031`);
- add a second show/hide control.

## Acceptance criteria

The task is complete when:
- Step 7 shows screen vs content coordinates under scroll/zoom/transform;
- content-mapping panels appear only when "Show implementation details" is enabled;
- `npm run build` passes.

## Checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main` using
this file's exact filename (`030_step7_demo.md`) as the commit message, then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
