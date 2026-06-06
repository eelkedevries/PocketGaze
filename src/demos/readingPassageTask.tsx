// Reading-passage AOI demo (076b). A short passage whose lines are areas of
// interest; the pointer (a clearly-labelled stand-in for gaze) is mapped to the
// line being read, and per-line dwell / fixation count / time-to-first-fixation are
// scored with the shared aoiMetrics. Figures are qualitative over a coarse stand-in,
// never validated reading behaviour (§6.3).

import { useMemo } from 'react';
import type { Aoi } from '../lib/aoiMetrics';
import { useAoiVisits } from './useAoiVisits';

const LINES = [
  'Reading research uses eye movements to study how text is processed.',
  'Readers fixate most words briefly and skip many short, predictable ones.',
  'The eyes jump ahead in fast saccades, then occasionally regress to re-read.',
  'Longer dwell on a line can indicate difficulty, interest, or re-reading.',
  'A webcam at a low frame rate sees only a coarse version of all this.',
  'So treat these per-line figures as qualitative, not validated reading data.',
];

const LINE_H = 0.14;
const LINE_GAP = 0.015;
const TOP = 0.03;

const AOIS: Aoi[] = LINES.map((_, i) => ({
  id: `Line ${i + 1}`,
  x: 0.03,
  y: TOP + i * (LINE_H + LINE_GAP),
  width: 0.94,
  height: LINE_H,
}));

export default function ReadingPassageTask() {
  const aois = useMemo(() => AOIS, []);
  const { panelRef, currentAoiId, metrics, onPointerMove, onPointerLeave, reset } =
    useAoiVisits(aois);

  return (
    <div className="aoi">
      <p className="timing-demo__note">
        Read the passage line by line. The pointer stands in for gaze (real screen gaze needs
        calibration); each line is an area of interest, so dwell per line approximates where reading
        effort went — qualitatively (§6.3).
      </p>

      <div className="aoi__controls">
        <button type="button" className="button" onClick={reset}>
          Reset
        </button>
        <span className="demo-input-mode demo-input-mode--pointer">
          Input mode: pointer (simulated gaze)
        </span>
        <span className="calibration__progress" aria-live="polite">
          {currentAoiId ?? 'Hover a line to start reading.'}
        </span>
      </div>

      <div
        className="aoi__panel reading-panel"
        ref={panelRef}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
      >
        {AOIS.map((a, i) => (
          <div
            key={a.id}
            className={`reading-line${currentAoiId === a.id ? ' reading-line--active' : ''}`}
            style={{
              left: `${a.x * 100}%`,
              top: `${a.y * 100}%`,
              width: `${a.width * 100}%`,
              height: `${a.height * 100}%`,
            }}
          >
            {LINES[i]}
          </div>
        ))}
      </div>

      <div className="panel__table-wrap">
        <table className="panel__table" aria-label="Per-line dwell, fixation count, and TTFF">
          <thead>
            <tr>
              <th scope="col">Line</th>
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
    </div>
  );
}
