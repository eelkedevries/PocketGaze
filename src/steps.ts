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

/**
 * One row of the Step 0 signal-taxonomy claims table: for each signal kind, what
 * it is, whether it needs calibration/validation, and — explicitly — what it does
 * and does not support.
 */
export interface SignalClaim {
  signal: string;
  whatItIs: string;
  needsCalibration: string;
  needsValidation: string;
  supports: string;
  doesNotSupport: string;
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
  /** Signal-taxonomy claims table (Step 0 only): what each signal supports and does not. */
  signalClaims?: SignalClaim[];
  /** When true, render the shared coordinate-chain figure (066) on this step. */
  coordinateFigure?: boolean;
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
      'PocketGaze is a portfolio project that shows, step by step, how smartphone-camera eye tracking can be built in practice. Everything runs in your browser — nothing you show the camera leaves your device. Instead of treating eye tracking as one black box, the site breaks it into a seven-step pipeline, each step paired with a live demo and optional panels that reveal what happens inside. One idea runs through the whole site: there are three easily confused kinds of “gaze” signal, and keeping them apart is central to honest eye tracking.',
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
      {
        term: 'Iris-centre proxy',
        definition:
          'The centre of the iris ring, estimated from landmarks and used as a proxy for the pupil centre. It is the raw 2-D point from which the eye-local signal is derived.',
      },
      {
        term: 'Fixation',
        definition:
          'A period during which gaze stays roughly still on one location, so visual information can be taken in.',
      },
      {
        term: 'Saccade',
        definition:
          'A fast ballistic jump of the eyes between fixations. At ~30 Hz its fine timing and peak velocity cannot be recovered.',
      },
      {
        term: 'Candidate fixation / candidate saccade',
        definition:
          'Fixations and saccades are labelled cautiously as candidates here, because the low frame rate and noise mean they cannot be confirmed to research-grade standards.',
      },
      {
        term: 'Calibration',
        definition:
          'Fitting a user-specific mapping from the eye-local feature to screen coordinates, using samples collected at known on-screen targets.',
      },
      {
        term: 'Validation error',
        definition:
          'The error of the fitted mapping measured on held-out targets that were not used for fitting — the honest test of on-screen accuracy, reported as accuracy and precision.',
      },
      {
        term: 'I-VT (velocity-threshold) rule',
        definition:
          'An event-detection rule that classifies samples as saccades when point-to-point velocity exceeds a threshold, and as fixations otherwise.',
      },
      {
        term: 'I-DT (dispersion-threshold) rule',
        definition:
          'An event-detection rule that marks a fixation when consecutive samples stay within a small spatial dispersion for a minimum duration. This site’s detector combines I-VT and I-DT.',
      },
      {
        term: 'One Euro filter',
        definition:
          'An adaptive low-pass filter that smooths slow movement strongly while letting fast movement through, trading latency against jitter (controlled by its minimum-cutoff and beta parameters).',
      },
      {
        term: 'rVFC (requestVideoFrameCallback)',
        definition:
          'A browser API that delivers a callback per decoded video frame with its media timestamp, giving accurate frame timing where available (with requestAnimationFrame as a fallback).',
      },
      {
        term: 'Tracking subtypes',
        definition:
          'Three distinct things are tracked, and are named separately rather than as a single “tracking”: face tracking (locating the face and landmarks), eye-region tracking (isolating each eye and its iris-centre proxy), and gaze estimation (mapping the eye-local feature to a screen-gaze estimate).',
      },
      {
        term: 'Quality subtypes',
        definition:
          'Quality is reported per concern rather than as a single “quality”: detection quality (landmark/face confidence), signal quality (eye-local stability), calibration quality (fit consistency), validation quality (held-out error), and event confidence (how trustworthy a candidate event is).',
      },
      {
        term: 'Candidate event labels',
        definition:
          'The exact event values used in the data: fixation_candidate, saccade_candidate, saccade_head_still, saccade_during_head_movement, uncertain_head_motion, blink, tracking_lost, and smooth_pursuit_candidate.',
      },
    ],
    signalClaims: [
      {
        signal: 'Eye-local signal',
        whatItIs: 'Iris-centre position within its own eye region.',
        needsCalibration: 'No',
        needsValidation: 'No',
        supports: 'Movement traces, relative direction, blink and candidate-event detection.',
        doesNotSupport: 'Where on the screen you are looking; absolute screen coordinates.',
      },
      {
        signal: 'Screen-gaze estimate',
        whatItIs: 'An estimate of the on-screen x/y point you are looking at.',
        needsCalibration: 'Yes',
        needsValidation: 'Yes (held-out)',
        supports: 'Approximate point-of-regard, dwell, and content mapping after validation.',
        doesNotSupport: 'Fine spatial claims when uncalibrated or unvalidated; sub-degree accuracy.',
      },
      {
        signal: 'Content-mapped coordinate',
        whatItIs: 'A screen-gaze point translated into the content’s own coordinates.',
        needsCalibration: 'Yes (via screen-gaze)',
        needsValidation: 'Yes (via screen-gaze)',
        supports: 'AOI dwell, reading/region analysis under scroll and zoom.',
        doesNotSupport: 'Anything the underlying screen-gaze estimate does not support.',
      },
      {
        signal: 'Candidate event',
        whatItIs: 'A cautiously labelled fixation, saccade, blink, or pursuit interval.',
        needsCalibration: 'No (eye-local) / inherited (screen-gaze)',
        needsValidation: 'No, but confidence is reported',
        supports: 'Qualitative event structure and timing at coarse resolution.',
        doesNotSupport: 'Peak velocity, the main sequence, microsaccades, or research-grade timing.',
      },
    ],
    methods: [
      'Treat smartphone eye tracking as a pipeline of seven stages, not a single model.',
      'Do the work browser-locally first, so raw video never has to leave the device.',
      'Keep eye-local signals, screen-gaze estimates, and content-mapped coordinates clearly separate, and label movement events cautiously as candidates.',
    ],
    implementationOnThisPage:
      'This page is the map. It introduces the pipeline and the vocabulary; each of Steps 1–7 then follows the same layout — a brief introduction, the options and methods, what the page implements, a live demo, optional implementation details, the outputs, and the limitations.',
    coordinateFigure: true,
    usageNote:
      'Use the “Show implementation details” control in the header at any time. With it switched off, each step shows only its main demo and explanation; switch it on to reveal the optional subprocess panels — intermediate signals, frame timing, landmarks, head pose, filtering stages, calibration samples, and so on — that show how a result was produced. It is a single switch that applies across the whole site, including the panel below.',
    noLiveDemo: true,
    pipelineStages: [
      { label: 'Step 1', title: 'Capture and timing', summary: 'Timestamped frames from the front camera.' },
      { label: 'Step 2', title: 'Face and eye features', summary: 'Landmarks, eye regions, an iris-centre proxy, and blink state.' },
      { label: 'Step 3', title: 'Head pose and motion quality', summary: 'Head pose and motion-quality labels.' },
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
      'Everything downstream depends on a reliable stream of camera frames with trustworthy timing. One timestamp per frame is not enough: when the camera captured a frame and when the pipeline processed it are different moments, and the gap matters once eye-movement traces are aligned with on-screen events. Step 1 acquires frames, attaches the right timestamps, and checks for dropped or repeated frames, so later steps can trust the timing they receive.',
    methods: [
      'Frame-by-frame processing: open the front camera with getUserMedia and hand each video frame to the processing pipeline.',
      'Frame-linked callbacks: requestVideoFrameCallback (where supported) fires once per composited frame with the hardware presentation timestamp and frame-count metadata; requestAnimationFrame is the fallback elsewhere.',
      'Dropped and repeated-frame detection: compare frame counters and source media times to spot frames the browser skipped or held.',
      'Separate timing fields: record presentation time, capture time, and processing latency as distinct fields — never collapsed into one value — so the export stays reanalysable.',
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
        'MediaPipe FaceLandmarker returns 478 facial landmarks. Each eye region is outlined from its eye-aspect-ratio (EAR) contour; the iris proxy is the centroid of the five-point iris ring; the EAR is mapped to an openness score used for blink detection; and the two eye-corner landmarks anchor the normalisation frame that the Step 4 eye-local signal uses — the corners stay put during blinks and squints, unlike the eyelids. Only these derived features are kept — never the raw video. Per-eye labels follow the subject\'s own anatomy (MediaPipe\'s landmark convention); because the front-camera preview is mirrored, each labelled eye appears on the matching side of the on-screen preview.',
      maths:
        'EAR = (‖p₂−p₆‖ + ‖p₃−p₅‖) / (2·‖p₁−p₄‖) over the six eye-contour points. Openness = clamp((EAR − 0.15) / (0.35 − 0.15), 0, 1). Open/closed uses hysteresis rather than one threshold: an open eye closes when EAR drops below 0.18 and only reopens above 0.24, so frames hovering near a single cut-off cannot flicker between states. The iris-proxy centre is the mean of the five iris-ring landmark coordinates.',
    },
    intro:
      'Raw camera frames tell you very little on their own. Step 2 runs a face-landmark model to locate the face, isolate each eye, place the iris-centre proxy within it, read eyelid openness, and score how trustworthy each detection is. Every later step builds on these features: head pose needs the face geometry, the eye-local signal needs the iris proxy, blink suppression needs the openness values, and a calibrated gaze mapping is only worth fitting on good detections.',
    methods: [
      'Face landmark detection: a face-mesh model locates the face and key points covering the eyes, brow, nose bridge, and face contour on every frame.',
      'Eye-region isolation: the landmarks define each eye region separately, normalised for face scale, so the iris proxy reads consistently however close the phone is held.',
      'Iris-centre proxy extraction: the centre of the iris ring stands in for the pupil centre — the 2-D point later steps use as the raw eye-movement signal.',
      'Eyelid-openness estimation: an eye-aspect ratio from the lid landmarks says whether each eye is open, partially open, or closed, driving blink detection and quality filtering in Step 6.',
      'Per-eye quality estimation: a per-eye quality score lets later steps weight or reject samples.',
    ],
    implementationOnThisPage:
      'The live demo for this step is a camera preview with a real-time overlay of detected landmarks, eye-region boundaries, and the iris-centre proxy, together with per-eye open/closed and quality indicators.',
    outputs: [
      'Face, eye, eyelid, and iris-centre proxy features per frame.',
      'Per-eye quality scores (left_eye_quality, right_eye_quality) and an overall face_quality field.',
      'Blink and eye-state fields (left_eye_open, right_eye_open, blink_state) used by filtering and event detection.',
    ],
    limitations: [
      'Landmark quality degrades with partial occlusion (hand, glasses, hair), unconventional eyewear, extreme yaw or pitch, strong side-lighting, or very low light.',
      'Unstable or noisy landmark detections propagate to every downstream step: poor iris localisation produces noisy eye-local signals, and poor face geometry produces unreliable head-pose estimates.',
      'The iris-centre proxy is a geometric estimate from visible landmarks, not a direct measurement of the pupil centre; accuracy varies with iris visibility and model choice.',
      'Running inference on every frame is computationally expensive; on mid-range phones, the chosen model must balance accuracy against thermal and battery impact.',
    ],
  },
  {
    index: 3,
    slug: 'step-3',
    navLabel: 'Step 3',
    title: 'Step 3: Head pose and motion quality',
    disclosure: {
      mechanism:
        'The facial transformation matrix produced alongside the landmarks is decomposed into head rotation (yaw, pitch, roll) and an approximate translation. Rotational speed and a pose-quality proxy then label each sample low / moderate / uncertain, so head-motion-contaminated intervals can be excluded downstream rather than mistaken for eye movement.',
      maths:
        'For a rotation R = Rz·Ry·Rx: pitch = atan2(r₂₁, r₂₂), yaw = atan2(−r₂₀, √(r₀₀² + r₁₀²)), roll = atan2(r₁₀, r₀₀) (a Tait–Bryan/Euler decomposition; atan2 keeps it numerically stable across the full ±180° range, but the decomposition itself still degenerates at the gimbal-lock singularity near ±90° of the middle axis, where yaw and roll are no longer separable — in practice the face is lost before that pose is reached). Monocular translation — especially depth — is unscaled and approximate.',
    },
    intro:
      'A phone camera cannot tell the difference between your eyes moving and your head — or the phone — moving: both shift where the iris appears in the frame. Step 3 estimates head rotation and approximate position from the face geometry, labels every sample with how much head motion is present, and flags intervals too contaminated to use. Without it, head and phone motion would be silently misread as large, rapid gaze shifts. Head pose here serves quality labelling, exclusion, and the optional Step 4 compensation — from one camera it is not a metric 3-D measurement, and the translation (especially depth) is approximate.',
    methods: [
      'Head rotation estimation (yaw, pitch, roll): fit a 3-D pose to the 2-D landmarks — via a PnP-style solve, Procrustes normalisation, or the landmark model\'s own pose output — for the head\'s orientation relative to the camera.',
      'Head translation estimation: the same fit yields an approximate head position (tx, ty, tz) — a coarse measure of distance and lateral shift.',
      'Head-motion quality labelling: from the rate of pose change, label each sample low, moderate, or uncertain — how much head motion may be contaminating the eye signal.',
      'Rejection of uncertain intervals: samples with too much movement are marked uncertain_head_motion and excluded by event detection rather than trusted.',
      'Note on phone IMU: browsers expose little inertial-sensor access, so camera-derived head pose is the primary motion signal in a browser-local implementation.',
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
      'The pose comes from the landmark model\'s facial transformation matrix — chosen because it adds no extra model or inference pass; that convenience trades away some accuracy compared with a dedicated solver.',
      'Rapid head turns can exceed the reliable range of the landmark model, making both the landmark detections and the derived pose unreliable for those frames.',
    ],
  },
  {
    index: 4,
    slug: 'step-4',
    navLabel: 'Step 4',
    title: 'Step 4: Eye-local and gaze signals',
    coordinateFigure: true,
    disclosure: {
      mechanism:
        'The iris-centre proxy is normalised within each eye\'s corner-anchored frame — origin midway between the two eye corners, x along the corner-to-corner axis, y perpendicular to it — to give the eye-local signal: calibration-light and available whenever eye and iris detection succeed with sufficient quality, but not screen gaze. Because the eye corners do not move when the eyelids do, the frame is invariant to face scale, head roll, and eyelid aperture (an eyelid-based box would shrink during squints and contaminate the vertical signal). A separate, calibrated regression (or an opt-in model) maps the eye-local feature vector to a screen-gaze estimate; the two signal kinds are kept in distinct fields and never conflated.',
      maths:
        'With corner midpoint m, unit corner-to-corner axis û, and half corner distance h: eye-local x = (iris − m)·û / h and y = (iris − m)·û⊥ / (0.5·h) — both roughly in [−1, 1], computed in an isotropic (pixel-true) space so head roll does not leak between the axes. Screen gaze = C · [1, cₓ, c_y, lₓ, l_y, rₓ, r_y, yaw′, pitch′, roll′]ᵀ, where the feature vector holds the combined and per-eye eye-local coordinates plus the head-pose angles scaled by 1/30°, and C is the fitted coefficient matrix (Step 5). The head-pose terms let the fitted mapping compensate linearly for head movement, since turning the head shifts the eye-local signal exactly like a gaze shift would.',
    },
    intro:
      'Step 4 produces the main signal — and the central design rule of PocketGaze is that two quite different signals must never be confused. The eye-local signal measures where the iris proxy sits within the eye: it reflects eye rotation relative to the head, needs no calibration, and is always available — but it is not where you are looking on the screen. A screen-gaze estimate goes further, mapping the eye-local signal through a calibrated mapping or trained model to an on-screen x/y. Screen gaze needs calibration and validation before it means anything; without them it is too coarse for spatial interpretation.',
    methods: [
      'Eye-local signal estimation: normalise the iris-centre proxy within each eye\'s corner-anchored frame for a calibration-light left/right/combined coordinate — the baseline signal, but not screen gaze.',
      'Screen-gaze estimation via regression mapping: after calibration (Step 5), apply the fitted mapping from eye-local features to screen positions on every new frame.',
      'Model-based screen-gaze inference: alternatively, a pre-trained gaze model (here WebEyeTrack, opt-in) takes the camera frame and outputs screen coordinates directly.',
      'Signal availability and confidence: every sample records whether a screen-gaze estimate exists and how confident it is; the eye-local signal remains available even when screen gaze is not.',
      'Content-mapped estimation: aligning screen gaze with scrolling or changing content is Step 7\'s job, not this step\'s.',
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
      'Model-based gaze inference (the opt-in WebEyeTrack provider) adds a heavier runtime and fetches its models from a third-party CDN when selected; the default regression provider stays fully self-hosted.',
      'Gaze estimation accuracy on a smartphone camera is inherently modest: spatial resolution is limited, and estimates degrade with head movement, variable lighting, and distance changes.',
    ],
  },
  {
    index: 5,
    slug: 'step-5',
    navLabel: 'Step 5',
    title: 'Step 5: Calibration and personalisation',
    coordinateFigure: true,
    disclosure: {
      mechanism:
        'A follow-the-dots task collects (feature → known screen target) pairs — the eye-local coordinates plus the scaled head-pose angles — skipping frames where the eyes are closed or tracking quality is low, and trimming per-target outliers (a glance away, a missed blink) before fitting. A ridge-regularised linear least-squares fit then maps features to screen coordinates; fit quality is estimated by leave-targets-out cross-validation, and a separate validation task on held-out targets measures on-screen accuracy and precision distinctly from the fit.',
      maths:
        'Per axis, solve the ridge-regularised normal equations (AᵀA + λI)·c = Aᵀ·t for the coefficients c. The design matrix is rank-deficient — the combined-eye feature columns are exact averages of the per-eye columns — so the ridge term λI is required for a well-posed solve. Calibration RMS = √(mean residual²), cross-validated by holding out whole targets (per-sample folds would leak: the remaining samples of the same dot stay in the training set, so the model is only asked about dots it has effectively memorised). Validation reports accuracy (mean target–estimate offset), precision (sample-to-sample RMS, “RMS-S2S”), and BCEA — the bivariate contour ellipse area.',
    },
    intro:
      'No generic model knows how you hold your phone, how far away you sit, or the geometry of your particular eyes — so uncalibrated screen-gaze estimates are too coarse for spatial analysis. Step 5 collects samples while you look at dots at known screen positions and fits a user-specific mapping from them. A held-out validation pass then measures how well that mapping actually generalises.',
    methods: [
      'Follow-the-dots calibration: a dot visits known screen positions while the concurrent eye features are recorded — the (feature, target) pairs that the fit needs.',
      'Tap/click calibration: an alternative that captures a sample at the moment the user taps a target.',
      'Regression mapping: fit from the collected features — the eye-local coordinates plus scaled head-pose angles, so the fit can compensate head movement — to the target positions. This site uses a regularised linear (affine) least-squares fit; richer polynomial or learned mappings exist but are not used here.',
      'Model personalisation: a pre-trained gaze model can instead be fine-tuned on the calibration samples.',
      'Calibration-quality checks: report a held-out error and a consistency measure after fitting, so the user can judge whether the calibration is good enough to use.',
    ],
    implementationOnThisPage:
      'The live demo for this step is a follow-the-dots task at known screen positions, followed by a fitted mapping and a held-out validation error readout.',
    outputs: [
      'A user-specific mapping model that translates eye-local features into personalised screen-gaze coordinates.',
      'Calibration rows in the export, recording each dot position and the corresponding eye-local features.',
      'calibration_target events marking each displayed target; target_x, target_y, and target_id fields per calibration sample.',
    ],
    limitations: [
      'Calibration quality depends heavily on user compliance: blink and low-quality frames are skipped at capture and per-target outliers are trimmed before fitting, but inattentive or wandering fixations during the dots still degrade the fitted mapping.',
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
        'One Euro cutoff f_c = f_cmin + β·|ẋ|, with the smoothing factor α = 1 / (1 + (f_s / 2π f_c)). A segment is saccade-like when its inter-sample speed ≥ the threshold (units/s); a fixation candidate is a low-speed run whose dispersion ≤ the limit for at least the minimum duration. A fast spike that returns to (almost) where it started — first-to-last displacement below the minimum saccade amplitude — is treated as landmark noise and folded back into the surrounding fixation, since real saccades land somewhere new. All labels are candidates, not validated detections.',
    },
    intro:
      'Eye signals from a phone camera are noisy: landmark jitter, frame-to-frame iris variability, and blinks all obscure the movement underneath. Step 6 filters the noise while preserving genuine rapid movements, suppresses blinks and low-quality samples, and detects candidate events in the cleaned trace. The raw signal is always kept alongside the filtered one, so the data stays reanalysable — and every event is labelled cautiously as a candidate, because without a ground-truth reference stronger labels would overclaim.',
    methods: [
      'Raw signal preservation: unfiltered coordinates keep their own columns next to the filtered ones, so analysis can choose either.',
      'Adaptive filtering (One Euro): a low-pass filter whose cut-off rises with signal speed — strong smoothing at rest, light smoothing during fast movement. Its parameters are recorded in the export.',
      'Blink suppression: the Step 2 eyelid-openness values mark blink intervals so their artefacts are never labelled as saccades.',
      'Quality-thresholding: samples below the quality thresholds become tracking_lost rather than being silently trusted.',
      'Velocity and displacement event detection: thresholds on the filtered signal pick out low-velocity runs (fixation candidates) and rapid transitions (saccade candidates), each scored with a confidence.',
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
    coordinateFigure: true,
    disclosure: {
      mechanism:
        'Screen-gaze coordinates are converted into content-relative coordinates using the content element’s bounding rectangle, accounting for page and element scroll and any CSS transform, so a fixed point keeps a constant content coordinate as the page moves. Fixations in content space are then aggregated per area of interest.',
      maths:
        'Content coordinate = (screen − rect.origin) / rect.size, with internal-scroll and transform corrections applied. Per AOI: dwell = Σ fixation durations inside it; fixation count = number assigned; time-to-first-fixation = the earliest in-AOI fixation onset relative to task start.',
    },
    intro:
      'A screen coordinate alone cannot say what someone was looking at: once content scrolls, zooms, or changes layout, the same screen x/y means different content at different times. Step 7 aligns the gaze signal with the content actually on screen by logging the position, size, and identity of elements alongside the tracking data. The result is a content-relative coordinate that survives layout changes — letting you ask not just "where on the screen?" but "which part of the content?".',
    methods: [
      'Stimulus and task logging: every stimulus event (a dot appearing, content entering view) is recorded with its identity, position, and timestamp, aligning the tracking stream with the task timeline.',
      'Viewport and screen geometry logging: viewport size, device pixel ratio, and orientation are logged at the start and on every change — the reference frame for all gaze coordinates.',
      'Layout and element-position logging: getBoundingClientRect records where content elements sit on screen, so screen-gaze coordinates can be converted into content-relative ones.',
      'Scroll, zoom, and transform logging: scroll positions, zoom, and CSS transforms are logged (scroll events, ResizeObserver) so coordinate conversions can be applied retroactively.',
      'Note on cloud-only alignment: aligning with server-rendered content needs backend timestamps and a shared clock — out of scope for this browser-local implementation.',
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
