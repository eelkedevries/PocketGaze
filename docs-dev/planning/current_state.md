# Current state

Living, high-level orientation for the project: what exists now, key architectural
decisions, and what is in progress. Read it at the start of a session to orient quickly.

This file records what *is* (current reality). The binding design canon is
`docs-dev/reference/primary_authoritative/`; when the two conflict, the canon wins and the
gap is work still to be done.

## Systems

- **Static site scaffold** — React + TypeScript + Vite. Builds to `dist/`, base path
  `/PocketGaze/`.
- **Top navigation across Step 0–7** — Step 0 (Overview) through Step 7 (Content and
  stimulus mapping), routed with `react-router-dom` (`HashRouter` for GitHub Pages).
- **Shared step-page structure** — every step uses the same sections: introduction,
  options/methods, implementation on this page, live demo area, optional
  implementation/subprocess area, outputs, limitations.
- **Master "Show implementation details" control** — a single site-wide toggle in the
  header (React context) that reveals or hides the optional implementation/subprocess
  placeholder panels on each step page. The setting persists in `localStorage`
  (default off).
- **About/Privacy page** — a standalone static page (`/about`, linked from the footer)
  stating the portfolio intent and the privacy-by-default posture (browser-local
  processing, no raw video stored by default, derived data treated as sensitive).
- **Shared data/session model** — the single source of truth for the internal data shape
  (spec §2.3, §4). Types in `src/types/session.ts` cover the five row types
  (sample/event/calibration/stimulus/quality) and every §4 field group, with raw and
  filtered signals as separate fields and blank (optional) distinct from a real `0`. An
  in-memory `SessionStore` (`src/lib/sessionStore.ts`) accumulates typed rows and owns the
  session-relative `time_ms` clock; later capture/tracking modules write to it rather than
  inventing their own shapes. Export (prompt 031) will serialise this store. Unit-tested
  with `node --test` (`npm run test`).
- **Validation (held-out accuracy/precision)** — a pure metrics library
  (`src/lib/validationMetrics.ts`, `034`) computing the field-standard data-quality
  metrics (accuracy, RMS-S2S precision, BCEA) in normalised units, unit-tested with
  `node --test`; and a follow-the-dots **validation** task (`src/demos/validationTask.tsx`,
  `035`) presenting a grid offset from the 9 calibration points, capturing the fitted
  screen-gaze estimate on held-out targets. Validation is kept distinct from calibration:
  held-out samples are written as `quality` rows tagged `task_phase: 'validation'`
  (carrying the target in CSS px + normalised and the concurrent estimate) plus a
  `stimulus` marker per target. The Step 5 demo (`036`) reports accuracy and precision
  as separate figures plus BCEA, and draws a screen-schematic error map (per-target
  offset vector + precision/BCEA ellipse via `src/lib/validationErrorMap.ts`); the
  per-target table sits under the master "Show implementation details" control.
- **eek-a-dev workflow** — `AGENTS.md`/`CLAUDE.md`, agent guides, prompt files, scripts
  (`validate-prompts.sh`, `check-public-build.sh`, `new-prompt.sh`), and GitHub Actions
  (`check-build.yml`, `deploy-pages.yml`).

## Key decisions

- Stack: React + TypeScript + Vite; public GitHub Pages static site.
- Deploy base path `/PocketGaze/`; `docs-dev/` is never included in the build.
- Commit-to-`main`, one commit per prompt, prompt filename as commit message,
  British English for user-facing text (see `AGENTS.md`).
- `validate-prompts.sh` extended to allow an optional uppercase `DRAFT_` marker in prompt
  filenames so draft prompts pass validation.
- **Full binding specification exists** at
  `docs-dev/reference/primary_authoritative/specification.md` (v1.0). It covers Scope,
  Architecture (stack/deploy, routing, source layout, app shell, the single master control,
  the repeated page contract, privacy posture, device targets), **per-step designs for
  Step 0–7** (goal, methods, live demo, subprocess panels, outputs, limitations), the
  derived-data **export schema** (row types + field groups) and **event vocabulary**,
  domain rules, naming/voice + glossary, and **technology decisions** (candidate libraries
  with locked-vs-open status). Locked decisions and an Open-decisions list are recorded.
  Genuinely open items (primary feature library, WebEyeTrack integration, export file
  format/field names, head-pose method, control persistence) are explicitly deferred.
- Workflow updated: commit and push directly to `main`; GitHub Pages auto-deploys on push
  to `main`.

## In progress / next

The original implementation queue (`004`–`033`) is **complete**: all step demos work and
the pipeline runs end-to-end in the browser. A follow-on queue (`034`–`056`,
`docs-dev/agent/prompts/000_index_new_prompts.md`) adds validation, visual-angle units,
eye-movement completeness, honesty/context panels, and explanatory interactions; it is
being worked through in order (`034`, `035` done). These prompts are self-contained and
record additive schema changes in their own `Data contracts touched` sections rather than
amending the specification; the spec (v1.6) is reconciled separately if adopted.

Outstanding items are human-run tasks:

- Physical multi-device verification (Android Chrome/Firefox; iOS Safari status) against
  `docs-dev/reviews/runtime_qa_checklist.md`.
- Confirming the deployed GitHub Pages URL (`https://eelkedevries.github.io/PocketGaze/`)
  loads correctly after the final push.

## Important caveats

- All processing is browser-local; no raw video is uploaded or stored.
- Monocular head-pose translation (`tx/ty/tz`) is approximate/unscaled (documented in
  `headPose.ts`); this is a known limitation of the monocular approach.
- Physical multi-device verification (Android Chrome/Firefox; iOS Safari) has not been
  performed in the agent environment; it remains a human task.
- The WebEyeTrack provider (Step 4, provider B) fetches model weights from third-party
  CDNs when selected; this is documented and narrowly scoped (provider A is fully
  self-hosted and is the default).

## Prompts run

- `001_setup.md` — initial PocketGaze scaffold and eek-a-dev workflow.
- `002_create_specification.md` — created the binding v1 specification (run twice:
  conservative v1.0, then expanded to the full v1.0).
- `003_plan_project_prompt_queue.md` — generated the implementation prompt queue (`004`–`033`).
- `004_step0_overview_content.md` — real Step 0 overview content (pipeline summary, glossary).
- `005_step_explanatory_content.md` — real introduction/methods/outputs/limitations for Steps 1–7.
- `006_shell_polish_accessibility.md` — master-control `localStorage` persistence, responsive
  layout, focus styles, and a skip-to-content link.
- `007_about_privacy_page.md` — standalone about/privacy page linked from the footer.
- `007b_shared_data_session_model.md` — shared pipeline types (`src/types/session.ts`) and the
  in-memory `SessionStore` (`src/lib/sessionStore.ts`), with `node --test` unit tests.
- `008_camera_access.md` — reusable `CameraPreview` consent/stream component and `src/lib/camera.ts`.
- `009_frame_timing.md` — `FrameTimer`/`FrameStatsTracker` (rVFC + rAF fallback) writing §4 timing fields.
- `010_step1_demo.md` — Step 1 live timing demo and master-controlled timing subprocess panels.
- `011_landmark_library_spike.md` — locked the feature-extraction library to MediaPipe
  FaceLandmarker (Tasks Vision, Web); decision only, no code (spec v1.2).
- `012_feature_extraction.md` — framework-agnostic feature module (`src/lib/featureExtraction.ts`,
  `src/lib/eyeGeometry.ts`): MediaPipe landmarks, per-eye iris proxy, EAR openness, per-eye
  quality, written to the session model; self-hosted model + WASM assets. Unit-tested.
- `013_step2_demo.md` — Step 2 live feature-overlay demo (landmarks/eye regions/iris proxy
  on the camera preview) and master-controlled feature subprocess panels.
- `014_head_pose_method_spike.md` — locked the head-pose method to the MediaPipe facial
  transformation matrix; decision only, no code (spec v1.3).
- `014b_head_pose_estimation.md` — head-pose module (`src/lib/headPose.ts`): decomposes the
  facial transformation matrix into yaw/pitch/roll + approximate translation with a
  pose-quality proxy, written to the session model via the feature extractor. Unit-tested;
  monocular-translation caveat documented.
- `015_motion_quality_labelling.md` — head-motion quality labelling (`src/lib/motionQuality.ts`):
  labels samples low/moderate/uncertain from rotational speed + pose quality (documented,
  configurable thresholds), with a stateful `HeadMotionLabeller` and an `headMotionExcluded`
  predicate for rejecting uncertain intervals. Added `head_motion_label` to sample rows
  (shared `HeadMotionFields`). Unit-tested.
- `025_blink_quality_suppression.md` — blink suppression and quality thresholding
  (`src/lib/suppression.ts`): batch blink/`tracking_lost` interval detectors plus a streaming
  `SampleSuppressor` that marks `blink_state`, per-sample validity, and sustained tracking
  loss, with documented thresholds so invalid data is excluded from event detection (`026`)
  without dropping raw columns. Unit-tested. (Prompts 016–024 were run in a parallel session.)
- `026_event_detection.md` — candidate event detection (`src/lib/eventDetection.ts`): a
  velocity/displacement detector that turns the filtered, quality-checked eye-local trace
  into cautiously-labelled `fixation_candidate` and saccade-like events, breaking runs on
  blink/`tracking_lost` gaps and re-labelling saccades by head-motion context
  (`saccade_head_still` / `saccade_during_head_movement` / `uncertain_head_motion`) with an
  `event_confidence`. Documented, overridable thresholds; unit-tested over synthetic traces.
- `027_step6_demo.md` — Step 6 filtering/events demo (`src/demos/step6.tsx`): live raw vs
  One Euro–filtered eye-local trace (canvas) with blink/tracking-loss shading, candidate-
  event stream with cautious labels, and master-controlled subprocess panels (filter
  parameters, blink/quality thresholds, event logic, recent event confidences).
- `028_stimulus_viewport_logging.md` — stimulus and viewport/screen logging
  (`src/lib/stimulusLog.ts`): a reusable `StimulusLogger` that records stimulus events
  (id, position in both CSS-pixel and normalised coordinate systems, timestamp) and the
  viewport context (size, orientation, device-pixel ratio) as `stimulus` rows, re-logging
  the viewport whenever it changes. Added `ViewportContextFields` to the session model.
  Pure helpers (orientation, change detection, coordinate resolution) unit-tested.
- `029_content_coordinate_mapping.md` — content coordinate mapping
  (`src/lib/contentCoordinates.ts`): pure `screenToContent` converts normalised screen gaze
  to content-relative coordinates via `getBoundingClientRect` (accounts for page scroll, CSS
  transforms, and layout shifts); `applyElementScroll` adds internal-scroll correction;
  `contentMappedFields` writes `content_x/y/content_mapping_available` (blank not zero when
  unavailable). `ContentMapper` class listens for scroll/resize to fire `onTransformChange`.
  Pure helpers unit-tested (scroll, zoom, offset, edge cases).
- `030_step7_demo.md` — Step 7 content-mapping demo (`src/demos/step7.tsx`): a pointer-driven
  (gaze stand-in) scrollable, zoomable content panel contrasting screen vs content
  coordinates — a fixed content target keeps a constant content coordinate while its screen
  coordinate moves under scroll/zoom — wiring `ContentMapper` (029) and `StimulusLogger`
  (028). Master-controlled subprocess panels: viewport/DPR/orientation, element coordinates,
  scroll/zoom/transform log, logged stimulus rows.
- `031_derived_data_export.md` — derived-data export (`src/lib/exportCsv.ts`): pure
  `serialiseToCsv` serialises `SessionStore` rows to the locked combined CSV (§4.1):
  single `row_type` column, blank for N/A (not 0), raw and filtered in separate columns,
  processing metadata columns, no raw video. `downloadSessionCsv` triggers a local browser
  download. `ExportButton` component (`src/components/ExportButton.tsx`) wired into Step 1's
  implementation details panels. Serialiser unit-tested (row types, blanks, raw/filtered,
  header stability, processing metadata).
- `032_cross_device_performance_qa.md` — cross-device / graceful-degradation QA pass. Code-
  level audit (recorded in `docs-dev/reviews/cross_device_qa_results.md`) confirmed every
  camera/inference demo degrades gracefully (camera denied/unsupported, rVFC→rAF fallback,
  GPU→CPU delegate, WASM/model load failure, WebEyeTrack provider failure, camera release on
  unmount) — no broken-page paths, no code changes required. Physical multi-device runs and
  iOS Safari verification remain human tasks; residual limitations documented.
- `033_docs_and_deploy_verification.md` — updated `README.md` and `docs/` to describe the
  working demos, camera permission flow, and CSV export; removed all scaffold/placeholder
  wording. Updated `current_state.md` to reflect the fully-implemented pipeline. Added
  camera-permission and WASM-load-failure troubleshooting to `docs/troubleshooting.md`.
- `034_validation_metrics_lib.md` — pure validation metrics (`src/lib/validationMetrics.ts`):
  accuracy (mean/median offset), precision (RMS-S2S), BCEA (default P = 0.68, degenerate-
  guarded), and `perTargetMetrics` with an aggregate summary, all in normalised units
  (degree conversion deferred to `040`). Degenerate inputs return finite documented values.
  Unit-tested with `node --test`, including a hand-checked BCEA.
- `035_validation_task.md` — follow-the-dots validation task (`src/demos/validationTask.tsx`)
  presenting a held-out grid offset from the 9 calibration points, capturing the fitted
  provider-A estimate after a settle period and writing `quality` rows tagged
  `task_phase: 'validation'` (target CSS px + normalised + the estimate) plus a `stimulus`
  marker per target. Extended `QualityRow` additively with `TaskStimulusFields` +
  `ScreenGazeFields` (existing CSV columns; no new row type). Wired into the Step 5 demo
  after calibration, exposing the latest fitted estimate. No metric display (that is `036`).
- `036_validation_demo.md` — wired `034`/`035` into Step 5: on validation completion it
  computes per-target and aggregate accuracy, precision (RMS-S2S), and BCEA, shows accuracy
  and precision as separate readouts with cautious §6.3 wording, and renders a screen-
  schematic error map (offset vector + precision/BCEA ellipse per target). Added pure,
  unit-tested helpers `src/lib/validationErrorMap.ts` (`validationInputsFromRows`,
  `precisionEllipse` — covariance-eigen ellipse whose area equals BCEA). Per-target table
  shows only under the master control.
- `037_live_precision_readout.md` — live rolling-precision readout: a pure ring-buffer
  (`src/lib/livePrecision.ts`, `RollingPrecision`) reusing `034`'s `precisionRmsS2S`/`bcea`
  over a documented 30-sample window, and a compact `LivePrecision` component
  (`src/components/LivePrecision.tsx`) mounted in the Step 4 eye-local demo. Normalised units,
  "lower is steadier", not a validated device figure; no session-model changes. Unit-tested.
- `038_visual_angle_estimation_lib.md` — pure visual-angle estimation (`src/lib/visualAngle.ts`):
  IPD-based pinhole `estimateViewingDistanceMm`, `degreesPerPixel`/`degreesPerNormalised`, and
  `estimateAngularScale` returning distance + conversion factors + `is_estimate: true` and the
  assumptions (IPD ~63 mm, default HFOV, CSS px pitch, screen dim). Degenerate inputs fall back
  to a documented finite distance. Everything is an estimate (§6.3). Unit-tested (hand-computed
  distance, monotonicity, degenerate guards). No session-model wiring (that is `039`).
- `039_dva_session_integration.md` — wired the visual-angle estimate into the feature
  pipeline (`src/lib/featureExtraction.ts`): each tracked sample now carries additive
  `viewing_distance_mm`, `deg_per_norm_x/y`, `angular_scale_is_estimate`, and a roughly-metric
  head-translation `head_tx_mm/ty_mm/tz_mm` (raw `head_tx/ty/tz` untouched; blank when no
  face). Added pure helpers `iodPixels` and `translationToApproxMm` to `visualAngle.ts`
  (anchors |tz| to the IOD-estimated distance) with unit tests. Extended `SampleRow` and the
  CSV export headers additively. Everything is a documented estimate (§3.3, §6.3).
- `040_dva_units_and_explainer.md` — degrees-of-visual-angle display: the Step 5 validation
  readout now shows accuracy/precision in estimated degrees alongside normalised units; Step 6
  shows an estimated saccade amplitude in degrees. Added `amplitude` (eye-local displacement)
  to `DetectedEvent` and `meanDegreesPerNormalised` to `visualAngle.ts` (both unit-tested);
  a "Why degrees of visual angle" explainer panel sits in the Step 5 details. All degree
  figures are labelled estimates (assumed IPD/FOV/screen size; §6.3); no schema changes.
- `041_smooth_pursuit_lib.md` — pure smooth-pursuit module (`src/lib/smoothPursuit.ts`):
  `pursuitTarget` (horizontal/circular moving target), `pursuitGain` (gaze/target velocity ratio
  + mean tracking error, degenerate-guarded), and a cautious `pursuitCandidate` helper. Added
  the additive `smooth_pursuit_candidate` value to the §5 event vocabulary (`EventType`).
  Unit-tested (unit gain, lag/undershoot, tracking error, degenerate). No demo (that is `042`).
- `042_smooth_pursuit_demo.md` — smooth-pursuit demo (`src/demos/pursuitTask.tsx`) mounted in
  Step 5 after calibration: animates a moving target, samples the calibrated gaze, draws
  target/gaze + tracking-error line on a canvas, and shows live pursuit gain + mean tracking
  error (reusing `041`). Its velocity/windowed-gain panel is gated by the existing master
  control (`useImplementationDetails`, no second toggle). Framed as candidate/qualitative;
  degrades gracefully with no gaze. Display-only (no session rows written).
- `043_fixation_aggregation_lib.md` — pure fixation aggregation (`src/lib/fixationAggregation.ts`):
  `scanpath` (ordered duration-carrying nodes + inter-node segments), `heatmap` (Gaussian-splat
  density grid normalised to its peak, duration- or count-weighted), plus `totalDwellMs` and
  `fixationBounds`. Normalised coordinates; documented degenerate handling. Unit-tested (order/
  durations, clustered peak, weighting, empty). No rendering/demo (that is `044`).
- `044_scanpath_heatmap_demo.md` — scanpath + heatmap demo (`src/demos/scanpathHeatmap.tsx`) on
  Step 6: the provider accumulates fixation centroids (eye-local mapped to 0–1) from detected
  fixation candidates; the component draws an ordered dwell-sized scanpath and a toggleable
  Gaussian heatmap (reusing `043`), with a prominent over-interpretation caveat (§6.3). Fixation
  list + heatmap-parameter panels gated by the existing master control. Degrades gracefully when
  empty/no-face.
- `045_aoi_metrics_lib.md` — pure AOI metrics (`src/lib/aoiMetrics.ts`): `aoiContains`,
  `assignFixationsToAois` (first-match-wins; unmapped left unassigned), and `aoiMetrics` →
  per-AOI dwell / fixation count / TTFF (relative to task start) plus totals and an unassigned
  count. Content-relative coordinates; documented zeros/blanks for empty inputs. Unit-tested
  (dwell/count sums, earliest-onset TTFF, out-of-AOI/unmapped exclusion, overlap). No demo (`046`).
- `046_aoi_dwell_demo.md` — AOI dwell-analysis demo (`src/demos/aoiTask.tsx`) on Step 7: a
  reading/viewing panel with four labelled AOIs in content coordinates; the pointer stand-in
  accumulates per-visit content-space fixations scored by `045` into a per-AOI dwell / fixation
  count / TTFF table, with the currently-fixated AOI highlighted. AOI-rectangle and raw
  assignment panels gated by the master control. Qualitative over the stand-in (§6.3).
- `047_gaze_contingent_demo.md` — gaze-contingent moving-window demo
  (`src/demos/gazeContingentTask.tsx`) in Step 5: content masked by a spotlight that follows the
  live One Euro–filtered gaze (reusing `OneEuroVectorFilter`), with a window-radius slider and an
  estimated end-to-end latency readout (measured gaze-update + render cadences). Falls back to a
  clearly-labelled pointer stand-in when uncalibrated. Latency/window panel gated by the master
  control. No new tracking/filtering maths.
- `048_honesty_limitation_panels.md` — three honesty/limitation panels
  (`src/components/LimitationPanels.tsx`): a Step 1 sampling-rate panel with a coarse-vs-fine
  saccade SVG figure (Nyquist point), a Step 3 "no corneal reflection → head-motion drift"
  panel, and an About-page "out of reach" section (microsaccades, pupillometry; no fake
  detector). Static content only, cautious British English (§6.3). No tracking code.
- `049_method_comparison_table.md` — method-comparison table (`src/components/MethodComparisonTable.tsx`)
  on the About page: this browser pipeline vs research-grade VOG vs a commercial webcam tool across
  accuracy, precision, sampling rate, calibration burden, and head-motion robustness, using ranges
  with units and a "not directly comparable / not measured here" caveat (§6.3). Static; no benchmarking.
- `050_head_pose_compensation_toggle.md` — head-pose compensation on/off toggle in Step 4: a
  pure illustrative `compensateEyeLocal` (`src/lib/headCompensation.ts`, unit-tested) removes a
  linear yaw/pitch term from the displayed eye-local point. With it off the trace drifts under
  head motion; with it on the drift is reduced. A demo control (not a second master toggle),
  display-only (session model unchanged), clearly labelled as illustrative, not geometric (§6.3).
- `051_one_euro_and_calibration_sliders.md` — two degradation demo controls: a Step 6 One Euro
  β / min-cutoff slider (recreates `SignalFilterSet` live so the filtered trace trades lag vs
  jitter; details panel reflects live params), and a Step 5 calibration-points dropout
  (9/5/3 → refit via the existing `fitGazeMapping`, RMS rises as points drop; refit invalidates
  prior validation). Demo controls only, no new maths, session model unchanged.
- `052_eye_region_crop_and_ear_trace.md` — Step 2 visualisation: a zoomed eye-region crop drawn
  from the live frame with the iris ring, iris-proxy centre, and the eye-local normalisation box
  overlaid (previews the Step 4 −1…1 mapping), plus a rolling combined-EAR trace with the blink
  threshold line that dips on a blink. Reuses the feature extractor/geometry; visualisation only,
  handles no-face gracefully, session model unchanged.
- `053_velocity_trace_threshold.md` — Step 6 velocity trace: a rolling eye-local velocity of the
  filtered signal (reusing `sampleSpeedPerSec`) drawn under the master control with the
  `saccadeSpeedPerSec` threshold as a dashed line and threshold crossings shaded, making the
  saccade-detection criterion observable. Invalid samples break the trace. Visualisation only,
  session model unchanged.
- `054_calibration_warped_grid.md` — Step 5 warped-grid visualisation: a regular eye-local input
  grid (−1…1) mapped forward through the fitted mapping (`applyMapping`) to screen positions,
  drawn over a screen schematic with an honest caption (linear mapping → affine mesh; edge stretch
  foreshadows edge/corner error, §6.3). Clear placeholder before any mapping exists. Reuses `022`;
  visualisation only.
- `055_frame_filmstrip.md` — Step 1 frame-as-sample filmstrip: recent sample rows rendered as
  cells with `frame_id`/`time_ms` (timestamps/metadata only — no raw video, §2.7), flagging
  repeated frames (same media time) and gaps implying dropped source frames, with the cumulative
  dropped/repeated counts from the tick; on the rAF fallback path it notes these can't be observed.
  Reuses the existing timing fields; visualisation only.
