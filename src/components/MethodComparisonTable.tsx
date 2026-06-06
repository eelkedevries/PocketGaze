// Method-comparison table (specification §1.1, §6.3, §7.1).
//
// Situates this browser pipeline against research-grade video-oculography and a
// commercial webcam tool across the dimensions practitioners care about. The
// contrast is QUALITATIVE — orders of magnitude and direction, not benchmarked
// figures. Precise per-device accuracy/precision numbers would each need their own
// source and would still come from different datasets and conditions, so they are
// NOT directly comparable (§6.3); the table is for orientation, not a benchmark.

interface Row {
  dimension: string;
  browser: string;
  research: string;
  webcam: string;
}

const ROWS: Row[] = [
  {
    dimension: 'Accuracy',
    browser: 'Not measured here — qualitatively several degrees, uncalibrated',
    research: 'Well under one degree',
    webcam: 'Around one to a few degrees, in good conditions',
  },
  {
    dimension: 'Precision (RMS-S2S)',
    browser: 'Reported in normalised units; degrees only as a caveated estimate',
    research: 'A small fraction of a degree',
    webcam: 'Roughly half a degree to a couple of degrees',
  },
  {
    dimension: 'Sampling rate',
    browser: '≈ camera rate — tens of Hz (throughput-bound)',
    research: 'Much higher — hundreds to thousands of Hz',
    webcam: '≈ camera rate — tens of Hz',
  },
  {
    dimension: 'Calibration burden',
    browser: 'Light — follow-the-dots, no fixed head',
    research: 'Moderate — multi-point, often a chin-rest',
    webcam: 'Light — a few points, no fixed head',
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
        Eyedid/SeeSo). The comparison is qualitative — direction and order of magnitude, for
        orientation only.
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
        This is a <strong>qualitative</strong> contrast, not a like-for-like benchmark: any precise
        per-device figure would come from a different study, device, and conditions, so they are{' '}
        <strong>not directly comparable</strong> (§6.3). No accuracy figure has been measured for
        this site, and to avoid implying false precision the cells state direction and order of
        magnitude rather than unsourced exact numbers.
      </p>
    </section>
  );
}
