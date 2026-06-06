# Task: Add a coordinate-system figure

## Goal

Add one schematic tracing a point through the coordinate chain — camera frame to
landmarks to eye-region-local to screen to viewport to content/AOI coordinates — and
reuse it on Steps 0, 4, 5, and 7.

## Scope

One reusable figure asset/component with alt text, placed on Steps 0, 4, 5, and 7. No
logic changes.

## Required reading

1. `docs-dev/reviews/current-state-audit.md` (Prompt 0).
2. The step page components for Steps 0, 4, 5, 7; the content-coordinate mapping module
   (for accurate labels).

## Dependencies

Assumes `057` (audit). Choose whatever rendering fits the codebase (inline SVG,
component, or asset).

## Rationale

A single shared schematic gives readers a consistent mental model of how a point moves
through the pipeline, reducing repeated ad-hoc explanation across steps.

## Required changes

1. Add one schematic tracing a point through camera frame, landmarks, eye-region-local,
   screen, viewport, and content/AOI coordinates: minimalist, labelled, landscape, with
   descriptive alt text.
2. Reuse it on Steps 0, 4, 5, and 7.
3. Choose whatever rendering fits the codebase.

## Do not implement

Do not:
- create a different figure per step;
- omit the descriptive alt text.

## Acceptance criteria

The figure appears on Steps 0, 4, 5, and 7, carries alt text, and those pages still read
coherently.

## Automated checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- Confirm the same figure renders on Steps 0, 4, 5, and 7 with descriptive alt text and
  the surrounding copy still reads coherently.

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main`
using this file's exact filename (`066_coordinate_system_figure.md`) as the commit
message, then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
