// Event-detection lab on Step 6 (074a). Generates a synthetic eye-local trace with
// known ground truth and feeds it to the project's REAL detector (detectEvents),
// exposing the same thresholds that module accepts (velocity / dispersion / minimum
// fixation duration — the hybrid I-VT / I-DT rule). The true-vs-detected comparison
// (false positives, misses, timing error) is layered on in 074b.

import { useMemo, useState } from 'react';
import {
  detectEvents,
  DEFAULT_EVENT_DETECTION_THRESHOLDS,
  type EventDetectionThresholds,
  type DetectedEvent,
} from '../lib/eventDetection';
import {
  generateSyntheticTrace,
  DEFAULT_SYNTHETIC_TRACE_PARAMS,
  type SyntheticTraceParams,
} from '../lib/syntheticTrace';

const W = 720;
const H = 200;
const PAD = 10;
const STRIP_H = 16;

function isFixation(t: DetectedEvent['event_type']): boolean {
  return t === 'fixation_candidate';
}

export default function EventDetectionLab() {
  const [params, setParams] = useState<SyntheticTraceParams>(DEFAULT_SYNTHETIC_TRACE_PARAMS);
  const [thresholds, setThresholds] = useState<EventDetectionThresholds>(
    DEFAULT_EVENT_DETECTION_THRESHOLDS,
  );

  const trace = useMemo(() => generateSyntheticTrace(params), [params]);
  const detected = useMemo(
    () => detectEvents(trace.samples, thresholds),
    [trace, thresholds],
  );

  const dur = trace.durationMs;
  const mapX = (ms: number) => PAD + (ms / dur) * (W - 2 * PAD);
  const plotTop = PAD;
  const plotH = H - 2 * PAD - STRIP_H - 8;
  const mapY = (v: number) => plotTop + ((1 - v) / 2) * plotH; // v in [-1,1]

  const linePath = (key: 'x' | 'y') =>
    trace.samples
      .filter((s) => s.valid)
      .map((s, i) => `${i === 0 ? 'M' : 'L'}${mapX(s.timeMs).toFixed(1)},${mapY(s[key]).toFixed(1)}`)
      .join(' ');

  const setP = (patch: Partial<SyntheticTraceParams>) => setParams((p) => ({ ...p, ...patch }));
  const setT = (patch: Partial<EventDetectionThresholds>) =>
    setThresholds((t) => ({ ...t, ...patch }));

  return (
    <section className="evlab" aria-label="Event-detection lab">
      <h3 className="limitation-panel__title">Event-detection lab (synthetic, known ground truth)</h3>
      <p className="evlab__intro">
        A <strong>synthetic</strong> eye-local trace with a known ground truth, fed into the site’s
        real event detector. Noise is zero-mean Gaussian added to the eye-local coordinates
        (std {params.noiseStd.toFixed(3)} units). Adjust the trace and the detector’s I-VT / I-DT
        thresholds and watch the detected events change.
      </p>

      <div className="evlab__controls">
        <label>
          Sampling rate
          <select
            value={params.samplingRateHz}
            onChange={(e) => setP({ samplingRateHz: Number(e.target.value) })}
          >
            {[30, 60, 120, 250].map((r) => (
              <option key={r} value={r}>{r} Hz</option>
            ))}
          </select>
        </label>
        <label>
          Noise std: {params.noiseStd.toFixed(3)}
          <input type="range" min={0} max={0.05} step={0.005} value={params.noiseStd}
            onChange={(e) => setP({ noiseStd: Number(e.target.value) })} />
        </label>
        <label>
          Smoothing window: {params.smoothingWindow}
          <input type="range" min={1} max={7} step={2} value={params.smoothingWindow}
            onChange={(e) => setP({ smoothingWindow: Number(e.target.value) })} />
        </label>
        <label>
          Blink interval: {params.blinkEveryMs === 0 ? 'off' : `${params.blinkEveryMs} ms`}
          <input type="range" min={0} max={3000} step={500} value={params.blinkEveryMs}
            onChange={(e) => setP({ blinkEveryMs: Number(e.target.value) })} />
        </label>
        <label>
          Head motion
          <select value={params.headMotion}
            onChange={(e) => setP({ headMotion: e.target.value as SyntheticTraceParams['headMotion'] })}>
            <option value="none">none</option>
            <option value="some">some</option>
            <option value="much">much</option>
          </select>
        </label>
        <label>
          Velocity threshold (I-VT): {thresholds.saccadeSpeedPerSec}
          <input type="range" min={2} max={14} step={1} value={thresholds.saccadeSpeedPerSec}
            onChange={(e) => setT({ saccadeSpeedPerSec: Number(e.target.value) })} />
        </label>
        <label>
          Min fixation: {thresholds.minFixationMs} ms
          <input type="range" min={50} max={250} step={10} value={thresholds.minFixationMs}
            onChange={(e) => setT({ minFixationMs: Number(e.target.value) })} />
        </label>
        <label>
          Dispersion threshold (I-DT): {thresholds.maxFixationDispersion.toFixed(2)}
          <input type="range" min={0.1} max={1} step={0.05} value={thresholds.maxFixationDispersion}
            onChange={(e) => setT({ maxFixationDispersion: Number(e.target.value) })} />
        </label>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img"
        aria-label="Synthetic eye-local trace with ground-truth fixation, saccade, and blink intervals shaded, the noisy x and y signals plotted, and the detected events shown as a strip beneath.">
        <rect x={0} y={0} width={W} height={H} fill="#111827" rx={4} />
        {/* Ground-truth shaded bands */}
        {trace.groundTruth.map((g, i) => (
          <rect
            key={i}
            x={mapX(g.startMs)}
            y={plotTop}
            width={Math.max(1, mapX(g.endMs) - mapX(g.startMs))}
            height={plotH}
            fill={g.type === 'fixation' ? '#46c08b22' : g.type === 'saccade' ? '#4c9aff22' : '#e5707e33'}
          />
        ))}
        {/* Signals */}
        <path d={linePath('x')} fill="none" stroke="#4c9aff" strokeWidth={1.25} />
        <path d={linePath('y')} fill="none" stroke="#f0b429" strokeWidth={1.25} />
        {/* Detected-events strip */}
        <text x={PAD} y={H - STRIP_H - 12} fontSize="9" fill="#9bacc4">Detected events:</text>
        {detected.map((e, i) => (
          <rect
            key={i}
            x={mapX(e.event_start_ms)}
            y={H - PAD - STRIP_H}
            width={Math.max(2, mapX(e.event_end_ms) - mapX(e.event_start_ms))}
            height={STRIP_H}
            rx={2}
            fill={isFixation(e.event_type) ? '#46c08b' : '#4c9aff'}
            opacity={0.6 + 0.4 * e.event_confidence}
          />
        ))}
      </svg>

      <p className="evlab__legend">
        Bands: <span className="evlab__swatch evlab__swatch--fix" /> fixation,{' '}
        <span className="evlab__swatch evlab__swatch--sac" /> saccade,{' '}
        <span className="evlab__swatch evlab__swatch--blink" /> blink (ground truth). Lines: eye-local
        x (blue) and y (amber). Strip: events from the real detector ({detected.length} detected over{' '}
        {trace.groundTruth.filter((g) => g.type !== 'blink').length} true events).
      </p>
    </section>
  );
}
