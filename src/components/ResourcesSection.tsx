// References and resources (077). A concise, themed set of POINTERS — not a review —
// explaining how webcam/smartphone methods differ from laboratory infrared pupil and
// corneal-reflection systems. Entries name well-established methods and systems as
// search pointers rather than asserting unsourced empirical figures.

interface Theme {
  heading: string;
  body: string;
  pointers: string[];
}

const THEMES: Theme[] = [
  {
    heading: 'Video-based eye tracking',
    body:
      'Tracking the eye from ordinary camera frames, without specialised illumination. Cheap and ubiquitous, but bound by the camera’s resolution and frame rate.',
    pointers: [
      'Webcam eye tracking in the browser (e.g. the WebGazer project)',
      'WebEyeTrack (2025) — the model-based provider offered on Step 4',
      'EyeTrax — landmark-based webcam gaze with corner-anchored features and ridge regression, the same family of approach as this site’s provider A',
    ],
  },
  {
    heading: 'Infrared pupil / corneal-reflection tracking',
    body:
      'Research-grade systems shine infrared light and track the pupil relative to the corneal reflection (the glint). The pupil–CR vector largely cancels head motion, giving high accuracy and very high sampling rates — the opposite trade-off to a selfie camera.',
    pointers: ['Research systems such as EyeLink (SR Research) and Tobii Pro'],
  },
  {
    heading: 'Appearance-based gaze estimation',
    body:
      'Learning gaze direction directly from the appearance of the eye/face region, rather than from explicit geometry. This is how camera-only gaze estimation reaches usable accuracy without a glint.',
    pointers: [
      'Appearance-based gaze estimation; smartphone-camera gaze research',
      'The MPIIGaze and GazeCapture datasets and the data-normalisation convention (fixed virtual camera, roll cancelled)',
    ],
  },
  {
    heading: 'Calibration and validation',
    body:
      'Calibration fits a user-specific mapping; validation measures error on held-out targets. They answer different questions — fit consistency versus on-screen accuracy — and must be reported separately.',
    pointers: [
      'Held-out validation; accuracy vs precision reporting conventions',
      'Normalised iris-centre–eye-corner vectors (corner-anchored features); head-pose terms in calibration regressions',
    ],
  },
  {
    heading: 'Accuracy, precision, and visual angle',
    body:
      'Accuracy is mean offset from target; precision is sample-to-sample stability (RMS-S2S) and dispersion (BCEA); both are conventionally expressed in degrees of visual angle, which depends on viewing distance.',
    pointers: ['RMS-S2S precision; BCEA (bivariate contour ellipse area); degrees of visual angle'],
  },
  {
    heading: 'Filtering and event detection',
    body:
      'Filtering trades latency against jitter; event detection segments the trace into fixations and saccades. This site combines a velocity threshold (I-VT) and a dispersion threshold (I-DT).',
    pointers: [
      'The One Euro filter (Casiez, Roussel & Vogel, 2012)',
      'The I-VT / I-DT event-detection taxonomy (Salvucci & Goldberg, 2000)',
      'Eye-aspect-ratio blink detection (Soukupová & Čech, 2016) and dual-threshold (hysteresis) variants',
    ],
  },
  {
    heading: 'Privacy and gaze data',
    body:
      'Gaze data reveals attention, reading, strategy, and fatigue, so it is sensitive personal data. On-device processing and informed consent are the relevant safeguards.',
    pointers: ['On-device / privacy-by-design processing; informed consent for gaze data'],
  },
];

export default function ResourcesSection() {
  return (
    <section className="step-section" aria-label="References and resources">
      <h2>References and resources</h2>
      <p>
        Pointers for going deeper, grouped by theme — not a literature review. They are signposts to
        the methods and systems named, to contrast browser/smartphone tracking with laboratory
        infrared systems across illumination, optics, sampling rate, geometry, and validation.
      </p>
      <dl className="resources">
        {THEMES.map((t) => (
          <div className="resources__item" key={t.heading}>
            <dt className="resources__heading">{t.heading}</dt>
            <dd className="resources__body">
              {t.body}
              <ul className="resources__pointers">
                {t.pointers.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </dd>
          </div>
        ))}
      </dl>
      <p className="limitation-panel__caption">
        Where a specific figure would be needed (for example, a device’s accuracy in degrees), this
        site states it qualitatively rather than quote an unsourced number — see the method
        comparison above.
      </p>
    </section>
  );
}
