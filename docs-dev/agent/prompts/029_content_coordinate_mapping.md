# Task: Map gaze to content coordinates

## Goal

Convert screen-gaze coordinates into content-relative coordinates using DOM geometry, and
log scroll/zoom/transform so screen x/y is not misinterpreted, with deterministic unit
tests for the pure mapping maths.

## Scope

Content-coordinate mapping and transform logging only. No Step 7 demo UI (that is `030`).

## Required reading

Read before editing:
1. `docs-dev/reference/primary_authoritative/specification.md` §3.7, §6.2, §7.2, §4
   (content-mapped fields).
2. Source: the stimulus/viewport logging (`028`); the screen-gaze module (`019`); the
   `007b` model.

## Dependencies

This prompt assumes:
- `028_stimulus_viewport_logging.md` is complete; `019_screen_gaze_integration.md` is
  complete (or its fallback).
If `028` is missing, stop and report.

## Context

The pure screen↔content transform maths is unit-tested with `node --test`; DOM wiring is
not.

## Required changes

1. Use DOM geometry (`getBoundingClientRect`, `ResizeObserver`, `IntersectionObserver`) to
   map screen-gaze to content-relative coordinates and AOIs.
2. Log scroll/zoom/transform changes that alter the screen↔content relationship.
3. Emit `content_x/y` and `content_mapping_available` into the session model; set
   availability false when mapping cannot be computed; add `node --test` tests for the pure
   transform (known scroll/zoom recovered).

## Do not implement

Do not:
- build the Step 7 demo UI (that is `030`);
- add file export (that is `031`);
- present content coordinates when mapping is unavailable.

## Data contracts touched

Adds (writes into the `007b` model): `content_x`, `content_y`,
`content_mapping_available`.
Preserves: screen-gaze fields; the signal-type separation.
Does not: change export format.

## Acceptance criteria

The task is complete when:
- screen-gaze is mapped to content coordinates accounting for scroll/zoom/transform;
- `content_mapping_available` reflects whether mapping succeeded;
- `npm run test` covers the transform maths and passes.

## Automated checks

```bash
npm run build
npm run test
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- Confirm the transform unit tests run (not zero tests) and pass.
- Scroll/zoom content in the app; confirm content coordinates stay consistent and
  availability flips false when mapping is impossible.

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main` using
this file's exact filename (`029_content_coordinate_mapping.md`) as the commit message,
then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
