# Phase 4 readiness gate (Prompt 072 / driver Phase 4 gate)

Decision: **Phase 4 may begin.**

This note confirms the revision-7 Phase 1–3 work (`058`–`071`) is complete, no duplicate
artefacts were introduced, validation status is settled, and the toolchain is green on
`main`.

## Phase 1 — credibility and correctness

- `058` status reconciled: no working step page says scaffold/placeholder/"not yet
  implemented"; Step 0 limitations are real; README/footer/About aligned. ✅
- `059` specialist wording corrected: Nyquist vs sampling, main-sequence framing,
  gimbal-lock, rank-deficiency note, "always available" qualified, Step 2 per-eye
  mirroring convention made explicit. ✅
- `060` terminology standardised + glossary extended in place (one glossary, all listed
  terms incl. subtypes and candidate-event labels); no "iris/pupil proxy" remains; no
  export columns renamed. ✅
- `061` Step 3 renamed to "Head pose and motion quality"; role stated; no metric
  translation claim. ✅
- `062` input mode explicit on the pursuit, gaze-contingent, scanpath, and AOI demos
  (indicators + warnings). The four demos are visual-only and write no session rows, so
  pointer/simulated data cannot enter the export; `signal_type` already labels exported
  signals. ✅
- `063` already-built capabilities surfaced: export now reachable on Steps 1, 5, 6, 7
  (per-step stores), not Step 1 only. ✅

## Phase 2 — validity framing

- `064` signal-taxonomy claims table on Step 0 with an explicit "does not support" column. ✅
- `065` Step 5 structurally separates fitting from held-out validation; metric set named;
  added a usable/marginal/poor validation verdict and a recalibration prompt. ✅
- `065b` (minimal held-out validation) **correctly skipped**: the `057` audit found
  validation already present (`validationTask.tsx`, `lib/validationMetrics.ts`, surfaced on
  Step 5 with accuracy/RMS-S2S/BCEA). No commit was made for `065b`. This is the dependency
  Prompt 17 (`075`) relies on, and it is satisfied. ✅
- `066` shared coordinate-chain figure on Steps 0, 4, 5, 7 (alt text). ✅
- `067` accuracy comparison reconciled: converted the unsourced dva synthesis to a
  qualitative contrast (no unsourced numbers); no second table created. ✅

## Phase 3 — robustness and ethics

- `068` illumination/failure-mode panel near Step 2, reusing the existing panel pattern. ✅
- `069` device/browser benchmark **template** (all performance cells "not yet measured") +
  live device-capability readout + manual protocol; nothing fabricated. ✅
- `070` privacy/ethics passage extended (sensitivity, consent, privacy-by-design) + export
  inspector; default export excludes raw frames/landmarks (never exported at all). ✅
- `071` actionable messages for detectable conditions (low frame rate, unstable landmarks)
  added; drift and unstable-event detection recorded as non-blocking TODOs, not guessed. ✅

## Duplication check

No duplicate panels, tables, or glossaries were introduced. The glossary, method-comparison
table, privacy section, and limitation panels were all extended in place per the audit. The
device benchmark template and export inspector are new artefacts with no pre-existing
equivalent (confirmed against the `057` audit).

## Toolchain

Green on `main`: `npm run build`, `npm run check`, `npm run test` (234 tests, 0 fail),
`scripts/check-public-build.sh`, and `scripts/validate-prompts.sh` all pass.

## Unresolved Phase 1–3 issues (carried into Phase 4 / 5)

- **Runtime/browser verification deferred** (no camera/browser automation here): the live
  behaviour of every camera demo, the new warnings, and the export remain on the manual
  checklist in `current-state-audit.md`. Priority: medium (human, on-device).
- **Spec/planning reconciliation outstanding** by design — Prompt 20 (`078`) folds in the
  Step 3 rename, the linear-mapping label, and additive schema/event values, and corrects
  `current_state.md`. Priority: high (do last).
- **Validation drift / unstable-event detection**: TODOs in `step5.tsx`/`step6.tsx`; the
  drift case is addressed instructionally by `075`. Priority: low.

Phase 4 (`073a`–`077`) may proceed.
