import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { useImplementationDetails } from '../context/ImplementationDetailsContext';
import { OneEuroVectorFilter, DEFAULT_ONE_EURO_PARAMS } from '../lib/oneEuroFilter';
import type { ScreenGazeEstimate } from '../lib/screenGaze';

// Gaze-contingent (moving-window) demo (specification §3.1 timing, §3.4, §3.6,
// §6.2, §6.3, §2.5/§2.6).
//
// Content masked by a spotlight that follows the live, One Euro–filtered gaze
// estimate. Unlike offline analysis, a gaze-contingent display cannot tolerate
// lag — so this makes end-to-end latency (capture → inference → filter → render)
// tangible. No new gaze or filtering maths: the estimate comes from the host
// camera loop and is smoothed with the existing One Euro filter. When no
// calibrated gaze is available it falls back to a pointer stand-in, clearly
// labelled as not-gaze (§6.2). Panels are gated by the single master control.

const REVEAL_TEXT = `Reading needs the eyes to land where the words are. A gaze-contingent window
reveals only what falls inside it and hides the rest, so the display must keep up with the eyes in
real time. Any lag between looking and revealing is felt immediately — which is exactly why
end-to-end latency matters here, and why offline scanpaths and heatmaps can tolerate delays that a
live window cannot. Move your eyes (or the pointer) and notice how the bright window chases you.`;

interface GazeContingentTaskProps {
  getEstimate: () => ScreenGazeEstimate;
}

export default function GazeContingentTask({ getEstimate }: GazeContingentTaskProps) {
  const { showDetails } = useImplementationDetails();
  const stageRef = useRef<HTMLDivElement | null>(null);
  const maskRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const runningRef = useRef(false);
  const prevTsRef = useRef<number | null>(null);
  const lastFrameTsRef = useRef(0);
  const lastUiRef = useRef(0);
  const filterRef = useRef<OneEuroVectorFilter>(new OneEuroVectorFilter(2));
  const pointerRef = useRef<{ x: number; y: number } | null>(null);

  // Measured cadences (EMAs).
  const renderEmaRef = useRef(0);
  const gazeEmaRef = useRef(0);
  const lastGazeKeyRef = useRef('');
  const lastGazeChangeRef = useRef(0);

  const [radius, setRadius] = useState(90);
  const [source, setSource] = useState<'gaze' | 'pointer' | 'none'>('none');
  const [renderMs, setRenderMs] = useState(0);
  const [gazeIntervalMs, setGazeIntervalMs] = useState(0);

  const radiusRef = useRef(radius);
  radiusRef.current = radius;

  const paint = useCallback((x: number, y: number) => {
    const mask = maskRef.current;
    if (!mask) return;
    const r = radiusRef.current;
    mask.style.background = `radial-gradient(circle ${r}px at ${x}px ${y}px, rgba(17,24,39,0) 0, rgba(17,24,39,0) ${r}px, rgba(17,24,39,0.96) ${r + 36}px)`;
  }, []);

  const tick = useCallback(() => {
    if (!runningRef.current) return;
    const stage = stageRef.current;
    const now = performance.now();
    const ema = (prev: number, sample: number) => (prev === 0 ? sample : prev * 0.8 + sample * 0.2);

    if (lastFrameTsRef.current > 0) {
      renderEmaRef.current = ema(renderEmaRef.current, now - lastFrameTsRef.current);
    }
    lastFrameTsRef.current = now;
    const dt = prevTsRef.current === null ? 1 / 60 : (now - prevTsRef.current) / 1000;
    prevTsRef.current = now;

    if (stage) {
      const w = stage.clientWidth;
      const h = stage.clientHeight;
      const est = getEstimate();
      let sx: number | null = null;
      let sy: number | null = null;
      let src: 'gaze' | 'pointer' | 'none' = 'none';

      if (est.gaze_available && est.gaze_x != null && est.gaze_y != null) {
        const [fx, fy] = filterRef.current.filter([est.gaze_x, est.gaze_y], dt);
        sx = Math.min(1, Math.max(0, fx)) * w;
        sy = Math.min(1, Math.max(0, fy)) * h;
        src = 'gaze';
        // Gaze "update" cadence: time between distinct estimate values.
        const key = `${est.gaze_x.toFixed(4)},${est.gaze_y.toFixed(4)}`;
        if (key !== lastGazeKeyRef.current) {
          if (lastGazeChangeRef.current > 0) {
            gazeEmaRef.current = ema(gazeEmaRef.current, now - lastGazeChangeRef.current);
          }
          lastGazeChangeRef.current = now;
          lastGazeKeyRef.current = key;
        }
      } else if (pointerRef.current) {
        sx = pointerRef.current.x;
        sy = pointerRef.current.y;
        src = 'pointer';
      }

      if (sx != null && sy != null) paint(sx, sy);
      if (now - lastUiRef.current >= 150) {
        lastUiRef.current = now;
        setSource(src);
        setRenderMs(renderEmaRef.current);
        setGazeIntervalMs(gazeEmaRef.current);
      }
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [getEstimate, paint]);

  useEffect(() => {
    runningRef.current = true;
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      runningRef.current = false;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [tick]);

  const onPointerMove = useCallback((e: ReactPointerEvent) => {
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    pointerRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const onPointerLeave = useCallback(() => {
    pointerRef.current = null;
  }, []);

  // Estimated end-to-end latency felt by the user ≈ one gaze-update interval
  // (capture + inference + filter) plus one render interval.
  const endToEndMs = (gazeIntervalMs || 0) + (renderMs || 0);

  return (
    <div className="gaze-contingent">
      <p className="timing-demo__note">
        A gaze-contingent <strong>moving window</strong> reveals only what is under your gaze. The
        window follows the live, One Euro–filtered estimate; the lag you feel is end-to-end latency.
        {source === 'pointer' && ' No calibrated gaze yet — the pointer is standing in (not gaze).'}
        {source === 'none' && ' Calibrate and look at the panel, or move the pointer over it.'}
      </p>

      <label className="content-demo__zoom">
        Window radius
        <input
          type="range"
          min={50}
          max={160}
          step={10}
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
        />
        <span className="content-demo__zoom-value">{radius}px</span>
      </label>

      <div
        className="gaze-contingent__stage"
        ref={stageRef}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
      >
        <p className="gaze-contingent__text">{REVEAL_TEXT}</p>
        <div className="gaze-contingent__mask" ref={maskRef} aria-hidden="true" />
      </div>

      <div className="motion-label motion-label--low" aria-live="polite">
        <span className="motion-label__caption">Estimated end-to-end latency</span>
        <span className="motion-label__value">{endToEndMs > 0 ? `${Math.round(endToEndMs)} ms` : '—'}</span>
        <span className="live-precision__hint">
          ≈ one gaze update ({gazeIntervalMs ? Math.round(gazeIntervalMs) : '—'} ms) + one render
          frame ({renderMs ? Math.round(renderMs) : '—'} ms). An estimate of the felt lag, not a
          calibrated measurement.
        </span>
      </div>

      {showDetails && (
        <div className="panels">
          <section className="panel">
            <h3 className="panel__title">Gaze-contingent window &amp; latency</h3>
            <ul className="panel__list">
              <li>
                Signal source: <strong>{source === 'gaze' ? 'calibrated gaze' : source === 'pointer' ? 'pointer stand-in (not gaze)' : 'none'}</strong>
              </li>
              <li>
                Window radius: <strong>{radius} px</strong>
              </li>
              <li>
                Smoothing: <strong>One Euro</strong> (minCutoff {DEFAULT_ONE_EURO_PARAMS.minCutoff} Hz,
                beta {DEFAULT_ONE_EURO_PARAMS.beta}) on the gaze x/y
              </li>
              <li>
                Gaze-update interval (capture → inference → filter):{' '}
                <strong>{gazeIntervalMs ? Math.round(gazeIntervalMs) : '—'} ms</strong>
              </li>
              <li>
                Render interval: <strong>{renderMs ? Math.round(renderMs) : '—'} ms</strong>
              </li>
              <li>
                Estimated end-to-end: <strong>{endToEndMs > 0 ? Math.round(endToEndMs) : '—'} ms</strong>
              </li>
            </ul>
            <p className="panel__note">
              Gaze-contingent display is latency-critical: unlike offline scanpaths/heatmaps, the
              window must track the eyes in real time. The figures are measured cadences plus an
              estimate of the felt lag, not a calibrated latency benchmark (§6.3). Without
              calibration the window position is not precise gaze (§6.2).
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
