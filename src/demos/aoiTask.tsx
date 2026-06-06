import { useCallback, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { useImplementationDetails } from '../context/ImplementationDetailsContext';
import { aoiMetrics, type Aoi, type AoiFixation } from '../lib/aoiMetrics';

// AOI dwell-analysis demo (specification §3.7, §6.2, §6.3, §2.5/§2.6).
//
// The applied output of content-mapped gaze: per-AOI dwell time, fixation count,
// and time-to-first-fixation over a small reading/viewing task. Consistent with
// Step 7, the pointer stands in for gaze (real screen gaze needs calibration,
// §6.2). Visits to each AOI are accumulated into content-space fixations and
// scored with the shared `045` metrics — no AOI maths lives here. The figures are
// qualitative over a coarse stand-in signal, never validated attention (§6.3).

// AOIs in content-relative coordinates (0–1 within the task panel).
const AOIS: Aoi[] = [
  { id: 'Headline', x: 0.04, y: 0.04, width: 0.92, height: 0.16 },
  { id: 'Image', x: 0.04, y: 0.24, width: 0.44, height: 0.42 },
  { id: 'Body text', x: 0.52, y: 0.24, width: 0.44, height: 0.62 },
  { id: 'Caption', x: 0.04, y: 0.7, width: 0.44, height: 0.16 },
];

interface OpenVisit {
  aoiId: string;
  entryMs: number;
  sumX: number;
  sumY: number;
  n: number;
  lastMs: number;
}

export default function AoiTask() {
  const { showDetails } = useImplementationDetails();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const taskStartRef = useRef<number | null>(null);
  const closedRef = useRef<AoiFixation[]>([]);
  const openRef = useRef<OpenVisit | null>(null);

  const [fixations, setFixations] = useState<AoiFixation[]>([]);
  const [currentAoiId, setCurrentAoiId] = useState<string | null>(null);

  const openToFixation = (v: OpenVisit, now: number): AoiFixation => ({
    content_x: v.sumX / v.n,
    content_y: v.sumY / v.n,
    durationMs: now - v.entryMs,
    onsetMs: v.entryMs - (taskStartRef.current ?? v.entryMs),
    content_mapping_available: true,
  });

  const flush = useCallback((now: number) => {
    const open = openRef.current;
    const list = [...closedRef.current];
    if (open) list.push(openToFixation(open, now));
    setFixations(list);
  }, []);

  const onPointerMove = useCallback(
    (e: ReactPointerEvent) => {
      const panel = panelRef.current;
      if (!panel) return;
      const now = performance.now();
      if (taskStartRef.current === null) taskStartRef.current = now;
      const rect = panel.getBoundingClientRect();
      const cx = (e.clientX - rect.left) / rect.width;
      const cy = (e.clientY - rect.top) / rect.height;
      const inside = cx >= 0 && cx <= 1 && cy >= 0 && cy <= 1;
      const aoi = inside ? AOIS.find((a) => cx >= a.x && cx <= a.x + a.width && cy >= a.y && cy <= a.y + a.height) : undefined;
      const aoiId = aoi?.id ?? null;

      const open = openRef.current;
      if (open && open.aoiId === aoiId && aoiId != null) {
        open.sumX += cx;
        open.sumY += cy;
        open.n += 1;
        open.lastMs = now;
      } else {
        if (open) closedRef.current.push(openToFixation(open, now));
        openRef.current =
          aoiId != null ? { aoiId, entryMs: now, sumX: cx, sumY: cy, n: 1, lastMs: now } : null;
      }
      setCurrentAoiId(aoiId);
      flush(now);
    },
    [flush],
  );

  const onPointerLeave = useCallback(() => {
    const now = performance.now();
    if (openRef.current) {
      closedRef.current.push(openToFixation(openRef.current, now));
      openRef.current = null;
    }
    setCurrentAoiId(null);
    setFixations([...closedRef.current]);
  }, []);

  const reset = useCallback(() => {
    closedRef.current = [];
    openRef.current = null;
    taskStartRef.current = null;
    setFixations([]);
    setCurrentAoiId(null);
  }, []);

  const metrics = useMemo(() => aoiMetrics(fixations, AOIS), [fixations]);

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
    </div>
  );
}
