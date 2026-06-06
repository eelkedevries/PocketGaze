// Step definitions for the PocketGaze seven-step pipeline explainer.
//
// This copy is final: it describes the live demos and panels that exist on each
// step page. The binding project decisions live in
// docs-dev/reference/primary_authoritative/specification.md.

/** A short term/definition pair (e.g. the signal-type glossary). */
export interface GlossaryEntry {
  term: string;
  definition: string;
}

/** A single stage in the at-a-glance pipeline summary. */
export interface PipelineStage {
  label: string;
  title: string;
  summary: string;
}

export interface StepDefinition {
  /** Pipeline index, 0 = overview. */
  index: number;
  /** Route slug, e.g. "step-1". */
  slug: string;
  /** Short navigation label, e.g. "Step 1". */
  navLabel: string;
  /** Full page title. */
  title: string;
  /** One-paragraph introduction. */
  intro: string;
  /** Options / methods bullet points. */
  methods: string[];
  /** Short note on what this page implements. */
  implementationOnThisPage: string;
  /** Outputs this step is expected to produce. */
  outputs: string[];
  /** Known limitations / cautions. */
  limitations: string[];

  // --- Optional fields used by the Step 0 overview only. ---
  // Steps 1–7 leave these undefined and render the standard step-page shell.

  /** When true, the "live demo" area shows a static summary instead of a camera placeholder. */
  noLiveDemo?: boolean;
  /** At-a-glance pipeline summary, shown in place of the live-demo placeholder. */
  pipelineStages?: PipelineStage[];
  /** Term/definition pairs rendered after the introduction (e.g. the signal-type glossary). */
  glossary?: GlossaryEntry[];
  /** Extra paragraph after "implementation on this page" (e.g. how to use the master control). */
  usageNote?: string;
  /** Real (static) content for the implementation-details panel, in place of the placeholder. */
  detailsContent?: string[];

  /**
   * Optional progressive-disclosure ladder (056). The `intro` is the always-visible
   * CONCEPT tier; `mechanism` is an expandable engineer-level tier; `maths` is the
   * deepest specialist tier, revealed only with the master "Show implementation
   * details" control (no second global toggle).
   */
  disclosure?: {
    mechanism?: string;
    maths?: string;
  };
}

export const steps: StepDefinition[] = [
  {
    index: 0,
    slug: 'step-0',
    navLabel: 'Step 0',
    title: 'Step 0: Overview',
    intro:
      'PocketGaze is a portfolio project that shows, step by step, how smartphone-camera eye tracking can be built in practice. It is meant to run entirely in your browser, so that nothing you show the camera has to leave your device. Rather than treating eye tracking as a single black box, it breaks the problem into a seven-step pipeline and pairs each step with a live demo and optional panels that reveal what is happening inside. One idea runs through the whole site: there are three different kinds of “gaze” signal that are easy to confuse, and keeping them apart is central to honest eye tracking.',
    glossary: [
      {
        term: 'Eye-local signal',
        definition:
          'Where the iris or pupil sits within its own eye region. It is calibration-light and useful for movement traces, but it is not the same as where you are looking on the screen.',
      },
      {
        term: 'Screen-gaze estimate',
        definition:
          'An estimate of the on-screen x/y position you are looking at. It depends on calibration and validation before it can be trusted.',
      },
      {
        term: 'Content-mapped coordinate',
        definition:
          'A screen-gaze point translated into the content’s own coordinates, accounting for scrolling, zooming, and changes in layout.',
      },
    ],
    methods: [
      'Treat smartphone eye tracking as a pipeline of seven stages, not a single model.',
      'Do the work browser-locally first, so raw video never has to leave the device.',
      'Keep eye-local signals, screen-gaze estimates, and content-mapped coordinates clearly separate, and label movement events cautiously as candidates.',
    ],
    implementationOnThisPage:
      'This page is the map. It introduces the pipeline and the vocabulary; each of Steps 1–7 then follows the same layout — a brief introduction, the options and methods, what the page implements, a live demo, optional implementation details, the outputs, and the limitations.',
    usageNote:
      'Use the “Show implementation details” control in the header at any time. With it switched off, each step shows only its main demo and explanation; switch it on to reveal the optional subprocess panels — intermediate signals, frame timing, landmarks, head pose, filtering stages, calibration samples, and so on — that show how a result was produced. It is a single switch that applies across the whole site, including the panel below.',
    noLiveDemo: true,
    pipelineStages: [
      { label: 'Step 1', title: 'Capture and timing', summary: 'Timestamped frames from the front camera.' },
      { label: 'Step 2', title: 'Face and eye features', summary: 'Landmarks, eye regions, an iris proxy, and blink state.' },
      { label: 'Step 3', title: 'Head and phone motion', summary: 'Head pose and motion-quality labels.' },
      { label: 'Step 4', title: 'Eye-local and gaze signals', summary: 'Eye-local movement and, optionally, a screen-gaze estimate.' },
      { label: 'Step 5', title: 'Calibration and personalisation', summary: 'A user-specific mapping to screen coordinates.' },
      { label: 'Step 6', title: 'Filtering and events', summary: 'Cleaned traces and cautious candidate events.' },
      { label: 'Step 7', title: 'Content and stimulus mapping', summary: 'Screen- and content-relative task data.' },
    ],
    detailsContent: [
      'Stack: a static React + TypeScript site built with Vite and deployed to GitHub Pages.',
      'Processing is browser-local: frames are analysed on your device, and raw video is never uploaded or stored by default.',
      'What can be exported is derived data — signals, events, and task metadata — never the video itself.',
    ],
    outputs: [
      'A shared mental model of the seven steps and how they connect.',
      'A clear vocabulary: eye-local signal versus screen-gaze estimate versus content-mapped coordinate.',
    ],
    limitations: [
      'Smartphone-camera eye tracking is inherently approximate: screen-gaze accuracy is modest and depends on calibration, lighting, viewing distance, and head pose.',
      'The effective frame rate is low (typically around 30 Hz), so fine saccade dynamics and microsaccades cannot be recovered, and movement events are labelled cautiously as candidates.',
      'There is no inertial sensing in the browser, so head and phone motion are inferred from face geometry alone; performance varies considerably across devices and browsers.',
    ],
  },
  {
    index: 1,
    slug: 'step-1',
    navLabel: 'Step 1',
    title: 'Step 1: Capture and timing',
    disclosure: {
      mechanism:
        'Frames arrive from the front camera via getUserMedia. Each is timestamped per frame with requestVideoFrameCallback (which also exposes the source media time), falling back to requestAnimationFrame where that is unavailable. The effective frame rate is derived from the spacing between successive frames, and repeated or skipped source frames are inferred from the media-time stream.',
      maths:
        'Effective rate ≈ 1 / median(Δt) over recent inter-frame intervals. A repeated source frame shows the same media time twice; a gap larger than roughly 1.8× the expected interval implies dropped frames. At ~30 Hz each frame is ~33 ms apart, so a 30–80 ms saccade spans only one to three samples: its onset, offset, duration, and peak velocity cannot be recovered, even though the displacement itself is visible. Microsaccades are out of reach because of their sub-degree amplitude and sub-frame duration, not because of a Nyquist frequency bound.',
    },
    intro:
      'Before any analysis can happen, the pipeline needs a reliable stream of frames from the front-facing camera with timing information accurate enough for sample-level work. A single millisecond timestamp per frame is not enough: the browser separates the moment a video frame was composed by the hardware from the moment the pipeline processed it, and that gap matters when you later want to align eye-movement traces with stimulus events. Step 1 acquires frames, attaches the right timestamps, and checks for dropped or repeated frames so that downstream steps can trust the timing they receive.',
    methods: [
      'Frame-by-frame processing: call getUserMedia to open the front camera, then draw each video frame into a canvas or pass it to an inference pipeline on each iteration.',
      'Frame-linked callbacks: use requestVideoFrameCallback (where supported) to process each frame at exactly the moment the browser has composited it, giving access to the hardware presentation timestamp and a metadata object that includes frame counts for drop/repeat detection. A requestAnimationFrame fallback is used where the API is unavailable.',
      'Dropped and repeated-frame detection: compare the sequential frame counter from the callback metadata (or a manual frame-count heuristic) to identify frames that the browser skipped or held for more than one display interval.',
      'Separate timing fields: record the video-frame presentation time, the capture timestamp, and the processing latency as distinct fields rather than collapsing them into one value, so the export stays reanalysable.',
    ],
    implementationOnThisPage:
      'The live demo for this step is a camera preview with a real-time frame-rate readout, per-frame timing display, and drop/repeat indicators.',
    outputs: [
      'Timestamped frames ready for the feature-extraction pipeline.',
      'Per-frame timing fields: time_ms (milliseconds from session start), frame_id, video_frame_time, capture_time, and processing_latency_ms.',
      'Drop and repeat flags, allowing downstream steps to exclude unreliable frames.',
    ],
    limitations: [
      'Effective frame rate varies considerably across devices, lighting conditions, and thermal state; nominal frame rate and actual delivered rate often differ.',
      'requestVideoFrameCallback is not available in all browsers; the fallback timer is less precise and cannot provide hardware presentation timestamps.',
      'The browser timing resolution may be reduced (jittered) for privacy reasons in some contexts, limiting sub-millisecond accuracy.',
      'Camera permission must be granted by the user; if denied or unavailable, the demo degrades gracefully to an explanatory message rather than a broken page.',
    ],
  },
  {
    index: 2,
    slug: 'step-2',
    navLabel: 'Step 2',
    title: 'Step 2: Face and eye features',
    disclosure: {
      mechanism:
        'MediaPipe FaceLandmarker returns 478 facial landmarks. Each eye region is taken from its eye-aspect-ratio (EAR) contour; the iris proxy is the centroid of the five-point iris ring; and the EAR is mapped to an openness score used for blink detection. Only these derived features are kept — never the raw video. Per-eye labels follow the subject\'s own anatomy (MediaPipe\'s landmark convention); because the front-camera preview is mirrored, each labelled eye appears on the matching side of the on-screen preview.',
      maths:
        'EAR = (‖p₂−p₆‖ + ‖p₃−p₅‖) / (2·‖p₁−p₄‖) over the six eye-contour points. Openness = clamp((EAR − 0.15) / (0.35 − 0.15), 0, 1); the eye is treated as closed/blinking below EAR ≈ 0.2. The iris-proxy centre is the mean of the five iris-ring landmark coordinates.',
    },
    intro:
      'Raw camera frames tell you very little on their own. Step 2 applies a face-landmark model to locate the face, isolate each eye region, estimate where the iris or pupil proxy sits within that region, assess whether each eyelid is open or closed, and score the quality of what was detected. These features are the raw material for every downstream step: head pose needs the face geometry, the eye-local signal needs the iris proxy within its eye region, blink suppression needs the eyelid-openness values, and calibrated gaze mapping needs good-quality detections to be worth fitting.',
    methods: [
      'Face landmark detection: run a face-mesh or sparse-landmark model on each camera frame to locate the face and a set of key points covering the eye regions, brow, nose bridge, and outer face contour.',
      'Eye-region isolation: use the landmark set to crop or define a bounding region around each eye separately, normalised for the face scale and orientation, so that the iris proxy can be measured consistently regardless of how close the phone is held.',
      'Iris and pupil-proxy extraction: within each eye region, estimate the centre of the iris or the brightest/darkest circular region as a proxy for the pupil; the result is a 2-D position within the eye region that the next steps will use as the raw eye-movement signal.',
      'Eyelid-openness estimation: derive an eye-aspect ratio or equivalent metric from the upper and lower lid landmarks to indicate whether each eye is open, partially open, or closed; this drives blink detection and quality filtering in Step 6.',
      'Per-eye quality estimation: combine landmark confidence, eye-region size, and openness into a per-eye quality score that later steps use to weight or reject samples.',
    ],
    implementationOnThisPage:
      'The live demo for this step is a camera preview with a real-time overlay of detected landmarks, eye-region boundaries, and the iris proxy, together with per-eye open/closed and quality indicators.',
    outputs: [
      'Face, eye, eyelid, and iris/pupil-proxy features per frame.',
      'Per-eye quality scores (left_eye_quality, right_eye_quality) and an overall face_quality field.',
      'Blink and eye-state fields (left_eye_open, right_eye_open, blink_state) used by filtering and event detection.',
    ],
    limitations: [
      'Landmark quality degrades with partial occlusion (hand, glasses, hair), unconventional eyewear, extreme yaw or pitch, strong side-lighting, or very low light.',
      'Unstable or noisy landmark detections propagate to every downstream step: poor iris localisation produces noisy eye-local signals, and poor face geometry produces unreliable head-pose estimates.',
      'The iris proxy is a geometric estimate from visible landmarks, not a direct measurement of the pupil centre; accuracy varies with iris visibility and model choice.',
      'Running inference on every frame is computationally expensive; on mid-range phones, the chosen model must balance accuracy against thermal and battery impact.',
    ],
  },
  {
    index: 3,
    slug: 'step-3',
    navLabel: 'Step 3',
    title: 'Step 3: Head and phone motion',
    disclosure: {
      mechanism:
        'The facial transformation matrix produced alongside the landmarks is decomposed into head rotation (yaw, pitch, roll) and an approximate translation. Rotational speed and a pose-quality proxy then label each sample low / moderate / uncertain, so head-motion-contaminated intervals can be excluded downstream rather than mistaken for eye movement.',
      maths:
        'For a rotation R = Rz·Ry·Rx: pitch = atan2(r₂₁, r₂₂), yaw = atan2(−r₂₀, √(r₀₀² + r₁₀²)), roll = atan2(r₁₀, r₀₀) (a Tait–Bryan/Euler decomposition; atan2 keeps it numerically stable across the full ±180° range, but the decomposition itself still degenerates at the gimbal-lock singularity near ±90° of the middle axis, where yaw and roll are no longer separable — in practice the face is lost before that pose is reached). Monocular translation — especially depth — is unscaled and approximate.',
    },
    intro:
      'A camera attached to a phone that moves in 3-D space cannot tell the difference between the eye moving and the head rotating or translating — both change where the iris appears in the frame. Step 3 estimates the head\'s orientation and position from the face geometry, attaches a motion-quality label to each sample, and flags intervals where head or phone movement makes the eye-movement signal too unreliable to use. Without this step, head and phone motion is silently misclassified as eye movement, corrupting the signal with artefacts that look like large, rapid gaze shifts.',
    methods: [
      'Head rotation estimation (yaw, pitch, roll): fit a 3-D pose to the 2-D face landmark positions — using a PnP-style solve, Procrustes normalisation, or the pose output of the landmark model — to derive the three rotation angles describing the orientation of the head relative to the camera.',
      'Head translation estimation: derive the approximate 3-D position of the head (tx, ty, tz) from the same geometric fit, giving a coarse measure of how far the face is from the camera and how it has shifted laterally.',
      'Head-motion quality labelling: compute the magnitude and rate of rotation and translation changes across frames, then assign each sample a label — low, moderate, or uncertain — to indicate how much the head is moving and how much that movement may be contaminating the eye signal.',
      'Rejection of uncertain intervals: mark samples as uncertain_head_motion when the movement is large enough that the eye-local or gaze signal cannot be trusted; downstream event detection excludes these intervals.',
      'Note on phone IMU: direct inertial-sensor access (accelerometer, gyroscope) is largely unavailable in the browser (the Generic Sensor API has limited browser support and requires HTTPS); head-pose estimates from the camera geometry are therefore the primary motion signal in this browser-local implementation.',
    ],
    implementationOnThisPage:
      'The live demo for this step is a real-time head-pose readout showing estimated yaw, pitch, and roll, together with a motion-quality label.',
    outputs: [
      'Head rotation fields: head_yaw, head_pitch, head_roll (in degrees or radians).',
      'Head translation fields: head_tx, head_ty, head_tz (normalised or in camera units).',
      'A head_pose_quality score and per-sample head-motion labels (low / moderate / uncertain_head_motion) that downstream steps use to weight or exclude samples.',
    ],
    limitations: [
      'Monocular RGB translation estimates (particularly depth, tz) are approximate and scale-ambiguous; they improve when the face fills more of the frame but are not a substitute for IMU data.',
      'Without explicit head-pose handling, even moderate head movements produce apparent eye-movement artefacts that are indistinguishable from real saccades in the raw signal.',
      'The chosen pose method (library output, PnP solve, or Procrustes normalisation) is decided by a method spike and may trade accuracy for computational cost.',
      'Rapid head turns can exceed the reliable range of the landmark model, making both the landmark detections and the derived pose unreliable for those frames.',
    ],
  },
  {
    index: 4,
    slug: 'step-4',
    navLabel: 'Step 4',
    title: 'Step 4: Eye-local and gaze signals',
    disclosure: {
      mechanism:
        'The iris proxy is normalised within each detected eye region to give the eye-local signal — calibration-light and available whenever eye-region and iris detection succeed with sufficient quality, but not screen gaze. A separate, calibrated regression (or an opt-in model) maps the eye-local feature vector to a screen-gaze estimate; the two signal kinds are kept in distinct fields and never conflated.',
      maths:
        'Eye-local coordinate = (iris − regionCentre) / regionHalfSize ∈ [−1, 1] per axis. Screen gaze = C · [1, cₓ, c_y, lₓ, l_y, rₓ, r_y]ᵀ, where the feature vector holds the combined and per-eye eye-local coordinates and C is the fitted coefficient matrix (Step 5).',
    },
    intro:
      'With face geometry and head pose available, Step 4 produces the main signal of interest. Two quite different signals are possible, and keeping them apart is one of the central design rules of PocketGaze. An eye-local signal measures where the iris proxy sits within the eye region — it reflects eye rotation relative to the head, is calibration-light, and is always available, but it is not the same as where you are looking on the screen. A screen-gaze estimate goes further: it maps the eye-local signal through a calibrated or trained model to give an estimated on-screen x/y position. Screen-gaze requires calibration, validation, and reliability checks before it can be used meaningfully; without those, it is too coarse for fine spatial interpretation.',
    methods: [
      'Eye-local signal estimation: normalise the iris-proxy position within the detected eye region (accounting for face scale and head orientation) to produce a calibration-light left/right/combined eye-local coordinate. This is the baseline signal — available only when eye-region and iris detection succeed with sufficient quality, but not screen gaze.',
      'Screen-gaze estimation via regression mapping: after a calibration step (Step 5), fit a mapping from eye-local features to known screen positions, then apply it to new frames to estimate where on the screen the user is looking.',
      'Model-based screen-gaze inference: use a pre-trained gaze model (such as WebEyeTrack, if available after a technical spike, or WebGazer as a fallback baseline) that takes the face or eye region as input and outputs screen-gaze coordinates directly.',
      'Signal availability and confidence: report whether a screen-gaze estimate is available for each sample and attach a confidence score; the eye-local signal is available as a fallback whenever eye-region and iris detection succeed, even when screen-gaze is not.',
      'Content-mapped estimation: screen-gaze coordinates that need to be aligned with scrolling or dynamic content are handled in Step 7, not here.',
    ],
    implementationOnThisPage:
      'The live demo for this step is an eye-local movement trace shown by default, with an optional screen-gaze overlay when a mapping or model is available, keeping the two signal types visually and terminologically distinct.',
    outputs: [
      'Eye-local signal fields: left_eye_x/y, right_eye_x/y, combined_eye_x/y — normalised within the eye region.',
      'Screen-gaze signal fields: gaze_x, gaze_y, gaze_available, gaze_confidence — present only when a calibrated mapping or model is active.',
      'The signal_type processing-metadata field, recording which signal (eye-local or screen-gaze) is active for each sample.',
    ],
    limitations: [
      'Eye-local movement is not screen gaze: the two must be labelled and described as such throughout, and the eye-local signal must not be presented as a precise gaze estimate unless a validated mapping has been fitted and checked.',
      'Screen-gaze estimates require a calibration step (Step 5) and depend on the quality of that calibration; a poor calibration produces systematically biased gaze coordinates.',
      'Model-based gaze inference (WebEyeTrack, WebGazer) requires a viable licence, self-hosting or CDN access, and browser compatibility — all confirmed by a technical spike before use.',
      'Gaze estimation accuracy on a smartphone camera is inherently modest: spatial resolution is limited, and estimates degrade with head movement, variable lighting, and distance changes.',
    ],
  },
  {
    index: 5,
    slug: 'step-5',
    navLabel: 'Step 5',
    title: 'Step 5: Calibration and personalisation',
    disclosure: {
      mechanism:
        'A follow-the-dots task collects (eye-local feature → known screen target) pairs. A linear least-squares fit maps features to screen coordinates; fit quality is estimated by k-fold cross-validation, and a separate validation task on held-out targets measures on-screen accuracy and precision distinctly from the fit.',
      maths:
        'Per axis, solve the ridge-regularised normal equations (AᵀA + λI)·c = Aᵀ·t for the coefficients c. The design matrix is rank-deficient — the combined-eye feature columns are exact averages of the per-eye columns — so the ridge term λI is required for a well-posed solve. Calibration RMS = √(mean residual²). Validation reports accuracy (mean target–estimate offset), precision (sample-to-sample RMS, “RMS-S2S”), and BCEA — the bivariate contour ellipse area.',
    },
    intro:
      'A generic gaze model cannot know how you hold your phone, how far from the screen you sit, or the geometry of your particular eye. Without calibration, even a well-engineered pipeline produces screen-gaze estimates that are too coarse for meaningful spatial analysis. Step 5 collects a set of samples at known screen positions — by asking you to follow or tap on a dot — and uses them to fit a user-specific mapping that compensates for your individual physiology, camera placement, and current posture. A held-out validation pass then estimates how well the fitted mapping generalises.',
    methods: [
      'Follow-the-dots calibration: display a dot at a sequence of known screen positions and record the eye-local or raw gaze feature at each position; the result is a set of (feature, target) pairs used to fit the mapping.',
      'Tap/click calibration: an alternative where the user taps on displayed targets, triggering a frame capture at the moment of the tap; useful when following a moving dot is impractical.',
      'Regression mapping: fit a mapping from the collected eye-local features to the target screen positions — this site uses a regularised linear (affine) least-squares fit; richer polynomial or learned mappings are possible but are not used here. The fitted mapping is then applied to subsequent frames to produce personalised screen-gaze estimates.',
      'Model personalisation: when using a pre-trained gaze model, fine-tune or adapt it on the collected calibration samples rather than fitting a separate regression on top.',
      'Calibration-quality checks: after fitting, compute a held-out error metric (e.g. mean angular error or pixel error on withheld targets) and a consistency metric across repeated samples; report both so the user can judge whether the calibration is good enough to use.',
    ],
    implementationOnThisPage:
      'The live demo for this step is a follow-the-dots task at known screen positions, followed by a fitted mapping and a held-out validation error readout.',
    outputs: [
      'A user-specific mapping model that translates eye-local features into personalised screen-gaze coordinates.',
      'Calibration rows in the export, recording each dot position and the corresponding eye-local features.',
      'calibration_target events marking each displayed target; target_x, target_y, and target_id fields per calibration sample.',
    ],
    limitations: [
      'Calibration quality depends heavily on user compliance: inattentive fixations, blinks, or head movement during the task produce noisy samples that degrade the fitted mapping.',
      'The fitted mapping may not generalise well beyond the calibrated screen region or to postures and distances different from those during calibration.',
      'Without calibration, screen-gaze coordinates are too coarse for fine spatial interpretation — the eye-local signal remains available, but screen position cannot be reliably estimated.',
      'Re-calibration is needed whenever the phone is repositioned significantly or the user moves to a substantially different distance from the screen.',
    ],
  },
  {
    index: 6,
    slug: 'step-6',
    navLabel: 'Step 6',
    title: 'Step 6: Filtering and events',
    disclosure: {
      mechanism:
        'A One Euro filter smooths the eye-local signal, raising its cutoff during fast movement to limit lag and lowering it at rest to limit jitter. Blink and low-quality samples are suppressed, then a velocity/dispersion rule labels cautious fixation and saccade candidates, downgraded by head-motion context.',
      maths:
        'One Euro cutoff f_c = f_cmin + β·|ẋ|, with the smoothing factor α = 1 / (1 + (f_s / 2π f_c)). A segment is saccade-like when its inter-sample speed ≥ the threshold (units/s); a fixation candidate is a low-speed run whose dispersion ≤ the limit for at least the minimum duration. All labels are candidates, not validated detections.',
    },
    intro:
      'Raw eye-movement signals from a smartphone camera are noisy. High-frequency jitter from imperfect landmark tracking, frame-to-frame variability in the iris proxy, and momentary blinks all obscure the underlying signal. Step 6 applies adaptive filtering to reduce noise while preserving genuine rapid movements, suppresses blink intervals, marks low-quality samples, and detects candidate events in the cleaned signal. The raw signal is always preserved alongside its filtered version so the data stays reanalysable. All detected events are labelled cautiously as candidates — without a ground-truth reference, strong event labels would overclaim.',
    methods: [
      'Raw signal preservation: keep the unfiltered eye-local or gaze coordinates in dedicated columns alongside their filtered counterparts, so downstream analysis can choose how to use them.',
      'Adaptive filtering with the One Euro filter: apply a low-pass filter whose cut-off frequency adapts to the local signal speed — aggressive smoothing at low speeds (suppressing tremor and noise) and lighter smoothing at high speeds (preserving rapid movements). Filter parameters (minimum cut-off, beta) are recorded in the export.',
      'Blink suppression: use the eyelid-openness values from Step 2 to identify blink intervals, mark the affected samples with blink_state, and exclude them from event detection to prevent blink-induced signal artefacts from being labelled as saccades.',
      'Quality-thresholding: apply per-sample quality scores from Steps 2 and 3 to mark samples below threshold as tracking_lost, ensuring that low-confidence detections are never silently treated as valid signal.',
      'Velocity and displacement event detection: compute frame-to-frame velocity and displacement in the filtered signal, apply thresholds to identify low-velocity intervals (fixation candidates) and rapid transitions (saccade-like candidates), and score each detection with a confidence value.',
    ],
    implementationOnThisPage:
      'The live demo for this step is raw and filtered signal traces shown together, with cautiously labelled candidate events overlaid.',
    outputs: [
      'Filtered signal columns alongside the original raw columns, with the filter name and parameters recorded in the export.',
      'Event rows using the candidate vocabulary: fixation_candidate, saccade_candidate, saccade_head_still, saccade_during_head_movement, blink, tracking_lost, and uncertain_head_motion.',
      'Per-event fields: event_type, event_start_ms, event_end_ms, event_confidence, and head_motion_label.',
    ],
    limitations: [
      'Excessive smoothing introduces temporal lag and removes genuine rapid eye movements; the One Euro beta parameter must be tuned to the expected signal range.',
      'Insufficient filtering leaves noise in the signal and produces spurious fixation and saccade candidates.',
      'Event detection thresholds (velocity, displacement, quality) are device- and lighting-dependent; values that work well on one phone may produce many false positives or miss real events on another.',
      'Without a validated reference signal (e.g. a laboratory eye tracker), all detected events remain candidates and must not be presented as confirmed fixations or saccades.',
    ],
  },
  {
    index: 7,
    slug: 'step-7',
    navLabel: 'Step 7',
    title: 'Step 7: Content and stimulus mapping',
    disclosure: {
      mechanism:
        'Screen-gaze coordinates are converted into content-relative coordinates using the content element’s bounding rectangle, accounting for page and element scroll and any CSS transform, so a fixed point keeps a constant content coordinate as the page moves. Fixations in content space are then aggregated per area of interest.',
      maths:
        'Content coordinate = (screen − rect.origin) / rect.size, with internal-scroll and transform corrections applied. Per AOI: dwell = Σ fixation durations inside it; fixation count = number assigned; time-to-first-fixation = the earliest in-AOI fixation onset relative to task start.',
    },
    intro:
      'Screen coordinates alone are not enough to understand what a person was looking at. When content scrolls, zooms, changes layout, or is overlaid by other elements, the same screen x/y position corresponds to different content at different times. Step 7 aligns the eye or gaze signal with the stimulus or content the user was actually viewing, by logging the position, size, and identity of screen elements alongside the tracking data. The result is a content-relative coordinate that remains meaningful even when layout changes — and a stimulus log that lets you later ask not just "where on the screen?" but "which part of the content?".',
    methods: [
      'Stimulus and task logging: record each stimulus event (e.g. a dot appearing, a content item entering the viewport) with its identity, on-screen position, and timestamp, so the tracking stream can be aligned with the task timeline.',
      'Viewport and screen geometry logging: record the viewport size, device pixel ratio, and screen orientation at the start of the session and whenever they change, providing the coordinate reference frame for all subsequent gaze coordinates.',
      'Layout and element-position logging: use getBoundingClientRect and related DOM APIs to record the screen position and size of specific content elements at the moment of interest, enabling screen-gaze coordinates to be converted into content-relative coordinates.',
      'Scroll, zoom, and transform logging: record scroll position, zoom level, and CSS transforms using ResizeObserver, IntersectionObserver, and scroll event listeners, so that coordinate transformations can be applied retroactively.',
      'Note on cloud-only alignment: aligning tracking data with server-rendered or dynamically fetched content requires backend timestamps and a shared clock, which is out of scope for this browser-local implementation.',
    ],
    implementationOnThisPage:
      'The live demo for this step is a side-by-side contrast of screen coordinates and content-relative coordinates for content that scrolls or transforms.',
    outputs: [
      'Content-relative coordinate fields: content_x, content_y, content_mapping_available — the gaze position expressed in the content\'s own coordinate space.',
      'Stimulus rows recording the identity, position, and timing of each task or display event.',
      'Viewport and layout metadata fields used to reconstruct coordinate transforms.',
    ],
    limitations: [
      'Screen coordinates are misleading whenever content scrolls, zooms, moves, or changes layout between the moment of gaze and the moment of analysis; failing to account for this produces systematic errors in content attribution.',
      'Accurate content mapping requires consistent coordinate systems across the tracking, layout, and stimulus logs; any mismatch in timestamps or coordinate origins produces misaligned data.',
      'The browser-local approach depends on DOM geometry APIs, which are not available for content rendered outside the browser (e.g. video, canvas, or native UI).',
      'Backend or server-side alignment — needed when stimuli are loaded from a remote source with server-controlled timing — is out of scope for this repository.',
    ],
  },
];

export function getStepBySlug(slug: string): StepDefinition | undefined {
  return steps.find((step) => step.slug === slug);
}
