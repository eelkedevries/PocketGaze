# Task: Baseline checks, state verification, and capability inventory

## Goal

Establish the project's starting state — the toolchain baseline, the per-step demo
status, and an inventory of which capabilities exist and whether each is surfaced —
and record it in a development-only audit note, making no functional changes.

## Scope

A single audit note under `docs-dev/reviews/`. No behavioural, content, or copy
change of any kind. This prompt establishes ground truth; every later prompt in this
batch (revision 7) anchors to verified code via this audit rather than to the
planning notes or the deployment.

## Required reading

1. `AGENTS.md` and `000b_index_revision7.md` (this batch's conventions and run order).
2. `package.json` (the available scripts).
3. `src/steps.ts`, `src/demos/registry.ts`, the step page components, and the export
   code.
4. `docs-dev/reference/primary_authoritative/specification.md` and
   `docs-dev/planning/current_state.md` (to find where code disagrees with them).

## Dependencies

None. This is the first prompt in the batch.

## Rationale

A revision-4 evaluation found `current_state.md` claiming all scaffold wording had
been removed while `src/steps.ts` still carried it. The project's own planning
documents therefore cannot be trusted on completeness, so this audit records only
what code confirms and is the anchor for all later prompts.

## Required changes

1. List the available build/typecheck/test/preview commands from `package.json`, run
   them, and record any pre-existing failures. There is no lint script; note its
   absence rather than inventing one.
2. Attempt to run each Step 1–7 demo locally and, if possible, on the deployed site.
   If camera or browser automation is unavailable, inspect source, record only what
   code confirms, and write a manual test checklist. Record per step: whether the
   demo runs, what it requires, and whether the deployed build matches source.
3. Inventory which of these exist in code, and separately whether each is surfaced to
   a user: held-out validation; precision metrics (RMS-S2S, BCEA); a
   degrees-of-visual-angle estimate; raw-plus-filtered retention (note whether the
   retained raw is signal samples, frames, or landmarks); CSV/session export; the
   lab-versus-webcam comparison table; the Step 0 glossary; and the AOI / heatmap /
   scanpath / gaze-contingent / smooth-pursuit demos. For each, record the file that
   implements it so later prompts can extend rather than re-create it.
4. Record where the code disagrees with `docs-dev/planning/current_state.md` and with
   the specification, so Prompt 20 (`078`) can reconcile them. Trust the code over
   both.

Write results to `docs-dev/reviews/current-state-audit.md`. Commit only that note.

## Do not implement

Do not:
- make any behavioural, content, or copy change;
- edit `current_state.md` or the specification (Prompt 20 reconciles those);
- fabricate runtime results — if a check cannot run here, say so and add it to the
  manual checklist.

## Acceptance criteria

The audit note records, per step, demo status and how it was verified; the toolchain
baseline; which listed capabilities exist and whether each is surfaced (with the
implementing file); and any code/doc disagreements. No behavioural change is
committed. The note is under `docs-dev/`, not `docs/`.

## Automated checks

```bash
npm run build
npm run check
npm run test
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- Confirm `docs-dev/reviews/current-state-audit.md` exists, is development-only, and
  records the per-step demo status, the capability inventory with implementing files,
  and the code/doc disagreements.

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main`
using this file's exact filename (`057_baseline_state_audit.md`) as the commit
message, then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
