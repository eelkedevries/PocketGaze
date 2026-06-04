// Blink suppression and quality thresholding (specification §3.6, §5).
//
// Camera-based eye signals are invalid during eye closure (blinks) and when
// tracking quality collapses (occlusion, look-away, poor lighting). This module
// marks those samples so they do not reach event detection (§6) as if they were
// real eye movement — without ever silently dropping the raw data, which stays
// in its own columns (§4.1). It produces:
//   - `blink_state` per sample, and blink INTERVALS for event labelling;
//   - a per-sample validity flag driven by quality thresholds;
//   - `tracking_lost` INTERVALS (emitted as §5 events) where tracking is
//     unavailable or below threshold.
//
// Pure and deterministic (timestamps are passed in, no clock), so it is fully
// unit-testable. Wiring it into the live per-frame write is the Step 6 demo
// (`027`); this module provides the detection logic only.

import type { BlinkState } from '../types/session';

export interface SuppressionThresholds {
  /** Eye-closure runs shorter than this are treated as noise, not blinks (ms). */
  minBlinkMs: number;
  /** Tracking quality (0-1) below which a sample is invalid. */
  minValidQuality: number;
  /** Continuous invalid tracking for at least this long is `tracking_lost` (ms). */
  trackingLostMs: number;
}

/**
 * Documented defaults (portfolio demo, not device-calibrated; tune per §3.6):
 *  - 50 ms: shorter "closures" are usually single-frame landmark noise.
 *  - 0.40 quality: below this the eye/face landmarks are unreliable.
 *  - 150 ms: a brief dropout is tolerated; sustained loss is `tracking_lost`.
 */
export const DEFAULT_SUPPRESSION_THRESHOLDS: SuppressionThresholds = {
  minBlinkMs: 50,
  minValidQuality: 0.4,
  trackingLostMs: 150,
};

export interface Interval {
  startMs: number;
  endMs: number;
}

/** A blink closes BOTH eyes; a single closed eye is a wink, not a blink. */
export function bothEyesClosed(leftOpen: boolean, rightOpen: boolean): boolean {
  return !leftOpen && !rightOpen;
}

/** A sample's tracking is invalid when the face is lost or quality is too low. */
export function isInvalidTracking(
  faceDetected: boolean,
  quality: number,
  thresholds: SuppressionThresholds = DEFAULT_SUPPRESSION_THRESHOLDS,
): boolean {
  return !faceDetected || quality < thresholds.minValidQuality;
}

export interface BlinkSampleInput {
  timeMs: number;
  leftEyeOpen: boolean;
  rightEyeOpen: boolean;
}

/**
 * Detect blink intervals from a per-frame eye-open series. A blink is a run of
 * consecutive both-eyes-closed samples whose span (first→last closed sample) is
 * at least `minBlinkMs`. Runs that are too short are discarded as noise.
 */
export function detectBlinkIntervals(
  samples: BlinkSampleInput[],
  thresholds: SuppressionThresholds = DEFAULT_SUPPRESSION_THRESHOLDS,
): Interval[] {
  return collectRuns(
    samples.map((s) => ({ timeMs: s.timeMs, active: bothEyesClosed(s.leftEyeOpen, s.rightEyeOpen) })),
    thresholds.minBlinkMs,
  );
}

export interface QualitySampleInput {
  timeMs: number;
  faceDetected: boolean;
  quality: number;
}

/**
 * Detect `tracking_lost` intervals: runs of invalid-tracking samples spanning
 * at least `trackingLostMs`. Shorter dropouts are tolerated as transient noise.
 */
export function detectTrackingLostIntervals(
  samples: QualitySampleInput[],
  thresholds: SuppressionThresholds = DEFAULT_SUPPRESSION_THRESHOLDS,
): Interval[] {
  return collectRuns(
    samples.map((s) => ({
      timeMs: s.timeMs,
      active: isInvalidTracking(s.faceDetected, s.quality, thresholds),
    })),
    thresholds.trackingLostMs,
  );
}

/** Collect runs of `active` samples whose span meets the minimum duration. */
function collectRuns(
  flags: Array<{ timeMs: number; active: boolean }>,
  minDurationMs: number,
): Interval[] {
  const intervals: Interval[] = [];
  let runStart: number | null = null;
  let runEnd = 0;

  for (const f of flags) {
    if (f.active) {
      if (runStart === null) runStart = f.timeMs;
      runEnd = f.timeMs;
    } else if (runStart !== null) {
      if (runEnd - runStart >= minDurationMs) intervals.push({ startMs: runStart, endMs: runEnd });
      runStart = null;
    }
  }
  if (runStart !== null && runEnd - runStart >= minDurationMs) {
    intervals.push({ startMs: runStart, endMs: runEnd });
  }
  return intervals;
}

export type SuppressionReason = 'ok' | 'blink' | 'low_quality' | 'no_face';

export interface FrameSuppressionResult {
  /** `closed` during a blink (both eyes closed), else `open`. */
  blink_state: BlinkState;
  /** False when the sample must be excluded from event detection. */
  valid: boolean;
  /** True once tracking has been continuously invalid for `trackingLostMs`. */
  trackingLost: boolean;
  reason: SuppressionReason;
}

export interface FrameSuppressionInput {
  timeMs: number;
  leftEyeOpen: boolean;
  rightEyeOpen: boolean;
  faceDetected: boolean;
  quality: number;
}

/**
 * Stateful per-frame suppressor for the live pipeline. It marks blink state and
 * sample validity immediately, and reports `tracking_lost` once tracking has
 * been continuously invalid for `trackingLostMs`. Blinks are an expected,
 * separate suppression and never count toward tracking loss.
 */
export class SampleSuppressor {
  private readonly thresholds: SuppressionThresholds;
  private invalidSinceMs: number | null = null;

  constructor(thresholds: SuppressionThresholds = DEFAULT_SUPPRESSION_THRESHOLDS) {
    this.thresholds = thresholds;
  }

  process(input: FrameSuppressionInput): FrameSuppressionResult {
    const blink = bothEyesClosed(input.leftEyeOpen, input.rightEyeOpen);
    const blink_state: BlinkState = blink ? 'closed' : 'open';

    // Tracking loss tracks only quality/face dropouts, not blinks.
    const invalidTracking = isInvalidTracking(input.faceDetected, input.quality, this.thresholds);
    if (invalidTracking) {
      if (this.invalidSinceMs === null) this.invalidSinceMs = input.timeMs;
    } else {
      this.invalidSinceMs = null;
    }
    const trackingLost =
      this.invalidSinceMs !== null &&
      input.timeMs - this.invalidSinceMs >= this.thresholds.trackingLostMs;

    let reason: SuppressionReason = 'ok';
    if (!input.faceDetected) reason = 'no_face';
    else if (input.quality < this.thresholds.minValidQuality) reason = 'low_quality';
    else if (blink) reason = 'blink';

    return { blink_state, valid: reason === 'ok', trackingLost, reason };
  }

  reset(): void {
    this.invalidSinceMs = null;
  }
}
