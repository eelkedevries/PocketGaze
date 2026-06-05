# New prompt queue (034–056) — index

Implements all suggestions from the analysis, continuing the existing queue from
`033`. Each prompt is a single reviewable unit and follows
`docs-dev/agent/prompt_authoring_guide.md`. Per the agreed approach these are
**self-contained**: they carry their own rationale and record additive schema
changes in their own `Data contracts touched` section rather than depending on a
prior specification amendment. The specification (currently v1.6) is **not**
updated by these prompts; if you want the binding canon kept in step, reconcile it
afterwards (several prompts add fields/event values flagged for `current_state.md`).

This index is not a prompt; do not run it. Run the numbered files in order, or by
phase. `pure-logic library` prompts must precede their `demo` prompts (the repo's
established split).

## Phase J — Validation and data quality
- `034_validation_metrics_lib.md` — accuracy, precision (RMS-S2S), BCEA (pure + tests)
- `035_validation_task.md` — validation grid on held-out targets (capture)
- `036_validation_demo.md` — accuracy/precision readout + spatial error map (Step 5)
- `037_live_precision_readout.md` — rolling RMS-S2S live precision widget

## Phase K — Visual angle (degrees)
- `038_visual_angle_estimation_lib.md` — IPD-based viewing distance + angular scale (pure + tests)
- `039_dva_session_integration.md` — scale into the model; roughly-metric head-pose translation
- `040_dva_units_and_explainer.md` — accuracy/precision/saccade amplitude in degrees + explainer

## Phase L — Eye-movement completeness
- `041_smooth_pursuit_lib.md` — pursuit path + pursuit-gain metric (pure + tests)
- `042_smooth_pursuit_demo.md` — moving-target pursuit demo
- `043_fixation_aggregation_lib.md` — scanpath + heatmap aggregation (pure + tests)
- `044_scanpath_heatmap_demo.md` — scanpath + heatmap (with over-interpretation caveat)
- `045_aoi_metrics_lib.md` — dwell / fixation count / TTFF per AOI (pure + tests)
- `046_aoi_dwell_demo.md` — reading/image AOI demo (Step 7)
- `047_gaze_contingent_demo.md` — spotlight / moving-window + latency

## Phase M — Honesty and context
- `048_honesty_limitation_panels.md` — sampling rate (+ coarse/fine figure), no corneal reflection, microsaccades/pupillometry
- `049_method_comparison_table.md` — browser vs research-grade vs commercial webcam

## Phase N — Explanatory interactions and visibility
- `050_head_pose_compensation_toggle.md` — compensation on/off drift contrast
- `051_one_euro_and_calibration_sliders.md` — `beta` slider + calibration-point dropout
- `052_eye_region_crop_and_ear_trace.md` — zoomed iris crop + normalisation box + live EAR trace (Step 2)
- `053_velocity_trace_threshold.md` — velocity trace with the detection threshold line (Step 6)
- `054_calibration_warped_grid.md` — warped-grid deformation field (Step 5)
- `055_frame_filmstrip.md` — frame-as-sample filmstrip with timestamps (Step 1)
- `056_progressive_disclosure_levels.md` — concept → mechanism → maths ladder

## Notes
- New event-type value `smooth_pursuit_candidate` (041) and new sample/quality
  fields (dva in 039; degree amplitude in 040) are additive; each prompt flags them
  for `current_state.md`. If you adopt option A later, fold these into
  specification §4/§5/§7 and bump the version.
- Validation rows reuse the existing `quality`/`stimulus` row types via
  `task_phase`, so no sixth row type is introduced.
