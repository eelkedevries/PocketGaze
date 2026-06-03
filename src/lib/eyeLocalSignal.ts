// Eye-local signal estimation (specification §3.4, §4.3, §6.2, §7.2).
//
// The eye-local signal is the iris/pupil proxy normalised WITHIN each detected
// eye region. It is calibration-light, always available, and reflects iris
// movement relative to the head — but it is NOT screen gaze. Screen gaze (§3.4,
// `018`/`019`) requires a calibrated mapping or trained model; this module must
// never be presented as producing screen-gaze coordinates (Domain rule §6.2).
//
// Pure and framework-agnostic: no DOM, no MediaPipe import, so it is fully
// unit-testable. It consumes plain numbers (an iris-proxy point, an eye-region
// box, and a per-eye quality) and produces normalised coordinates plus the
// model field subset, so any caller (e.g. the Step 4 demo, `020`) can feed it
// from the Step 2 features without this module depending on the feature library.

import type { EyeLocalSignalFields, SignalType } from '../types/session';

/** A 2-D point in the normalised eye-local coordinate space. */
export interface Point2 {
  x: number;
  y: number;
}

/** An axis-aligned eye-region box (same coordinate space as the iris point). */
export interface EyeRegion {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/** Per-eye input: the iris-proxy centre, its eye region, and a 0-1 quality. */
export interface EyeInput {
  /** Iris-proxy centre (e.g. normalised camera-frame coords from Step 2). */
  iris: { x: number; y: number };
  /** The detected eye region, in the same coordinate space as `iris`. */
  region: EyeRegion;
  /** Per-eye tracking quality, 0-1. */
  quality: number;
}

/** The eye-local signal: per-eye and combined coordinates plus a quality. */
export interface EyeLocalSignal {
  /** Left-eye coordinate, normalised within the left eye region. */
  left: Point2;
  /** Right-eye coordinate, normalised within the right eye region. */
  right: Point2;
  /** Mean of the two eyes — the combined eye-local coordinate. */
  combined: Point2;
  /**
   * Quality of the selected (eye-local) signal, 0-1: the mean of the per-eye
   * qualities. Low when either eye is poorly tracked.
   */
  quality: number;
}

function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

/**
 * Normalise an iris-proxy point to a CENTRED coordinate within its eye region:
 * the region centre maps to (0, 0) and each edge to ±1, so the value is roughly
 * in [-1, 1] and is invariant to face scale / camera distance (a closer face
 * yields a larger region but the same normalised position).
 *
 * A degenerate (zero-extent) region maps to (0, 0) rather than producing
 * NaN/Infinity, so a missing or collapsed detection reads as "centred/unknown".
 */
export function normaliseWithinRegion(iris: { x: number; y: number }, region: EyeRegion): Point2 {
  const halfW = (region.maxX - region.minX) / 2;
  const halfH = (region.maxY - region.minY) / 2;
  const cx = (region.minX + region.maxX) / 2;
  const cy = (region.minY + region.maxY) / 2;
  return {
    x: halfW > 1e-9 ? (iris.x - cx) / halfW : 0,
    y: halfH > 1e-9 ? (iris.y - cy) / halfH : 0,
  };
}

/**
 * Compute the eye-local signal from the two eyes' inputs: per-eye normalised
 * coordinates, their mean (combined), and the selected-signal quality.
 */
export function computeEyeLocalSignal(left: EyeInput, right: EyeInput): EyeLocalSignal {
  const l = normaliseWithinRegion(left.iris, left.region);
  const r = normaliseWithinRegion(right.iris, right.region);
  return {
    left: l,
    right: r,
    combined: { x: (l.x + r.x) / 2, y: (l.y + r.y) / 2 },
    quality: clamp01((clamp01(left.quality) + clamp01(right.quality)) / 2),
  };
}

/**
 * Map an eye-local signal to the §4 session-model field subset for a `sample`
 * row. The `signal_type` is fixed to `eye_local` so the model never conflates
 * this with screen gaze or content-mapped coordinates (Domain rule §6.2).
 */
export function eyeLocalSampleFields(
  signal: EyeLocalSignal,
): EyeLocalSignalFields & { selected_signal_quality: number; signal_type: SignalType } {
  return {
    left_eye_x: signal.left.x,
    left_eye_y: signal.left.y,
    right_eye_x: signal.right.x,
    right_eye_y: signal.right.y,
    combined_eye_x: signal.combined.x,
    combined_eye_y: signal.combined.y,
    selected_signal_quality: signal.quality,
    signal_type: 'eye_local',
  };
}
