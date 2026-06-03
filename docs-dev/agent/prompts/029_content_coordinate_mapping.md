# Task: Map gaze to content coordinates

## Goal

Convert screen-gaze coordinates into content-relative coordinates using DOM geometry, and
log scroll/zoom/transform so screen x/y is not misinterpreted.

## Scope

Content-coordinate mapping and transform logging only. No Step 7 demo UI (that is `030`).

## Context

Implements specification §3.7 (layout/position logging, scroll/zoom/transform logging),
§6.2/§7.2 (content-mapped coordinate), §4 content-mapped fields (`content_x/y`,
`content_mapping_available`). Uses logging from `028` and screen gaze from `019`.

## Required changes

1. Use DOM geometry (`getBoundingClientRect`, `ResizeObserver`, `IntersectionObserver`) to
   map screen-gaze to content-relative coordinates and AOIs.
2. Log scroll/zoom/transform changes that alter the screen↔content relationship.
3. Emit `content_x/y` and `content_mapping_available`; set availability false when mapping
   cannot be computed.

## Do not implement

Do not:
- build the Step 7 demo UI (that is `030`);
- add export (that is `031`);
- present content coordinates when mapping is unavailable.

## Acceptance criteria

The task is complete when:
- screen-gaze is mapped to content coordinates accounting for scroll/zoom/transform;
- `content_mapping_available` reflects whether mapping succeeded;
- `npm run build` passes.

## Checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main` using
this file's exact filename (`029_content_coordinate_mapping.md`) as the commit message,
then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
