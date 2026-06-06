// Live end-to-end latency budget (073b). Decomposes the per-frame budget into its
// pipeline stages and updates live on Step 1. Only genuinely measurable stages show
// numbers — nothing is fabricated. Step 1 is capture-only, so model inference and
// filtering are labelled as running downstream (Steps 2 and 6) rather than given
// invented timings here.

import { useEffect, useRef, useState } from 'react';
import type { FrameTick } from '../lib/frameTiming';

function fmtMs(ms: number | undefined): string {
  return ms === undefined || !Number.isFinite(ms) ? '—' : `${ms.toFixed(1)} ms`;
}

interface Stage {
  name: string;
  value: string;
  measured: boolean;
  note: string;
}

export default function LatencyBudget({ tick }: { tick: FrameTick | null }) {
  // Live render-cadence measurement: a rAF loop tracks the smoothed time between
  // animation frames, i.e. how often the browser can paint (the rendering stage).
  const [renderMs, setRenderMs] = useState<number | null>(null);
  const emaRef = useRef<number | null>(null);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = now - last;
      last = now;
      emaRef.current = emaRef.current === null ? dt : emaRef.current * 0.9 + dt * 0.1;
      setRenderMs(emaRef.current);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const frameIntervalMs = tick && tick.effectiveFps > 0 ? 1000 / tick.effectiveFps : undefined;
  const captureToCallback =
    tick && tick.captureTime !== undefined && tick.videoFrameTime !== undefined
      ? Math.max(0, tick.captureTime - tick.videoFrameTime)
      : undefined;

  const stages: Stage[] = [
    {
      name: 'Camera capture (frame interval)',
      value: fmtMs(frameIntervalMs),
      measured: frameIntervalMs !== undefined,
      note: 'How often a new frame arrives — the rate everything downstream is bounded by.',
    },
    {
      name: 'Browser frame callback',
      value: captureToCallback !== undefined ? fmtMs(captureToCallback) : 'rVFC timestamps',
      measured: captureToCallback !== undefined,
      note: 'Media presentation time → the moment your code receives the frame.',
    },
    {
      name: 'Per-frame processing',
      value: fmtMs(tick?.processingLatencyMs),
      measured: tick?.processingLatencyMs !== undefined,
      note: 'Work done in the frame callback on this capture-only step.',
    },
    {
      name: 'Model inference',
      value: 'runs on Step 2',
      measured: false,
      note: 'Not executed on this capture-only step — measured where the face model runs (Step 2).',
    },
    {
      name: 'Filtering (One Euro)',
      value: 'runs on Step 6',
      measured: false,
      note: 'Not executed here — the filter stage runs in the Step 6 pipeline.',
    },
    {
      name: 'Rendering (paint cadence)',
      value: fmtMs(renderMs ?? undefined),
      measured: renderMs !== null,
      note: 'Smoothed time between browser paints, measured live.',
    },
  ];

  return (
    <section className="latency-budget" aria-label="Live latency budget">
      <h3 className="limitation-panel__title">Live latency budget</h3>
      <p className="latency-budget__intro">
        Where end-to-end delay accumulates, stage by stage. Only the stages this capture step
        actually runs show measured times; model inference and filtering are timed on the steps that
        run them. Updates live.
      </p>
      <table className="panel__table latency-budget__table">
        <thead>
          <tr>
            <th scope="col">Stage</th>
            <th scope="col">Live</th>
            <th scope="col">What it is</th>
          </tr>
        </thead>
        <tbody>
          {stages.map((s) => (
            <tr key={s.name}>
              <th scope="row">{s.name}</th>
              <td className={s.measured ? 'latency-budget__measured' : 'latency-budget__downstream'}>
                {s.value}
              </td>
              <td>{s.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
