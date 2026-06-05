import { useCallback, useEffect, useRef, useState } from 'react';
import { useImplementationDetails } from '../context/ImplementationDetailsContext';
import {
  pursuitTarget,
  pursuitGain,
  pursuitCandidate,
  type PursuitParams,
  type PursuitSample,
  type PursuitGainResult,
} from '../lib/smoothPursuit';
import type { ScreenGazeEstimate } from '../lib/screenGaze';

// Smooth-pursuit demo (specification §3.4, §3.6, §6.3, §2.5/§2.6).
//
// A target moves along a fixed path (`041`) while the calibrated gaze estimate
// tries to track it. Smooth pursuit CANNOT be evoked without a moving target —
// that is the whole point of the task — so the demo animates a target and reads
// the concurrent gaze, reporting live pursuit gain and mean tracking error as a
// qualitative validation of the gaze signal. All metric maths is reused from
// `041`; nothing here is presented as a validated measurement (§6.3). The
// velocity/windowed-gain panels are gated by the single master control.

const PURSUIT_PARAMS: PursuitParams = {
  path: 'horizontal',
  periodMs: 4000,
  amplitude: 0.36,
  center: { x: 0.5, y: 0.5 },
};

const WINDOW_MS = 2000; // rolling window for the live gain readout
const STAGE = 240; // square stage size, px

interface PursuitTaskProps {
  /** Latest calibrated screen-gaze estimate from the host camera loop. */
  getEstimate: () => ScreenGazeEstimate;
}

type Status = 'idle' | 'running';

export default function PursuitTask({ getEstimate }: PursuitTaskProps) {
  const { showDetails } = useImplementationDetails();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef(0);
  const bufferRef = useRef<PursuitSample[]>([]);
  const runningRef = useRef(false);
  const lastUiRef = useRef(0);

  const [status, setStatus] = useState<Status>('idle');
  const [result, setResult] = useState<PursuitGainResult | null>(null);
  const [hasGaze, setHasGaze] = useState(false);

  const draw = useCallback((target: { x: number; y: number }, gaze: ScreenGazeEstimate) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, STAGE, STAGE);
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, STAGE, STAGE);

    // Faint recent target/gaze traces.
    const buf = bufferRef.current;
    const drawTrace = (key: 'target' | 'gaze', colour: string) => {
      ctx.strokeStyle = colour;
      ctx.lineWidth = 1;
      ctx.beginPath();
      buf.slice(-60).forEach((s, i) => {
        const p = s[key];
        const x = p.x * STAGE;
        const y = p.y * STAGE;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    };
    if (buf.length > 1) {
      drawTrace('target', 'rgba(91,227,155,0.35)');
      if (gaze.gaze_available) drawTrace('gaze', 'rgba(76,154,255,0.35)');
    }

    // Target (green) and gaze (blue) with a line showing the tracking error.
    const tx = target.x * STAGE;
    const ty = target.y * STAGE;
    if (gaze.gaze_available && gaze.gaze_x != null && gaze.gaze_y != null) {
      const gx = gaze.gaze_x * STAGE;
      const gy = gaze.gaze_y * STAGE;
      ctx.strokeStyle = 'rgba(220,38,38,0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(gx, gy);
      ctx.stroke();
      ctx.fillStyle = '#4c9aff';
      ctx.beginPath();
      ctx.arc(gx, gy, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#5be39b';
    ctx.beginPath();
    ctx.arc(tx, ty, 9, 0, Math.PI * 2);
    ctx.fill();
  }, []);

  const tick = useCallback(() => {
    if (!runningRef.current) return;
    const now = performance.now();
    const t = now - startRef.current;
    const target = pursuitTarget(t, PURSUIT_PARAMS);
    const gaze = getEstimate();
    if (gaze.gaze_available && gaze.gaze_x != null && gaze.gaze_y != null) {
      bufferRef.current.push({ t_ms: t, target, gaze: { x: gaze.gaze_x, y: gaze.gaze_y } });
      // Keep only the rolling window.
      const cutoff = t - WINDOW_MS;
      while (bufferRef.current.length > 0 && bufferRef.current[0].t_ms < cutoff) {
        bufferRef.current.shift();
      }
    }
    draw(target, gaze);
    if (now - lastUiRef.current >= 100) {
      lastUiRef.current = now;
      setHasGaze(gaze.gaze_available);
      setResult(bufferRef.current.length >= 2 ? pursuitGain(bufferRef.current) : null);
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [draw, getEstimate]);

  const start = useCallback(() => {
    bufferRef.current = [];
    startRef.current = performance.now();
    lastUiRef.current = 0;
    runningRef.current = true;
    setStatus('running');
    setResult(null);
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const stop = useCallback(() => {
    runningRef.current = false;
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setStatus('idle');
  }, []);

  useEffect(
    () => () => {
      runningRef.current = false;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  const candidate = result ? pursuitCandidate(result) : null;

  return (
    <div className="pursuit">
      <p className="timing-demo__note">
        Smooth pursuit can only be evoked by a <strong>moving</strong> target — fixations and
        saccades will not show it. Follow the green dot with your eyes; the blue dot is the
        calibrated gaze estimate.
      </p>

      <div className="pursuit__controls">
        <button type="button" className="button" onClick={status === 'running' ? stop : start}>
          {status === 'running' ? 'Stop pursuit' : 'Start pursuit'}
        </button>
        <span className="calibration__progress" aria-live="polite">
          {status === 'running' && !hasGaze && 'Waiting for a gaze estimate — look at the target.'}
          {status === 'running' && hasGaze && 'Tracking…'}
          {status === 'idle' && 'Start the moving-target pursuit task.'}
        </span>
      </div>

      <canvas
        ref={canvasRef}
        width={STAGE}
        height={STAGE}
        className="pursuit__stage"
        role="img"
        aria-label="Smooth-pursuit target and gaze estimate"
      />

      <div className="pursuit__figures" aria-live="polite">
        <div className="motion-label motion-label--low">
          <span className="motion-label__caption">Pursuit gain (eye vel ÷ target vel)</span>
          <span className="motion-label__value">
            {result ? result.gain.toFixed(2) : '—'}
          </span>
          <span className="live-precision__hint">
            ~1.0 = tracking well, &lt;1 = lagging/undershooting. Candidate{' '}
            {candidate ? 'yes' : 'no'} — not a validated measurement.
          </span>
        </div>
        <div className="motion-label motion-label--low">
          <span className="motion-label__caption">Mean tracking error (normalised)</span>
          <span className="motion-label__value">
            {result ? result.meanTrackingError.toFixed(3) : '—'}
          </span>
        </div>
      </div>

      {showDetails && (
        <div className="panels">
          <section className="panel">
            <h3 className="panel__title">Pursuit: target vs gaze velocity (rolling window)</h3>
            <ul className="panel__list">
              <li>
                Window: <strong>{WINDOW_MS} ms</strong> · samples in window:{' '}
                <strong>{result?.sampleCount ?? 0}</strong>
              </li>
              <li>
                Target path length: <strong>{result ? result.targetPathLength.toFixed(3) : '—'}</strong>{' '}
                · gaze path length: <strong>{result ? result.gazePathLength.toFixed(3) : '—'}</strong>{' '}
                (normalised)
              </li>
              <li>
                Windowed gain (path-length ratio over the same elapsed time):{' '}
                <strong>{result ? result.gain.toFixed(2) : '—'}</strong>
              </li>
              <li>
                Path: <strong>{PURSUIT_PARAMS.path}</strong>, period {PURSUIT_PARAMS.periodMs} ms,
                amplitude {PURSUIT_PARAMS.amplitude}
              </li>
            </ul>
            <p className="panel__note">
              Gain is the ratio of gaze to target path length over the same time, i.e. mean eye
              speed ÷ mean target speed. It is a qualitative, uncalibrated-friendly check — the
              gaze estimate is only as good as the calibration, and the label is a candidate (§6.3).
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
