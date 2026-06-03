// Provider A — custom regression screen-gaze mapping (specification §3.4, §7.3 `018b`).
//
// A lightweight, fully self-hosted WebGazer-style baseline: a linear least-squares
// mapping from the eye-local signal (`017`) to normalised screen coordinates. This
// module owns the mapping REPRESENTATION and its application; FITTING the mapping
// from a calibration set is `022`. With no mapping set, the provider reports
// `gaze_available: false` so screen gaze degrades cleanly before calibration (§6.2).
//
// Pure and framework-agnostic (no DOM), so it is unit-testable.

import type { EyeLocalSignal } from './eyeLocalSignal';
import type { ScreenGazeProvider, ScreenGazeInput, ScreenGazeEstimate } from './screenGaze';

/**
 * Feature vector fed to the linear mapping. A bias term plus the combined and
 * per-eye eye-local coordinates: `[1, cx, cy, lx, ly, rx, ry]`. Keeping the bias
 * first lets a mapping encode a constant offset.
 */
export function gazeFeatures(eyeLocal: EyeLocalSignal): number[] {
  return [
    1,
    eyeLocal.combined.x,
    eyeLocal.combined.y,
    eyeLocal.left.x,
    eyeLocal.left.y,
    eyeLocal.right.x,
    eyeLocal.right.y,
  ];
}

/** Number of features produced by `gazeFeatures` (bias + 3 × {x,y}). */
export const GAZE_FEATURE_LENGTH = 7;

/**
 * A fitted linear mapping: one coefficient vector per output axis. Each vector
 * has length `GAZE_FEATURE_LENGTH`; `x = cx · f`, `y = cy · f`.
 */
export interface LinearGazeMapping {
  cx: number[];
  cy: number[];
}

function dot(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}

function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

/**
 * Apply a fitted mapping to a feature vector, returning normalised screen
 * coordinates (unclamped — callers decide whether to clamp to the viewport).
 */
export function applyMapping(mapping: LinearGazeMapping, features: number[]): {
  x: number;
  y: number;
} {
  return { x: dot(mapping.cx, features), y: dot(mapping.cy, features) };
}

/**
 * Provider A: applies a fitted eye-local → screen mapping. The default screen-gaze
 * provider (`018b`). Requires calibration (`requiresCalibration: true`): until a
 * mapping is set it returns `gaze_available: false`.
 */
export class RegressionGazeProvider implements ScreenGazeProvider {
  readonly id = 'regression';
  readonly label = 'Custom regression (calibrated)';
  readonly requiresCalibration = true;

  private mapping: LinearGazeMapping | null = null;

  /** Install or clear the fitted mapping (fitting happens in `022`). */
  setMapping(mapping: LinearGazeMapping | null): void {
    if (mapping && (mapping.cx.length !== GAZE_FEATURE_LENGTH || mapping.cy.length !== GAZE_FEATURE_LENGTH)) {
      throw new Error(
        `Mapping coefficient length must be ${GAZE_FEATURE_LENGTH} (got cx=${mapping.cx.length}, cy=${mapping.cy.length})`,
      );
    }
    this.mapping = mapping;
  }

  /** Whether a mapping has been fitted/installed. */
  get hasMapping(): boolean {
    return this.mapping !== null;
  }

  estimate(input: ScreenGazeInput): ScreenGazeEstimate {
    if (!this.mapping || !input.eyeLocal) {
      return { gaze_available: false };
    }
    const { x, y } = applyMapping(this.mapping, gazeFeatures(input.eyeLocal));
    return {
      gaze_x: clamp01(x),
      gaze_y: clamp01(y),
      gaze_available: true,
      // Confidence is bounded by how well the eye-local signal itself is tracked.
      gaze_confidence: clamp01(input.eyeLocal.quality),
    };
  }
}
