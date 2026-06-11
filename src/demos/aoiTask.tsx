import { useMemo } from 'react';
import { useImplementationDetails } from '../context/ImplementationDetailsContext';
import { type Aoi } from '../lib/aoiMetrics';
import { useAoiVisits } from './useAoiVisits';
import ScanpathHeatmap from './scanpathHeatmap';

// AOI dwell-analysis demo (specification §3.7, §6.2, §6.3, §2.5/§2.6).
//
// The applied output of content-mapped gaze: per-AOI dwell time, fixation count,
// and time-to-first-fixation over a small reading/viewing task. Consistent with
// Step 7, the pointer stands in for gaze (real screen gaze needs calibration,
// §6.2). Visit accumulation and scoring are shared with the other Step 7 tasks
// via `useAoiVisits` (which wraps the `045` metrics) — no AOI maths lives here.
// The figures are qualitative over a coarse stand-in signal, never validated
// attention (§6.3).

// AOIs in content-relative coordinates (0–1 within the task panel).
const AOIS: Aoi[] = [
  { id: 'Headline', x: 0.04, y: 0.04, width: 0.92, height: 0.16 },
  { id: 'Image', x: 0.04, y: 0.24, width: 0.44, height: 0.42 },
  { id: 'Body text', x: 0.52, y: 0.24, width: 0.44, height: 0.62 },
  { id: 'Caption', x: 0.04, y: 0.7, width: 0.44, height: 0.16 },
];

export default function AoiTask() {
  const { showDetails } = useImplementationDetails();
  const aois = useMemo(() => AOIS, []);
  const { panelRef, fixations, currentAoiId, metrics, onPointerMove, onPointerLeave, reset } =
    useAoiVisits(aois);

  // Reuse the existing scanpath/heatmap component over the same pointer-driven
  // fixations (076d): content-space, clearly labelled as a pointer stand-in.
  const heatmapFixations = useMemo(
    () => fixations.map((f) => ({ x: f.content_x, y: f.content_y, durationMs: f.durationMs })),
    [fixations],
  );

  return (
    <div className="aoi">
      <p className="timing-demo__note">
        Move the pointer over the panel (it stands in for gaze — real screen gaze needs
        calibration). Dwell, fixation count, and time-to-first-fixation per area of interest are the
        applied output of content-mapped gaze. Figures are qualitative over this stand-in (§6.3).
      </p>

      <div className="aoi__controls">
        <button type="button" className="button" onClick={reset}>
          Reset
        </button>
        <span className="demo-input-mode demo-input-mode--pointer">
          Input mode: pointer (simulated gaze)
        </span>
        <span className="calibration__progress" aria-live="polite">
          {currentAoiId
            ? `Looking at: ${currentAoiId} (dwell ${Math.round(
                metrics.perAoi.find((r) => r.id === currentAoiId)?.dwellMs ?? 0,
              )} ms)`
            : 'Hover an area of interest.'}
        </span>
      </div>

      <div
        className="aoi__panel"
        ref={panelRef}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
      >
        {AOIS.map((a) => (
          <div
            key={a.id}
            className={`aoi__box${currentAoiId === a.id ? ' aoi__box--active' : ''}`}
            style={{
              left: `${a.x * 100}%`,
              top: `${a.y * 100}%`,
              width: `${a.width * 100}%`,
              height: `${a.height * 100}%`,
            }}
          >
            <span className="aoi__label">{a.id}</span>
          </div>
        ))}
      </div>

      <div className="panel__table-wrap">
        <table className="panel__table" aria-label="Per-AOI dwell, fixation count, and TTFF">
          <thead>
            <tr>
              <th scope="col">AOI</th>
              <th scope="col">dwell (ms)</th>
              <th scope="col">fixations</th>
              <th scope="col">TTFF (ms)</th>
            </tr>
          </thead>
          <tbody>
            {metrics.perAoi.map((r) => (
              <tr key={r.id} className={currentAoiId === r.id ? 'aoi__row--active' : undefined}>
                <td>{r.id}</td>
                <td>{Math.round(r.dwellMs)}</td>
                <td>{r.fixationCount}</td>
                <td>{r.ttffMs == null ? '—' : Math.round(r.ttffMs)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showDetails && (
        <div className="panels">
          <section className="panel">
            <h3 className="panel__title">AOI rectangles (content coordinates)</h3>
            <div className="panel__table-wrap">
              <table className="panel__table">
                <thead>
                  <tr>
                    <th scope="col">AOI</th>
                    <th scope="col">x, y</th>
                    <th scope="col">w × h</th>
                  </tr>
                </thead>
                <tbody>
                  {AOIS.map((a) => (
                    <tr key={a.id}>
                      <td>{a.id}</td>
                      <td>
                        {a.x.toFixed(2)}, {a.y.toFixed(2)}
                      </td>
                      <td>
                        {a.width.toFixed(2)} × {a.height.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="panel__note">
              A fixation is assigned to the first AOI (in order) containing its content coordinate
              (`045`). {metrics.unassignedCount} fixation
              {metrics.unassignedCount === 1 ? '' : 's'} fell outside all AOIs.
            </p>
          </section>
          <section className="panel">
            <h3 className="panel__title">Raw fixation → AOI assignment</h3>
            {fixations.length === 0 ? (
              <p className="panel__note">No fixations yet — hover the panel.</p>
            ) : (
              <div className="panel__table-wrap">
                <table className="panel__table">
                  <thead>
                    <tr>
                      <th scope="col">#</th>
                      <th scope="col">content (x, y)</th>
                      <th scope="col">dwell (ms)</th>
                      <th scope="col">onset (ms)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fixations.slice(-10).map((f, i) => (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        <td>
                          {f.content_x.toFixed(2)}, {f.content_y.toFixed(2)}
                        </td>
                        <td>{Math.round(f.durationMs)}</td>
                        <td>{Math.round(f.onsetMs)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="panel__note">
              Dwell, fixation count, and TTFF are standard reading/UX measures — here over a coarse
              pointer stand-in, so read them as qualitative, not validated attention (§6.3).
            </p>
          </section>
        </div>
      )}

      <h4 className="content-demo__subheading">Scanpath and heatmap of this task</h4>
      <ScanpathHeatmap
        fixations={heatmapFixations}
        inputModeLabel="pointer (simulated gaze), content space"
        inputModeClass="demo-input-mode--pointer"
        spaceNote="This view is over a pointer stand-in in content space, not validated screen gaze"
      />
    </div>
  );
}
