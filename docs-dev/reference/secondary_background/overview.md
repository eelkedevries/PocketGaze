<!--
NON-BINDING BACKGROUND MATERIAL.
This file is secondary background context for PocketGaze. It is informational only
and does NOT override the binding canon in
docs-dev/reference/primary_authoritative/specification.md.
-->

# Free and open-source smartphone-camera eye tracking: structured pipeline overview
**Generated:** 2026-06-02
**Scope:** free/open-source methods and tools for smartphone/front-camera eye tracking.
**Recommended routes:** browser-local first; Android-local second; Android app with self-hosted cloud processing third.

---
## 1. Seven-step pipeline framework
A smartphone-camera eye-tracking system should be designed as a pipeline rather than as a single model. Each step is described using the same structure: **goal**, **methods**, and **implementations**.

| Step | Short name                          | Main output                                      |
| ---: | ----------------------------------- | ------------------------------------------------ |
|    1 | Capture and timing                  | timestamped camera frames                        |
|    2 | Face/eye feature extraction         | face, eye, eyelid, and iris/pupil-proxy features |
|    3 | Head-pose and phone-motion handling | head pose and motion-quality labels              |
|    4 | Eye/gaze signal estimation          | eye-local signal, screen-gaze signal, or both    |
|    5 | Calibration and personalisation     | user-specific mapping model                      |
|    6 | Filtering and event detection       | filtered traces and event labels                 |
|    7 | Content and stimulus mapping        | screen- or content-relative task data            |

---
### 1.1 Step 1: capture and timing

#### Goal
Acquire frames from the front-facing camera and attach timing information that is accurate enough for sample-level analysis.

#### Methods
| Method                         | Description                                                      | Pros                                                              | Cons / risks                                                          | Best use                                    |
| ------------------------------ | ---------------------------------------------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------- |
| Frame-by-frame processing      | Process each available camera frame as a discrete sample.        | Reduces ambiguity about which image produced which signal.        | Effective frame rate may vary across devices and lighting conditions. | All pipelines.                              |
| Frame-linked browser callbacks | Trigger processing when a new browser video frame is available.  | Avoids repeatedly processing the same displayed frame.            | Depends on browser support.                                           | Browser-local pipeline.                     |
| Native camera frame analysis   | Use the Android camera stack to analyse frames directly.         | Better access to timestamps and frame metadata than browser APIs. | Requires native app development.                                      | Android-local and Android-cloud pipelines.  |
| Dropped/repeated-frame checks  | Detect whether frames are skipped, delayed, or reused.           | Improves interpretability of velocity and event estimates.        | Requires explicit logging and quality checks.                         | All pipelines.                              |
| Separate timing fields         | Store capture time, processing time, and export time separately. | Makes latency and timing artefacts easier to diagnose.            | Adds more fields to the export.                                       | All pipelines, especially cloud processing. |

#### Implementations
| Pipeline route | Language/platform | Tools/software | Notes |
|---|---|---|---|
| Browser-local | JavaScript/TypeScript | `navigator.mediaDevices.getUserMedia()`; `HTMLVideoElement.requestVideoFrameCallback()` | Use `getUserMedia` for camera access and `requestVideoFrameCallback` for frame-linked timing where supported. |
| Android-local | Kotlin/Java | CameraX `ImageAnalysis`; CameraX/ImageProxy timestamps | Preferred native Android route for frame analysis. |
| Android-cloud | Kotlin/Java app + Python backend | CameraX; HTTPS/WebSocket/WebRTC; backend ingest timestamps | Prefer feature upload over frame upload; log both app-side and backend-side timestamps. |

#### Main risk
If timing is irregular or undocumented, velocity estimates and event timing become difficult to interpret.

---
### 1.2 Step 2: face and eye feature extraction

#### Goal
Detect the face, eyes, eyelids, iris or pupil proxy, and landmarks needed for eye-local tracking, screen-gaze estimation, blink detection, and head-pose estimation.

#### Methods
| Method | Description | Pros | Cons / risks | Best use |
|---|---|---|---|---|
| Face landmark detection | Detect stable landmarks across the face. | Provides the basis for head pose, eye-region localisation, and quality checks. | Landmark quality can degrade with occlusion, glasses, lighting, and extreme pose. | All pipelines. |
| Eye-region detection | Isolate left and right eye regions separately. | Enables separate eye-specific reliability and signal export. | Errors in eye-region localisation affect all downstream eye signals. | All pipelines. |
| Iris/pupil-proxy extraction | Estimate iris centre or a pupil/iris-centre proxy from landmarks or image features. | Provides a calibration-light eye-local signal. | The proxy may not correspond exactly to the anatomical pupil centre. | Browser-local and Android-local pipelines. |
| Eyelid openness estimation | Estimate eye closure using eyelid landmarks or eye aspect ratio. | Supports blink detection and invalid-sample suppression. | May be unstable for partial occlusions or low-resolution frames. | All pipelines. |
| Per-eye quality estimation | Compute reliability separately for each eye and signal type. | Allows adaptive signal selection and confidence labels. | Requires explicit quality criteria. | All pipelines. |

#### Implementations
| Pipeline route | Language/platform | Tools/software | Notes |
|---|---|---|---|
| Browser-local | JavaScript/TypeScript | Human; MediaPipe Tasks Vision / FaceLandmarker Web; TensorFlow.js if needed | Use for local browser feature extraction. |
| Android-local | Kotlin/Java | MediaPipe Tasks Vision / FaceLandmarker Android; OpenCV Android; TensorFlow Lite/LiteRT if needed | Use native libraries for speed and camera integration. |
| Android-cloud | Kotlin/Java app + Python backend | Prefer local Android landmarks; alternatively MediaPipe Python and OpenCV Python | Uploading landmarks is preferable to uploading frames. |

#### Main risk
Unstable landmarks propagate noise and bias into all later pipeline stages.

---
### 1.3 Step 3: head-pose and phone-motion handling

#### Goal
Estimate whether apparent eye movement is caused by actual eye movement, head movement, phone movement, or changing face-camera geometry.

#### Methods
| Method | Description | Pros | Cons / risks | Best use |
|---|---|---|---|---|
| Head rotation estimation | Estimate yaw, pitch, and roll from face landmarks. | Helps separate eye movement from head movement. | Accuracy depends on landmark stability and camera geometry. | All pipelines. |
| Head translation estimation | Estimate face position or translation relative to the camera. | Captures shifts in distance and face position. | Translation estimates may be approximate with monocular RGB input. | All pipelines. |
| Phone-motion logging | Record accelerometer, gyroscope, or orientation metadata. | Helps identify phone movement in native apps. | Browser access is limited; sensor data require careful interpretation. | Android-local and Android-cloud pipelines. |
| Head-motion quality labelling | Label samples/events as low, moderate, or uncertain head-motion contamination. | Makes event interpretation more transparent. | Requires thresholds that may need empirical tuning. | All pipelines. |
| Rejection of uncertain intervals | Mark or reject intervals with unreliable pose/tracking. | Reduces false event labels. | May reduce usable data. | All pipelines. |

#### Implementations
| Pipeline route | Language/platform | Tools/software | Notes |
|---|---|---|---|
| Browser-local | JavaScript/TypeScript | Human pose output; MediaPipe landmarks; OpenCV.js `solvePnP`; custom Procrustes-style normalisation | Browser support and performance must be tested. |
| Android-local | Kotlin/Java | MediaPipe landmarks; OpenCV `solvePnP`; Android `SensorManager` | Strongest route for combining camera and phone-motion metadata. |
| Android-cloud | Kotlin/Java app + Python backend | Android sensor metadata; OpenCV Python `solvePnP`; MediaPipe Python; NumPy/SciPy | Useful when heavier filtering or pose modelling is needed server-side. |

#### Main risk
Without head-pose handling, head or phone movement can be misclassified as eye movement.

---
### 1.4 Step 4: eye/gaze signal estimation

#### Goal
Estimate the main signal of interest: an eye-local signal, a screen-gaze signal, or both.

#### Methods
| Method | Description | Pros | Cons / risks | Best use |
|---|---|---|---|---|
| Eye-local signal estimation | Normalise iris/pupil proxy within the detected eye region. | Calibration-light; useful for eye-movement traces and event candidates. | Not equivalent to screen gaze. | First implementation layer in all pipelines. |
| Screen-gaze estimation | Use a trained gaze model or calibrated mapping to estimate screen x/y. | Enables dot-task, AOI, and screen-position analyses. | Requires calibration, validation, and model reliability checks. | Browser-local and Android-local pipelines when gaze coordinates are needed. |
| Content-mapped estimation | Convert screen-gaze coordinates into content/stimulus coordinates. | Handles scrolling, moving, or transformed content. | Requires stimulus/layout logging. | Tasks with dynamic content. |
| Model-based inference | Use appearance-based models trained for gaze estimation. | Can improve screen-gaze estimates compared with geometry alone. | Model availability, licence, and device performance must be checked. | WebEyeTrack, MGazeNet-style routes. |
| Baseline regression | Use simpler regression from features to screen coordinates. | Easier to implement and useful as a baseline. | Often less robust under head and phone movement. | Baseline/fallback only. |

#### Implementations
| Pipeline route | Language/platform | Tools/software | Notes |
|---|---|---|---|
| Browser-local | JavaScript/TypeScript | Human/MediaPipe for eye-local signals; WebEyeTrack for screen gaze; WebGazer.js as baseline/fallback | Keep eye-local and screen-gaze signals separate in the export. |
| Android-local | Kotlin/Java + mobile inference runtime | MediaPipe/OpenCV for eye-local signals; MGazeNet / PhoneRealTimeGazeEstimation-style models; GAZEL; TensorFlow Lite/LiteRT, MNN, ONNX Runtime Mobile | Check licence and availability of model weights before reuse. |
| Android-cloud | Kotlin/Java app + Python backend | MGazeNet, AFF-Net, iTracker-style models; PyTorch; TensorFlow; ONNX Runtime; OpenCV; MediaPipe Python | Strongest route for heavy model experimentation. |

#### Main risk
Eye-local movement should not be presented as precise screen gaze unless a valid mapping has been fitted and checked.

---
### 1.5 Step 5: calibration and personalisation

#### Goal
Adapt the signal or gaze mapping to the individual user, phone, camera position, screen geometry, and holding posture.

#### Methods
| Method | Description | Pros | Cons / risks | Best use |
|---|---|---|---|---|
| Follow-the-dots calibration | Ask the user to look at or follow dots at known screen positions. | Provides known target positions and timestamps; useful for validation and mapping. | Adds a task step; quality depends on compliance and attention. | All pipelines. |
| Tap/click calibration | Use taps or clicks as approximate gaze targets. | Simple and natural in interactive tasks. | Target assumptions can be weak if users tap without looking. | Browser and app tasks. |
| Regression mapping | Fit a mapping from eye-local/model features to screen coordinates. | Transparent and relatively easy to implement. | May not generalise beyond the calibrated posture/range. | First implementation of screen mapping. |
| Model personalisation | Adapt a trained gaze model to the current user. | Potentially more accurate than simple mapping. | More complex; may require model support and more compute. | WebEyeTrack or native model routes where available. |
| Calibration-quality checks | Estimate error or consistency from calibration samples. | Allows warnings or recalibration prompts. | Requires held-out points or repeated targets. | All pipelines. |

#### Implementations
| Pipeline route | Language/platform | Tools/software | Notes |
|---|---|---|---|
| Browser-local | JavaScript/TypeScript | Custom dot/click task; WebEyeTrack personalisation if available; JavaScript regression; TensorFlow.js if needed | Keep calibration samples in the export. |
| Android-local | Kotlin/Java | Native dot task; Kotlin calibration module; TensorFlow Lite/LiteRT, MNN, ONNX Runtime Mobile if model-specific adaptation is available | Native UI gives stable full-screen target presentation. |
| Android-cloud | Kotlin/Java app + Python backend | App-side dot task; backend calibration with scikit-learn, PyTorch, TensorFlow, NumPy, pandas | Best route for comparing calibration models. |

#### Main risk
Without calibration, screen-gaze estimates are usually too inaccurate for fine spatial interpretation.

---
### 1.6 Step 6: filtering and event detection

#### Goal
Reduce noise, mark invalid samples, and convert the time series into interpretable event candidates.

#### Methods
| Method | Description | Pros | Cons / risks | Best use |
|---|---|---|---|---|
| Raw derived-signal preservation | Export minimally processed eye/gaze/head signals. | Keeps the data reanalysable. | Produces noisier traces than filtered outputs. | All pipelines. |
| Adaptive filtering | Smooth low-velocity noise while limiting lag during rapid movement. | Better than heavy fixed smoothing for event work. | Filter parameters must be documented and tuned. | All pipelines. |
| Blink suppression | Mark or exclude samples during eye closure. | Prevents invalid samples from entering event detection. | Blink detection may be imperfect. | All pipelines. |
| Quality-thresholding | Use confidence/quality fields to mark invalid or uncertain samples. | Reduces false events. | Thresholds may be device- and lighting-dependent. | All pipelines. |
| Velocity/displacement event detection | Detect candidate fixations and rapid movements from documented signal versions. | Transparent and implementable in browser, app, or backend. | Sensitive to timing, filtering, and noise. | All pipelines. |
| Event confidence scoring | Attach confidence values based on signal quality and head motion. | Makes event labels easier to interpret. | Requires explicit scoring rules. | All pipelines. |

#### Implementations
| Pipeline route | Language/platform | Tools/software | Notes |
|---|---|---|---|
| Browser-local | JavaScript/TypeScript | JavaScript/TypeScript One Euro filter; optional Kalman filter; custom blink and saccade-like event detector | Keep filter parameters in the export. |
| Android-local | Kotlin/Java | Kotlin One Euro filter; optional Kalman filter; native blink and saccade-like event detector | Native implementation can run continuously on-device. |
| Android-cloud | Python backend | NumPy; SciPy; pandas; custom One Euro/Kalman/event-detection code | Best route for rapid method iteration. |

#### Main risk
Excessive smoothing can introduce lag or remove rapid movements; insufficient filtering can produce false events.

---
### 1.7 Step 7: content and stimulus mapping

#### Goal
Align eye-local or gaze signals with the actual screen content, dot task, stimulus, or user-interface state.

#### Methods
| Method | Description | Pros | Cons / risks | Best use |
|---|---|---|---|---|
| Stimulus logging | Store dot/stimulus identity, position, and timestamp. | Enables validation and task alignment. | Requires consistent coordinate systems. | All task-based pipelines. |
| Viewport/screen logging | Store viewport, screen size, orientation, and device-pixel ratio. | Needed to interpret screen coordinates. | Values can change during a session. | Browser and app pipelines. |
| Layout/position logging | Store element or view coordinates at relevant times. | Allows gaze-to-content mapping. | Requires integration with the UI layer. | Browser and Android tasks. |
| Scroll/zoom/transform logging | Store transformations that change the relation between screen and content. | Prevents misleading interpretation of screen x/y. | Adds implementation complexity. | Dynamic content. |
| Backend alignment | Align tracking data with task logs after collection. | Useful for complex processing and validation. | Requires careful timestamp synchronisation. | Cloud pipeline. |

#### Implementations
| Pipeline route | Language/platform | Tools/software | Notes |
|---|---|---|---|
| Browser-local | JavaScript/TypeScript | DOM APIs; `getBoundingClientRect`; `ResizeObserver`; `IntersectionObserver`; scroll/zoom/transform logging | Required for dynamic browser content. |
| Android-local | Kotlin/Java | Jetpack Compose layout coordinates; Android View coordinates; local task/stimulus event logging | Required for native dot and stimulus tasks. |
| Android-cloud | Kotlin/Java app + Python backend | App-side stimulus logging; backend alignment in Python with pandas/NumPy | Keep app and backend clocks interpretable. |

#### Main risk
Screen coordinates can become misleading when content scrolls, zooms, moves, or changes layout.

---
## 2. Recommended pipelines
The three recommended pipelines are defined by deployment route and processing location.

| Pipeline | Deployment | Processing location | Main language(s) | Recommended status |
|---|---|---|---|---|
| 1 | Web browser application | Local in browser | JavaScript/TypeScript | first route |
| 2 | Android app first; iOS later | Local on device | Kotlin/Java | second route |
| 3 | Android app first; iOS later | Self-hosted backend | Kotlin/Java + Python | third route |

---
### 2.1 Pipeline 1: web browser application with local processing

#### Goal
Build a browser-accessible eye-tracking or eye-movement application that processes camera data locally and exports derived data. This is the best route for a public technical demo, a static web app, or a browser-based validation task.

#### Methods
| Step | Pipeline-specific method                                     | Why this method is used                                                                                        | Main risk                                                                                      |
| ---: | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
|    1 | Browser-local camera capture with frame-linked timing        | Enables URL-based deployment while preserving frame-level timing where supported.                              | Browser support and effective frame rate vary across devices.                                  |
|    2 | Browser-local face, eye, iris, and eyelid feature extraction | Keeps raw video local and provides the features needed for eye-local tracking, blink detection, and head pose. | Landmark quality can degrade with poor lighting, glasses, occlusion, or low-resolution frames. |
|    3 | Browser-side head-pose estimation and head-motion labelling  | Allows apparent eye movement to be interpreted relative to head movement.                                      | Browser-side pose estimates may be noisy or incomplete.                                        |
|    4 | Eye-local signal first, with optional screen-gaze model      | Keeps a usable signal even when screen-gaze estimation is unavailable or unreliable.                           | Eye-local movement is not equivalent to screen gaze.                                           |
|    5 | Follow-the-dots or click/tap calibration and validation      | Provides known target locations for mapping and quality checks.                                                | Calibration quality depends on user compliance and stable posture.                             |
|    6 | Browser-side filtering and candidate event detection         | Produces interpretable traces and event labels while keeping processing local.                                 | Filtering and event detection are sensitive to timing, noise, and head movement.               |
|    7 | Browser-side stimulus and content mapping                    | Aligns eye/gaze data with DOM elements, dot targets, and dynamic content.                                      | Dynamic layouts, scrolling, and transforms require careful logging.                            |

#### Implementations
| Step | Method | Tools/software | Language/platform |
|---:|---|---|---|
| 1 | Browser camera capture and frame timing | `getUserMedia`; `requestVideoFrameCallback` | JavaScript/TypeScript |
| 2 | Face/eye/iris landmarks | Human; MediaPipe FaceLandmarker Web | JavaScript/TypeScript |
| 3 | Head pose | Human pose output; MediaPipe landmarks; OpenCV.js if needed | JavaScript/TypeScript; possible WebAssembly |
| 4 | Eye-local + optional screen gaze | Human/MediaPipe eye-local signal; WebEyeTrack for screen gaze; WebGazer.js baseline only | JavaScript/TypeScript; TensorFlow.js where used |
| 5 | Calibration | follow-the-dots task; WebEyeTrack personalisation if available; JavaScript regression | JavaScript/TypeScript |
| 6 | Filtering/events | One Euro filter; blink detection; saccade-like event detector | JavaScript/TypeScript |
| 7 | Stimulus/content mapping | DOM geometry and transform logging | JavaScript/TypeScript |

#### Strengths
- Easiest to distribute.
- No app-store dependency.
- Local processing is privacy-favourable.
- Can be deployed as a static app if models are self-hosted.

#### Limitations
- Browser support and performance must be tested on target devices.
- Some browser libraries may not expose all low-level signals.
- Mobile browser memory and camera constraints may limit model choice.

#### Recommendation
implement first.

---
### 2.2 Pipeline 2: Android app with local processing

#### Goal
Build a native Android application that processes all camera data on the device. iOS can be added later after the Android version is stable.

#### Methods
| Step | Pipeline-specific method | Why this method is used | Main risk |
|---:|---|---|---|
| 1 | Native Android camera capture and frame timing | Provides better camera control and access to frame metadata than the browser route. | Requires native app development and device-specific testing. |
| 2 | On-device face, eye, iris, and eyelid feature extraction | Keeps raw video local while using native/mobile-optimised libraries. | Runtime performance must be tested on target phones. |
| 3 | Native head-pose estimation plus phone-motion logging | Combines camera-based pose with Android sensor metadata where useful. | Sensor signals and camera pose estimates require careful interpretation. |
| 4 | Eye-local signal first, with optional native screen-gaze model | Provides a robust base signal and allows later addition of MGazeNet-style gaze estimation. | Native gaze-model reuse depends on licence, weights, preprocessing, and runtime support. |
| 5 | Native follow-the-dots calibration and validation | Gives stable full-screen target presentation and user-specific mapping data. | Less accessible than a browser task and requires app installation. |
| 6 | On-device filtering and candidate event detection | Keeps derived processing local and can run continuously on the device. | Implementation must preserve raw derived signals and document filter parameters. |
| 7 | Native stimulus and content mapping | Aligns tracking data with Android UI coordinates and task events. | Coordinate systems must be handled consistently across devices and orientations. |

#### Implementations
| Step | Method | Tools/software | Language/platform |
|---:|---|---|---|
| 1 | Native camera capture | CameraX `ImageAnalysis`; Android camera timestamps | Kotlin/Java |
| 2 | Face/eye/iris features | MediaPipe FaceLandmarker Android; OpenCV Android | Kotlin/Java; native C++ internally |
| 3 | Head pose and phone motion | OpenCV `solvePnP`; Android `SensorManager`; MediaPipe landmarks | Kotlin/Java |
| 4 | Eye-local + native screen gaze | MediaPipe/OpenCV geometry; MGazeNet/PhoneRealTimeGazeEstimation-style model; GAZEL reference | Kotlin/Java; TensorFlow Lite/LiteRT, MNN, or ONNX Runtime Mobile |
| 5 | Calibration | native follow-the-dots task; regression/SVR-style mapping | Kotlin/Java |
| 6 | Filtering/events | Kotlin One Euro filter; blink detection; saccade-like event detector | Kotlin/Java |
| 7 | Stimulus/content mapping | Jetpack Compose or Android View coordinates | Kotlin/Java |

#### Strengths
- Better camera and timing control than browser.
- Easier access to phone sensors.
- More stable full-screen task presentation.
- Stronger route for on-device model inference.

#### Limitations
- Less accessible than a browser link.
- Android-first development creates later iOS porting work.
- Native deployment increases maintenance burden.
- Licence and model-weight availability must be checked for research repositories.

#### Recommendation
use if browser constraints become limiting.

---
### 2.3 Pipeline 3: Android app with self-hosted cloud processing

#### Goal
Build an Android app that captures frames or features locally and sends data to a self-hosted backend for heavier processing. iOS can be added later.

#### Methods
| Step | Pipeline-specific method | Why this method is used | Main risk |
|---:|---|---|---|
| 1 | Native Android capture plus controlled upload/streaming | Allows app-side frame capture while delegating heavier processing to a backend. | Network latency, dropped packets, and backend timestamps must be handled. |
| 2 | Prefer local feature extraction before upload; use server-side extraction only if needed | Reduces the privacy burden by uploading landmarks/features rather than frames. | Feature upload still contains sensitive derived information; server-side extraction may require frame upload. |
| 3 | Server-side head-pose estimation and motion-quality modelling | Allows heavier pose filtering and quality modelling in Python. | App-side and backend-side timing must remain interpretable. |
| 4 | Server-side eye-local and screen-gaze estimation | Supports heavier models and faster iteration with Python research code. | The system depends on backend availability and model/data-flow validation. |
| 5 | App-side calibration task with backend mapping/personalisation | Combines controlled target presentation with flexible backend modelling. | Calibration data must be aligned precisely with uploaded features or frames. |
| 6 | Server-side filtering and candidate event detection | Enables rapid algorithm development and reproducible batch processing. | Live feedback may be limited by latency; offline and online outputs may differ. |
| 7 | App-side stimulus logging with backend alignment/export | Allows the backend to reconstruct task, stimulus, and content-relative data. | Requires reliable synchronisation between app logs and backend processing. |

#### Data-flow options
| Data flow | What is uploaded | Privacy burden | Recommendation |
|---|---|---|---|
| Feature upload | landmarks, timestamps, task metadata | lower | preferred |
| Frame upload | cropped eye/face images or full frames | high | only if necessary |
| Hybrid | features plus explicit diagnostic frames | medium/high | development/validation only |

#### Implementations
| Step | Method | Tools/software | Language/platform |
|---:|---|---|---|
| 1 | Native capture and upload | CameraX; HTTPS; WebSocket; WebRTC if needed | Kotlin/Java app; network transport |
| 2 | Local or server feature extraction | preferably MediaPipe Android locally; alternatively MediaPipe Python/OpenCV backend | Kotlin/Java or Python |
| 3 | Server-side head pose | OpenCV `solvePnP`; MediaPipe Python; NumPy/SciPy | Python |
| 4 | Server-side gaze estimation | MGazeNet, AFF-Net, iTracker-style models; PyTorch/TensorFlow/ONNX Runtime | Python |
| 5 | Server-side calibration | app dot task; backend scikit-learn/PyTorch/TensorFlow mapping | Kotlin/Java + Python |
| 6 | Server-side filtering/events | NumPy; SciPy; pandas; custom filtering/event detection | Python |
| 7 | Stimulus alignment | app-side task logs; backend alignment | Kotlin/Java + Python |

#### Backend implementations
| Backend layer | Tools/software | Language/platform |
|---|---|---|
| API | FastAPI | Python |
| Streaming | WebSocket; WebRTC if needed | client/backend |
| Computer vision | OpenCV; MediaPipe Python | Python |
| Model inference | PyTorch; TensorFlow; ONNX Runtime | Python |
| Calibration | scikit-learn; PyTorch; TensorFlow | Python |
| Data handling | pandas; NumPy; SciPy | Python |
| Deployment | Docker; Docker Compose | infrastructure |

#### Strengths
- Can run heavier models than the phone or browser.
- Easier to use Python research code.
- Centralised model updates.
- Useful for validation and multi-device experiments.

#### Limitations
- Highest privacy and infrastructure burden.
- Network latency and dropped packets must be handled.
- Raw-frame upload should not be the default.

#### Recommendation
use only when local processing is insufficient or centralised model experimentation is required.

---
## 3. Recommended development order

#### Goal
Choose an implementation order that keeps the project useful even if later stages prove difficult.

#### Methods
| Method | Description | Pros | Cons / risks |
|---|---|---|---|
| Browser-first development | Start with Pipeline 1. | Fastest distribution and simplest access. | Browser limitations may appear later. |
| Native fallback | Move to Pipeline 2 if browser constraints are too restrictive. | Better camera/sensor control. | More development and distribution work. |
| Cloud only when justified | Use Pipeline 3 only for heavier models or centralised experiments. | More flexible computation. | Privacy and infrastructure costs increase. |

#### Implementations
1. **Pipeline 1 first:** web browser application with local processing.
2. **Pipeline 2 second:** Android app with local processing if browser limitations become too restrictive.
3. **Pipeline 3 third:** Android app with self-hosted cloud processing only if heavier models or centralised processing are needed.

---
## 4. Recommended data export

### 4.1 Goal
Create a data format that can be inspected, reanalysed, and compared across pipelines.

### 4.2 Methods
| Method | Description | Pros | Cons / risks |
|---|---|---|---|
| Derived-data export | Export gaze/eye/head/event/task data rather than raw video. | More privacy-favourable and easier to share. | Does not allow later image-level reprocessing. |
| Combined row-type format | Store samples, events, calibration, stimuli, and quality summaries in one file. | Easy first export format. | Can become wide and requires clear row-type definitions. |
| Raw and filtered signal columns | Keep minimally processed and filtered derived signals separately. | Supports reanalysis. | Increases export size. |
| Processing metadata | Store model, filter, pipeline, and data-flow fields. | Improves reproducibility. | Requires discipline during implementation. |

#### Implementations
| Row type | Purpose |
|---|---|
| `sample` | time-series sample |
| `event` | blink, fixation candidate, saccade-like event, or tracking loss |
| `calibration` | dot/click target used for mapping |
| `stimulus` | task or display event |
| `quality` | optional signal-quality summary |
| Field group | Example fields |
|---|---|
| Timing | `time_ms`, `frame_id`, `video_frame_time`, `capture_time`, `processing_latency_ms` |
| Eye-local signal | `left_eye_x`, `left_eye_y`, `right_eye_x`, `right_eye_y`, `combined_eye_x`, `combined_eye_y` |
| Screen-gaze signal | `gaze_x`, `gaze_y`, `gaze_available`, `gaze_confidence` |
| Content-mapped signal | `content_x`, `content_y`, `content_mapping_available` |
| Head pose | `head_yaw`, `head_pitch`, `head_roll`, `head_tx`, `head_ty`, `head_tz` |
| Tracking quality | `left_eye_quality`, `right_eye_quality`, `face_quality`, `head_pose_quality`, `selected_signal_quality` |
| Blink/eye state | `left_eye_open`, `right_eye_open`, `blink_state` |
| Events | `event_type`, `event_start_ms`, `event_end_ms`, `event_confidence`, `head_motion_label` |
| Task/stimulus | `target_x`, `target_y`, `target_id`, `task_phase` |
| Processing/data flow | `pipeline_id`, `model_name`, `signal_type`, `filter_name`, `mapping_model_id`, `processing_location`, `uploaded_data_type`, `raw_video_saved` |

---
## 5. Recommended event labels

### 5.1 Goal
Use event labels that are useful but cautious for smartphone-camera data.

### 5.2 Methods
| Method | Description | Pros | Cons / risks |
|---|---|---|---|
| Candidate event labels | Mark events as candidates when reference validation is unavailable. | Avoids overclaiming. | Less definitive wording. |
| Tracking-loss labels | Explicitly mark unavailable or low-quality samples. | Prevents invalid data from being treated as events. | Requires quality thresholds. |
| Head-motion labels | Label events according to head-motion contamination. | Improves interpretability. | Thresholds require tuning. |
| Confidence values | Attach confidence or reliability values to event labels. | Helps downstream filtering. | Requires explicit scoring rules. |

### 5.3 Implementations
| Label | Meaning |
|---|---|
| `blink` | eye-closure interval |
| `tracking_lost` | face or eye tracking unavailable or below threshold |
| `fixation_candidate` | low-velocity interval passing quality criteria |
| `saccade_candidate` | rapid eye/gaze movement passing basic criteria |
| `saccade_head_still` | saccade-like event with low head-motion contamination |
| `saccade_during_head_movement` | saccade-like event during moderate head movement |
| `uncertain_head_motion` | interval too affected by head movement for confident classification |
| `calibration_target` | known dot/click target used for mapping |
| `stimulus_event` | task or stimulus event aligned with the tracking stream |

---
## 6. Verification checklist

### 6.1 Pipeline 1: browser-local
- Test Android Firefox, Android Chrome/Chromium, and later iOS Safari if needed.
- Check whether `requestVideoFrameCallback` is available or requires fallback.
- Confirm export of separate left/right eye signals, head pose, blink state, timestamps, and confidence.
- Confirm whether WebEyeTrack can be self-hosted and used from a static app.
- Test performance on mid-range phones.

---
### 6.2 Pipeline 2: Android-local
- Check CameraX timing quality.
- Compare local landmark options on target phones.
- Check licence/reuse status for MGazeNet, PhoneRealTimeGazeEstimation, and GAZEL.
- Confirm trained-weight availability and local inference speed.
- Test whether phone sensors improve head/phone-motion labels.
- Confirm complete derived-data export without raw video.

---
### 6.3 Pipeline 3: Android-cloud
- Specify uploaded data: features, crops, frames, or video.
- Avoid raw-frame upload unless necessary and explicitly consented.
- Use encrypted transport and self-hosted backend.
- Check whether feature upload is sufficient for calibration and event detection.
- Log backend processing timestamps and make exports reproducible.

---
## 7. Tool and link index
The table below groups links by category. Empty cells mean that a directly relevant link was not central to this document.

| Tool/resource | Main role | Platform/language | Official website | API documentation | Code repository | Live demo | Examples / papers / other |
|---|---|---|---|---|---|---|---|
| `getUserMedia` | browser camera access | JavaScript/TypeScript |  | https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia |  |  |  |
| `requestVideoFrameCallback` | browser frame timing | JavaScript/TypeScript |  | https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement/requestVideoFrameCallback |  |  | https://wicg.github.io/video-rvfc/ |
| Human | browser face/iris/pose/eye-state library | JavaScript/TypeScript; TensorFlow.js | https://vladmandic.github.io/human/typedoc/ | https://vladmandic.github.io/human/typedoc/ | https://github.com/vladmandic/human | https://vladmandic.github.io/human/demo/index.html |  |
| MediaPipe Tasks Vision / FaceLandmarker Web | browser landmark extraction | JavaScript/TypeScript | https://ai.google.dev/edge/mediapipe/solutions/guide | https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker | https://github.com/google-ai-edge/mediapipe |  |  |
| TensorFlow.js | browser model inference | JavaScript/TypeScript | https://www.tensorflow.org/js | https://www.tensorflow.org/js/guide | https://github.com/tensorflow/tfjs |  |  |
| WebEyeTrack | browser screen-gaze candidate | JavaScript/TypeScript; Python research code |  |  | https://github.com/RedForestAi/WebEyeTrack | https://redforestai.github.io/WebEyeTrack/ | https://arxiv.org/abs/2508.19544 ; https://mmla.gse.harvard.edu/tools/webeyetrack/ |
| WebGazer.js | browser gaze baseline | JavaScript | https://webgazer.cs.brown.edu/ | https://webgazer.cs.brown.edu/ | https://github.com/brownhci/webgazer | https://webgazer.cs.brown.edu/ | https://osdoc.cogsci.nl/3.3/manual/eyetracking/webgazer/ ; https://www.jspsych.org/6.3/overview/eye-tracking/ |
| OpenCV.js / `solvePnP` | browser geometry/head-pose option | JavaScript/WebAssembly | https://opencv.org/ | https://docs.opencv.org/4.x/d5/d1f/calib3d_solvePnP.html | https://github.com/opencv/opencv |  | https://docs.opencv.org/4.x/d9/d0c/group__calib3d.html |
| DOM geometry APIs | browser content/stimulus mapping | JavaScript/TypeScript |  | https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect ; https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver ; https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver |  |  |  |
| CameraX `ImageAnalysis` | Android frame capture | Kotlin/Java | https://developer.android.com/media/camera/camerax | https://developer.android.com/media/camera/camerax/analyze ; https://developer.android.com/reference/androidx/camera/core/ImageAnalysis |  |  |  |
| Android camera timestamps / `ImageProxy` | Android frame metadata | Kotlin/Java | https://developer.android.com/media/camera/camerax | https://developer.android.com/reference/androidx/camera/core/ImageProxy |  |  |  |
| Android `SensorManager` | phone-motion metadata | Kotlin/Java |  | https://developer.android.com/reference/android/hardware/SensorManager ; https://developer.android.com/reference/kotlin/android/hardware/SensorManager |  |  |  |
| MediaPipe Tasks Vision / FaceLandmarker Android | Android landmark extraction | Kotlin/Java | https://ai.google.dev/edge/mediapipe/solutions/guide | https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker | https://github.com/google-ai-edge/mediapipe |  |  |
| OpenCV Android | Android geometry/image processing | Kotlin/Java wrapper over C++ | https://opencv.org/ | https://docs.opencv.org/4.x/d5/d1f/calib3d_solvePnP.html | https://github.com/opencv/opencv |  | https://opencv.org/releases/ |
| Jetpack Compose | Android task UI/layout | Kotlin | https://developer.android.com/jetpack/compose | https://developer.android.com/reference/kotlin/androidx/compose/ui/layout/LayoutCoordinates |  |  |  |
| Android View coordinate APIs | Android layout/stimulus coordinates | Kotlin/Java |  | https://developer.android.com/reference/android/view/View#getLocationOnScreen(int[]) |  |  |  |
| TensorFlow Lite / LiteRT | Android local inference | Kotlin/Java + native runtime | https://ai.google.dev/edge/litert | https://www.tensorflow.org/api_docs/python/tf/lite |  |  |  |
| MNN | mobile inference runtime | native mobile runtime | https://www.mnn.zone/ |  | https://github.com/alibaba/MNN |  | https://arxiv.org/abs/2002.12418 |
| ONNX Runtime Mobile | mobile inference runtime | Kotlin/Java + native runtime | https://onnxruntime.ai/ | https://onnxruntime.ai/docs/tutorials/mobile/ ; https://onnxruntime.ai/docs/get-started/with-mobile.html | https://github.com/microsoft/onnxruntime |  |  |
| PhoneRealTimeGazeEstimation / MGazeNet | native/cloud gaze-model reference | Python training; mobile deployment |  |  | https://github.com/GanchengZhu/PhoneRealTimeGazeEstimation |  | https://onlinelibrary.wiley.com/doi/full/10.1155/2024/2644725 |
| GAZEL | Android gaze-estimation reference | Android app stack |  |  | https://github.com/joonb14/GAZEL |  | https://www.researchgate.net/publication/351864211_GAZEL_Runtime_Gaze_Tracking_for_Smartphones |
| FastAPI | self-hosted backend API | Python | https://fastapi.tiangolo.com/ | https://fastapi.tiangolo.com/ | https://github.com/fastapi/fastapi |  |  |
| WebSocket API | app-backend communication | client/backend |  | https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API ; https://developer.mozilla.org/en-US/docs/Web/API/WebSocket |  |  |  |
| WebRTC | low-latency transport option | client/backend | https://webrtc.org/ | https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API |  |  |  |
| MediaPipe Python | server-side feature extraction | Python | https://ai.google.dev/edge/mediapipe/solutions/guide | https://ai.google.dev/edge/mediapipe/solutions/guide | https://github.com/google-ai-edge/mediapipe |  |  |
| OpenCV Python | server-side computer vision | Python | https://opencv.org/ | https://docs.opencv.org/ | https://github.com/opencv/opencv |  | https://docs.opencv.org/4.x/d5/d1f/calib3d_solvePnP.html |
| PyTorch | backend model training/inference | Python | https://pytorch.org/ | https://docs.pytorch.org/docs/stable/index.html | https://github.com/pytorch/pytorch |  |  |
| TensorFlow | backend model training/inference | Python | https://www.tensorflow.org/ | https://www.tensorflow.org/api_docs | https://github.com/tensorflow/tensorflow |  |  |
| ONNX Runtime | backend/mobile model inference | Python/mobile runtimes | https://onnxruntime.ai/ | https://onnxruntime.ai/docs/ | https://github.com/microsoft/onnxruntime |  |  |
| scikit-learn | calibration/regression | Python | https://scikit-learn.org/ | https://scikit-learn.org/stable/user_guide.html | https://github.com/scikit-learn/scikit-learn |  |  |
| NumPy | numerical computation | Python | https://numpy.org/ | https://numpy.org/doc/ | https://github.com/numpy/numpy |  |  |
| SciPy | filtering/optimisation/signal processing | Python | https://scipy.org/ | https://docs.scipy.org/doc/scipy/ | https://github.com/scipy/scipy |  |  |
| pandas | data alignment/export | Python | https://pandas.pydata.org/ | https://pandas.pydata.org/docs/ | https://github.com/pandas-dev/pandas |  |  |
| Docker | backend deployment | infrastructure | https://www.docker.com/ | https://docs.docker.com/ | https://github.com/docker |  |  |
| Docker Compose | multi-container deployment | infrastructure |  | https://docs.docker.com/compose/ | https://github.com/docker/compose |  |  |
| GazeCapture / Eye Tracking for Everyone | foundational dataset/model reference | research dataset/model | https://gazecapture.csail.mit.edu/ |  | https://github.com/CSAILVision/GazeCapture |  | https://www.cv-foundation.org/openaccess/content_cvpr_2016/papers/Krafka_Eye_Tracking_for_CVPR_2016_paper.pdf |
| iTracker | foundational gaze model | research model |  |  | https://github.com/CSAILVision/GazeCapture ; https://github.com/yihuacheng/Itracker |  | https://www.cv-foundation.org/openaccess/content_cvpr_2016/papers/Krafka_Eye_Tracking_for_CVPR_2016_paper.pdf |
| AFF-Net | appearance-based gaze model reference | research model |  |  | https://github.com/kirito12138/AFF-Net |  | https://arxiv.org/abs/2103.11119 |
| ZJUGaze / ZJUGaze-V2 | restricted smartphone gaze dataset reference | research dataset |  |  | https://github.com/GanchengZhu/PhoneRealTimeGazeEstimation/blob/main/access_zjugaze.md |  |  |
| EyeTrax | Python webcam/MediaPipe filtering reference | Python |  |  | https://github.com/ck-zhang/eyetrax/ |  |  |

---
## 8. Final recommendation
1. **Pipeline 1 first:** web browser application with local processing.
2. **Pipeline 2 second:** Android app with local processing if browser limitations become too restrictive.
3. **Pipeline 3 third:** Android app with self-hosted cloud processing only if heavier models or centralised processing are needed.
For all three routes, keep the same seven-step structure: capture/timing, feature extraction, head-pose handling, signal estimation, calibration, filtering/events, and content/stimulus mapping.
