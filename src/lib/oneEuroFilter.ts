// One Euro filter for the eye/gaze/head signals (specification §3.6, §4.1).
//
// The One Euro filter (Casiez et al., 2012) is an adaptive low-pass filter: it
// smooths slow movement hard (low jitter) but raises its cutoff during fast
// movement (low lag). It is applied to the derived signals while the RAW signals
// are preserved in their own columns (§4.1), so both stay exportable.
//
// Pure and deterministic (time steps are passed in, no clock), so it is fully
// unit-testable. Wiring it into the live per-frame write is the Step 6 demo
// (`027`); this module provides the filter and the raw→filtered field mapping.

import type { EyeLocalSignal } from './eyeLocalSignal';
import type { EyeLocalFilteredFields } from '../types/session';

/** Recorded as `filter_name` in the session model (§4). */
export const ONE_EURO_FILTER_NAME = 'one-euro';

export interface OneEuroParams {
  /** Minimum cutoff frequency (Hz) — lower = smoother at rest. */
  minCutoff: number;
  /** Speed coefficient — higher = less lag during fast movement. */
  beta: number;
  /** Cutoff (Hz) for the derivative's own low-pass. */
  dCutoff: number;
}

/**
 * Documented defaults; tune per device/signal (not device-calibrated).
 * minCutoff 1 Hz follows the authors' recommended starting point; beta 0.03
 * sits in the range gaze pipelines use in practice (~0.02-0.07) — the paper's
 * generic 0.007 keeps saccades visibly lagging behind the eye, and for a gaze
 * signal responsiveness during fast movement matters more than the last bit
 * of rest jitter (which minCutoff already controls).
 */
export const DEFAULT_ONE_EURO_PARAMS: OneEuroParams = {
  minCutoff: 1.0,
  beta: 0.03,
  dCutoff: 1.0,
};

/** Exponential-smoothing factor for a cutoff frequency and time step. */
export function smoothingAlpha(cutoffHz: number, dtSec: number): number {
  const tau = 1 / (2 * Math.PI * cutoffHz);
  return 1 / (1 + tau / dtSec);
}

/** Stateful scalar exponential low-pass. */
class LowPass {
  private y: number | null = null;

  filter(x: number, alpha: number): number {
    this.y = this.y === null ? x : alpha * x + (1 - alpha) * this.y;
    return this.y;
  }

  reset(): void {
    this.y = null;
  }
}

/** Adaptive One Euro filter for a single scalar channel. */
export class OneEuroFilter {
  private readonly xFilter = new LowPass();
  private readonly dxFilter = new LowPass();
  private readonly params: OneEuroParams;
  private prevX: number | null = null;

  constructor(params: OneEuroParams = DEFAULT_ONE_EURO_PARAMS) {
    this.params = params;
  }

  /** Filter one sample given the elapsed time since the last (seconds, > 0). */
  filter(x: number, dtSec: number): number {
    const dt = dtSec > 0 ? dtSec : 1e-6;
    const dx = this.prevX === null ? 0 : (x - this.prevX) / dt;
    const edx = this.dxFilter.filter(dx, smoothingAlpha(this.params.dCutoff, dt));
    const cutoff = this.params.minCutoff + this.params.beta * Math.abs(edx);
    const y = this.xFilter.filter(x, smoothingAlpha(cutoff, dt));
    this.prevX = x;
    return y;
  }

  reset(): void {
    this.xFilter.reset();
    this.dxFilter.reset();
    this.prevX = null;
  }
}

/** A bank of One Euro filters for a fixed-length vector signal. */
export class OneEuroVectorFilter {
  private readonly filters: OneEuroFilter[];

  constructor(size: number, params: OneEuroParams = DEFAULT_ONE_EURO_PARAMS) {
    this.filters = Array.from({ length: size }, () => new OneEuroFilter(params));
  }

  filter(values: number[], dtSec: number): number[] {
    return values.map((v, i) => this.filters[i].filter(v, dtSec));
  }

  reset(): void {
    for (const f of this.filters) f.reset();
  }
}

/**
 * Stateful filterer for the per-frame signals, producing the §4 *filtered*
 * field subsets without touching the raw columns. The eye-local channels are
 * ordered [left.x, left.y, right.x, right.y, combined.x, combined.y]; gaze is
 * [x, y].
 */
export class SignalFilterSet {
  readonly filterName = ONE_EURO_FILTER_NAME;
  readonly params: OneEuroParams;
  private readonly eye: OneEuroVectorFilter;
  private readonly gaze: OneEuroVectorFilter;

  constructor(params: OneEuroParams = DEFAULT_ONE_EURO_PARAMS) {
    this.params = params;
    this.eye = new OneEuroVectorFilter(6, params);
    this.gaze = new OneEuroVectorFilter(2, params);
  }

  /** Filter the eye-local signal into the `*_filtered` eye-local fields (§4.1). */
  filterEyeLocal(signal: EyeLocalSignal, dtSec: number): EyeLocalFilteredFields {
    const [lx, ly, rx, ry, cx, cy] = this.eye.filter(
      [signal.left.x, signal.left.y, signal.right.x, signal.right.y, signal.combined.x, signal.combined.y],
      dtSec,
    );
    return {
      left_eye_x_filtered: lx,
      left_eye_y_filtered: ly,
      right_eye_x_filtered: rx,
      right_eye_y_filtered: ry,
      combined_eye_x_filtered: cx,
      combined_eye_y_filtered: cy,
    };
  }

  /** Filter a screen-gaze coordinate into the `gaze_*_filtered` fields (§4.1). */
  filterGaze(x: number, y: number, dtSec: number): { gaze_x_filtered: number; gaze_y_filtered: number } {
    const [fx, fy] = this.gaze.filter([x, y], dtSec);
    return { gaze_x_filtered: fx, gaze_y_filtered: fy };
  }

  reset(): void {
    this.eye.reset();
    this.gaze.reset();
  }
}
