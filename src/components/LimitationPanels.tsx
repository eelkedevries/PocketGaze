// Honesty / limitation panels (specification §3.1, §3.3, §6.3, §6.4, §7.1).
//
// Static explanatory content stating plainly what smartphone-camera eye tracking
// CANNOT do. For an expert audience these limits are stronger credibility signals
// than another feature. No tracking maths, no fake detectors — just accurate,
// cautiously-worded explanation and one illustrative figure.

// A logistic "saccade" position-vs-time curve, sampled finely vs coarsely. The
// coarse (~30 Hz) sampling misses the steep middle, so peak velocity and the
// saccade's dynamics are unrecoverable (a Nyquist-style point).
function CoarseVsFineFigure() {
  const W = 150;
  const H = 90;
  const pad = 10;
  const curveY = (x: number) => {
    // x in [0,1] -> logistic step in the middle.
    const k = 14;
    const s = 1 / (1 + Math.exp(-k * (x - 0.5)));
    return pad + (1 - s) * (H - 2 * pad);
  };
  const curveX = (x: number) => pad + x * (W - 2 * pad);
  const path = Array.from({ length: 60 }, (_, i) => {
    const x = i / 59;
    return `${i === 0 ? 'M' : 'L'} ${curveX(x).toFixed(1)} ${curveY(x).toFixed(1)}`;
  }).join(' ');
  const fine = Array.from({ length: 13 }, (_, i) => i / 12);
  const coarse = [0, 0.5, 1];

  const Panel = ({ samples, label, x0 }: { samples: number[]; label: string; x0: number }) => (
    <g transform={`translate(${x0}, 0)`}>
      <rect x={0} y={0} width={W} height={H} fill="#111827" rx={4} />
      <path d={path} fill="none" stroke="rgba(155,172,196,0.5)" strokeWidth={1} />
      {/* Reconstruction from the samples (straight lines between sampled points). */}
      <path
        d={samples
          .map((x, i) => `${i === 0 ? 'M' : 'L'} ${curveX(x).toFixed(1)} ${curveY(x).toFixed(1)}`)
          .join(' ')}
        fill="none"
        stroke="#4c9aff"
        strokeWidth={1.5}
      />
      {samples.map((x, i) => (
        <circle key={i} cx={curveX(x)} cy={curveY(x)} r={2.5} fill="#5be39b" />
      ))}
      <text x={6} y={H - 6} fontSize="9" fill="#9babc4">
        {label}
      </text>
    </g>
  );

  return (
    <svg
      className="limitation-figure"
      viewBox={`0 0 ${W * 2 + 12} ${H}`}
      width={W * 2 + 12}
      height={H}
      role="img"
      aria-label="A saccade sampled finely reconstructs its trajectory; sampled coarsely at ~30 Hz it is reduced to a straight line that misses peak velocity."
    >
      <Panel samples={fine} label="Fine sampling" x0={0} />
      <Panel samples={coarse} label="Coarse (~30 Hz)" x0={W + 12} />
    </svg>
  );
}

/** Step 1: what a ~30 Hz sampling rate can and cannot resolve. */
export function SamplingRatePanel() {
  return (
    <section className="limitation-panel" aria-label="Sampling-rate limitations">
      <h3 className="limitation-panel__title">What ~30 Hz can and cannot resolve</h3>
      <p>
        The effective rate above is typically around <strong>30 frames per second</strong>. That is
        enough to locate <strong>fixations</strong> and to see <strong>large saccades</strong>{' '}
        happen — but not to measure how they happen. Peak saccadic velocity, the{' '}
        <em>main sequence</em> (the velocity–amplitude relationship), and fine saccade dynamics
        unfold in tens of milliseconds, so at this rate they are <strong>under-sampled</strong> and
        cannot be recovered. <strong>Microsaccades</strong> are out of reach entirely.
      </p>
      <CoarseVsFineFigure />
      <p className="limitation-panel__caption">
        The same saccade sampled finely (left) keeps its trajectory; sampled coarsely at ~30 Hz
        (right) it collapses to a straight line that misses the peak velocity — a sampling
        (Nyquist) limit, not something a better algorithm can fix in-browser (§3.1, §6.3).
      </p>
    </section>
  );
}

/** Step 3: no corneal reflection, so head motion contaminates gaze directly. */
export function NoCornealReflectionPanel() {
  return (
    <section className="limitation-panel" aria-label="No corneal reflection">
      <h3 className="limitation-panel__title">Why your phone drifts when you move</h3>
      <p>
        Research-grade <strong>video-oculography</strong> shines infrared light at the eye and
        tracks the <strong>pupil relative to the corneal reflection</strong> (the glint). Because
        the glint and the pupil move together when the head moves but differently when the eye
        rotates, that pupil–CR vector largely <strong>cancels head motion</strong> — the tracker
        stays accurate as you shift.
      </p>
      <p>
        An ordinary RGB selfie camera has <strong>no corneal reflection</strong> to reference. It
        sees only the iris/pupil position in the image, so <strong>head and phone motion
        contaminate the gaze signal directly</strong> (§6.4). That is the deep reason this step
        estimates head pose and flags head-motion intervals at all — and why an uncalibrated phone
        estimate <strong>drifts when you move</strong> where a research tracker does not.
      </p>
    </section>
  );
}

/** Limitations/about: microsaccades and pupillometry are out of reach; no fake detector. */
export function OutOfReachPanel() {
  return (
    <section className="step-section" aria-label="Out of reach">
      <h2>What is out of reach (and not faked)</h2>
      <p>
        Some measurements common in eye-tracking research are simply not possible with a browser and
        a selfie camera, and this project does <strong>not</strong> provide a fake detector that
        pretends otherwise:
      </p>
      <ul>
        <li>
          <strong>Microsaccades</strong> — these are sub-degree movements, below both the spatial
          resolution of an iris-in-image estimate and the temporal resolution of a ~30 Hz camera.
          Claiming to detect them here would be dishonest.
        </li>
        <li>
          <strong>Pupillometry</strong> — pupil diameter is confounded by visible-light changes and
          partial iris occlusion without infrared illumination and a controlled light environment,
          so a meaningful pupil-size signal cannot be recovered from an RGB webcam.
        </li>
      </ul>
      <p>
        Stating these limits plainly is the point: honest boundaries matter more than another
        impressive-looking but unreliable read-out (§6.3).
      </p>
    </section>
  );
}
