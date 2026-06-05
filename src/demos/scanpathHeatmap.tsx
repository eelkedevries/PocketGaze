import { useMemo, useState } from 'react';
import { useImplementationDetails } from '../context/ImplementationDetailsContext';
import { scanpath, heatmap, type Fixation } from '../lib/fixationAggregation';

// Scanpath + heatmap visualisation (specification §3.6, §3.7, §6.3, §2.5/§2.6).
//
// Draws the two iconic gaze visualisations from accumulated fixation candidates:
// an ordered, dwell-sized SCANPATH and a toggleable HEATMAP. The aggregation
// maths is reused from `043`; this component only renders. The framing is the
// methodological point: over coarse, low-accuracy, low-sampling-rate webcam data
// these pictures are QUALITATIVE and easily over-read — never a validated
// attention map (§6.3). The fixation/parameter panels are gated by the single
// master control.

const STAGE = 260;
const HEATMAP_GRID = { width: 36, height: 36 };
const HEATMAP_SIGMA = 0.06;

/** Map a normalised [0,1] density to an rgba heat colour (blue → red). */
function heatColour(v: number): string {
  if (v <= 0) return 'rgba(0,0,0,0)';
  // Interpolate hue from blue (240) to red (0) and scale alpha by density.
  const hue = 240 * (1 - v);
  const alpha = 0.15 + 0.55 * v;
  return `hsla(${hue}, 80%, 55%, ${alpha})`;
}

export default function ScanpathHeatmap({ fixations }: { fixations: Fixation[] }) {
  const { showDetails } = useImplementationDetails();
  const [showHeatmap, setShowHeatmap] = useState(true);

  const sp = useMemo(() => scanpath(fixations), [fixations]);
  const hm = useMemo(
    () => heatmap(fixations, HEATMAP_GRID, HEATMAP_SIGMA, 'duration'),
    [fixations],
  );

  // Dwell -> node radius (px), clamped to a sensible range.
  const maxDwell = sp.nodes.reduce((m, n) => Math.max(m, n.durationMs), 1);
  const nodeRadius = (durationMs: number) => 5 + 13 * Math.sqrt(durationMs / maxDwell);

  return (
    <div className="scanpath" aria-label="Scanpath and heatmap visualisation">
      <div className="scanpath__controls">
        <button
          type="button"
          className="button"
          aria-pressed={showHeatmap}
          onClick={() => setShowHeatmap((s) => !s)}
        >
          {showHeatmap ? 'Hide heatmap' : 'Show heatmap'}
        </button>
        <span className="calibration__progress">
          {fixations.length === 0
            ? 'Fixate around the frame to build a scanpath.'
            : `${fixations.length} fixation${fixations.length === 1 ? '' : 's'} collected`}
        </span>
      </div>

      <svg
        className="scanpath__svg"
        viewBox={`0 0 ${STAGE} ${STAGE}`}
        width={STAGE}
        height={STAGE}
        role="img"
        aria-label="Scanpath nodes connected in order, with an optional heatmap overlay"
      >
        <rect x={0} y={0} width={STAGE} height={STAGE} fill="#111827" />

        {showHeatmap &&
          hm.values.map((v, i) => {
            if (v <= 0.02) return null;
            const col = i % hm.width;
            const row = Math.floor(i / hm.width);
            const cw = STAGE / hm.width;
            const ch = STAGE / hm.height;
            return (
              <rect
                key={i}
                x={col * cw}
                y={row * ch}
                width={cw + 0.5}
                height={ch + 0.5}
                fill={heatColour(v)}
              />
            );
          })}

        {sp.segments.map((seg, i) => (
          <line
            key={i}
            x1={seg.from.x * STAGE}
            y1={seg.from.y * STAGE}
            x2={seg.to.x * STAGE}
            y2={seg.to.y * STAGE}
            stroke="rgba(255,255,255,0.4)"
            strokeWidth={1.5}
          />
        ))}

        {sp.nodes.map((n) => (
          <g key={n.order}>
            <circle
              cx={n.x * STAGE}
              cy={n.y * STAGE}
              r={nodeRadius(n.durationMs)}
              fill="rgba(91,227,155,0.35)"
              stroke="#5be39b"
              strokeWidth={1.5}
            />
            <text
              x={n.x * STAGE}
              y={n.y * STAGE + 3}
              textAnchor="middle"
              fontSize="9"
              fill="#e5f9ef"
            >
              {n.order + 1}
            </text>
          </g>
        ))}
      </svg>

      <p className="timing-demo__note">
        <strong>Read with care.</strong> Scanpaths and heatmaps look authoritative, but over coarse,
        low-precision webcam data at a modest sampling rate they are <strong>qualitative</strong>{' '}
        sketches — easily over-interpreted as precise “attention”. This view is in eye-local space,
        not validated screen gaze (§6.3).
      </p>

      {showDetails && (
        <div className="panels">
          <section className="panel">
            <h3 className="panel__title">Fixations (order &amp; dwell)</h3>
            {sp.nodes.length === 0 ? (
              <p className="panel__note">No fixations collected yet.</p>
            ) : (
              <div className="panel__table-wrap">
                <table className="panel__table">
                  <thead>
                    <tr>
                      <th scope="col">#</th>
                      <th scope="col">x, y (0–1)</th>
                      <th scope="col">dwell (ms)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sp.nodes.map((n) => (
                      <tr key={n.order}>
                        <td>{n.order + 1}</td>
                        <td>
                          {n.x.toFixed(2)}, {n.y.toFixed(2)}
                        </td>
                        <td>{Math.round(n.durationMs)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="panel__note">
              Total dwell: <strong>{Math.round(sp.totalDwellMs)} ms</strong> across{' '}
              {sp.nodes.length} fixation{sp.nodes.length === 1 ? '' : 's'}.
            </p>
          </section>
          <section className="panel">
            <h3 className="panel__title">Heatmap parameters</h3>
            <ul className="panel__list">
              <li>
                Grid: <strong>{HEATMAP_GRID.width}×{HEATMAP_GRID.height}</strong> cells
              </li>
              <li>
                Gaussian sigma: <strong>{HEATMAP_SIGMA}</strong> (normalised units)
              </li>
              <li>
                Weighting: <strong>duration</strong> (longer dwells contribute more)
              </li>
              <li>
                Normalisation: each cell divided by the peak cell (0–1)
              </li>
            </ul>
            <p className="panel__note">
              The density is a Gaussian splat of fixations (`043`). Changing sigma trades locality
              for smoothness; none of it makes the underlying gaze more accurate (§6.3).
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
