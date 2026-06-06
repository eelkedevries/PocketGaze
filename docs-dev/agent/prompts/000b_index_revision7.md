# Revision-7 prompt queue (057–078) — index

This batch folds the external "PocketGaze: Claude Code implementation prompts
(revision 7)" driver into the repository's numbered work queue, continuing from `056`.
The original driver numbered its prompts `0`, `0b`, `1`–`20` with lettered sub-prompts;
they have been renumbered into the repo's three-digit scheme, preserving the lettered
sub-prompt structure. This index is not a prompt; do not run it. Run the numbered files
in order.

These prompts are audit-first: Prompt 0 (`057`) establishes verified ground truth and
every later prompt anchors to that audit rather than to the planning notes or the
deployment. Each file is a single reviewable unit and ends with the five-section final
report from `AGENTS.md`; per the repo convention each commit uses the prompt's exact
filename as its message.

## Number mapping (driver → repo)

- Prompt 0 → `057_baseline_state_audit.md`
- Prompt 0b → `057b_reconcile_conventions.md`
- Prompt 1 → `058_reconcile_implementation_status.md`
- Prompt 2 → `059_correct_specialist_wording.md`
- Prompt 3 → `060_standardise_terminology_glossary.md`
- Prompt 4 → `061_rename_scope_step3.md`
- Prompt 5 → `062_explicit_input_mode.md`
- Prompt 6 → `063_surface_built_capabilities.md`
- Prompt 7 → `064_step0_signal_taxonomy_table.md`
- Prompt 8 → `065_step5_calibration_vs_validation.md`
- Prompt 8b → `065b_minimal_holdout_validation.md`
- Prompt 9 → `066_coordinate_system_figure.md`
- Prompt 10 → `067_accuracy_expectations_lab.md`
- Prompt 11 → `068_illumination_failure_panel.md`
- Prompt 12 → `069_device_browser_benchmark_table.md`
- Prompt 13 → `070_privacy_ethics_export_inspector.md`
- Prompt 14 → `071_actionable_failure_messages.md`
- Phase 4 readiness gate → `072_phase4_readiness_gate.md`
- Prompt 15a → `073a_step1_sampling_rate_replay.md`
- Prompt 15b → `073b_step1_latency_budget.md`
- Prompt 16a → `074a_step6_synthetic_event_trace.md`
- Prompt 16b → `074b_step6_event_detection_comparison.md`
- Prompt 17 → `075_step5_calibration_drift_demo.md`
- Prompt 18a → `076a_step7_aoi_dwell_demo.md`
- Prompt 18b → `076b_step7_reading_passage_aoi.md`
- Prompt 18c → `076c_step7_visual_search_task.md`
- Prompt 18d → `076d_step7_heatmap_demo.md`
- Prompt 18e → `076e_step7_dwell_click_interaction.md`
- Prompt 19 → `077_references_resources_section.md`
- Prompt 20 → `078_reconcile_records_spec.md`

## Phases

- Phase 0 — establish ground truth: `057`, `057b`.
- Phase 1 — credibility and correctness: `058`–`063`.
- Phase 2 — validity framing: `064`–`067` (plus `065b`).
- Phase 3 — robustness and ethics: `068`–`071`.
- Phase 4 readiness gate: `072`.
- Phase 4 — educational extensions: `073a`–`077`.
- Phase 5 — reconcile the records: `078`.

## Run order and notes

- Run `057`, then `057b`, then Phases 1–3 in order, then the readiness gate (`072`), then
  Phase 4, then Phase 5 (`078`) last so it reconciles the records against the finished
  work.
- Run `065b` (Prompt 8b) only if `057` found no validation task, after `065` and before
  `075`; if validation already exists, record `065b` as skipped.
- Several prompts edit the same pages — Step 0 in `058`, `060`, `064`, `066`; Step 5 in
  `059`, `065`, `065b`, `066`, `075` — so re-check those pages after each edit.
- The do-not-duplicate rule applies throughout: before creating any panel, table,
  glossary, figure, or demo, check the `057` audit and extend/relocate rather than create a
  second one.

## Project conventions (from the driver; reconciled into `AGENTS.md` by `057b`)

- One commit per prompt or lettered sub-prompt; each commit must build and pass the
  available checks independently. The real checks are `npm run build` (verify),
  `npm run check` (typecheck-only), and `npm run test` (`node --test`); there is no lint
  script.
- Do not invent benchmark values, citations, accuracy figures, or runtime test results.
- Verification deferral covers runtime/browser checks only — never implementation scope and
  never the toolchain checks, which must always run and pass.
- Raw-signal distinction: raw derived signal samples (the unfiltered signal trace) are
  distinct from raw video frames and raw landmark data; the signal trace may be
  surfaced/exported, frames and landmarks must not.
- Do not duplicate existing work; extend, relocate, or cite it when the audit finds it.
- Do not overclaim or under-claim; make clear what is measured, estimated, assumed,
  validated, and what can go wrong.
- House style: formal, precise British English; sparing emphasis; restrained em-dash use;
  sentence-case headings; match the surrounding voice.
- Event vocabulary: reuse the repository's existing candidate-event labels verbatim
  (fixation_candidate, saccade_candidate, saccade_head_still,
  saccade_during_head_movement, uncertain_head_motion, blink, tracking_lost,
  smooth_pursuit_candidate); do not coin new event names.
- End every task with the repository's five-section final report (`AGENTS.md`).
