// Rolling live-precision helper (specification §3.6, §6.3).
//
// Precision is judged in practice by the sample-to-sample spread of the signal
// while a viewer holds a fixation. This is a tiny fixed-length ring buffer over
// the most recent signal points that feeds the SHARED metric maths in `034`
// (`precisionRmsS2S`, optional `bcea`) — it duplicates no maths of its own. The
// result is a normalised-unit figure (degrees are layered on later by `040`); it
// is a live derived readout only and writes nothing to the session model.

import { bcea, precisionRmsS2S, type Point } from './validationMetrics.ts';

export interface RollingPrecisionValue {
  /** Rolling sample-to-sample RMS over the window (normalised units). */
  rmsS2S: number;
  /** Rolling BCEA over the window (normalised-unit² area). */
  bcea: number;
  /** Number of samples currently in the window. */
  count: number;
  /** Whether the window has filled to its configured length. */
  full: boolean;
}

/** Default window length in samples (~0.5–1 s of a 30–60 fps signal). */
export const DEFAULT_PRECISION_WINDOW = 30;

/**
 * A fixed-length ring buffer of recent signal points. `push` adds a point and
 * drops the oldest once the window is full; `value` reports the rolling
 * precision via `034`. Degenerate windows (fewer than two points) report 0 from
 * `precisionRmsS2S`/`bcea` (finite, documented).
 */
export class RollingPrecision {
  private readonly buf: Point[] = [];
  readonly windowLength: number;

  constructor(windowLength: number = DEFAULT_PRECISION_WINDOW) {
    this.windowLength = windowLength;
  }

  push(point: Point): void {
    this.buf.push(point);
    if (this.buf.length > this.windowLength) this.buf.shift();
  }

  reset(): void {
    this.buf.length = 0;
  }

  get size(): number {
    return this.buf.length;
  }

  value(): RollingPrecisionValue {
    return {
      rmsS2S: precisionRmsS2S(this.buf),
      bcea: bcea(this.buf),
      count: this.buf.length,
      full: this.buf.length >= this.windowLength,
    };
  }
}
