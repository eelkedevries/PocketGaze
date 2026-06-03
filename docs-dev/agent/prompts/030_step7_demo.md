# Task: Build the Step 7 content-mapping demo and panels

## Goal

Wire stimulus/viewport logging and content mapping into the Step 7 page: contrast screen
coordinates with content-relative coordinates for content that scrolls/moves/transforms.

## Scope

Step 7 demo UI only. Reuse modules from `028` and `029`.

## Required reading

Read before editing:
1. `docs-dev/reference/primary_authoritative/specification.md` §3.7, §6.2, §2.5, §2.6.
2. `docs-dev/reviews/runtime_qa_checklist.md` (mobile; toggle rows).
3. Source: the stimulus/viewport (`028`) and content-mapping (`029`) modules.

## Dependencies

This prompt assumes:
- `028_stimulus_viewport_logging.md` and `029_content_coordinate_mapping.md` are complete.
If any is missing, stop and report.

## Context

Implements the Step 7 demo and panels using the shared master control (§2.5).

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
- content-mapping panels appear only when "Show implementation details" is enabled.

## Automated checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- Open Step 7 and scroll/zoom the content; confirm screen vs content coordinates diverge as
  expected and the framing makes the point clear.
- Toggle the master control; confirm the content-mapping panels show/hide.
- See `docs-dev/reviews/runtime_qa_checklist.md` (mobile; toggle rows).

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main` using
this file's exact filename (`030_step7_demo.md`) as the commit message, then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
