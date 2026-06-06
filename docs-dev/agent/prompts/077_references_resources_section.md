# Task: References and resources section

## Goal

Add a concise resources section explaining how webcam/smartphone methods differ from
laboratory infrared systems, organised under set themes, and confirm every empirical claim
in the project carries a source or is removed.

## Scope

A resources section (pointers, not a review) and a sweep that every empirical claim,
including the Prompt 10 (`067`) and Prompt 12 (`069`) figures, is sourced or removed.

## Required reading

1. `docs-dev/reviews/current-state-audit.md` (Prompt 0) and the Phase 4 readiness note
   (`072`).
2. The accuracy comparison (`067`) and benchmark table (`069`) copy.

## Dependencies

Runs after the Phase 4 readiness gate (`072`). Best done late so it can sweep all
empirical claims added earlier.

## Rationale

A pointers section helps readers go deeper and provides the place to anchor sources;
sweeping for unsourced claims protects the project's credibility.

## Required changes

1. Add a concise resources section explaining how webcam/smartphone methods differ from
   laboratory infrared pupil and corneal-reflection systems in illumination, optics,
   sampling rate, geometry, and validation.
2. Organise it under: video-based eye tracking; infrared pupil/corneal-reflection
   tracking; appearance-based gaze estimation; calibration and validation; accuracy,
   precision, and visual angle; filtering and event detection; and privacy and gaze data.
3. Keep it to pointers, not a review.
4. Confirm every empirical claim in the project (including the `067` and `069` figures)
   carries a source or is removed.

## Do not implement

Do not:
- write a full literature review;
- leave any unsourced empirical claim in the project.

## Acceptance criteria

The section covers these themes and no unsourced empirical claim remains.

## Automated checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- Confirm the resources section covers each theme as pointers, and spot-check that
  empirical claims across the site carry a source.

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main`
using this file's exact filename (`077_references_resources_section.md`) as the commit
message, then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
