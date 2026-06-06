// Synthetic eye-movement trace generator with known ground truth (074a).
//
// Produces a deterministic eye-local trace (the same input shape the real
// `eventDetection` module consumes) together with an EXPLICIT ground-truth event
// list (typed fixation / saccade / blink intervals). The additive-noise model is a
// zero-mean Gaussian on the eye-local coordinates, stated in the UI. Deterministic
// via a seeded PRNG so a given parameter set always yields the same trace.
//
// This is a teaching fixture: it feeds the project's real detector (detectEvents),
// not a re-implementation, so the demo exercises the algorithm the site actually
// uses.

import type { EventSampleInput } from './eventDetection';
import type { HeadMotionLabel } from '../types/session';

export type GroundTruthType = 'fixation' | 'saccade' | 'blink';

export interface GroundTruthInterval {
  type: GroundTruthType;
  startMs: number;
  endMs: number;
}

export interface SyntheticTraceParams {
  /** Output sampling rate (Hz). */
  samplingRateHz: number;
  /** Standard deviation of the zero-mean additive Gaussian noise (eye-local units). */
  noiseStd: number;
  /** Moving-average window in samples applied to valid samples (1 = no smoothing). */
  smoothingWindow: number;
  /** Insert a blink roughly this often (ms); 0 disables blinks. */
  blinkEveryMs: number;
  /** Blink duration (ms) — samples within are invalid (gaps). */
  blinkDurationMs: number;
  /** Head-motion contamination applied to saccades. */
  headMotion: 'none' | 'some' | 'much';
  /** PRNG seed for reproducibility. */
  seed: number;
}

export interface SyntheticTrace {
  samples: EventSampleInput[];
  groundTruth: GroundTruthInterval[];
  params: SyntheticTraceParams;
  durationMs: number;
}

export const DEFAULT_SYNTHETIC_TRACE_PARAMS: SyntheticTraceParams = {
  samplingRateHz: 30,
  noiseStd: 0.01,
  smoothingWindow: 1,
  blinkEveryMs: 1500,
  blinkDurationMs: 120,
  headMotion: 'none',
  seed: 1,
};

// Fixed scenario: fixation targets in eye-local space, alternating with saccades.
const TARGETS: { x: number; y: number }[] = [
  { x: -0.5, y: -0.3 },
  { x: 0.45, y: -0.15 },
  { x: 0.1, y: 0.5 },
  { x: -0.35, y: 0.25 },
  { x: 0.5, y: 0.4 },
  { x: -0.2, y: -0.4 },
];
const FIXATION_MS = 320;
const SACCADE_MS = 40;

/** mulberry32 — small deterministic PRNG. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Box-Muller standard normal from a uniform PRNG. */
function gaussian(rng: () => number): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** Minimum-jerk interpolation factor in [0,1]. */
function minJerk(tau: number): number {
  return 10 * tau ** 3 - 15 * tau ** 4 + 6 * tau ** 5;
}

interface PhaseSeg {
  type: 'fixation' | 'saccade';
  startMs: number;
  endMs: number;
  from: { x: number; y: number };
  to: { x: number; y: number };
  head: HeadMotionLabel;
}

export function generateSyntheticTrace(params: SyntheticTraceParams): SyntheticTrace {
  const rng = mulberry32(params.seed);

  // 1. Build the alternating fixation/saccade phase list and ground truth.
  const phases: PhaseSeg[] = [];
  const groundTruth: GroundTruthInterval[] = [];
  let t = 0;
  let saccadeIndex = 0;
  for (let i = 0; i < TARGETS.length; i++) {
    const pos = TARGETS[i];
    phases.push({ type: 'fixation', startMs: t, endMs: t + FIXATION_MS, from: pos, to: pos, head: 'low' });
    groundTruth.push({ type: 'fixation', startMs: t, endMs: t + FIXATION_MS });
    t += FIXATION_MS;
    if (i < TARGETS.length - 1) {
      const next = TARGETS[i + 1];
      let head: HeadMotionLabel = 'low';
      if (params.headMotion === 'some') head = saccadeIndex % 2 === 0 ? 'moderate' : 'low';
      else if (params.headMotion === 'much') head = saccadeIndex % 2 === 0 ? 'uncertain' : 'moderate';
      phases.push({ type: 'saccade', startMs: t, endMs: t + SACCADE_MS, from: pos, to: next, head });
      groundTruth.push({ type: 'saccade', startMs: t, endMs: t + SACCADE_MS });
      t += SACCADE_MS;
      saccadeIndex++;
    }
  }
  const durationMs = t;

  // 2. Blink intervals (override validity), recorded as ground truth.
  const blinks: GroundTruthInterval[] = [];
  if (params.blinkEveryMs > 0 && params.blinkDurationMs > 0) {
    for (let bt = params.blinkEveryMs; bt < durationMs; bt += params.blinkEveryMs) {
      const blink = { type: 'blink' as const, startMs: bt, endMs: bt + params.blinkDurationMs };
      blinks.push(blink);
      groundTruth.push(blink);
    }
  }
  const inBlink = (ms: number) => blinks.some((b) => ms >= b.startMs && ms < b.endMs);

  const phaseAt = (ms: number): PhaseSeg => {
    for (const p of phases) if (ms >= p.startMs && ms < p.endMs) return p;
    return phases[phases.length - 1];
  };

  // 3. Sample at the requested rate with additive Gaussian noise.
  const stepMs = 1000 / params.samplingRateHz;
  const raw: EventSampleInput[] = [];
  for (let ms = 0; ms <= durationMs + 1e-6; ms += stepMs) {
    const p = phaseAt(ms);
    let x: number;
    let y: number;
    if (p.type === 'fixation') {
      x = p.from.x;
      y = p.from.y;
    } else {
      const tau = Math.min(1, Math.max(0, (ms - p.startMs) / (p.endMs - p.startMs)));
      const k = minJerk(tau);
      x = p.from.x + (p.to.x - p.from.x) * k;
      y = p.from.y + (p.to.y - p.from.y) * k;
    }
    x += gaussian(rng) * params.noiseStd;
    y += gaussian(rng) * params.noiseStd;
    raw.push({
      timeMs: ms,
      x,
      y,
      valid: !inBlink(ms),
      headMotionLabel: p.head,
    });
  }

  // 4. Optional moving-average smoothing over valid samples.
  const samples = smooth(raw, params.smoothingWindow);

  groundTruth.sort((a, b) => a.startMs - b.startMs);
  return { samples, groundTruth, params, durationMs };
}

function smooth(samples: EventSampleInput[], window: number): EventSampleInput[] {
  if (window <= 1) return samples;
  const half = Math.floor(window / 2);
  return samples.map((s, i) => {
    if (!s.valid) return s;
    let sx = 0;
    let sy = 0;
    let n = 0;
    for (let j = i - half; j <= i + half; j++) {
      const o = samples[j];
      if (o && o.valid) {
        sx += o.x;
        sy += o.y;
        n++;
      }
    }
    return n > 0 ? { ...s, x: sx / n, y: sy / n } : s;
  });
}
