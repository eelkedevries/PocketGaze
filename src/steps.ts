// Step definitions for the PocketGaze seven-step pipeline explainer.
//
// This is scaffold content only: short, placeholder-level descriptions that
// establish the navigation and the repeated page structure. The binding
// project decisions and final copy will be set by a later prompt, once
// docs-dev/reference/primary_authoritative/specification.md exists.

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
}

export const steps: StepDefinition[] = [
  {
    index: 0,
    slug: 'step-0',
    navLabel: 'Step 0',
    title: 'Step 0: Overview',
    intro:
      'PocketGaze is a portfolio project that explains how smartphone-camera eye tracking can be implemented in practice. It walks through a seven-step pipeline, pairing each step with a live demo and optional implementation panels. This page is a placeholder scaffold; no real tracking exists yet.',
    methods: [
      'Treat smartphone eye tracking as a pipeline, not a single model.',
      'Prefer browser-local processing as the first route.',
      'Keep eye-local signals, screen-gaze estimates, and content-mapped coordinates clearly separate.',
    ],
    implementationOnThisPage:
      'This page introduces the pipeline and the site structure. Each later step reuses the same layout.',
    outputs: ['A shared mental model of the seven steps and how they connect.'],
    limitations: [
      'Scaffold only — pages contain simple placeholders.',
      'No camera access, tracking, or data export is implemented yet.',
    ],
  },
  {
    index: 1,
    slug: 'step-1',
    navLabel: 'Step 1',
    title: 'Step 1: Capture and timing',
    intro:
      'Acquire frames from the front-facing camera and attach timing information accurate enough for sample-level analysis.',
    methods: [
      'Frame-by-frame processing of available camera frames.',
      'Frame-linked browser callbacks where supported.',
      'Dropped/repeated-frame checks and separate timing fields.',
    ],
    implementationOnThisPage:
      'Placeholder for a future capture-and-timing demo. No camera is accessed in this scaffold.',
    outputs: ['Timestamped camera frames (placeholder).'],
    limitations: ['Effective frame rate varies across devices and lighting conditions.'],
  },
  {
    index: 2,
    slug: 'step-2',
    navLabel: 'Step 2',
    title: 'Step 2: Face and eye features',
    intro:
      'Detect the face, eyes, eyelids, iris or pupil proxy, and the landmarks needed for later steps.',
    methods: [
      'Face landmark detection.',
      'Eye-region and iris/pupil-proxy extraction.',
      'Eyelid-openness and per-eye quality estimation.',
    ],
    implementationOnThisPage:
      'Placeholder for a future feature-overlay demo. No landmark detection runs in this scaffold.',
    outputs: ['Face, eye, eyelid, and iris/pupil-proxy features (placeholder).'],
    limitations: ['Landmark quality can degrade with occlusion, glasses, lighting, and extreme pose.'],
  },
  {
    index: 3,
    slug: 'step-3',
    navLabel: 'Step 3',
    title: 'Step 3: Head and phone motion',
    intro:
      'Estimate whether apparent eye movement is caused by real eye movement, head movement, phone movement, or changing face-camera geometry.',
    methods: [
      'Head rotation and translation estimation.',
      'Phone-motion logging where available.',
      'Head-motion quality labelling and rejection of uncertain intervals.',
    ],
    implementationOnThisPage:
      'Placeholder for a future head-pose and motion-quality demo.',
    outputs: ['Head pose and motion-quality labels (placeholder).'],
    limitations: ['Head or phone movement can be misclassified as eye movement without proper handling.'],
  },
  {
    index: 4,
    slug: 'step-4',
    navLabel: 'Step 4',
    title: 'Step 4: Eye-local and gaze signals',
    intro:
      'Estimate the main signal of interest: an eye-local signal, a screen-gaze signal, or both. Eye-local movement is not the same as screen gaze.',
    methods: [
      'Eye-local signal estimation from the iris/pupil proxy.',
      'Optional screen-gaze estimation via a calibrated mapping or model.',
      'Content-mapped estimation for dynamic content.',
    ],
    implementationOnThisPage:
      'Placeholder for a future signal-estimation demo. The eye-local and screen-gaze distinction will be made visually central later.',
    outputs: ['Eye-local signal, screen-gaze signal, or both (placeholder).'],
    limitations: ['Eye-local movement should not be presented as precise screen gaze without a validated mapping.'],
  },
  {
    index: 5,
    slug: 'step-5',
    navLabel: 'Step 5',
    title: 'Step 5: Calibration and personalisation',
    intro:
      'Adapt the signal or gaze mapping to the individual user, phone, camera position, screen geometry, and holding posture.',
    methods: [
      'Follow-the-dots calibration.',
      'Tap/click calibration.',
      'Regression mapping, model personalisation, and calibration-quality checks.',
    ],
    implementationOnThisPage:
      'Placeholder for a future follow-the-dots calibration demo.',
    outputs: ['A user-specific mapping model (placeholder).'],
    limitations: ['Calibration quality depends on user compliance and stable posture.'],
  },
  {
    index: 6,
    slug: 'step-6',
    navLabel: 'Step 6',
    title: 'Step 6: Filtering and events',
    intro:
      'Reduce noise, mark invalid samples, and convert the time series into interpretable event candidates.',
    methods: [
      'Raw derived-signal preservation alongside adaptive filtering.',
      'Blink suppression and quality-thresholding.',
      'Velocity/displacement event detection with confidence scoring.',
    ],
    implementationOnThisPage:
      'Placeholder for a future raw-versus-filtered trace demo with cautiously labelled candidate events.',
    outputs: ['Filtered traces and candidate event labels (placeholder).'],
    limitations: ['Excessive smoothing adds lag; insufficient filtering produces false events.'],
  },
  {
    index: 7,
    slug: 'step-7',
    navLabel: 'Step 7',
    title: 'Step 7: Content and stimulus mapping',
    intro:
      'Align eye-local or gaze signals with the actual screen content, dot task, stimulus, or user-interface state.',
    methods: [
      'Stimulus, viewport, and layout logging.',
      'Scroll/zoom/transform logging.',
      'Alignment of tracking data with task logs.',
    ],
    implementationOnThisPage:
      'Placeholder for a future demo contrasting screen coordinates with content-relative coordinates.',
    outputs: ['Screen- or content-relative task data (placeholder).'],
    limitations: ['Screen coordinates can mislead when content scrolls, zooms, moves, or changes layout.'],
  },
];

export function getStepBySlug(slug: string): StepDefinition | undefined {
  return steps.find((step) => step.slug === slug);
}
