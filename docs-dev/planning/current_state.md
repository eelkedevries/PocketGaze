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

- **Prompts 002 and 003 are now finalised, runnable prompts** (the `DRAFT_` markers were
  removed): `002_create_specification.md` was expanded to generate the *full* binding
  specification (architecture, per-step Step 0–7 designs, data-export schema, event
  vocabulary, domain rules, naming/voice, technology decisions), and
  `003_plan_project_prompt_queue.md` generates the *full ordered* implementation prompt
  queue (Phases A–I, browser-local, incremental).
- **Implementation prompt queue generated and hardened:** prompts `004`–`033` (plus
  `007b_shared_data_session_model.md` and the `014` head-pose method spike + `014b`
  implementation split) cover Phases A–I (content & shell; shared data/session model;
  capture & timing; features; head/phone motion; eye-local & gaze; calibration; filtering &
  events; content mapping; export & hardening). They are the ordered, browser-local,
  incremental work queue and have **not been run yet**.
- **Queue hardening (from review feedback):** every implementation prompt now has
  `Required reading`, `Dependencies`, split `Automated checks` / `Manual verification`, and
  (where relevant) `Data contracts touched`. `validate-prompts.sh` now enforces prompt
  structure and rejects unresolved `<placeholders>`. Added
  `docs-dev/reviews/runtime_qa_checklist.md`. Pure-logic prompts request `node --test`
  unit tests via `npm run test`.
- **Spec v1.1:** export format locked to one combined CSV (`row_type` column, blanks for
  N/A, ms-from-start `time_ms`); shared data/session model added to the architecture;
  head-pose method recorded as a spike decision. Deployment wording made consistent
  (auto-deploy on push to `main`) across README/spec/current_state/workflow.
- **Spec v1.2:** primary feature-extraction library locked (spike `011`) to **MediaPipe
  FaceLandmarker (Tasks Vision, Web)**, with Human kept as a documented alternative.
  Rationale, the self-hosting requirement (model + WASM assets served from our own origin,
  no runtime CDN), and browser support are recorded in §7.3; added to §8 and removed from
  §9 open decisions.
- **Spec v1.3:** head-pose method locked (spike `014`) to the **MediaPipe facial
  transformation matrix** (Procrustes-style normalisation kept as a lightweight fallback;
  OpenCV.js `solvePnP` rejected on bundle size/complexity). Rationale, bundle/performance/
  stability implications, and the monocular-translation caveat are recorded in §7.3; added
  to §8 and removed from §9 open decisions.
- **Next planned prompt:** run `004_step0_overview_content.md`, then proceed in order
  (note `007b` runs before `008`, and `014` before `014b`).

## Important caveats

- The site currently contains **simple placeholders only**.
- There is **no real camera, frame timing, face/eye tracking, calibration, filtering,
  event detection, or data export**, and no Android or backend code.
- The intended later site behaviour includes the master control for showing/hiding
  implementation-detail panels (already scaffolded at placeholder level).

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
