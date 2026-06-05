// Method-comparison table (specification §1.1, §6.3, §7.1).
//
// Situates this browser pipeline against research-grade video-oculography and a
// commercial webcam tool across the dimensions practitioners care about. Figures
// are RANGES with stated units, not point claims, and are drawn from the
// background tool assessment
// (docs-dev/reference/secondary_background/smartphone_eye_tracking_background.md
// §2, §4). Cross-tool numbers come from different datasets and conditions and are
// NOT directly comparable (§6.3); the table is for orientation, not a benchmark.

interface Row {
  dimension: string;
  browser: string;
  research: string;
  webcam: string;
}

const ROWS: Row[] = [
  {
    dimension: 'Accuracy (dva)',
    browser: 'Not measured here — qualitatively several degrees, uncalibrated',
    research: '~0.25–0.5°',
    webcam: '~1–2.5° (best case, good conditions)',
  },
  {
    dimension: 'Precision (dva, RMS-S2S)',
    browser: 'Reported in normalised units; degrees only as a caveated estimate',
    research: '~0.01–0.05°',
    webcam: '~0.5–1.5°',
  },
  {
    dimension: 'Sampling rate (Hz)',
    browser: '~15–30 Hz (camera/throughput-bound)',
    research: '~250–2000 Hz',
    webcam: '~30 Hz (webcam-bound)',
  },
  {
    dimension: 'Calibration burden',
    browser: 'Light — 9-point follow-the-dots, no fixed head',
    research: 'Moderate — multi-point, often a chin-rest',
    webcam: 'Light — ~5–9 point, no fixed head',
  },
  {
    dimension: 'Head-motion robustness',
    browser: 'Poor — no corneal reflection, drifts with head/phone motion',
    research: 'High — pupil–CR and/or head stabilisation',
    webcam: 'Moderate — model-based compensation, still motion-sensitive',
  },
];

export default function MethodComparisonTable() {
  return (
    <section className="step-section" aria-label="Method comparison">
      <h2>How this compares to other eye trackers</h2>
      <p>
        Where this browser pipeline sits relative to <strong>research-grade video-oculography</strong>{' '}
        (e.g. EyeLink, Tobii Pro) and a <strong>commercial webcam tool</strong> (e.g. RealEye,
        Eyedid/SeeSo). Figures are ranges with units, for orientation only.
      </p>
      <div className="panel__table-wrap">
        <table className="panel__table comparison-table">
          <thead>
            <tr>
              <th scope="col">Dimension</th>
              <th scope="col">This browser pipeline</th>
              <th scope="col">Research-grade VOG</th>
              <th scope="col">Commercial webcam tool</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.dimension}>
                <th scope="row">{r.dimension}</th>
                <td>{r.browser}</td>
                <td>{r.research}</td>
                <td>{r.webcam}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="limitation-panel__caption">
        These figures come from different studies, devices, and conditions, so they are{' '}
        <strong>not directly comparable</strong> — treat them as rough landscape orientation, not a
        like-for-like benchmark, and note that no accuracy figure has been measured for this site
        (§6.3). Context: the background tool assessment in the project's reference notes.
      </p>
    </section>
  );
}
