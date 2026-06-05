// Smooth-pursuit target path and pursuit-gain metric (specification §3.4, §3.6,
// §5, §6.3).
//
// Smooth pursuit is a distinct eye-movement type from fixations and saccades: it
// can only be evoked by a MOVING target, and its canonical measure is PURSUIT
// GAIN — the ratio of eye velocity to target velocity (1.0 = perfect tracking,
// < 1 = the eyes lag/undershoot). This module generates a moving target along a
// path and computes pursuit gain plus a mean tracking error from paired
// target/gaze samples.
//
// Pure and deterministic (positions and timestamps are supplied, no clock), so it
// is fully unit-testable. Per the candidate-only convention (§5, §6.3), nothing
// here is presented as a validated detection; a `smooth_pursuit_candidate` marker
// is offered for cautious labelling. Demo wiring is `042`.

import type { EventType } from '../types/session';

export interface Point {
  x: number;
  y: number;
}

/** The §5 candidate marker for a smooth-pursuit run (never a validated label). */
export const SMOOTH_PURSUIT_CANDIDATE: EventType = 'smooth_pursuit_candidate';

export type PursuitPath = 'horizontal' | 'circular';

export interface PursuitParams {
  /** Path shape: a horizontal sinusoid or a circle. */
  path: PursuitPath;
  /** Time for one full cycle, ms (must be > 0; ≤ 0 yields a stationary target). */
  periodMs: number;
  /** Half-range of the motion in normalised screen units (e.g. 0.35). */
  amplitude: number;
  /** Path centre in normalised screen coordinates (default screen centre). */
  center?: Point;
}

/**
 * Target position along the path at time `t_ms`, in normalised screen
 * coordinates (0–1). Horizontal paths move in x only; circular paths trace a
 * circle of radius `amplitude` about the centre. A non-positive period returns a
 * stationary target at the centre (documented, finite).
 */
export function pursuitTarget(t_ms: number, params: PursuitParams): Point {
  const c = params.center ?? { x: 0.5, y: 0.5 };
  if (!(params.periodMs > 0)) return { x: c.x, y: c.y };
  const phase = (2 * Math.PI * t_ms) / params.periodMs;
  if (params.path === 'horizontal') {
    return { x: c.x + params.amplitude * Math.sin(phase), y: c.y };
  }
  return {
    x: c.x + params.amplitude * Math.cos(phase),
    y: c.y + params.amplitude * Math.sin(phase),
  };
}

/** A paired target/gaze observation during a pursuit run. */
export interface PursuitSample {
  t_ms: number;
  target: Point;
  gaze: Point;
}

export interface PursuitGainResult {
  /**
   * Pursuit gain over the run: total gaze path length / total target path length.
   * Because both are measured over the same elapsed time, this equals the ratio
   * of mean speeds. 1.0 ≈ perfect tracking; < 1 = lag/undershoot; > 1 = overshoot
   * or noise. 0 when the target did not move (documented guard).
   */
  gain: number;
  /** Mean Euclidean distance between gaze and target across the samples. */
  meanTrackingError: number;
  /** Total target path length (normalised units). */
  targetPathLength: number;
  /** Total gaze path length (normalised units). */
  gazePathLength: number;
  sampleCount: number;
}

function dist(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * Pursuit gain and mean tracking error from paired target/gaze samples. Segments
 * with non-increasing timestamps (gaps) are skipped. A stationary target (zero
 * total path length) yields gain 0 — finite, not NaN.
 */
export function pursuitGain(samples: PursuitSample[]): PursuitGainResult {
  let targetPathLength = 0;
  let gazePathLength = 0;
  for (let i = 1; i < samples.length; i++) {
    const a = samples[i - 1];
    const b = samples[i];
    if (b.t_ms - a.t_ms <= 0) continue; // gap / out-of-order guard
    targetPathLength += dist(a.target, b.target);
    gazePathLength += dist(a.gaze, b.gaze);
  }
  let errorSum = 0;
  for (const s of samples) errorSum += dist(s.gaze, s.target);
  const n = samples.length;
  return {
    gain: targetPathLength > 1e-9 ? gazePathLength / targetPathLength : 0,
    meanTrackingError: n > 0 ? errorSum / n : 0,
    targetPathLength,
    gazePathLength,
    sampleCount: n,
  };
}

export interface PursuitCandidateThresholds {
  /** Minimum plausible gain for a pursuit candidate. */
  minGain: number;
  /** Maximum plausible gain (above this is likely noise, not pursuit). */
  maxGain: number;
  /** Maximum mean tracking error (normalised units) for a candidate. */
  maxTrackingError: number;
}

/** Documented defaults — cautious, not device-calibrated (§6.3). */
export const DEFAULT_PURSUIT_CANDIDATE_THRESHOLDS: PursuitCandidateThresholds = {
  minGain: 0.5,
  maxGain: 1.4,
  maxTrackingError: 0.2,
};

/**
 * Cautiously decide whether a pursuit result looks like smooth pursuit: gain in a
 * plausible band and tracking error below a limit. Returns the
 * `smooth_pursuit_candidate` marker or null — never a validated detection (§6.3).
 */
export function pursuitCandidate(
  result: PursuitGainResult,
  thresholds: PursuitCandidateThresholds = DEFAULT_PURSUIT_CANDIDATE_THRESHOLDS,
): EventType | null {
  const ok =
    result.gain >= thresholds.minGain &&
    result.gain <= thresholds.maxGain &&
    result.meanTrackingError <= thresholds.maxTrackingError;
  return ok ? SMOOTH_PURSUIT_CANDIDATE : null;
}
