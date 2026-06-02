<!--
NON-BINDING BACKGROUND MATERIAL.
This file is secondary background context for PocketGaze. It is informational only
and does NOT override the binding canon in
docs-dev/reference/primary_authoritative/specification.md.
-->

# PocketGaze background synthesis: smartphone-camera eye tracking

**Status:** secondary background information  
**Recommended repository path:** `docs-dev/reference/secondary_background/smartphone_eye_tracking_background.md`  
**Intended use:** background context for PocketGaze documentation, future specification work, and later implementation planning.  
**Not binding:** binding project decisions should be recorded in `docs-dev/reference/primary_authoritative/specification.md`.

## 1. Scope

This document synthesises two background research files on smartphone-camera eye tracking. It focuses on systems that use standard front-facing RGB cameras, with browser/mobile systems prioritised. The main project context is PocketGaze: a static browser explainer and live-demo site for a seven-step smartphone-camera eye-tracking pipeline.

The emphasis is on:

- free/open-source tools and methods;
- browser-local processing as the preferred first route;
- Android-local processing as a later native route;
- self-hosted cloud processing only where local processing is insufficient;
- clear separation between eye-local signals, screen-gaze estimates, and content-mapped coordinates;
- cautious interpretation of accuracy, event labels, and privacy claims.

Commercial tools are included only as comparison points.

## 2. Main conclusions

1. **Smartphone-camera eye tracking is a pipeline, not a single model.** Useful systems require capture/timing, feature extraction, head/phone-motion handling, signal estimation, calibration, filtering/event detection, and content/stimulus mapping.

2. **Browser-local processing is the best first route for PocketGaze.** It is easiest to distribute, fits GitHub Pages, keeps raw video local, and supports a public explainer/portfolio project.

3. **WebEyeTrack is the strongest open browser-native candidate for screen-gaze estimation**, but it should be treated as a candidate module requiring a technical spike. Its public ecosystem is still small, and low-level export/timestamp details need verification.

4. **Human and MediaPipe-style landmark pipelines are strong candidates for the feature layer**, especially for face, iris/eye-region, blink/eye-state, and head-pose features. They should not be treated as complete precision screen-gaze engines by themselves.

5. **WebGazer is useful as a legacy baseline**, especially because of its browser ecosystem and jsPsych/OpenSesame integrations. It is not the best main engine for smartphone-first, head-motion-aware tracking.

6. **Native smartphone systems such as PhoneRealTimeGazeEstimation/MGazeNet and GAZEL are useful references**, but they are not direct static-browser solutions. Licence, model weights, build status, and output schemas must be checked before reuse.

7. **Cloud processing is an architecture, not a ready-made free/open-source pipeline.** If used, feature upload is preferable to raw-frame upload, but derived landmarks and gaze data should still be treated as sensitive.

8. **Accuracy values are not directly comparable across tools.** Reports use different units, datasets, platforms, calibration procedures, and evaluation conditions.

## 3. Conceptual foundations

### 3.1 Geometry-based versus appearance-based approaches

| Approach | Description | Strengths | Limitations | PocketGaze relevance |
|---|---|---|---|---|
| Geometry-based tracking | Uses face/eye/iris landmarks to estimate eye direction or eye-local movement. | Lightweight; interpretable; useful for browser demos; suitable for eye-local traces and head-pose reasoning. | Does not reliably produce precise screen coordinates without calibration/mapping; sensitive to camera geometry and landmark quality. | Good for Step 2, Step 3, and the first version of Step 4. |
| Appearance-based gaze estimation | Uses cropped eye/face images and trained models to predict screen gaze. | Better route to screen-gaze coordinates under unconstrained mobile conditions. | Requires training data, calibration, model optimisation, and careful validation. | Relevant for later Step 4 screen-gaze module. |
| Hybrid pipeline | Combines landmarks, head pose, eye patches, calibration, and model inference. | Best practical architecture for smartphone use. | More complex; requires clear data-flow and validation. | Best long-term model for PocketGaze. |

### 3.2 Important datasets and model families

| Resource | Role | Relevance |
|---|---|---|
| GazeCapture / iTracker | Foundational smartphone/tablet RGB gaze dataset and model. | Important benchmark and conceptual reference, but not a drop-in browser solution. |
| AFF-Net | Appearance-based feature-fusion gaze-estimation model. | Useful methodological reference; direct browser/mobile reuse requires work. |
| MGazeNet / PhoneRealTimeGazeEstimation | Recent native smartphone gaze-estimation pipeline and model family. | Strong native reference; not browser-first. |
| ZJUGaze / ZJUGaze-V2 | Large smartphone gaze datasets with restricted access. | Important background for modern models, but not directly usable in an open static site. |

## 4. Practical tool assessment

### 4.1 Open/free tools most relevant to PocketGaze

| Tool / project | Best role | Main strengths | Main limitations | Recommended use |
|---|---|---|---|---|
| WebEyeTrack | Browser screen-gaze candidate | Open-source; browser/mobile orientation; local inference; head-pose-aware model; few-shot personalisation. | Newer project; limited downstream ecosystem; public runtime/export schema needs verification. | Test later as optional Step 4 screen-gaze module. |
| Human | Browser face/iris/head-pose feature layer | Broad browser AI library; face, iris, pose, and eye-state features; useful for live overlays. | Gaze is more proxy/directional than validated screen-gaze mapping. | Candidate for Step 2 and Step 3 feature demos. |
| MediaPipe FaceLandmarker / Face Mesh / Iris-style pipelines | Cross-platform landmark layer | Strong face/landmark basis; available across web, Android, and Python routes. | Exact eye/gaze outputs depend on wrapper and implementation; screen gaze requires mapping/model. | Candidate feature layer across browser, Android, and backend routes. |
| WebGazer.js | Browser baseline | Mature ecosystem; client-side; known integrations with experimental tools. | Generic webcam orientation; limited head-pose robustness; maintenance status and accuracy concerns. | Baseline/fallback only. |
| EyeTrax | Python/offline filtering and visualisation reference | Uses MediaPipe and filtering approaches; useful for offline or backend inspiration. | Not suitable for static mobile-browser deployment. | Reference for later filtering/event demos. |
| PhoneRealTimeGazeEstimation / MGazeNet | Native smartphone reference | Strong methodological reference for training, calibration, filtering, and mobile deployment. | Native route; licence/weights/export details require verification. | Reference for Android-local or backend routes. |
| GAZEL | Android research reference | Smartphone-oriented Android framework. | Older/staler; no browser path; licence and current build status need verification. | Secondary Android reference. |
| GazeSync-style mapping | Dynamic content mapping concept | Addresses mobile UI transformations such as scrolling, zooming, and content movement. | Conceptual/system reference rather than plug-and-play dependency. | Strong reference for Step 7. |

### 4.2 Commercial/proprietary comparison points

| Tool | Why it matters | Why it is not a PocketGaze implementation base |
|---|---|---|
| RealEye | Useful comparator for hosted mobile browser studies, AOIs, heatmaps, and reported smartphone performance. | Proprietary hosted platform; not reusable as an open-source site component. |
| Eyedid / SeeSo | Strong commercial mobile/web SDK comparator with local processing claims and mobile-first orientation. | Proprietary SDK; requires licence and does not fit free/open-source goal. |
| GazeCloudAPI / GazeRecorder | Useful as API/recorder comparison; includes gaze/head outputs in examples. | Licence, processing location, privacy, and current mobile validation need caution. |
| Other hosted platforms | Useful for UX expectations and comparison. | Not suitable as open-source implementation layers. |

## 5. Methodological implications for the seven PocketGaze steps

| Step | Key background point | Implication for the explainer site |
|---:|---|---|
| 1. Capture and timing | Browser camera timing can be irregular; frame-linked callbacks are preferable where available. | Step 1 should teach why camera frames need timestamps, frame IDs, and dropped/repeated-frame checks. |
| 2. Face and eye features | Landmarks and eye/iris proxies are the foundation for most browser-local demos. | Step 2 can start with feature overlays before any screen-gaze model is added. |
| 3. Head and phone motion | Head pose, face-camera distance, and phone movement are major sources of apparent eye/gaze changes. | Step 3 should explicitly show that head/phone motion can contaminate eye-local signals. |
| 4. Eye-local and gaze signals | Eye-local movement and screen-gaze estimates are different signal types. | Step 4 should make this distinction visually and terminologically central. |
| 5. Calibration and personalisation | Screen-gaze estimates usually require user/device/posture-specific mapping. | Step 5 should use a follow-the-dots task as the clearest calibration/validation example. |
| 6. Filtering and events | Raw camera-based signals are noisy; filtering can help but can also distort timing. | Step 6 should show raw versus filtered traces and label events cautiously as candidates. |
| 7. Content and stimulus mapping | Screen x/y coordinates may become misleading when content scrolls, zooms, or transforms. | Step 7 should demonstrate screen coordinates versus content-relative coordinates. |

## 6. Browser and mobile constraints

PocketGaze should treat browser implementation as an incremental route. Relevant constraints include:

- mobile browser differences, especially Android Firefox/Chrome and later iOS Safari;
- support for `requestVideoFrameCallback` and fallback timing strategies;
- performance variability across phones;
- memory pressure, thermal throttling, and battery impact;
- WebGL/WebGPU/WASM backend availability;
- camera permission and camera-resolution constraints;
- privacy implications of any camera, frame, landmark, or gaze-data handling.

The first scaffold should therefore contain simple placeholders only. Live camera, landmarking, gaze estimation, calibration, and export should be added through later narrow prompts.

## 7. Privacy and data governance

The preferred design is local processing and derived-data export by default.

Important principles:

- do not store raw video by default;
- clearly distinguish local processing from any upload;
- prefer feature upload over frame upload if a cloud route is later explored;
- treat landmarks, gaze data, head pose, and task-linked eye data as potentially sensitive;
- document what is processed, what is stored, and what is exported;
- avoid claiming regulatory compliance unless it has been explicitly reviewed.

For PocketGaze, privacy should be explained as part of the product, but it should not dominate the public-facing demo unless a later feature actually processes camera data.

## 8. Recommended route for PocketGaze

### 8.1 First route: browser-local explainer and demo

This is the recommended initial implementation path.

Start with:

1. static Step 0–7 pages;
2. simple placeholders;
3. simulated educational panels;
4. Step 1 camera timing only after the scaffold and specification are stable;
5. Step 2 feature overlays only after camera access is intentionally introduced;
6. optional WebEyeTrack integration only after the eye-local and timing layers are clean.

### 8.2 Second route: Android-local app

This is a later option if browser APIs, performance, or camera control become limiting. Android-local processing gives better camera control, easier access to phone sensors, and stronger native inference options, but reduces accessibility and increases development burden.

### 8.3 Third route: Android app with self-hosted backend

This is only justified if heavier models, centralised processing, or systematic validation require it. It introduces infrastructure, privacy, and synchronisation complexity. If explored, upload derived features rather than raw frames wherever possible.

## 9. Important gaps and checks before implementation decisions

Before any tool becomes part of the actual implementation, verify:

- current licence and reuse terms;
- whether model weights are available;
- whether the tool works on target browsers/devices;
- whether it can be self-hosted;
- whether timestamps and confidence/quality fields are exposed;
- whether left-eye and right-eye signals can be accessed separately;
- whether head pose, blink/eye-state, and tracking quality are available;
- whether data export can include raw/minimally processed derived signals;
- whether the public demo actually works on target phones.

Specific checks:

| Candidate | Checks before use |
|---|---|
| WebEyeTrack | API surface, self-hosting, browser compatibility, timestamp/export fields, live-demo behaviour, licence. |
| Human | Face/iris/head-pose output stability, browser performance, left/right eye access, blink/eye-state support. |
| MediaPipe Web | FaceLandmarker/iris availability, model hosting, browser compatibility, performance. |
| WebGazer | Current maintenance status, licence constraints, phone/browser performance, baseline-only role. |
| MGazeNet / PhoneRealTimeGazeEstimation | Licence, weights, build status, Android deployment path, export schema. |
| GAZEL | Licence, build status, current Android compatibility, model availability. |
| Cloud architecture | Uploaded data type, consent model, encryption, backend logging, raw-frame storage policy. |

## 10. Recommended documentation use in the repository

Use this file as concise secondary background documentation.

Suggested location:

`docs-dev/reference/secondary_background/smartphone_eye_tracking_background.md`

Suggested companion files:

| File | Role |
|---|---|
| `docs-dev/reference/primary_authoritative/specification.md` | Binding project decisions. |
| `docs-dev/reference/secondary_background/overview.md` | Short seven-step project overview. |
| `docs-dev/reference/secondary_background/research/verified_tool_comparison.md` | Optional full research appendix, if retained. |
| `docs-dev/reference/secondary_background/research/archive/` | Optional archive for long-form source files. |

This file should inform future prompts, but it should not override the binding specification.
