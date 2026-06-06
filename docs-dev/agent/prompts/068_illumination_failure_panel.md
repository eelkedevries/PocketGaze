# Task: Add or extend an illumination and failure-mode panel

## Goal

Provide a "why tracking fails" treatment near Step 2, enumerating the main failure modes
and their expected effects, reusing the project's existing limitation-panel pattern.

## Scope

One illumination/failure-mode panel near Step 2, following the existing panel
component/pattern. No new panel framework; no restating content already covered
elsewhere.

## Required reading

1. `docs-dev/reviews/current-state-audit.md` (Prompt 0) — the existing honesty/limitation
   panels (Step 1 sampling-rate, Step 3 no-corneal-reflection, About-page "out of reach").
2. `src/components/LimitationPanels.tsx` (the panel pattern) and Step 2.

## Dependencies

Assumes `057` (audit). Reuse the existing panel component for consistency.

## Rationale

A consistent, honest failure-mode treatment helps users interpret poor results; reusing
the existing panel pattern keeps the register and styling uniform.

## Required changes

1. Provide a "why tracking fails" treatment near Step 2 covering at least: low light,
   side lighting, glasses glare, occlusion (hair/eyelid/face), extreme yaw/pitch, low
   resolution, hand-held movement, autofocus/exposure shifts, and browser throttling —
   each with its expected effect.
2. Reuse the existing panel pattern and component for consistency, and place this new
   illumination/failure-mode content near Step 2 without duplicating those existing
   panels' content.
3. Live warnings, static examples, or both.

## Do not implement

Do not:
- introduce a new panel framework;
- restate content already covered by the existing panels.

## Acceptance criteria

The failure-mode treatment near Step 2 enumerates these modes and their effects, follows
the existing panel pattern, and does not restate content already covered elsewhere.

## Automated checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- Confirm the panel appears near Step 2, lists each failure mode with its effect, and
  matches the existing panel styling without duplicating other panels.

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main`
using this file's exact filename (`068_illumination_failure_panel.md`) as the commit
message, then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
