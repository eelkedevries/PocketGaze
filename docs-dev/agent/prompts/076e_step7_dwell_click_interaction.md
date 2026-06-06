# Task: Applied AOI examples on Step 7 — dwell-click interaction

## Goal

Add a dwell-click interaction on Step 7 so dwell selection works in the active mode without
accuracy overclaims.

## Scope

A new dwell-click interaction demo on Step 7. Part of the Prompt 18 series; its own commit.

## Required reading

1. `docs-dev/reviews/current-state-audit.md` (Prompt 0).
2. The Step 7 AOI / dwell infrastructure.

## Dependencies

Runs after the Phase 4 readiness gate (`072`). Use real calibrated gaze only when
validation passes; otherwise a clearly labelled pointer mode.

## Rationale

Dwell-to-select is a common gaze interaction; demonstrating it shows applied use while the
mode labelling keeps accuracy claims honest.

## Required changes

1. Add a dwell-click interaction (new).
2. Make dwell selection work in the active mode without accuracy overclaims.
3. Use real calibrated gaze only when validation passes; otherwise a clearly labelled
   pointer mode.

## Do not implement

Do not:
- present pointer-mode data as calibrated gaze;
- overclaim selection accuracy.

## Acceptance criteria

Dwell selection works in the active mode without accuracy overclaims.

## Automated checks

```bash
npm run build
npm run test
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- On Step 7, confirm dwell selection triggers in the active mode and the mode is labelled
  without accuracy overclaims.

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main`
using this file's exact filename (`076e_step7_dwell_click_interaction.md`) as the commit
message, then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
