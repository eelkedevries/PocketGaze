// Visual-search AOI demo (076c). A grid of items with one target among distractors;
// each item is an area of interest. The pointer (a clearly-labelled gaze stand-in)
// is mapped to items, distinguishing the TARGET AOI from DISTRACTOR AOIs: it reports
// time-to-first-fixation on the target and dwell spent on the target vs distractors.
// Letters are drawn at random orientations — the classic T-among-rotated-Ls display,
// where the target shares its features with the distractors so it does not "pop out"
// and search proceeds item by item, giving the TTFF something real to measure.
// Qualitative over a coarse stand-in, not validated search behaviour (§6.3).

import { useMemo, useState } from 'react';
import type { Aoi } from '../lib/aoiMetrics';
import { useAoiVisits } from './useAoiVisits';

const COLS = 4;
const ROWS = 3;
const COUNT = COLS * ROWS;
const CELL_W = 1 / COLS;
const CELL_H = 1 / ROWS;
const PAD = 0.02;

const AOIS: Aoi[] = Array.from({ length: COUNT }, (_, i) => {
  const col = i % COLS;
  const row = Math.floor(i / COLS);
  return {
    id: `Item ${i + 1}`,
    x: col * CELL_W + PAD,
    y: row * CELL_H + PAD,
    width: CELL_W - 2 * PAD,
    height: CELL_H - 2 * PAD,
  };
});

/** One random quarter-turn (0/90/180/270°) per item, regenerated per search. */
function randomRotations(): number[] {
  return Array.from({ length: COUNT }, () => 90 * Math.floor(Math.random() * 4));
}

export default function VisualSearchTask() {
  const aois = useMemo(() => AOIS, []);
  const { panelRef, currentAoiId, metrics, onPointerMove, onPointerLeave, reset } =
    useAoiVisits(aois);
  const [targetIndex, setTargetIndex] = useState(() => Math.floor(Math.random() * COUNT));
  const [rotations, setRotations] = useState<number[]>(randomRotations);

  const targetId = `Item ${targetIndex + 1}`;
  const targetRow = metrics.perAoi.find((r) => r.id === targetId);
  const targetFound = (targetRow?.dwellMs ?? 0) > 0;
  const distractorDwell = metrics.perAoi
    .filter((r) => r.id !== targetId)
    .reduce((s, r) => s + r.dwellMs, 0);

  const newSearch = () => {
    reset();
    setTargetIndex(Math.floor(Math.random() * COUNT));
    setRotations(randomRotations());
  };

  return (
    <div className="aoi">
      <p className="timing-demo__note">
        Find the <strong>T</strong> among the rotated Ls by moving the pointer (a gaze stand-in).
        Because the T is built from the same two strokes as the Ls and every letter is rotated, it
        does not pop out — you have to inspect items one by one, which is what makes the
        time-to-first-fixation on the target meaningful. Reported qualitatively, over a coarse
        stand-in (§6.3).
      </p>

      <div className="aoi__controls">
        <button type="button" className="button" onClick={newSearch}>
          New search
        </button>
        <span className="demo-input-mode demo-input-mode--pointer">
          Input mode: pointer (simulated gaze)
        </span>
        <span className="calibration__progress" aria-live="polite">
          {targetFound
            ? `Target found — time to first fixation ${
                targetRow?.ttffMs == null ? '—' : Math.round(targetRow.ttffMs)
              } ms`
            : currentAoiId
              ? `On ${currentAoiId}${currentAoiId === targetId ? ' (target!)' : ' (distractor)'}`
              : 'Search for the target.'}
        </span>
      </div>

      <div
        className="aoi__panel search-panel"
        ref={panelRef}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
      >
        {AOIS.map((a, i) => {
          const isTarget = i === targetIndex;
          const active = currentAoiId === a.id;
          return (
            <div
              key={a.id}
              className={`search-item${active ? ' search-item--active' : ''}${
                isTarget && targetFound ? ' search-item--target-found' : ''
              }`}
              style={{
                left: `${a.x * 100}%`,
                top: `${a.y * 100}%`,
                width: `${a.width * 100}%`,
                height: `${a.height * 100}%`,
              }}
            >
              <span
                className="search-item__letter"
                style={{ transform: `rotate(${rotations[i]}deg)` }}
              >
                {isTarget ? 'T' : 'L'}
              </span>
            </div>
          );
        })}
      </div>

      <dl className="readout" aria-live="polite">
        <div className="readout__item">
          <dt className="readout__label">Target found</dt>
          <dd className="readout__value">{targetFound ? 'yes' : 'no'}</dd>
        </div>
        <div className="readout__item">
          <dt className="readout__label">Time to target (TTFF)</dt>
          <dd className="readout__value">
            {targetRow?.ttffMs == null ? '—' : `${Math.round(targetRow.ttffMs)} ms`}
          </dd>
        </div>
        <div className="readout__item">
          <dt className="readout__label">Dwell on target</dt>
          <dd className="readout__value">{Math.round(targetRow?.dwellMs ?? 0)} ms</dd>
        </div>
        <div className="readout__item">
          <dt className="readout__label">Dwell on distractors</dt>
          <dd className="readout__value">{Math.round(distractorDwell)} ms</dd>
        </div>
      </dl>
    </div>
  );
}
