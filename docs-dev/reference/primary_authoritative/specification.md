# Specification

**Version:** 1.1 · **Last updated:** 2026-06-03

**Changelog:** 1.1 — locked the derived-data export format (§4.1) to a single combined
CSV with a row-type column; added the early shared data/session model to the architecture
(§2.3); recorded the head-pose method as a spike decision (§7.3). 1.0 — first full spec.

The authoritative design canon for PocketGaze. **Only the sections actually filled below
are binding.** A section or sub-item marked _Not yet decided_ imposes no constraint and is
open for a future decision.

When the codebase and this document conflict, this document is correct. When a decision is
made or revised, update the relevant section here and bump the version above (noting what
changed).

Non-binding background informs this document but never overrides it:
`docs-dev/reference/secondary_background/overview.md` (seven-step framework §1, pipelines
§2, development order §3, export §4, event labels §5) and
`docs-dev/reference/secondary_background/smartphone_eye_tracking_background.md` (tool
assessment, constraints §6, privacy §7, pre-use checks §9).

---

## 1. Scope

### 1.1 What PocketGaze is

PocketGaze is a **static, browser-based explainer and live-demo site** for the seven-step
smartphone-camera eye-tracking pipeline. It is **primarily a portfolio project**: it exists
to show potential employers, collaborators, and customers that the author understands how
smartphone-camera eye tracking can be implemented in practice.

For each step the site does two things:

1. presents the **concept and a live demo** for that step; and
2. makes the **implementation process understandable** through optional
   implementation/subprocess panels revealed by one master control.

### 1.2 In scope

- A public, static site covering **Step 0 (Overview) through Step 7**, one page per step.
- A consistent, repeated structure on every step page (§2.6).
- A single, site-wide **"Show implementation details"** control (§2.5).
- **Browser-local processing** (the recommended first route) for all real functionality.
- Derived-data export of eye/gaze/head/event/task data (§4).

### 1.3 Out of scope (for this repository)

- Native Android or iOS application code.
- Server-side / cloud processing backends.
- Storing or uploading raw video by default.

The Android-local and Android-cloud routes, and appearance-based mobile models
(MGazeNet/iTracker/AFF-Net etc.), may be **described as explanatory content**, but this
repository implements the **browser-local route only**.

### 1.4 Current state vs target

The site currently contains **placeholders only** — no real camera access or tracking.
Real functionality is introduced incrementally by later prompts (planned by
`003_plan_project_prompt_queue.md`). `current_state.md` records what actually exists at any
time; this specification records the intended design. Placeholders must always read as
placeholders (§5.5).

---

## 2. Architecture

### 2.1 Stack, build, and deployment

- **Stack:** React + TypeScript + Vite; single-page static site.
- **Deployment:** public GitHub Pages, base path **`/PocketGaze/`**, built output in
  `dist/`. Auto-deploys on push to `main`.
- **Verify command:** `npm run build` (with `npm run check` for a type-only pass).
- **Build hygiene:** everything under `docs-dev/` is excluded from `dist/` and is verified
  by `scripts/check-public-build.sh`. No source maps or private references in the build.

### 2.2 Routing and the GitHub-Pages constraint

Client-side routing across the Step 0–7 pages. The routing approach **must keep deep links
and refreshes working on GitHub Pages without server-side rewrites.** The scaffold uses a
hash-based router (`HashRouter`) to satisfy this; the mechanism may change only if the
deep-link/refresh constraint is still met (e.g. an SPA 404 fallback).

### 2.3 Source-code organisation

Conventions (the agent may extend, not contradict):

- `src/steps.ts` — step metadata / content model driving navigation and pages.
- `src/components/` — shared UI (layout, navigation, the step-page shell, demo shells).
- `src/context/` — shared React state, including the master-control context.
- `src/demos/` (to be added) — per-step live-demo and subprocess-panel implementations.
- `src/lib/` (to be added) — reusable, framework-agnostic logic: capture/timing, feature
  extraction adapters, head pose, signal types, filtering/events, export.
- `src/types/` (to be added) — shared TypeScript types, including the export schema (§4).

**Shared data/session model first.** Before any camera/tracking module is built, a shared
data model and in-memory session store are defined (the §4 row types and field groups, with
raw-vs-filtered separation and processing metadata) so that capture, features, pose,
signals, calibration, events, and content mapping all write to **one** agreed shape rather
than inventing their own. Export (§4) serialises this store; it does not define new shapes.

Pipeline logic (capture, features, pose, signals, filtering, export) should live in
testable modules under `src/lib`, kept separate from React presentation. Pure, deterministic
logic (filtering, calibration mapping, suppression, event detection, content mapping, export
serialisation) is unit-tested with `node --test` via `npm run test`.

### 2.4 App shell and navigation

A persistent shell provides the brand, the master control, and top navigation across all
eight steps (Step 0–7). The shell wraps every step page; the home route resolves to
Step 0; unknown routes fall back to Step 0.

### 2.5 Master "Show implementation details" control

- There is **exactly one** site-wide control that reveals or hides the optional
  implementation/subprocess panels across **all** step pages.
- **Disabled (default):** each step page shows only the main live-demo area and the core
  explanatory content; the implementation/subprocess panels are hidden.
- **Enabled:** the additional implementation/subprocess panels for each step are revealed.
- The control is a **single shared piece of state** for the whole site (the scaffold
  implements it with a React context). All step content must hook into this one control;
  introducing a second, independent toggle is forbidden.
- Optional, recommended: persist the setting (e.g. `localStorage`) so it survives
  navigation and reloads. _Persistence mechanism: open._

### 2.6 Repeated step-page contract

Every step page (Step 1–7, and Step 0 as far as it applies) must present its content in
this order:

1. **Introduction** — brief framing of the step.
2. **Options / methods** — the main approaches.
3. **Implementation on this page** — what this page actually does.
4. **Live demo** — the main demo area for the step.
5. **Implementation details (optional)** — implementation/subprocess panels, shown only
   when the master control is enabled.
6. **Outputs** — what the step produces.
7. **Limitations** — cautions and known weaknesses.

### 2.7 Processing and privacy posture

- **Process locally in the browser.** Do not send camera frames to a server by default.
- **Do not store raw video by default.** Prefer derived-data export (signals, events, task
  metadata) over raw frames.
- Request the camera only when a demo needs it, with a clear permission/consent flow, and
  release the stream when not in use.
- Treat landmarks, gaze, head pose, and task-linked eye data as **sensitive**, even though
  processing is local.
- If a cloud route were ever explored (out of scope here), prefer **feature upload over
  frame upload**.

### 2.8 Performance and device targets

- Primary targets: **mid-range Android phones**, Android Chrome/Chromium and Android
  Firefox; iOS Safari is a later consideration.
- Demos must **degrade gracefully** when a capability or library is unavailable (e.g.
  `requestVideoFrameCallback` missing, camera denied, WebGL/WASM unavailable): show a clear
  message, never a broken page.
- Be mindful of memory pressure, thermal throttling, and battery; prefer a single shared
  camera/inference pipeline over many concurrent ones.

---

## 3. Per-step specifications (Step 0–7)

Each step inherits the page contract (§2.6) and the master-control behaviour (§2.5).
Substance is distilled from `overview.md` §1.1–1.7 and §2.1; it is binding for this site as
stated here. Specific libraries are candidates until locked in §7.

### 3.0 Step 0 — Overview

- **Goal:** orient the visitor: what PocketGaze is, the portfolio intent, and the
  seven-step pipeline as a pipeline (not a single model).
- **Content:** the seven steps and how they connect; the eye-local vs screen-gaze vs
  content-mapped distinction (§6.2); how to use the master control; an honest statement of
  the site's current state and limitations.
- **Live demo:** none required (or a lightweight pipeline diagram). No camera.
- **Implementation details panel:** the site/tech overview (stack, browser-local, privacy).
- **Outputs:** a shared mental model. **Limitations:** scaffold/placeholder status.

### 3.1 Step 1 — Capture and timing

- **Goal:** acquire front-camera frames and attach timing accurate enough for sample-level
  analysis.
- **Methods to explain:** frame-by-frame processing; frame-linked callbacks; dropped/
  repeated-frame checks; separate timing fields (capture, processing, export).
- **Live demo:** camera preview with a live readout of effective frame rate and per-frame
  timing; a permission/consent flow; graceful failure if denied/unsupported.
- **Implementation details panels:** frame timeline; capture vs processing timestamps;
  dropped/repeated-frame indicators; effective vs nominal FPS.
- **Outputs:** timestamped frames; timing fields per §4 (`time_ms`, `frame_id`,
  `video_frame_time`, `capture_time`, `processing_latency_ms`).
- **Limitations:** effective frame rate varies by device/lighting; browser timing APIs may
  be unavailable and require fallback.

### 3.2 Step 2 — Face and eye features

- **Goal:** detect face, eyes, eyelids, iris/pupil proxy, and the landmarks later steps
  need.
- **Methods to explain:** face landmark detection; left/right eye-region isolation;
  iris/pupil-proxy extraction; eyelid-openness; per-eye quality estimation.
- **Live demo:** live overlay of landmarks / eye regions / iris proxy on the camera
  preview; per-eye open/closed and quality indicators.
- **Implementation details panels:** raw landmark set; per-eye region crops/markers;
  eye-aspect-ratio / openness values; per-eye quality scores.
- **Outputs:** face/eye/eyelid/iris-proxy features; `left/right_eye_quality`,
  `face_quality`, blink/eye-state fields (§4).
- **Limitations:** landmark quality degrades with occlusion, glasses, lighting, extreme
  pose; unstable landmarks propagate downstream.

### 3.3 Step 3 — Head and phone motion

- **Goal:** distinguish apparent eye movement caused by real eye movement vs head movement
  vs changing face–camera geometry.
- **Methods to explain:** head rotation (yaw/pitch/roll); head translation (position/
  distance); head-motion quality labelling; rejection of uncertain intervals. (Phone IMU
  logging is noted as native-only and largely unavailable in-browser.)
- **Live demo:** live head-pose readout/visualisation with a head-motion quality label
  (low / moderate / uncertain).
- **Implementation details panels:** yaw/pitch/roll and translation values; the geometry/
  `solvePnP`-style derivation; the motion-quality thresholding.
- **Outputs:** head pose (`head_yaw/pitch/roll`, `head_tx/ty/tz`), `head_pose_quality`,
  head-motion labels (§4).
- **Limitations:** monocular RGB translation is approximate; without pose handling, head/
  phone motion can be misclassified as eye movement.

### 3.4 Step 4 — Eye-local and gaze signals

- **Goal:** produce the main signal — an eye-local signal, a screen-gaze signal, or both.
- **Methods to explain:** eye-local signal estimation (iris proxy normalised within the eye
  region); screen-gaze estimation via calibrated mapping/model; model-based inference
  (WebEyeTrack) vs baseline regression (WebGazer); content-mapped estimation (handed to
  Step 7).
- **Live demo:** an eye-local movement trace by default; an **optional** screen-gaze
  estimate when a mapping/model is available, with the two signal types **visibly and
  terminologically distinct**.
- **Implementation details panels:** eye-local coordinates per eye and combined; screen-
  gaze coordinates with availability/confidence; which signal is selected and why.
- **Outputs:** eye-local fields (`left/right/combined_eye_x/y`), screen-gaze fields
  (`gaze_x/y`, `gaze_available`, `gaze_confidence`) (§4).
- **Limitations:** eye-local movement is **not** screen gaze; screen gaze requires
  calibration, validation, and reliability checks (Domain rule §5.2).

### 3.5 Step 5 — Calibration and personalisation

- **Goal:** adapt the signal/mapping to the user, phone, camera position, screen geometry,
  and posture.
- **Methods to explain:** follow-the-dots calibration; tap/click calibration; regression
  mapping; model personalisation; calibration-quality checks.
- **Live demo:** a **follow-the-dots** task at known screen positions, then a fitted
  mapping and a simple validation/error readout.
- **Implementation details panels:** calibration samples (target vs estimate); the fitted
  mapping; held-out error / consistency metrics.
- **Outputs:** a user-specific mapping model; `calibration` rows and `calibration_target`
  events; `target_x/y`, `target_id` (§4).
- **Limitations:** quality depends on compliance and stable posture; may not generalise
  beyond the calibrated range; without calibration, screen-gaze is too coarse for fine
  spatial interpretation.

### 3.6 Step 6 — Filtering and events

- **Goal:** reduce noise, mark invalid samples, and turn the time series into interpretable
  **candidate** events.
- **Methods to explain:** raw derived-signal preservation; adaptive filtering (One Euro);
  blink suppression; quality-thresholding; velocity/displacement event detection; event
  confidence scoring.
- **Live demo:** **raw vs filtered** traces shown together; cautiously labelled candidate
  events (fixation/saccade candidates, blinks, tracking loss).
- **Implementation details panels:** filter parameters; blink-suppressed intervals;
  quality thresholds; the velocity/displacement event logic; event confidences.
- **Outputs:** filtered traces and `event` rows with the §5 vocabulary; `filter_name` and
  parameters retained in the export.
- **Limitations:** excessive smoothing adds lag/removes rapid movements; insufficient
  filtering yields false events; thresholds are device/lighting-dependent.

### 3.7 Step 7 — Content and stimulus mapping

- **Goal:** align eye/gaze signals with the actual screen content, dot task, stimulus, or
  UI state.
- **Methods to explain:** stimulus logging; viewport/screen logging; layout/position
  logging; scroll/zoom/transform logging; (backend alignment noted as cloud-only).
- **Live demo:** a contrast between **screen coordinates** and **content-relative
  coordinates** for content that scrolls/moves/transforms.
- **Implementation details panels:** logged stimulus identity/position/time; viewport/DPR/
  orientation; element coordinates (`getBoundingClientRect`); scroll/zoom/transform log.
- **Outputs:** screen- or content-relative task data; `content_x/y`,
  `content_mapping_available`, `stimulus` rows (§4).
- **Limitations:** screen coordinates mislead when content scrolls, zooms, moves, or
  changes layout; requires consistent coordinate systems.

---

## 4. Data schemas (derived-data export)

PocketGaze exports **derived data, not raw video** (§2.7). The schema below is the
**candidate** export contract from `overview.md` §4; exact field names and the on-disk
format become binding when export is implemented (Phase I) and recorded here.

### 4.1 Format (locked)

- The first (and default) export is a **single combined CSV file** with an explicit
  **`row_type` column** (`sample`/`event`/`calibration`/`stimulus`/`quality`).
- Fields that do not apply to a given row are left **blank/empty** (not `0`); consumers
  must treat blank as "not applicable", distinct from a real zero.
- **Raw (minimally processed) and filtered signals occupy separate columns** (e.g. a raw
  column and its filtered counterpart) so the data stays reanalysable; raw and filtered are
  not split across different row types.
- **Timestamp convention:** `time_ms` is milliseconds from session start (a monotonic
  clock), shared across all subsystems; absolute wall-clock time is not required.
- Each export carries **processing metadata** (model, filter, pipeline, data-flow) for
  reproducibility (see the Processing/data-flow field group in §4.3).
- A combined CSV is the locked first format; additional formats (e.g. JSON-lines) may be
  added later but must not replace it without a spec change.

### 4.2 Row types

| Row type | Purpose |
|---|---|
| `sample` | a time-series sample |
| `event` | blink, fixation candidate, saccade-like event, or tracking loss |
| `calibration` | a dot/click target used for mapping |
| `stimulus` | a task or display event |
| `quality` | an optional signal-quality summary |

### 4.3 Field groups (candidate fields)

| Field group | Example fields |
|---|---|
| Timing | `time_ms`, `frame_id`, `video_frame_time`, `capture_time`, `processing_latency_ms` |
| Eye-local signal | `left_eye_x/y`, `right_eye_x/y`, `combined_eye_x/y` |
| Screen-gaze signal | `gaze_x`, `gaze_y`, `gaze_available`, `gaze_confidence` |
| Content-mapped signal | `content_x`, `content_y`, `content_mapping_available` |
| Head pose | `head_yaw/pitch/roll`, `head_tx/ty/tz` |
| Tracking quality | `left/right_eye_quality`, `face_quality`, `head_pose_quality`, `selected_signal_quality` |
| Blink / eye state | `left_eye_open`, `right_eye_open`, `blink_state` |
| Events | `event_type`, `event_start_ms`, `event_end_ms`, `event_confidence`, `head_motion_label` |
| Task / stimulus | `target_x`, `target_y`, `target_id`, `task_phase` |
| Processing / data flow | `pipeline_id`, `model_name`, `signal_type`, `filter_name`, `mapping_model_id`, `processing_location`, `uploaded_data_type`, `raw_video_saved` |

---

## 5. Event vocabulary

Events are labelled **cautiously as candidates** when reference validation is unavailable
(`overview.md` §5). Binding label set:

| Label | Meaning |
|---|---|
| `blink` | eye-closure interval |
| `tracking_lost` | face/eye tracking unavailable or below threshold |
| `fixation_candidate` | low-velocity interval passing quality criteria |
| `saccade_candidate` | rapid eye/gaze movement passing basic criteria |
| `saccade_head_still` | saccade-like event with low head-motion contamination |
| `saccade_during_head_movement` | saccade-like event during moderate head movement |
| `uncertain_head_motion` | interval too affected by head movement to classify confidently |
| `calibration_target` | a known dot/click target used for mapping |
| `stimulus_event` | a task/stimulus event aligned with the tracking stream |

Tracking-loss and uncertain-head-motion labels must be used to prevent invalid data from
being treated as events.

---

## 6. Domain rules

These conceptual rules are binding for all content and all implementation:

1. **Pipeline, not a single model.** Present the seven steps as distinct stages; never
   collapse them into one black box.
2. **Keep signal types distinct.** Eye-local signals, screen-gaze estimates, and
   content-mapped coordinates are different and must be labelled and described as such.
   Eye-local movement must **not** be presented as precise screen gaze unless a validated
   mapping has been fitted and checked.
3. **Do not overclaim accuracy or events.** Event labels are **candidates** unless
   validated; describe smartphone-camera tracking cautiously; do not quote accuracy figures
   that have not been measured for this site.
4. **Head and phone motion can masquerade as eye movement.** Content must not imply that
   apparent eye movement is necessarily real eye movement.
5. **Placeholders must read as placeholders.** Scaffold/demo placeholders must never imply
   that functionality already exists.
6. **Privacy by default.** Local processing; no raw video stored by default; treat derived
   data as sensitive (§2.7).

---

## 7. Naming, voice, and technology decisions

### 7.1 Naming and voice

- **Language/locale:** British English for all user-facing text (e.g. "personalisation",
  "behaviour", "colour"). Code identifiers may follow the conventional American spellings
  of their libraries.
- **Voice:** clear, honest, technically credible — appropriate to a portfolio piece.
  Explain mechanisms plainly; prefer cautious, accurate wording over marketing claims.
- **Step labels:** "Step 0"–"Step 7" with the titles in §2 / §3.
- **Master-control label:** "Show implementation details".

### 7.2 Glossary (binding terminology)

- **Eye-local signal** — iris/pupil-proxy movement normalised within the detected eye
  region; calibration-light; **not** screen gaze.
- **Screen-gaze estimate** — estimated screen x/y from a calibrated mapping or trained
  model; requires calibration and validation.
- **Content-mapped coordinate** — a screen-gaze coordinate transformed into content/
  stimulus space, accounting for scroll/zoom/layout.

### 7.3 Technology decisions (candidates vs open)

All choices below are **candidates** from the background; none is locked until recorded
here. Integrations marked _spike_ require a technical spike (verify licence, self-hosting,
browser support, and exposed timestamp/quality/export fields — background §9) before use.

| Concern | Candidate browser tools | Status |
|---|---|---|
| Capture & timing | `getUserMedia`; `requestVideoFrameCallback` (+ fallback) | open |
| Feature extraction | Human; MediaPipe Tasks Vision / FaceLandmarker Web | open (choose one primary) |
| Head pose | library pose output; OpenCV.js `solvePnP`; Procrustes-style normalisation | open — decided by the `014` method spike |
| Eye-local signal | iris-proxy geometry from the chosen landmark library | open |
| Screen gaze | WebEyeTrack _(spike)_; WebGazer.js (baseline/fallback only) | open |
| Calibration | custom follow-the-dots task + JS regression; model personalisation if available | open |
| Filtering & events | One Euro filter; optional Kalman; custom blink/saccade detector | open |
| Content mapping | DOM geometry APIs (`getBoundingClientRect`, `ResizeObserver`, `IntersectionObserver`) | open |
| Inference backend | TensorFlow.js (only if a chosen model needs it) | open |

---

## 8. Locked decisions

Settled decisions that must not be re-litigated without an explicit change here (and a
version bump):

1. PocketGaze is a **portfolio-oriented**, static, browser-based explainer and live-demo
   site for the seven-step smartphone-camera eye-tracking pipeline.
2. Stack is **React + TypeScript + Vite**; deployment is **public GitHub Pages** at base
   **`/PocketGaze/`**, auto-deployed on push to `main`.
3. The site covers **Step 0–7**, one page per step, using the **repeated step-page
   structure** (§2.6).
4. There is a **single site-wide "Show implementation details" control** (§2.5); all
   content reuses it.
5. The implemented processing route is **browser-local**; native-app and cloud backends are
   **out of scope** for this repository (they may be described as content only).
6. **No raw video is stored by default**; local processing and derived-data export are the
   default posture (§2.7).
7. Real functionality is added **incrementally** via narrow prompts; the site stays useful
   and shippable at placeholder stage and must not overclaim (§5.5, §6).
8. User-facing text uses **British English**.
9. The export is **derived data** with distinct raw vs filtered signals and processing
   metadata (§4); events use the **candidate-label vocabulary** (§5).
10. The **signal-type distinction** (eye-local / screen-gaze / content-mapped) is central
    and must be preserved in UI, terminology, and export (§6.2, §7.2).
11. The default export is a **single combined CSV** with a `row_type` column and blank
    cells for non-applicable fields; `time_ms` is milliseconds from session start (§4.1).
12. A **shared data/session model** is defined before camera/tracking work; all modules
    write to it and export serialises it (§2.3).
13. Pure pipeline logic is **unit-tested** with `node --test` via `npm run test`; UI and
    content remain test-light (overrides the default no-tests convention for those modules).

---

## 9. Open decisions

Tracked items deliberately left open (no constraint until decided and moved to §8):

- The primary feature-extraction library (Human vs MediaPipe FaceLandmarker Web) — decided
  by the `011` spike.
- Whether to integrate WebEyeTrack for screen gaze — decided by the `018` spike.
- The head-pose method (library pose vs OpenCV.js `solvePnP` vs Procrustes) — decided by the
  `014` spike.
- The final, exact CSV field names (the format and conventions are now locked in §4.1).
- Persistence mechanism for the master control setting.
- Whether Step 0 includes a pipeline diagram demo.
