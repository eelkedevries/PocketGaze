// Step definitions for the PocketGaze seven-step pipeline explainer.
//
// This is scaffold content only: short, placeholder-level descriptions that
// establish the navigation and the repeated page structure. The binding
// project decisions and final copy will be set by a later prompt, once
// docs-dev/reference/primary_authoritative/specification.md exists.

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
      'Processing is browser-local: when the demos are added, frames are analysed on your device, and raw video is never uploaded or stored by default.',
      'What can be exported later is derived data — signals, events, and task metadata — never the video itself.',
    ],
    outputs: [
      'A shared mental model of the seven steps and how they connect.',
      'A clear vocabulary: eye-local signal versus screen-gaze estimate versus content-mapped coordinate.',
    ],
    limitations: [
      'This is an early scaffold: the per-step live demos are still placeholders and are being added incrementally.',
      'No camera access, tracking, calibration, filtering, or data export is implemented yet, so nothing here is a working eye tracker.',
      'Smartphone-camera eye tracking is inherently approximate; when the demos arrive, accuracy will be modest and movement events will be labelled as candidates.',
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
